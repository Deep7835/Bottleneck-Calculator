/*
 * Mac gaming calculator UI (/mac/). The numbers and copy come from macs.js,
 * which the page generator also uses, so the first paint matches this script.
 */
(function () {
  const { Macs, Engine, Motion } = window;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const short = Engine.shortName;
  const RES_LABEL = { "1080p": "1080p", "1440p": "1440p", "4k": "4K", native: "Retina" };
  const Q_LABEL = { low: "Low", medium: "Medium", high: "High", ultra: "Ultra" };
  const RUN_BADGE = {
    native: '<span class="run run-native">Native</span>',
    translated: '<span class="run run-translated">CrossOver</span>',
    blocked: '<span class="run run-blocked">Not on Mac</span>',
    cloud: '<span class="run run-blocked">Cloud only</span>',
  };
  const ICONS = {
    good: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/></svg>',
  };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const DEFAULTS = { mac: "macbook-pro-14-m4-pro-20-core-gpu", game: "cyberpunk", res: "1080p", quality: "high", upscale: "off" };
  const state = { ...DEFAULTS, ram: Macs.byId[DEFAULTS.mac].defaultRam };

  // ---------- URL state ----------
  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (Macs.byId[p.get("mac")]) state.mac = p.get("mac");
    const m = Macs.byId[state.mac];
    state.ram = m.ram.includes(+p.get("ram")) ? +p.get("ram") : m.defaultRam;
    if (Macs.gameById[p.get("game")] || Macs.GENERIC[p.get("game")]) state.game = p.get("game");
    if (RES_LABEL[p.get("res")]) state.res = p.get("res");
    if (Q_LABEL[p.get("q")]) state.quality = p.get("q");
    if (Engine.UPSCALE[p.get("up")]) state.upscale = p.get("up");
    if (state.res === "native" && !m.display) state.res = "1440p";
  }
  function shareUrl() {
    const p = new URLSearchParams({ mac: state.mac, game: state.game });
    if (state.res !== DEFAULTS.res) p.set("res", state.res);
    if (state.quality !== DEFAULTS.quality) p.set("q", state.quality);
    if (state.upscale !== DEFAULTS.upscale) p.set("up", state.upscale);
    if (state.ram !== Macs.byId[state.mac].defaultRam) p.set("ram", state.ram);
    return `${location.origin}${location.pathname}?${p}`;
  }

  // ---------- Inputs ----------
  function syncInputs() {
    const m = Macs.byId[state.mac];
    $("#mac").value = state.mac;
    $("#game").value = state.game;
    $("#ram").innerHTML = m.ram.map((v) => `<option value="${v}"${v === state.ram ? " selected" : ""}>${v} GB</option>`).join("");
    $("#upscale").value = state.upscale;
    $$('input[name="res"]').forEach((r) => {
      r.checked = r.value === state.res;
      if (r.value === "native") { r.disabled = !m.display; r.closest("label").hidden = false; r.closest("label").classList.toggle("off", !m.display); }
    });
    $$('input[name="quality"]').forEach((r) => (r.checked = r.value === state.quality));
  }

  $("#mac-form").addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "mac") {
      state.mac = t.value;
      const m = Macs.byId[state.mac];
      if (!m.ram.includes(state.ram)) state.ram = m.defaultRam;
      if (state.res === "native" && !m.display) state.res = "1440p";
      syncInputs();
    } else if (t.id === "game") state.game = t.value;
    else if (t.id === "ram") state.ram = +t.value;
    else if (t.id === "upscale") state.upscale = t.value;
    else if (t.name === "res") state.res = t.value;
    else if (t.name === "quality") state.quality = t.value;
    else return;
    update();
  });

  const moreBtn = $("#more-toggle");
  moreBtn.addEventListener("click", () => {
    const open = moreBtn.getAttribute("aria-expanded") !== "true";
    moreBtn.setAttribute("aria-expanded", String(open));
    $("#more").classList.toggle("open", open);
  });

  // ---------- Render ----------
  let touched = false;
  function update(initial) {
    if (!initial) touched = true;
    const m = Macs.byId[state.mac];
    const g = Macs.game(state.game);
    const o = { res: state.res, quality: state.quality, upscale: state.upscale, ram: state.ram, game: state.game };
    const r = Macs.evaluate(m, o);
    const pc = Macs.pcEquivalent(m);
    const resLabel = state.res === "native" && m.display ? `Retina (${m.display.w}×${m.display.h})` : RES_LABEL[state.res];

    $("#mac-meta").textContent = `${m.chip.cpuLabel} · ${m.gpuCores}-core GPU · ${m.fanless ? "fanless" : "with fans"}`;
    $("#game-meta").textContent = Macs.RUN[g.run] ? Macs.RUN[g.run].label : g.note;

    $("#results").dataset.tone = Macs.tone(r);
    const verdict = $(".verdict");
    const title = `${Macs.label(r)} on this Mac`;
    if ($("#verdict-title").textContent !== title) { verdict.classList.remove("swap"); void verdict.offsetWidth; verdict.classList.add("swap"); }
    $("#verdict-title").textContent = title;
    $("#verdict-text").textContent = Macs.verdictLine(m, g, r, `${resLabel} ${Q_LABEL[state.quality]}`);
    $("#tone-pill").textContent = !r.playable ? (g.run === "cloud" ? "Cloud only" : "Blocked on macOS") : g.run === "translated" ? "Via CrossOver" : "Native";

    // Gauge shows FPS against a 120 FPS scale.
    $("#gauge-fill").style.strokeDashoffset = String(100 - (r.playable ? Math.max(2, Math.min(100, (r.fps / 120) * 100)) : 2));
    if (r.playable) Motion.countUp($("#big-fps"), r.fps, fmt, 900); else { $("#big-fps")._v = 0; $("#big-fps").textContent = "–"; }
    $("#big-label").textContent = r.playable ? "FPS average" : "not playable";
    if (r.playable) { Motion.countUp($("#s-fps"), r.fps, fmt); Motion.countUp($("#s-low"), r.low1, fmt); }
    else { $("#s-fps").textContent = "–"; $("#s-low").textContent = "–"; $("#s-fps")._v = 0; $("#s-low")._v = 0; }
    $("#s-vram").textContent = Macs.vramFor(state.ram);
    $("#s-pc").textContent = short(pc.gpu.name);
    $("#s-pc-cpu").textContent = `+ ${short(pc.cpu.name)}`;
    $("#opt-summary").textContent = `${Q_LABEL[state.quality]} · ${state.ram} GB · MetalFX ${state.upscale === "off" ? "off" : state.upscale}`;
    $("#context-line").textContent = `${m.name} · ${resLabel} · ${Q_LABEL[state.quality]} · ${state.ram} GB`;

    // Resolution table
    $("#res-sub").textContent = `${g.name} at ${Q_LABEL[state.quality]} settings.`;
    const resKeys = ["1080p", "1440p", "4k", ...(m.display ? ["native"] : [])];
    $("#res-table tbody").innerHTML = resKeys.map((k) => {
      const x = Macs.evaluate(m, { ...o, res: k });
      const lbl = k === "native" ? "Built-in display" : RES_LABEL[k];
      return `<tr class="${k === state.res ? "current" : ""}"><td>${lbl}</td>${x.playable ? `<td class="r num">${fmt(x.fps)}</td><td class="r num">${fmt(x.low1)}</td>` : '<td class="r">–</td><td class="r">–</td>'}</tr>`;
    }).join("");

    // All games
    $("#games-sub").textContent = `At ${resLabel} ${Q_LABEL[state.quality]} with ${state.ram} GB.`;
    $("#games-table tbody").innerHTML = Macs.games.map((x) => {
      const y = Macs.evaluate(m, { ...o, game: x.id });
      return `<tr class="${x.id === state.game ? "current" : ""}"><td>${esc(x.name)}</td><td>${RUN_BADGE[x.run]}</td>${y.playable ? `<td class="r num">${fmt(y.fps)}</td>` : '<td class="r">–</td>'}</tr>`;
    }).join("");

    // Tips
    $("#tips").innerHTML = Macs.tips(m, g, r, o).map(([k, txt]) => `<li class="${k}">${ICONS[k]}<span>${esc(txt)}</span></li>`).join("");

    // Macs that hold 60 FPS
    const sixty = r.playable ? Macs.sixtyList(state.game, state.res === "native" ? "1440p" : state.res, state.quality, state.upscale) : [];
    $("#sixty-sub").textContent = r.playable ? `Current Macs (2024 and later) at ${RES_LABEL[state.res === "native" ? "1440p" : state.res]} ${Q_LABEL[state.quality]}, slowest first.` : "This game doesn't run on macOS.";
    $("#sixty").innerHTML = sixty.length
      ? sixty.map((x) => `<a class="up" href="${x.m.id}/"><span class="up-tag">${esc(x.m.product)}</span><span class="up-name">${esc(x.m.chip.name)} ${x.m.gpuCores}-core GPU</span><span class="up-gain">≈${fmt(x.r.fps)} FPS</span></a>`).join("")
      : `<p class="empty-note">${r.playable ? "No current Mac reaches 60 FPS at these settings. Try 1080p, Medium or MetalFX." : "Use cloud gaming to play it on any Mac."}</p>`;

    if (touched) history.replaceState(null, "", shareUrl().replace(location.origin, "") + location.hash);
    if (touched || location.search) document.title = `${m.name}: ${g.name} FPS – Mac Gaming Calculator`;
  }

  // ---------- Share ----------
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  $("#share-btn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(shareUrl()); toast("Result link copied"); }
    catch { window.prompt("Copy this link:", shareUrl()); }
  });

  readUrl();
  syncInputs();
  update(true);
  Motion.initPage();
})();
