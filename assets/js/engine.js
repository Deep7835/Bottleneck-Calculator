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

  const RES = {
    "1080p": { label: "1080p", full: "1080p (1920×1080)", mp: 2.07, vram: 0 },
    "1440p": { label: "1440p", full: "1440p (2560×1440)", mp: 3.69, vram: 1.5 },
    "uw1440": { label: "UW 1440p", full: "Ultrawide 1440p (3440×1440)", mp: 4.95, vram: 2 },
    "4k": { label: "4K", full: "4K (3840×2160)", mp: 8.29, vram: 3 },
  };

  const QUALITY = {
    low: { label: "Low", gpu: 1.75, cpu: 1.06, vram: -3 },
    medium: { label: "Medium", gpu: 1.35, cpu: 1.03, vram: -1.5 },
    high: { label: "High", gpu: 1, cpu: 1, vram: 0 },
    ultra: { label: "Ultra", gpu: 0.8, cpu: 0.96, vram: 2 },
  };

  const WORKLOAD = {
    general: { label: "AAA / mixed games", short: "AAA games", cpu: 1, gpu: 1, vram: 0,
      examples: "Cyberpunk 2077, Black Myth: Wukong, Elden Ring" },
    esports: { label: "Competitive esports", short: "Esports", cpu: 2.6, gpu: 3.2, vram: -4,
      examples: "CS2, Valorant, Fortnite (Performance), League of Legends" },
    cpuheavy: { label: "CPU-heavy (strategy, sims, MMO)", short: "CPU-heavy", cpu: 0.55, gpu: 1.25, vram: 0,
      examples: "MS Flight Simulator, Cities: Skylines II, WoW, Baldur's Gate 3 Act 3" },
    raytracing: { label: "Ray tracing / path tracing", short: "Ray tracing", cpu: 0.85, gpu: 0.58, vram: 1.5, rt: true,
      examples: "Cyberpunk RT Overdrive, Alan Wake 2, Indiana Jones" },
  };

  const UPSCALE = {
    off: { label: "Off (native)", gpu: 1, vram: 0 },
    quality: { label: "DLSS/FSR Quality", gpu: 1.4, vram: -0.5 },
    balanced: { label: "DLSS/FSR Balanced", gpu: 1.6, vram: -0.8 },
    performance: { label: "DLSS/FSR Performance", gpu: 1.85, vram: -1 },
  };

  const RAM = { 8: 0.8, 16: 0.96, 32: 1, 64: 1 };

  // One threshold table used everywhere (calculator, copy, FAQ).
  const SEVERITY = [
    { max: 10, key: "excellent", label: "Excellent balance" },
    { max: 20, key: "good", label: "Minor bottleneck" },
    { max: 35, key: "moderate", label: "Moderate bottleneck" },
    { max: 101, key: "severe", label: "Severe bottleneck" },
  ];

  const severityOf = (pct) => SEVERITY.find((s) => pct < s.max);

  // A GPU-bound system is the healthy state for gaming, so it gets calmer wording.
  const GPU_LABELS = {
    excellent: "Excellent balance",
    good: "Well balanced (GPU-bound)",
    moderate: "GPU-limited, CPU has headroom",
    severe: "Heavily GPU-limited",
  };

  function verdict(r) {
    const s = severityOf(r.pct);
    if (r.limiter === "gpu") return { key: s.key, label: GPU_LABELS[s.key], tone: s.key === "excellent" ? "excellent" : "gpu" };
    return { key: s.key, label: s.key === "excellent" ? s.label : s.label.replace("bottleneck", "CPU bottleneck"), tone: s.key };
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
        pick((x) => x.r.fps >= r.fps * 1.4, "Step up"),
        pick((x) => x.r.fps >= r.fps * 1.8, "Big upgrade"),
        pick((x) => x.r.pct < 20, "Best match for your CPU"),
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
    const t = [];
    const hz = o.hz;
    if (r.limiter === "cpu" && r.pct >= 15 && o.res === "1080p") {
      const alt = evaluate(cpu, gpu, { ...o, res: "1440p" });
      t.push({ type: "good", text: `Your GPU has headroom. Playing at 1440p would cost little FPS (≈${Math.round(alt.fps)} FPS) and drops the bottleneck to ${Math.round(alt.pct)}%.` });
    }
    if (r.limiter === "cpu" && o.upscale !== "off") {
      t.push({ type: "info", text: "You are CPU-bound, so DLSS/FSR upscaling adds little FPS here. Try running native resolution or DLAA for sharper image quality at nearly the same frame rate." });
    }
    if (r.limiter === "cpu" && (o.quality === "low" || o.quality === "medium")) {
      t.push({ type: "info", text: "Raising graphics quality is almost free while CPU-bound — the GPU is idling anyway." });
    }
    if (r.limiter === "gpu" && r.fps < 60 && o.upscale === "off") {
      t.push({ type: "warn", text: "Below 60 FPS and GPU-bound: enable DLSS/FSR/XeSS Quality mode or drop to Medium settings for a big frame-rate gain." });
    }
    if (gpu.type !== "i" && gpu.vram < r.vramNeed) {
      t.push({ type: "warn", text: `${gpu.vram} GB of VRAM is below the ~${Math.round(r.vramNeed)} GB these settings need. Lower texture quality to avoid stutter and texture pop-in.` });
    }
    if (o.ram === 8) {
      t.push({ type: "warn", text: "8 GB of RAM is a bottleneck by itself in 2026 — expect stutter. 16 GB is the minimum, 32 GB is recommended." });
    }
    if (WORKLOAD[o.workload].rt && gpu.rt === 0) {
      t.push({ type: "warn", text: `${shortName(gpu.name)} has no hardware ray tracing cores. Ray tracing will run very slowly or not at all.` });
    }
    if (o.streaming) {
      t.push({ type: "info", text: "Streaming? Use your GPU's hardware encoder (NVENC, AMD AMF or Intel Quick Sync) instead of x264 to take the encoding load off your CPU." });
    }
    if (hz && r.fps > hz * 1.15) {
      t.push({ type: "info", text: `You'll exceed your ${hz} Hz monitor (≈${Math.round(r.fps)} FPS). Cap FPS a few frames below ${hz} for lower latency and less heat, or consider a higher refresh-rate monitor.` });
    } else if (hz && r.fps < hz * 0.7 && r.fps >= 50) {
      t.push({ type: "info", text: `Your ${hz} Hz monitor can show more frames than this build delivers. Variable refresh (G-Sync/FreeSync) will keep motion smooth.` });
    }
    if (cpu.type === "l" || gpu.type === "l") {
      t.push({ type: "info", text: "Laptop results assume a well-cooled chassis at full power. Thin laptops with lower TGP limits can be 10–25% slower." });
    }
    return t;
  }

  const shortName = (n) => n.replace(/^(AMD|Intel|NVIDIA)\s+/, "").replace(/^GeForce\s+|^Radeon\s+/, "");

  // Default build shown on first load (also pre-rendered into index.html by scripts/build.js).
  const DEFAULTS = {
    cpu: "ryzen-7-7800x3d", gpu: "rtx-5070-ti", res: "1440p", quality: "high",
    workload: "general", upscale: "off", ram: 32, hz: 165, streaming: false,
  };

  // One-paragraph explanation of a result, shared by the calculator and the build script.
  function summary(cpu, gpu, r, o) {
    const fmt = (n) => Math.round(n).toLocaleString("en-US");
    const res = RES[o.res].label;
    const c = shortName(cpu.name), g = shortName(gpu.name);
    if (r.verdict.key === "excellent") {
      return `The ${c} and ${g} are an excellent match at ${res}. Neither part holds the other back, and you can expect around ${fmt(r.fps)} FPS in ${WORKLOAD[o.workload].short.toLowerCase()} at ${QUALITY[o.quality].label} settings.`;
    }
    if (r.limiter === "cpu") {
      return `The ${c} limits the ${g} at ${res}. Your graphics card could render about ${fmt(r.gpuFps - r.cpuFps)} more FPS, but the CPU can only prepare around ${fmt(r.cpuFps)} frames per second.` +
        (r.pct >= 20 ? " Upgrading the CPU, or playing at a higher resolution, will make better use of this GPU." : " That's a small gap you're unlikely to notice.");
    }
    return `Your ${g} is the limiting part at ${res}, which is the normal and preferred situation for gaming. The ${c} has headroom for about ${fmt(r.cpuFps)} FPS, so it can handle a faster GPU later.` +
      (r.fps < 60 ? " FPS is below 60, so lower settings or enable upscaling." : "");
  }

  window.Engine = { DEFAULTS, summary, verdict, RES, QUALITY, WORKLOAD, UPSCALE, SEVERITY, evaluate, upgrades, tips, severityOf, shortName };
})();
