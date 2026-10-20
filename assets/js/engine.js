/*
 * Bottleneck + FPS estimation engine.
 *
 * 1. CPU ceiling: the frame rate the CPU can prepare (resolution independent).
 * 2. GPU ceiling: the frame rate the GPU can render at the chosen resolution,
 *    quality, upscaling and VRAM budget.
 * 3. Estimated FPS: a soft minimum of the two ceilings (real systems lose a
 *    little performance when both parts are near their limit).
 * 4. Bottleneck % = (faster ceiling - slower ceiling) / faster ceiling.
 */
(function () {
  const CPU_FPS_PER_POINT = 2.0; // Ryzen 7 9800X3D (100) ~ 200 FPS CPU-bound in modern AAA at High
  const GPU_FPS_PER_POINT = 2.3; // RTX 4090 (100) ~ 230 FPS GPU-bound at 1080p High
  const RES_EXPONENT = 0.62;     // FPS scales with pixel count ^ -0.62 (measured, not linear)
  const SOFT_MIN_K = 8;

  // User-visible strings live in i18n.js (loaded first in the browser, required here under Node).
  if (!window.I18N && typeof require === "function") require("./i18n.js");
  const t = (key, vars) => window.I18N.t(key, vars);
  const fmt = (n) => window.I18N.fmt(n);
  // Localized getters (e.g. RES["4k"].full), so callers keep reading plain properties.
  function labelled(table, prefix, fields) {
    for (const key of Object.keys(table)) {
      for (const f of fields) Object.defineProperty(table[key], f, { get: () => t(`${prefix}.${key}.${f}`), enumerable: true });
    }
    return table;
  }

  const RES = labelled({
    "1080p": { mp: 2.07, vram: 0 },
    "1440p": { mp: 3.69, vram: 1.5 },
    "uw1440": { mp: 4.95, vram: 2 },
    "4k": { mp: 8.29, vram: 3 },
  }, "res", ["label", "full"]);

  const QUALITY = labelled({
    low: { gpu: 1.75, cpu: 1.06, vram: -3 },
    medium: { gpu: 1.35, cpu: 1.03, vram: -1.5 },
    high: { gpu: 1, cpu: 1, vram: 0 },
    ultra: { gpu: 0.8, cpu: 0.96, vram: 2 },
  }, "quality", ["label"]);

  const WORKLOAD = labelled({
    general: { cpu: 1, gpu: 1, vram: 0 },
    esports: { cpu: 2.6, gpu: 3.2, vram: -4 },
    cpuheavy: { cpu: 0.55, gpu: 1.25, vram: 0 },
    raytracing: { cpu: 0.85, gpu: 0.58, vram: 1.5, rt: true },
  }, "workload", ["label", "short", "examples"]);

  const UPSCALE = labelled({
    off: { gpu: 1, vram: 0 },
    quality: { gpu: 1.4, vram: -0.5 },
    balanced: { gpu: 1.6, vram: -0.8 },
    performance: { gpu: 1.85, vram: -1 },
  }, "upscale", ["label"]);

  const RAM = { 8: 0.8, 16: 0.96, 32: 1, 64: 1 };

  // One threshold table used everywhere (calculator, copy, FAQ).
  const SEVERITY = [
    { max: 10, key: "excellent" },
    { max: 20, key: "good" },
    { max: 35, key: "moderate" },
    { max: 101, key: "severe" },
  ];
  SEVERITY.forEach((s) => Object.defineProperty(s, "label", { get: () => t(`sev.${s.key}`), enumerable: true }));

  const severityOf = (pct) => SEVERITY.find((s) => pct < s.max);

  // A GPU-bound system is the healthy state for gaming, so it gets calmer wording ("verdict.gpu.*").
  function verdict(r) {
    const s = severityOf(r.pct);
    if (r.limiter === "gpu") return { key: s.key, label: t(`verdict.gpu.${s.key}`), tone: s.key === "excellent" ? "excellent" : "gpu" };
    return { key: s.key, label: s.key === "excellent" ? s.label : t(`verdict.cpu.${s.key}`), tone: s.key };
  }

  // The game type, optionally tuned by per-game multipliers (o.game, see games.js).
  function workload(o) {
    const wl = WORKLOAD[o.workload];
    const t = o.game;
    return t ? { ...wl, cpu: wl.cpu * t.cpu, gpu: wl.gpu * t.gpu, vram: wl.vram + (t.vram || 0) } : wl;
  }

  function cpuCeiling(cpu, o) {
    const wl = workload(o);
    let f = cpu.g * CPU_FPS_PER_POINT * wl.cpu * QUALITY[o.quality].cpu * (RAM[o.ram] || 1);
    if (o.workload === "cpuheavy" && cpu.threads < 8) f *= 0.85;
    if (o.workload !== "esports" && cpu.threads <= 4) f *= 0.9; // modern AAA stutters on 4 threads
    if (o.streaming) f *= cpu.threads >= 24 ? 0.92 : cpu.threads >= 16 ? 0.86 : cpu.threads >= 12 ? 0.8 : 0.7;
    return f;
  }

  function vramNeed(o) {
    return Math.max(2, 8 + RES[o.res].vram + QUALITY[o.quality].vram + workload(o).vram + UPSCALE[o.upscale].vram);
  }

  function gpuCeiling(gpu, o) {
    const wl = workload(o);
    const resF = Math.pow(RES[o.res].mp / RES["1080p"].mp, -RES_EXPONENT);
    let f = gpu.g * GPU_FPS_PER_POINT * resF * wl.gpu * QUALITY[o.quality].gpu * UPSCALE[o.upscale].gpu;
    if (wl.rt) f *= gpu.rt > 0 ? gpu.rt : 0.22;
    // Integrated GPUs use system RAM, so they have no fixed VRAM budget.
    if (gpu.type !== "i") {
      const deficit = vramNeed(o) - gpu.vram;
      if (deficit > 0) f *= Math.max(0.55, 1 - 0.05 * deficit);
    }
    return f;
  }

  function evaluate(cpu, gpu, o) {
    const c = cpuCeiling(cpu, o);
    const g = gpuCeiling(gpu, o);
    const fps = Math.pow(Math.pow(c, -SOFT_MIN_K) + Math.pow(g, -SOFT_MIN_K), -1 / SOFT_MIN_K);
    const limiter = c < g ? "cpu" : "gpu";
    const pct = (Math.abs(c - g) / Math.max(c, g)) * 100;
    // 1% lows are worse when CPU-bound; blend smoothly so they track the average.
    const t = Math.min(1, Math.max(0, (c / g - 0.8) / 0.4));
    let lowRatio = 0.7 + 0.08 * t;
    if (/X3D/.test(cpu.name)) lowRatio += 0.04;
    if (o.ram === 8) lowRatio -= 0.08;
    return {
      cpuFps: c, gpuFps: g, fps, low1: fps * lowRatio, limiter, pct,
      severity: severityOf(pct),
      verdict: verdict({ pct, limiter }),
      cpuLoad: Math.min(99, (fps / c) * 100),
      gpuLoad: Math.min(99, (fps / g) * 100),
      vramNeed: vramNeed(o),
    };
  }

  // Suggest the smallest upgrades that bring the system into balance.
  function upgrades(cpu, gpu, o, r, HW) {
    const out = { cpu: [], gpu: [], sameSocket: [] };
    const target = 10;
    if (r.limiter === "cpu" && r.pct >= 15 && cpu.type !== "l") {
      const desktop = HW.cpus.filter((x) => x.type === "d" && x.g > cpu.g && x.year >= 2022);
      const solve = (list) => list
        .map((x) => ({ part: x, r: evaluate(x, gpu, o) }))
        .filter((x) => x.r.pct < target || x.r.limiter === "gpu")
        .sort((a, b) => a.part.g - b.part.g);
      // Same-socket picks first: no new motherboard or RAM needed.
      out.cpu = dedupeByScore(solve(desktop)).slice(0, 3)
        .sort((a, b) => (b.part.socket === cpu.socket) - (a.part.socket === cpu.socket));
      const same = HW.cpus.filter((x) => x.socket === cpu.socket && x.type === "d" && x.g > cpu.g)
        .sort((a, b) => b.g - a.g);
      if (same.length && !out.cpu.some((x) => x.part.socket === cpu.socket)) {
        const best = same[0];
        out.sameSocket = [{ part: best, r: evaluate(best, gpu, o) }];
      }
    }
    if (r.limiter === "gpu" && r.pct >= 20 && gpu.type === "d") {
      const desktop = HW.gpus.filter((x) => x.type === "d" && x.g > gpu.g * 1.15 && x.year >= 2023);
      const list = desktop
        .map((x) => ({ part: x, r: evaluate(cpu, x, o) }))
        .sort((a, b) => a.part.g - b.part.g);
      // Three tiers: a solid step up, a big step up, and the balanced match for this CPU.
      const pick = (fn, tag) => { const x = list.find(fn); return x ? { ...x, tag } : null; };
      const tiers = [
        pick((x) => x.r.fps >= r.fps * 1.4, t("up.stepUp")),
        pick((x) => x.r.fps >= r.fps * 1.8, t("up.big")),
        pick((x) => x.r.pct < 20, t("up.match")),
      ].filter(Boolean);
      const seen = new Set();
      out.gpu = tiers.filter((x) => !seen.has(x.part.name) && seen.add(x.part.name));
    }
    return out;
  }

  function dedupeByScore(list) {
    const seen = new Set();
    return list.filter((x) => {
      const k = Math.round(x.part.g / 3);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function tips(cpu, gpu, o, r) {
    const out = [];
    const hz = o.hz;
    if (r.limiter === "cpu" && r.pct >= 15 && o.res === "1080p") {
      const alt = evaluate(cpu, gpu, { ...o, res: "1440p" });
      out.push({ type: "good", text: t("tip.res", { fps: Math.round(alt.fps), pct: Math.round(alt.pct) }) });
    }
    if (r.limiter === "cpu" && o.upscale !== "off") {
      out.push({ type: "info", text: t("tip.upscaleCpu") });
    }
    if (r.limiter === "cpu" && (o.quality === "low" || o.quality === "medium")) {
      out.push({ type: "info", text: t("tip.qualityFree") });
    }
    if (r.limiter === "gpu" && r.fps < 60 && o.upscale === "off") {
      out.push({ type: "warn", text: t("tip.below60") });
    }
    if (gpu.type !== "i" && gpu.vram < r.vramNeed) {
      out.push({ type: "warn", text: t("tip.vram", { vram: gpu.vram, need: Math.round(r.vramNeed) }) });
    }
    if (o.ram === 8) {
      out.push({ type: "warn", text: t("tip.ram8") });
    }
    if (WORKLOAD[o.workload].rt && gpu.rt === 0) {
      out.push({ type: "warn", text: t("tip.noRt", { gpu: shortName(gpu.name) }) });
    }
    if (o.streaming) {
      out.push({ type: "info", text: t("tip.stream") });
    }
    if (hz && r.fps > hz * 1.15) {
      out.push({ type: "info", text: t("tip.overHz", { hz, fps: Math.round(r.fps) }) });
    } else if (hz && r.fps < hz * 0.7 && r.fps >= 50) {
      out.push({ type: "info", text: t("tip.underHz", { hz }) });
    }
    if (cpu.type === "l" || gpu.type === "l") {
      out.push({ type: "info", text: t("tip.laptop") });
    }
    return out;
  }

  const shortName = (n) => n.replace(/^(AMD|Intel|NVIDIA)\s+/, "").replace(/^GeForce\s+|^Radeon\s+/, "");

  // Default build shown on first load (also pre-rendered into index.html by scripts/build.js).
  const DEFAULTS = {
    cpu: "ryzen-7-7800x3d", gpu: "rtx-5070-ti", res: "1440p", quality: "high",
    workload: "general", upscale: "off", ram: 32, hz: 165, streaming: false,
  };

  // One-paragraph explanation of a result, shared by the calculator and the build script.
  function summary(cpu, gpu, r, o) {
    const v = { res: RES[o.res].label, c: shortName(cpu.name), g: shortName(gpu.name) };
    if (r.verdict.key === "excellent") {
      return t("sum.excellent", { ...v, fps: fmt(r.fps), wl: WORKLOAD[o.workload].short, wlInline: t(`gtype.${o.workload}`), q: QUALITY[o.quality].label });
    }
    if (r.limiter === "cpu") {
      return t("sum.cpu", { ...v, diff: fmt(r.gpuFps - r.cpuFps), cpuFps: fmt(r.cpuFps) }) +
        (r.pct >= 20 ? t("sum.cpu.big") : t("sum.cpu.small"));
    }
    return t("sum.gpu", { ...v, cpuFps: fmt(r.cpuFps) }) + (r.fps < 60 ? t("sum.gpu.low") : "");
  }

  window.Engine = { DEFAULTS, summary, verdict, RES, QUALITY, WORKLOAD, UPSCALE, SEVERITY, evaluate, upgrades, tips, severityOf, shortName };
})();
