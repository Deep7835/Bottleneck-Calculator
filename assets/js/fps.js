/*
 * FPS calculator page (/fps-calculator/). Same engine as the bottleneck
 * calculator, plus per-game profiles from games.js.
 */
(function () {
  const { HW, Engine, Games, Combobox, I18N } = window;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const byId = (list, id) => list.find((x) => x.id === id);
  const t = I18N.t;
  const fmt = I18N.fmt;
  const short = Engine.shortName;

  const DEFAULTS = {
    cpu: "ryzen-5-7600", gpu: "rtx-5070", game: "cyberpunk", res: "1440p", quality: "high",
    upscale: "off", ram: 32, hz: 144,
  };
  const state = { ...DEFAULTS };
  const QUALITIES = ["low", "medium", "high", "ultra"];
  const TARGETS = [60, 144, 240];

  // ---------- URL state (shareable results) ----------
  const PARAMS = { cpu: "cpu", gpu: "gpu", game: "game", res: "res", quality: "q", upscale: "up", ram: "ram", hz: "hz" };
  const ALWAYS = ["cpu", "gpu", "game"];

  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (p.get("cpu") && byId(HW.cpus, p.get("cpu"))) state.cpu = p.get("cpu");
    if (p.get("gpu") && byId(HW.gpus, p.get("gpu"))) state.gpu = p.get("gpu");
    if (p.get("game") && Games.valid(p.get("game"))) state.game = p.get("game");
    if (Engine.RES[p.get("res")]) state.res = p.get("res");
    if (Engine.QUALITY[p.get("q")]) state.quality = p.get("q");
    if (Engine.UPSCALE[p.get("up")]) state.upscale = p.get("up");
    if ([8, 16, 32, 64].includes(+p.get("ram"))) state.ram = +p.get("ram");
    if (+p.get("hz") >= 30 && +p.get("hz") <= 500) state.hz = +p.get("hz");
  }

  function shareUrl() {
    const p = new URLSearchParams();
    for (const [k, q] of Object.entries(PARAMS)) {
      if (ALWAYS.includes(k) || state[k] !== DEFAULTS[k]) p.set(q, state[k]);
    }
    return `${location.origin}${location.pathname}?${p.toString()}`;
  }

  // ---------- Inputs ----------
  const cpuBox = Combobox($('.combo[data-kind="cpu"]'), HW.cpus, "cpu", (it) => { state.cpu = it.id; update(); });
  const gpuBox = Combobox($('.combo[data-kind="gpu"]'), HW.gpus, "gpu", (it) => { state.gpu = it.id; update(); });

  function syncInputs() {
    cpuBox.set(byId(HW.cpus, state.cpu));
    gpuBox.set(byId(HW.gpus, state.gpu));
    $$('input[name="res"]').forEach((r) => (r.checked = r.value === state.res));
    $$('input[name="quality"]').forEach((r) => (r.checked = r.value === state.quality));
    $$('input[name="ram"]').forEach((r) => (r.checked = +r.value === state.ram));
    $("#game").value = state.game;
    $("#upscale").value = state.upscale;
    const hz = $("#hz");
    if (![...hz.options].some((o) => +o.value === state.hz)) hz.add(new Option(state.hz + " Hz", state.hz));
    hz.value = String(state.hz);
  }

  $("#calc-form").addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "res") state.res = t.value;
    else if (t.name === "quality") state.quality = t.value;
    else if (t.name === "ram") state.ram = +t.value;
    else if (t.id === "game") state.game = t.value;
    else if (t.id === "upscale") state.upscale = t.value;
    else if (t.id === "hz") state.hz = +t.value;
    else return;
    update();
  });

  const moreBtn = $("#more-toggle");
  moreBtn.addEventListener("click", () => {
    const open = moreBtn.getAttribute("aria-expanded") !== "true";
    moreBtn.setAttribute("aria-expanded", String(open));
    $("#more").classList.toggle("open", open);
  });

  const pipeline = Motion.Pipeline($("#pipe-canvas"), { cpu: $("#node-cpu"), gpu: $("#node-gpu"), display: $("#node-display") }, $("#results"));
  const ICONS = {
    good: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/></svg>',
  };

  // ---------- Model ----------
  const opts = (over = {}) => ({ res: state.res, quality: state.quality, upscale: state.upscale, ram: state.ram, hz: state.hz, streaming: false, ...over });
  const parts = () => ({ cpu: byId(HW.cpus, state.cpu), gpu: byId(HW.gpus, state.gpu) });
  const run = (over, game = state.game) => { const { cpu, gpu } = parts(); return Games.evaluate(cpu, gpu, game, opts(over)); };

  // Same four bands as the legend under the FPS table.
  const fpsTone = (fps) => fps >= 144 ? "excellent" : fps >= 60 ? "gpu" : fps >= 30 ? "moderate" : "severe";
  const limitText = (r) => r.capped ? `<span class="dot" data-tone="excellent"></span>${t("fps.limit.game")}`
    : r.verdict.key === "excellent" ? `<span class="dot" data-tone="excellent"></span>${t("limit.balanced")}`
    : `<span class="dot" data-tone="${r.verdict.tone}"></span>${r.limiter.toUpperCase()}`;
  const qLabel = (q) => Engine.QUALITY[q].label;
  const upperFirst = (s) => s[0].toUpperCase() + s.slice(1);

  function summary(cpu, gpu, r) {
    const c = short(cpu.name), g = short(gpu.name);
    const at = t("fps.at", { res: Engine.RES[state.res].label, q: qLabel(state.quality) });
    const game = Games.byId[state.game];
    if (r.capped) {
      return t("fps.sum.capped", { game: game.name, cap: game.cap, c, g, at, unc: fmt(r.uncapped) });
    }
    const lead = t("fps.sum.lead", { fps: fmt(r.fps), low: fmt(r.low1), at });
    if (r.verdict.key === "excellent") return t("fps.sum.excellent", { lead, game: Games.name(state.game) });
    if (r.limiter === "cpu") {
      return t("fps.sum.cpu", { lead, c, g, gpuFps: fmt(r.gpuFps) });
    }
    return t("fps.sum.gpu", { lead, c, g, cpuFps: fmt(r.cpuFps) });
  }

  // How to reach each common refresh rate with this build.
  function targetNote(T, cpu) {
    const game = Games.byId[state.game];
    const label = `<b>${T} Hz</b>`;
    if (game && game.cap && game.cap < T) {
      return { type: "info", text: t("fps.tgt.capped", { label, game: game.name, cap: game.cap }) };
    }
    const curIdx = QUALITIES.indexOf(state.quality);
    const best = [...QUALITIES].reverse().find((q) => run({ quality: q }).fps >= T);
    if (best) {
      const r = run({ quality: best });
      if (QUALITIES.indexOf(best) >= curIdx) {
        const now = run();
        return { type: "good", text: t("fps.tgt.reached", { label, fps: fmt(now.fps), q: best !== state.quality ? qLabel(best) : "" }) };
      }
      return { type: "info", text: t("fps.tgt.drop", { label, q: qLabel(best), fps: fmt(r.fps) }) };
    }
    const low = run({ quality: "low" });
    if (low.cpuFps < T) {
      return { type: "warn", text: t("fps.tgt.cpu", { label, c: short(cpu.name), fps: fmt(low.cpuFps) }) };
    }
    // Stronger upscaling modes than the current one, mildest first.
    const ups = Object.keys(Engine.UPSCALE);
    for (const up of ups.slice(ups.indexOf(state.upscale) + 1)) {
      const r = run({ quality: "low", upscale: up });
      if (r.fps >= T) return { type: "info", text: t("fps.tgt.upscale", { label, up: Engine.UPSCALE[up].label, fps: fmt(r.fps) }) };
    }
    return { type: "warn", text: t("fps.tgt.gpu", { label, res: Engine.RES[state.res].label, fps: fmt(low.fps) }) };
  }

  // ---------- Rendering ----------
  let touched = false;
  const hadParams = new URLSearchParams(location.search).has("cpu");

  function update(initial) {
    if (!initial) touched = true;
    const { cpu, gpu } = parts();
    const game = Games.byId[state.game];
    const gameName = Games.name(state.game);
    const r = run();

    $("#cpu-meta").textContent = I18N.meta.cpu(cpu);
    $("#gpu-meta").textContent = I18N.meta.gpu(gpu);

    // Gauge: how much of the monitor's refresh rate this build fills.
    const tone = fpsTone(r.fps);
    $("#results").dataset.tone = tone;
    $("#gauge-fill").style.strokeDashoffset = String(100 - Math.max(2, Math.min(100, (r.fps / state.hz) * 100)));
    Motion.countUp($("#fps"), r.fps, fmt, 900);
    $("#fps-label").textContent = t("fps.gauge", { hz: state.hz });
    $("#tone-pill").textContent = r.capped ? t("fps.pill.capped", { cap: game.cap })
      : r.verdict.key === "excellent" ? t("pill.balanced") : t(r.limiter === "cpu" ? "pill.cpu" : "pill.gpu");
    const title = t("fps.title", { fps: fmt(r.fps), game: gameName });
    const verdict = $(".verdict");
    if ($("#verdict-title").textContent !== title) {
      verdict.classList.remove("swap");
      void verdict.offsetWidth;
      verdict.classList.add("swap");
    }
    $("#verdict-title").textContent = title;
    $("#verdict-text").textContent = summary(cpu, gpu, r);

    // Frame pipeline
    const cpuLimit = !r.capped && r.verdict.key !== "excellent" && r.limiter === "cpu";
    const gpuLimit = !r.capped && r.verdict.key !== "excellent" && r.limiter === "gpu";
    $("#node-cpu").classList.toggle("limit", cpuLimit);
    $("#node-gpu").classList.toggle("limit", gpuLimit);
    Motion.countUp($("#cap-cpu-val"), r.cpuFps, fmt);
    Motion.countUp($("#cap-gpu-val"), r.gpuFps, fmt);
    $("#cap-hz-val").textContent = state.hz + " Hz";
    $("#pipeline").setAttribute("aria-label", t("pipe.aria", { cpu: fmt(r.cpuFps), gpu: fmt(r.gpuFps), hz: state.hz }));
    pipeline.set(r.capped ? { fps: r.fps, limiter: "gpu", pct: 0 } : r);

    // Stats
    Motion.countUp($("#s-fps"), r.fps, fmt);
    Motion.countUp($("#s-low"), r.low1, fmt);
    Motion.countUp($("#s-ms"), 1000 / r.fps, I18N.dec1);
    $("#s-limit").textContent = r.capped ? t("fps.limit.cap") : r.verdict.key === "excellent" ? t("fps.limit.both") : r.limiter.toUpperCase();
    const qCtx = t("ctx.q", { q: qLabel(state.quality) });
    $("#opt-summary").textContent = `${qCtx} · ${state.ram} GB · ${state.hz} Hz${state.upscale !== "off" ? t("opt.upscaling") : ""}`;
    $("#context-line").textContent = `${upperFirst(gameName)} · ${Engine.RES[state.res].full} · ${qCtx}${state.upscale !== "off" ? " · " + Engine.UPSCALE[state.upscale].label : ""}`;

    // Resolution × quality grid
    const rows = ["1080p", "1440p", "4k"];
    if (state.res === "uw1440") rows.splice(2, 0, "uw1440");
    $("#grid-sub").textContent = t("fps.grid.sub", { game: gameName, mode: state.upscale === "off" ? t("fps.grid.native") : Engine.UPSCALE[state.upscale].label });
    $("#fps-grid tbody").innerHTML = rows.map((res) => {
      const cells = QUALITIES.map((q) => {
        const x = run({ res, quality: q });
        const cur = res === state.res && q === state.quality;
        return `<td class="r"><button type="button" class="fps-cell num" data-res="${res}" data-q="${q}" data-tone="${fpsTone(x.fps)}" aria-pressed="${cur}" aria-label="${t("fps.cell.aria", { res: Engine.RES[res].label, q: qLabel(q), fps: fmt(x.fps) })}"><span class="dot"></span>${fmt(x.fps)}</button></td>`;
      }).join("");
      return `<tr><th scope="row">${Engine.RES[res].label}</th>${cells}</tr>`;
    }).join("");

    // Refresh-rate targets
    $("#targets").innerHTML = TARGETS.map((T) => targetNote(T, cpu))
      .map((t) => `<li class="${t.type}">${ICONS[t.type]}<span>${t.text}</span></li>`).join("");

    // Recommendations: the game's own note first, then the shared engine tips.
    const o = game ? { ...opts(), workload: game.base, game } : { ...opts(), workload: state.game };
    const tips = Engine.tips(cpu, gpu, r.capped ? { ...o, hz: 0 } : o, r);
    tips.unshift({ type: "info", text: game ? game.note : t("fps.tip.type", { ex: Engine.WORKLOAD[state.game].examples }) });
    $("#tips").innerHTML = tips.map((t) => `<li class="${t.type}">${ICONS[t.type] || ICONS.info}<span>${t.text}</span></li>`).join("");

    // Every game with this build
    $("#games-sub").textContent = t("fps.games.sub", { c: short(cpu.name), g: short(gpu.name), res: Engine.RES[state.res].label, q: qLabel(state.quality) });
    $("#games-table tbody").innerHTML = Games.list.map((g) => {
      const x = run({}, g.id);
      const href = `?cpu=${state.cpu}&amp;gpu=${state.gpu}&amp;game=${g.id}`;
      return `<tr class="${g.id === state.game ? "current" : ""}"><td><a class="game-link" href="${href}" data-game="${g.id}">${g.name}</a></td><td class="r num">${fmt(x.fps)}</td><td class="r num">${fmt(x.low1)}</td><td>${limitText(x)}</td></tr>`;
    }).join("");

    if (touched) history.replaceState(null, "", shareUrl().replace(location.origin, "") + location.hash);
    if (touched || hadParams) document.title = t("fps.doc.title", { game: upperFirst(gameName), c: short(cpu.name), g: short(gpu.name) });
  }

  $("#fps-grid").addEventListener("click", (e) => {
    const b = e.target.closest(".fps-cell");
    if (!b) return;
    state.res = b.dataset.res;
    state.quality = b.dataset.q;
    syncInputs();
    update();
  });

  $("#games-table").addEventListener("click", (e) => {
    const a = e.target.closest("a.game-link");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    state.game = a.dataset.game;
    syncInputs();
    update();
    $("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Pre-rendered example links in the article load into the calculator without a reload.
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a.load-build");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    Object.assign(state, DEFAULTS);
    history.replaceState(null, "", new URL(a.href).search + "#calculator");
    readUrl();
    syncInputs();
    update();
    $("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ---------- Share ----------
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  $("#share-btn").addEventListener("click", async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast(t("toast.copied"));
    } catch {
      window.prompt(t("prompt.copy"), url);
    }
  });

  readUrl();
  syncInputs();
  update(true);
  Motion.initPage();
})();
