(function () {
  const { HW, Engine, Combobox, I18N } = window;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const byId = (list, id) => list.find((x) => x.id === id);
  const t = I18N.t;
  const fmt = I18N.fmt;
  const Meta = I18N.meta;
  const short = Engine.shortName;

  const DEFAULTS = Engine.DEFAULTS;
  const state = { ...DEFAULTS };

  // ---------- URL state (shareable results) ----------
  const PARAMS = { cpu: "cpu", gpu: "gpu", res: "res", quality: "q", workload: "game", upscale: "up", ram: "ram", hz: "hz", streaming: "stream" };

  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (p.get("cpu") && byId(HW.cpus, p.get("cpu"))) state.cpu = p.get("cpu");
    if (p.get("gpu") && byId(HW.gpus, p.get("gpu"))) state.gpu = p.get("gpu");
    if (Engine.RES[p.get("res")]) state.res = p.get("res");
    if (Engine.QUALITY[p.get("q")]) state.quality = p.get("q");
    if (Engine.WORKLOAD[p.get("game")]) state.workload = p.get("game");
    if (Engine.UPSCALE[p.get("up")]) state.upscale = p.get("up");
    if ([8, 16, 32, 64].includes(+p.get("ram"))) state.ram = +p.get("ram");
    if (+p.get("hz") >= 30 && +p.get("hz") <= 500) state.hz = +p.get("hz");
    state.streaming = p.get("stream") === "1";
  }

  function shareUrl() {
    const p = new URLSearchParams();
    for (const [k, q] of Object.entries(PARAMS)) {
      if (k === "streaming") { if (state.streaming) p.set(q, "1"); continue; }
      if (k === "cpu" || k === "gpu" || state[k] !== DEFAULTS[k]) p.set(q, state[k]);
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
    $("#workload").value = state.workload;
    $("#upscale").value = state.upscale;
    const hz = $("#hz");
    if (![...hz.options].some((o) => +o.value === state.hz)) hz.add(new Option(state.hz + " Hz", state.hz));
    hz.value = String(state.hz);
    $("#streaming").checked = state.streaming;
  }

  $("#calc-form").addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "res") state.res = t.value;
    else if (t.name === "quality") state.quality = t.value;
    else if (t.name === "ram") state.ram = +t.value;
    else if (t.id === "workload") state.workload = t.value;
    else if (t.id === "upscale") state.upscale = t.value;
    else if (t.id === "hz") state.hz = +t.value;
    else if (t.id === "streaming") state.streaming = t.checked;
    else return;
    update();
  });

  // Settings disclosure
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

  // ---------- Rendering ----------
  const opts = () => ({ res: state.res, quality: state.quality, workload: state.workload, upscale: state.upscale, ram: state.ram, hz: state.hz, streaming: state.streaming });

  function limitText(r) {
    if (r.verdict.key === "excellent") return `<span class="dot" data-tone="excellent"></span>${t("limit.balanced")}`;
    return `<span class="dot" data-tone="${r.verdict.tone}"></span>${r.limiter.toUpperCase()} ${Math.round(r.pct)}%`;
  }

  const summary = Engine.summary;

  let touched = false;
  const hadParams = new URLSearchParams(location.search).has("cpu");
  function update(initial) {
    if (!initial) touched = true;
    const cpu = byId(HW.cpus, state.cpu);
    const gpu = byId(HW.gpus, state.gpu);
    const o = opts();
    const r = Engine.evaluate(cpu, gpu, o);

    // Field meta lines
    $("#cpu-meta").textContent = Meta.cpu(cpu);
    $("#gpu-meta").textContent = Meta.gpu(gpu);

    // Gauge + verdict (the tone colour flows from #results through CSS)
    const tone = r.verdict.tone;
    $("#results").dataset.tone = tone;
    $("#gauge-fill").style.strokeDashoffset = String(100 - Math.max(2, Math.min(100, r.pct)));
    Motion.countUp($("#pct"), r.pct, (v) => Math.round(v) + "%", 900);
    $("#pct-label").textContent = r.verdict.key === "excellent" ? t("gauge.balanced") : t("gauge.limited", { lim: r.limiter.toUpperCase() });
    $("#tone-pill").textContent = r.verdict.key === "excellent" ? t("pill.balanced") : t(r.limiter === "cpu" ? "pill.cpu" : "pill.gpu");
    const verdict = $(".verdict");
    if ($("#verdict-title").textContent !== r.verdict.label) {
      verdict.classList.remove("swap");
      void verdict.offsetWidth; // restart the animation
      verdict.classList.add("swap");
    }
    $("#verdict-title").textContent = r.verdict.label;
    $("#verdict-text").textContent = summary(cpu, gpu, r, o);

    // Frame pipeline
    const cpuLimit = r.verdict.key !== "excellent" && r.limiter === "cpu";
    const gpuLimit = r.verdict.key !== "excellent" && r.limiter === "gpu";
    $("#node-cpu").classList.toggle("limit", cpuLimit);
    $("#node-gpu").classList.toggle("limit", gpuLimit);
    Motion.countUp($("#cap-cpu-val"), r.cpuFps, fmt);
    Motion.countUp($("#cap-gpu-val"), r.gpuFps, fmt);
    $("#cap-hz-val").textContent = state.hz + " Hz";
    $("#pipeline").setAttribute("aria-label", t("pipe.aria", { cpu: fmt(r.cpuFps), gpu: fmt(r.gpuFps), hz: state.hz }));
    pipeline.set(r);

    // Stats
    Motion.countUp($("#s-fps"), r.fps, fmt);
    Motion.countUp($("#s-low"), r.low1, fmt);
    Motion.countUp($("#s-cpu"), r.cpuLoad, (v) => Math.round(v));
    Motion.countUp($("#s-gpu"), r.gpuLoad, (v) => Math.round(v));
    $("#m-cpu").style.transform = `scaleX(${r.cpuLoad / 100})`;
    $("#m-gpu").style.transform = `scaleX(${r.gpuLoad / 100})`;
    $("#m-cpu").classList.toggle("hot", cpuLimit);
    $("#m-gpu").classList.toggle("hot", gpuLimit);
    const qCtx = t("ctx.q", { q: Engine.QUALITY[o.quality].label });
    $("#opt-summary").textContent = `${qCtx} · ${Engine.WORKLOAD[o.workload].short} · ${o.ram} GB · ${o.hz} Hz${o.upscale !== "off" ? t("opt.upscaling") : ""}${o.streaming ? t("opt.streaming") : ""}`;
    $("#context-line").textContent = `${Engine.RES[o.res].full} · ${qCtx} · ${Engine.WORKLOAD[o.workload].short}${o.upscale !== "off" ? " · " + Engine.UPSCALE[o.upscale].label : ""}`;

    // Resolution table
    $("#res-table tbody").innerHTML = Object.entries(Engine.RES).map(([key, res]) => {
      const x = Engine.evaluate(cpu, gpu, { ...o, res: key });
      return `<tr class="${key === o.res ? "current" : ""}"><td>${res.label}<span class="hide-sm"> ${res.full.replace(/^[^(]*/, "")}</span></td><td class="r num">${fmt(x.fps)}</td><td class="r num">${fmt(x.low1)}</td><td>${limitText(x)}</td></tr>`;
    }).join("");

    // Game type table
    $("#wl-sub").textContent = t("wl.sub", { res: Engine.RES[o.res].label, q: Engine.QUALITY[o.quality].label });
    $("#wl-table tbody").innerHTML = Object.entries(Engine.WORKLOAD).map(([key, wl]) => {
      const x = Engine.evaluate(cpu, gpu, { ...o, workload: key });
      return `<tr class="${key === o.workload ? "current" : ""}"><td>${wl.label}<br><small>${wl.examples}</small></td><td class="r num">${fmt(x.fps)}</td><td>${limitText(x)}</td></tr>`;
    }).join("");

    // Tips
    const tips = Engine.tips(cpu, gpu, o, r);
    if (!tips.length) tips.push({ type: "good", text: t("tip.none") });
    $("#tips").innerHTML = tips.map((t) => `<li class="${t.type}">${ICONS[t.type] || ICONS.info}<span>${t.text}</span></li>`).join("");

    renderUpgrades(cpu, gpu, o, r);
    // Keep the address bar shareable, but leave a clean URL until the user changes something.
    if (touched) history.replaceState(null, "", shareUrl().replace(location.origin, "") + location.hash);
    // Only retitle for a specific build, so the homepage keeps its SEO title when rendered.
    if (touched || hadParams) document.title = t("title.build", { c: short(cpu.name), g: short(gpu.name) });
  }

  function renderUpgrades(cpu, gpu, o, r) {
    const up = Engine.upgrades(cpu, gpu, o, r, HW);
    const box = $("#upgrades");
    const card = (x, kind, tag) => {
      const gain = Math.round((x.r.fps / r.fps - 1) * 100);
      return `<button type="button" class="up" data-kind="${kind}" data-id="${x.part.id}">
        <span class="up-tag">${tag}</span>
        <span class="up-name">${short(x.part.name)}</span>
        <span class="up-gain">≈${fmt(x.r.fps)} FPS <b>(+${gain}%)</b> · ${x.r.verdict.key === "excellent" ? t("up.balanced") : x.r.limiter.toUpperCase() + " " + Math.round(x.r.pct) + "%"}</span>
      </button>`;
    };
    let html = "";
    if (up.cpu.length || up.sameSocket.length) {
      $("#up-title").textContent = t("up.cpu.title");
      $("#up-sub").textContent = t("up.cpu.sub", { g: short(gpu.name) });
      html += up.sameSocket.map((x) => card(x, "cpu", t("up.dropIn", { socket: x.part.socket }))).join("");
      html += up.cpu.map((x) => card(x, "cpu", t(x.part.socket === cpu.socket ? "up.sameSocket" : "up.newPlatform", { socket: x.part.socket }))).join("");
    } else if (up.gpu.length) {
      $("#up-title").textContent = t("up.gpu.title");
      $("#up-sub").textContent = t("up.gpu.sub", { c: short(cpu.name) });
      html += up.gpu.map((x) => card(x, "gpu", x.tag)).join("");
    } else {
      $("#up-title").textContent = t("up.title");
      $("#up-sub").textContent = t("up.sub");
      const laptop = cpu.type === "l" || gpu.type !== "d";
      html = `<p class="empty-note">${laptop && r.pct >= 15 ? t("up.laptop") : t("up.none")}</p>`;
    }
    box.innerHTML = html;
  }

  $("#upgrades").addEventListener("click", (e) => {
    const b = e.target.closest(".up");
    if (!b) return;
    state[b.dataset.kind] = b.dataset.id;
    syncInputs();
    update();
    $("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Popular combo links load into the calculator without a page reload.
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a.combo-card");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    Object.assign(state, DEFAULTS);
    const url = new URL(a.href);
    history.replaceState(null, "", url.search + "#calculator");
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
