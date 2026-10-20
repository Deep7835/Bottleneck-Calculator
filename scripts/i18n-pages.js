/*
 * Localized calculator pages: /es/, /ja/, /es/calculadora-fps/, /ja/fps-calculator/.
 *
 * The copy lives in scripts/i18n/<lang>.js; runtime UI strings live in
 * assets/js/i18n.js. Every table and the default result are computed from
 * engine.js / games.js with I18N.override set to the page's language, so the
 * numbers always match what the calculator shows. Called from build.js;
 * returns the page URLs and the hreflang alternates for the sitemap.
 */
const fs = require("fs");
const path = require("path");

// Pages that exist in all three languages (paths relative to the site root).
const layout = require("./layout");

const GROUPS = {
  home: { en: "", es: "es/", ja: "ja/" },
  fps: { en: "fps-calculator/", es: "es/calculadora-fps/", ja: "ja/fps-calculator/" },
};
const LANG_NAMES = { en: "English", es: "Español", ja: "日本語" };
const OG_LOCALES = { en: "en_US", es: "es_ES", ja: "ja_JP" };

// Same builds as the English pages (build.js / fps-page.js).
const COMBOS = [
  ["ryzen-7-7800x3d", "rtx-5070-ti", "1440p"], ["ryzen-7-9800x3d", "rtx-5090", "4k"], ["ryzen-7-9800x3d", "rtx-5080", "1440p"],
  ["ryzen-5-7600", "rtx-5070", "1440p"], ["ryzen-5-5600", "rtx-4060", "1080p"], ["i5-12400f", "rtx-5060", "1080p"],
  ["i5-13400f", "rtx-4070-super", "1440p"], ["i5-14600k", "rx-9070-xt", "1440p"], ["ryzen-7-5700x3d", "rx-9070", "1440p"],
  ["ryzen-5-3600", "rtx-3060-12gb", "1080p"], ["i7-14700k", "rtx-4070-ti-super", "1440p"], ["ultra-7-265k", "rtx-5070-ti", "1440p"],
  ["ryzen-7-5800x3d", "rtx-4080-super", "1440p"], ["ryzen-5-5600x", "rx-7800-xt", "1440p"], ["i5-12400f", "arc-b580", "1080p"],
  ["ryzen-7-9700x", "rx-9060-xt-16gb", "1080p"],
];
const LADDER_IDS = ["ryzen-5-3600", "i5-10400f", "ryzen-5-5600", "i5-12400f", "i5-13400f", "ryzen-5-7600",
  "ryzen-7-5700x3d", "i5-14600k", "ryzen-7-7700x", "ryzen-7-7800x3d", "ryzen-7-9800x3d"];
const TABLE_GPU_IDS = ["rtx-5090", "rtx-5080", "rtx-5070-ti", "rx-9070-xt", "rtx-5070", "rx-9070", "rtx-4070-super",
  "rx-7800-xt", "rtx-5060-ti-16gb", "rx-9060-xt-16gb", "rtx-5060", "rtx-4060", "arc-b580", "rtx-3060-12gb"];
const FPS_BUILDS = [
  ["ryzen-5-5600", "rtx-4060", "1080p"], ["ryzen-5-7600", "rtx-5070", "1440p"],
  ["ryzen-7-7800x3d", "rx-9070-xt", "1440p"], ["ryzen-7-9800x3d", "rtx-5080", "4k"],
];

module.exports = function buildI18nPages({ ROOT, SITE_URL, HW, Engine, faqSchema }) {
  require(path.join(ROOT, "assets/js/games.js"));
  const { Games, I18N } = global.window;
  const t = I18N.t;
  const fmt = (n) => I18N.fmt(n);
  const short = Engine.shortName;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const find = (list, id) => list.find((x) => x.id === id) || (() => { throw new Error(`Unknown part id: ${id}`); })();
  const cpu = (id) => find(HW.cpus, id), gpu = (id) => find(HW.gpus, id);
  const HOME_BASE = { res: "1440p", quality: "high", workload: "general", upscale: "off", ram: 32, hz: 165, streaming: false };
  const FPS_BASE = { res: "1440p", quality: "high", upscale: "off", ram: 32, hz: 144, streaming: false };

  // ---------- Shared pieces ----------
  const rel = (loc) => "../".repeat(loc.split("/").filter(Boolean).length);
  const abs = (loc) => SITE_URL + loc;

  function hreflangLinks(group) {
    const g = GROUPS[group];
    return ["en", "es", "ja"].map((l) => `<link rel="alternate" hreflang="${l}" href="${abs(g[l])}">`).join("\n  ") +
      `\n  <link rel="alternate" hreflang="x-default" href="${abs(g.en)}">`;
  }

  function langSwitch(L, group, loc) {
    const g = GROUPS[group];
    const links = ["en", "es", "ja"].map((l) => {
      const cur = l === L.lang ? ' aria-current="page"' : "";
      return `<a href="${rel(loc)}${g[l]}" lang="${l}" hreflang="${l}"${cur}>${LANG_NAMES[l]}</a>`;
    });
    return `<nav class="lang-switch" aria-label="${L.site.langLabel}">${links.join('<span aria-hidden="true">·</span>')}</nav>`;
  }

  function head(L, P, group, loc, extraSchema) {
    const r = rel(loc);
    const others = ["en", "es", "ja"].filter((l) => l !== L.lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALES[l]}">`).join("\n  ");
    return `<!doctype html>
<html lang="${L.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(P.title)}</title>
  <meta name="description" content="${esc(P.description)}">
  <link rel="canonical" href="${abs(loc)}">
  ${hreflangLinks(group)}
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)">
  <link rel="icon" href="${r}favicon.svg" type="image/svg+xml">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="${OG_LOCALES[L.lang]}">
  ${others}
  <meta property="og:title" content="${esc(P.ogTitle)}">
  <meta property="og:description" content="${esc(P.ogDescription)}">
  <meta property="og:url" content="${abs(loc)}">
  <meta property="og:image" content="${abs("og-image.png")}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(L.site.ogImageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(P.ogTitle)}">
  <meta name="twitter:description" content="${esc(P.ogDescription)}">
  <meta name="twitter:image" content="${abs("og-image.png")}">

  <script>document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}</script>
  <link rel="preload" href="${r}assets/fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${r}assets/fonts/geist-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${r}assets/css/style.css?v=27">

  <script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": [{
    "@type": "WebApplication", name: P.appName, url: abs(loc), inLanguage: L.lang,
    applicationCategory: "UtilitiesApplication", operatingSystem: "Any", browserRequirements: L.site.requiresJs,
    description: P.appDescription, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, dateModified: "2026-10-20",
  }, ...(extraSchema || [])] }, null, 2)}
  </script>
  <!-- FAQSCHEMA:START -->
  <!-- FAQSCHEMA:END -->
</head>`;
  }

  const LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2.5" stroke-linecap="round"/><path class="logo-arc" d="M4 17a8 8 0 0 1 11.3-7.3" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/><path class="logo-needle" d="M12 17l4-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.8" fill="currentColor"/></svg>';

  // Same compact header menu as the English pages (scripts/layout.js) below 900px.
  const MENU_LABEL = { es: "Menú", ja: "メニュー" };

  function header(L, P, loc) {
    const r = rel(loc);
    const nav = P.nav.map(([href, label, cur]) => `<a href="${href.startsWith("#") ? href : r + href}"${cur ? ' aria-current="page"' : ""}>${label}</a>`).join("\n        ");
    return `<body>
  <a class="skip" href="#calculator">${L.site.skip}</a>
  <header class="site-header">
    <div class="wrap">
      <a class="logo" href="${r}${GROUPS.home[L.lang]}" aria-label="${esc(L.site.logoAria)}">
        ${LOGO}
        <span>Bottleneck<b>Calc</b></span>
      </a>
      <nav class="nav" aria-label="${L.site.navLabel}">
        ${nav}
      </nav>
      <div class="header-tools">
        <button type="button" class="icon-btn search-btn" data-root="${r}" aria-label="${L.lang === "ja" ? "サイト内検索" : "Buscar en el sitio"}" aria-keyshortcuts="/ Control+K Meta+K"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button>
        <button type="button" class="icon-btn theme-btn" aria-label="${L.lang === "ja" ? "ライト／ダークを切り替え" : "Cambiar tema claro u oscuro"}"><svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg></button>
        ${layout.langMenu(L.lang, Object.fromEntries(["en", "es", "ja"].map((l) => [l, `${r}${(Object.values(GROUPS).find((g) => g[L.lang] === loc) || GROUPS.home)[l]}` || "./"])), L.lang === "ja" ? "言語" : "Idioma")}
      </div>
      <details class="menu">
        <summary aria-label="${MENU_LABEL[L.lang] || "Menu"}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></summary>
        <nav class="menu-panel" aria-label="${L.site.navLabel}">
          ${nav}
        </nav>
      </details>
    </div>
  </header>`;
  }

  // Same footer as the English pages (scripts/layout.js), with localized copy.
  function footer(L, P, group, loc) {
    const r = rel(loc), F = L.site.footer;
    const home = `${r}${GROUPS.home[L.lang]}`;
    const link = ([to, label, en]) => {
      const target = GROUPS[to] ? `${r}${GROUPS[to][L.lang]}` : to.startsWith("#") ? `${home}${to}` : `${r}${to}`;
      return [target, label, `${en ? ' hreflang="en"' : ""}${target === `${r}${loc}` ? ' aria-current="page"' : ""}`];
    };
    return `  ${layout.footerShell({
      home,
      tagline: F.tagline,
      cta: { href: `${home}#calculator`, label: F.cta },
      badges: F.badges,
      siteLabel: L.site.footerNavLabel,
      columns: F.columns.map((c) => ({ title: c.title, links: c.links.map(link) })),
      copyright: `© 2026 Bottleneck Calculator · ${F.builtBy} <a href="${layout.OWNER.url}">${layout.OWNER.name}</a>`,
      status: F.status,
      disclaimer: F.disclaimer,
      langSwitch: langSwitch(L, group, loc),
    })}

  <div class="toast" id="toast" role="status"></div>
`;
  }

  const scripts = (loc, list) => list.map((f) => `  <script src="${rel(loc)}assets/js/${f}.js?v=27"></script>`).join("\n");

  const seg = (name, id, label, items, checked) => `<span class="field-label" id="${id}">${label}</span>
              <div class="seg" role="radiogroup" aria-labelledby="${id}">
                <span class="seg-thumb" aria-hidden="true"></span>
                ${items.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}"${v === checked ? " checked" : ""}><span>${l}</span></label>`).join("\n                ")}
              </div>`;

  const select = (id, label, options, selected) => `<label for="${id}">${label}</label>
                  <select id="${id}" name="${id}">
                    ${options.map(([v, l]) => `<option value="${v}"${String(v) === String(selected) ? " selected" : ""}>${l}</option>`).join("\n                    ")}
                  </select>`;

  const HZ = [60, 75, 120, 144, 165, 180, 240, 360].map((h) => [h, `${h} Hz`]);
  const RAMS = [8, 16, 32, 64].map((g) => [String(g), `${g} GB`]);
  const RES_SEG = [["1080p", "1080p"], ["1440p", "1440p"], ["uw1440", "UW"], ["4k", "4K"]];

  // CPU + GPU pickers (identical markup on both calculators).
  function pickers(U, c, g) {
    return `<div class="builder-main">
            <div class="field">
              <label for="cpu-input">${U.processor}</label>
              <div class="combo" data-kind="cpu">
                <svg class="combo-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>
                <input id="cpu-input"${c ? ` value="${esc(c.name)}"` : ""} type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="cpu-list" aria-describedby="cpu-meta" spellcheck="false" placeholder="${esc(U.cpuPlaceholder)}">
                <button type="button" class="combo-toggle" tabindex="-1" aria-label="${esc(U.cpuToggle)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
                <ul id="cpu-list" class="combo-list" role="listbox" aria-label="${esc(U.cpuList)}" hidden></ul>
              </div>
              <div class="field-meta" id="cpu-meta">${c ? esc(I18N.meta.cpu(c)) : ""}</div>
            </div>
            <div class="builder-plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></div>
            <div class="field">
              <label for="gpu-input">${U.gpu}</label>
              <div class="combo" data-kind="gpu">
                <svg class="combo-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="9" cy="12" r="2.5"/><circle cx="16" cy="12" r="2.5"/><path d="M5 17v2"/></svg>
                <input id="gpu-input"${g ? ` value="${esc(g.name)}"` : ""} type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="gpu-list" aria-describedby="gpu-meta" spellcheck="false" placeholder="${esc(U.gpuPlaceholder)}">
                <button type="button" class="combo-toggle" tabindex="-1" aria-label="${esc(U.gpuToggle)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
                <ul id="gpu-list" class="combo-list" role="listbox" aria-label="${esc(U.gpuList)}" hidden></ul>
              </div>
              <div class="field-meta" id="gpu-meta">${g ? esc(I18N.meta.gpu(g)) : ""}</div>
            </div>
          </div>`;
  }

  const moreToggle = (U, summary) => `<button type="button" class="more-toggle" id="more-toggle" aria-expanded="false" aria-controls="more">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>
              <span class="more-text"><b>${U.settings}</b><span id="opt-summary">${esc(summary)}</span></span>
              <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </button>`;

  const gauge = (inner) => `<div class="gauge" aria-hidden="true">
              <svg viewBox="0 0 220 124">
                <path class="track" d="M15 115 A95 95 0 0 1 205 115" fill="none" stroke-width="14" stroke-linecap="round"/>
                <path class="fill" id="gauge-fill" d="M15 115 A95 95 0 0 1 205 115" fill="none" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
              </svg>
              <div class="gauge-value">${inner}</div>
            </div>`;

  const pipeline = (U, cpuVal, gpuVal, hzVal, tag) => `<div class="pipeline" id="pipeline" role="img" aria-label="${esc(U.pipelineAria)}">
            <canvas id="pipe-canvas" aria-hidden="true"></canvas>
            <div class="pipe-node node-cpu" id="node-cpu"><span class="pipe-name">CPU</span><span class="pipe-val num"><span id="cap-cpu-val">${cpuVal}</span><span class="pu"> FPS</span></span><span class="pipe-tag">${tag}</span></div>
            <div class="pipe-node node-gpu" id="node-gpu"><span class="pipe-name">GPU</span><span class="pipe-val num"><span id="cap-gpu-val">${gpuVal}</span><span class="pu"> FPS</span></span><span class="pipe-tag">${tag}</span></div>
            <div class="pipe-node node-display" id="node-display"><span class="pipe-name">${U.display}</span><span class="pipe-val num" id="cap-hz-val">${hzVal}</span></div>
          </div>`;

  const shareBtn = (U) => `<button type="button" class="btn-ghost" id="share-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>${U.copyLink}</button>`;

  const toc = (L, items) => `<nav class="toc" aria-label="${L.site.tocLabel}">
        <p>${L.site.tocLabel}</p>
        <ol>
          ${items.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join("\n          ")}
        </ol>
      </nav>`;

  const faqSection = (P) => `<!-- AD:endOfPage -->
        <section id="faq" class="faq">
          <h2>${P.faqTitle}</h2>
          ${P.faq.map(([q, a], i) => `<details${i ? "" : " open"}><summary>${q}</summary><div><p>${a}</p></div></details>`).join("\n          ")}
        </section>`;

  const table = (headCells, rows, cls) => `<div class="table-scroll"><table${cls ? ` class="${cls}"` : ""}><thead><tr>${headCells.join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;

  // ---------- Bottleneck calculator tables ----------
  function limitCell(r) {
    if (r.verdict.key === "excellent") return `<span class="dot" data-tone="excellent"></span>${t("limit.balanced")}`;
    return `<span class="dot" data-tone="${r.verdict.tone}"></span>${r.limiter.toUpperCase()} ${Math.round(r.pct)}%`;
  }

  function resExample(T) {
    const c = cpu("ryzen-5-3600"), g = gpu("rtx-4070-super");
    const rows = Object.entries(Engine.RES).map(([key, res]) => {
      const r = Engine.evaluate(c, g, { ...HOME_BASE, res: key });
      return `<tr><td>${res.full}</td><td class="r num">${fmt(r.cpuFps)}</td><td class="r num">${fmt(r.gpuFps)}</td><td class="r num">${fmt(r.fps)}</td><td>${limitCell(r)}</td></tr>`;
    });
    const h = T.resHead;
    return table([`<th>${h[0]}</th>`, `<th class="r">${h[1]}</th>`, `<th class="r">${h[2]}</th>`, `<th class="r">${h[3]}</th>`, `<th>${h[4]}</th>`], rows);
  }

  function minCpuTable(T) {
    const ladder = LADDER_IDS.map(cpu).sort((a, b) => a.g - b.g);
    const minCpu = (g, res) => {
      const ok = ladder.find((c) => { const r = Engine.evaluate(c, g, { ...HOME_BASE, res }); return r.limiter === "gpu" || r.pct < 10; });
      if (!ok) return `Ryzen 7 9800X3D <small>${T.stillCpuBound}</small>`;
      return ok === ladder[0] ? "Ryzen 5 3600+" : short(ok.name);
    };
    const rows = TABLE_GPU_IDS.map(gpu).map((g) =>
      `<tr><td><strong>${short(g.name)}</strong></td><td>${minCpu(g, "1080p")}</td><td>${minCpu(g, "1440p")}</td><td>${minCpu(g, "4k")}</td></tr>`);
    return table([`<th>${T.gpuHead}</th>`, "<th>1080p</th>", "<th>1440p</th>", "<th>4K</th>"], rows);
  }

  function combos() {
    const cards = COMBOS.map(([c, g, res]) => {
      const r = Engine.evaluate(cpu(c), gpu(g), { ...HOME_BASE, res });
      const label = r.verdict.key === "excellent" ? t("limit.balanced") : `${t(`pill.${r.limiter}`)} ${Math.round(r.pct)}%`;
      const href = `?cpu=${c}&amp;gpu=${g}${res !== HOME_BASE.res ? `&amp;res=${res}` : ""}#calculator`;
      return `<a class="combo-card" href="${href}"><b>${short(cpu(c).name)} + ${short(gpu(g).name)}</b><span>${Engine.RES[res].label} · <em data-tone="${r.verdict.tone}">${label}</em> · ≈${fmt(r.fps)} FPS</span></a>`;
    });
    return `<div class="combos">${cards.join("")}</div>`;
  }

  // ---------- Bottleneck calculator page ----------
  function homePage(L) {
    const P = L.home, U = L.ui, loc = GROUPS.home[L.lang];
    const o = Engine.DEFAULTS, c = cpu(o.cpu), g = gpu(o.gpu);
    const r = Engine.evaluate(c, g, o);
    const limited = r.verdict.key !== "excellent";
    const qCtx = t("ctx.q", { q: Engine.QUALITY[o.quality].label });
    const T = { resExample: resExample(L.tables), minCpu: minCpuTable(L.tables), combos: combos() };

    let html = head(L, P, "home", loc) + "\n" + header(L, P, loc) + `

  <main>
    <div class="wrap">
      <section class="hero">
        <p class="eyebrow reveal"><span class="live-dot" aria-hidden="true"></span>${P.eyebrow}</p>
        <h1 class="reveal">${P.h1}</h1>
        <p class="lead reveal">${P.lead}</p>
      </section>

      <section id="calculator" class="calc reveal" aria-label="${esc(P.calcAria)}">
        <form class="card builder" id="calc-form" autocomplete="off" onsubmit="return false">
          ${pickers(U, c, g)}

          <div class="builder-sub">
            <div class="field field-res">
              ${seg("res", "res-label", U.resolution, RES_SEG, o.res)}
            </div>
            ${moreToggle(U, `${qCtx} · ${Engine.WORKLOAD[o.workload].short} · ${o.ram} GB · ${o.hz} Hz`)}
          </div>

          <div class="more" id="more">
            <div class="more-inner">
              <div class="more-grid">
                <div class="field">
                  ${seg("quality", "q-label", U.quality, U.qualitySeg, o.quality)}
                </div>
                <div class="field">
                  ${seg("ram", "ram-label", U.ram, RAMS, String(o.ram))}
                </div>
                <div class="field">
                  ${select("workload", U.games, U.workloadOptions, o.workload)}
                </div>
                <div class="field">
                  ${select("upscale", U.upscaling, Object.keys(Engine.UPSCALE).map((k) => [k, Engine.UPSCALE[k].label]), o.upscale)}
                </div>
                <div class="field">
                  ${select("hz", U.hz, HZ, o.hz)}
                </div>
                <div class="field">
                  ${select("storage", U.storage, U.storageOptions, "nvme")}
                </div>
                <label class="switch"><input type="checkbox" id="streaming" name="streaming" role="switch"><span class="switch-track" aria-hidden="true"></span>${U.streaming}</label>
              </div>
            </div>
          </div>
        </form>

        <section class="card results" id="results" data-tone="${r.verdict.tone}" aria-label="${esc(U.resultAria)}">
          <div class="results-head">
            ${gauge(`<strong class="num" id="pct">${Math.round(r.pct)}%</strong><small id="pct-label">${limited ? t("gauge.limited", { lim: r.limiter.toUpperCase() }) : t("gauge.balanced")}</small>`)}
            <div class="verdict" aria-live="polite">
              <span class="tone-pill" id="tone-pill">${!limited ? t("pill.balanced") : t(`pill.${r.limiter}`)}</span>
              <h2 id="verdict-title">${esc(r.verdict.label)}</h2>
              <p id="verdict-text">${esc(Engine.summary(c, g, r, o))}</p>
            </div>
          </div>

          ${pipeline(U, fmt(r.cpuFps), fmt(r.gpuFps), `${o.hz} Hz`, U.bottleneckTag)}
          <p class="pipe-note">${U.pipeNote}</p>

          <div class="stats">
            <div class="stat"><small>${U.avgFps}</small><strong class="num" id="s-fps">${fmt(r.fps)}</strong></div>
            <div class="stat"><small>${U.low1}</small><strong class="num" id="s-low">${fmt(r.low1)}</strong></div>
            <div class="stat"><small>${U.cpuLoad}</small><strong class="num"><span id="s-cpu">${Math.round(r.cpuLoad)}</span><span class="unit">%</span></strong><div class="meter"><i id="m-cpu"></i></div></div>
            <div class="stat"><small>${U.gpuLoad}</small><strong class="num"><span id="s-gpu">${Math.round(r.gpuLoad)}</span><span class="unit">%</span></strong><div class="meter"><i id="m-gpu"></i></div></div>
          </div>

          <div class="result-actions">
            <div class="score" id="score" role="img" aria-label="">
              <svg viewBox="0 0 36 36" aria-hidden="true"><circle class="score-track" cx="18" cy="18" r="15.5"/><circle class="score-fill" id="score-fill" cx="18" cy="18" r="15.5" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
              <span class="score-num num" id="score-num">0</span>
              <span class="score-text"><small>${esc(I18N.t("score.label"))}</small><b id="score-grade">&nbsp;</b></span>
            </div>
            <span class="context" id="context-line">${esc(`${Engine.RES[o.res].full} · ${qCtx} · ${Engine.WORKLOAD[o.workload].short}`)}</span>
            <button type="button" class="btn-ghost" id="save-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>${U.saveImage}</button>
            ${shareBtn(U)}
          </div>
        </section>
      </section>

      <div class="details reveal-group" id="details">
        <section class="card panel">
          <h3>${U.resTitle}</h3>
          <p class="sub">${U.resSub}</p>
          <div class="table-scroll"><table id="res-table"><thead><tr><th>${U.resHead[0]}</th><th class="r">${U.resHead[1]}</th><th class="r">${U.resHead[2]}</th><th>${U.resHead[3]}</th></tr></thead><tbody></tbody></table></div>
        </section>
        <section class="card panel">
          <h3>${U.wlTitle}</h3>
          <p class="sub" id="wl-sub">${U.wlSub}</p>
          <div class="table-scroll"><table id="wl-table"><thead><tr><th>${U.wlHead[0]}</th><th class="r">${U.wlHead[1]}</th><th>${U.wlHead[2]}</th></tr></thead><tbody></tbody></table></div>
        </section>
        <section class="card panel">
          <h3>${U.recTitle}</h3>
          <p class="sub">${U.recSub}</p>
          <ul class="tips" id="tips"></ul>
        </section>
        <section class="card panel">
          <h3 id="up-title">${t("up.title")}</h3>
          <p class="sub" id="up-sub">${t("up.sub")}</p>
          <div class="upgrades" id="upgrades"></div>
        </section>
      </div>
      <!-- AD:belowResults -->
    </div>

    <div class="wrap content">
      ${toc(L, P.toc)}

      <article class="article">
${P.body(T)}

        ${faqSection(P)}

${P.updates}
      </article>
    </div>
  </main>

` + footer(L, P, "home", loc) + "\n" + scripts(loc, ["i18n", "hardware", "engine", "motion", "combobox", "app"]) + "\n</body>\n</html>\n";
    return finish(html, loc);
  }

  // ---------- FPS calculator tables ----------
  function gameOptions(U) {
    return `<optgroup label="${esc(U.popularGames)}">${Games.list.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join("")}</optgroup>` +
      `<optgroup label="${esc(U.gameTypes)}">${Object.entries(Engine.WORKLOAD).map(([k, w]) => `<option value="${k}">${esc(w.label)}</option>`).join("")}</optgroup>`;
  }

  function gameProfiles(T) {
    const rows = Games.list.map((g) =>
      `<tr><td><strong>${esc(g.name)}</strong><br><small>${esc(g.note)}</small></td><td>${Engine.WORKLOAD[g.base].short}</td><td class="r num">${g.cap ? g.cap : "–"}</td></tr>`);
    return table([`<th>${T.gameHead}</th>`, `<th>${T.engineHead}</th>`, `<th class="r">${T.capHead}</th>`], rows);
  }

  function gameBuilds(T) {
    const builds = FPS_BUILDS.map(([c, g, res]) => ({ cpu: cpu(c), gpu: gpu(g), res }));
    const headCells = [`<th>${T.gameHead}</th>`, ...builds.map((b) => `<th class="r">${short(b.cpu.name)} + ${short(b.gpu.name)}<br><small>${Engine.RES[b.res].label}</small></th>`)];
    const rows = Games.list.map((game) => {
      const cells = builds.map((b) => {
        const r = Games.evaluate(b.cpu, b.gpu, game.id, { ...FPS_BASE, res: b.res });
        const href = `?cpu=${b.cpu.id}&amp;gpu=${b.gpu.id}&amp;game=${game.id}${b.res !== FPS_BASE.res ? `&amp;res=${b.res}` : ""}#calculator`;
        return `<td class="r"><a class="load-build" href="${href}">${fmt(r.fps)}${r.capped ? ` <small>${T.capShort}</small>` : ""}</a></td>`;
      }).join("");
      return `<tr><td><strong>${esc(game.name)}</strong></td>${cells}</tr>`;
    });
    return table(headCells, rows, "builds-table");
  }

  // ---------- FPS calculator page ----------
  function fpsPage(L) {
    const P = L.fps, U = L.ui, F = L.fpsUi, loc = GROUPS.fps[L.lang];
    const T = { profiles: gameProfiles(L.tables), builds: gameBuilds(L.tables) };
    const breadcrumb = { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: L.home.appName, item: abs(GROUPS.home[L.lang]) },
      { "@type": "ListItem", position: 2, name: P.appName, item: abs(loc) },
    ] };

    let html = head(L, P, "fps", loc, [breadcrumb]) + "\n" + header(L, P, loc) + `

  <main>
    <div class="wrap">
      <section class="hero">
        <p class="eyebrow reveal"><span class="live-dot" aria-hidden="true"></span>${P.eyebrow}</p>
        <h1 class="reveal">${P.h1}</h1>
        <p class="lead reveal">${P.lead}</p>
      </section>

      <section id="calculator" class="calc reveal" aria-label="${esc(P.calcAria)}">
        <form class="card builder" id="calc-form" autocomplete="off" onsubmit="return false">
          ${pickers(U)}

          <div class="builder-sub">
            <div class="field field-game">
              <label for="game">${F.game}</label>
              <select id="game" name="game">
                ${gameOptions(F)}
              </select>
            </div>
            <div class="field field-res">
              ${seg("res", "res-label", U.resolution, RES_SEG, "1440p")}
            </div>
            ${moreToggle(U, `${t("ctx.q", { q: Engine.QUALITY.high.label })} · 32 GB · 144 Hz`)}
          </div>

          <div class="more" id="more">
            <div class="more-inner">
              <div class="more-grid">
                <div class="field">
                  ${seg("quality", "q-label", U.quality, U.qualitySeg, "high")}
                </div>
                <div class="field">
                  ${seg("ram", "ram-label", U.ram, RAMS, "32")}
                </div>
                <div class="field">
                  ${select("upscale", U.upscaling, Object.keys(Engine.UPSCALE).map((k) => [k, Engine.UPSCALE[k].label]), "off")}
                </div>
                <div class="field">
                  ${select("hz", U.hz, HZ, 144)}
                </div>
              </div>
            </div>
          </div>
        </form>

        <section class="card results" id="results" aria-label="${esc(U.resultAria)}">
          <div class="results-head">
            ${gauge(`<strong class="num" id="fps">0</strong><small id="fps-label">${F.avgFpsShort}</small>`)}
            <div class="verdict" aria-live="polite">
              <span class="tone-pill" id="tone-pill">${F.calculating}</span>
              <h2 id="verdict-title">${F.pickTitle}</h2>
              <p id="verdict-text">${F.pickText}</p>
            </div>
          </div>

          ${pipeline(U, "–", "–", "–", F.limitTag)}
          <p class="pipe-note">${F.pipeNote}</p>

          <div class="stats">
            <div class="stat"><small>${U.avgFps}</small><strong class="num" id="s-fps">0</strong></div>
            <div class="stat"><small>${U.low1}</small><strong class="num" id="s-low">0</strong></div>
            <div class="stat"><small>${F.frameTime}</small><strong class="num"><span id="s-ms">0</span><span class="unit">ms</span></strong></div>
            <div class="stat"><small>${F.limitedBy}</small><strong class="num" id="s-limit">–</strong></div>
          </div>

          <div class="result-actions">
            <span class="context" id="context-line"></span>
            ${shareBtn(U)}
          </div>
        </section>
      </section>

      <div class="details reveal-group" id="details">
        <section class="card panel panel-wide">
          <h3>${F.gridTitle}</h3>
          <p class="sub" id="grid-sub">${F.gridSub}</p>
          <div class="table-scroll"><table id="fps-grid" class="fps-grid"><thead><tr><th scope="col">${U.resHead[0]}</th>${["low", "medium", "high", "ultra"].map((q) => `<th class="r" scope="col">${Engine.QUALITY[q].label}</th>`).join("")}</tr></thead><tbody></tbody></table></div>
          <p class="legend"><span><span class="dot" data-tone="excellent"></span>144+ FPS</span><span><span class="dot" data-tone="gpu"></span>60–143</span><span><span class="dot" data-tone="moderate"></span>30–59</span><span><span class="dot" data-tone="severe"></span>${F.under30}</span></p>
        </section>
        <section class="card panel">
          <h3>${F.targetsTitle}</h3>
          <p class="sub">${F.targetsSub}</p>
          <ul class="tips" id="targets"></ul>
        </section>
        <section class="card panel">
          <h3>${U.recTitle}</h3>
          <p class="sub">${F.recSub}</p>
          <ul class="tips" id="tips"></ul>
        </section>
        <section class="card panel panel-wide">
          <h3>${F.gamesTitle}</h3>
          <p class="sub" id="games-sub">${F.gamesSub}</p>
          <div class="table-scroll"><table id="games-table"><thead><tr><th>${L.tables.gameHead}</th><th class="r">${U.avgFps}</th><th class="r">${U.low1}</th><th>${F.limitedBy}</th></tr></thead><tbody></tbody></table></div>
        </section>
      </div>
      <!-- AD:belowResults -->
    </div>

    <div class="wrap content">
      ${toc(L, P.toc)}

      <article class="article">
${P.body(T)}

        ${faqSection(P)}
      </article>
    </div>
  </main>

` + footer(L, P, "fps", loc) + "\n" + scripts(loc, ["i18n", "hardware", "engine", "games", "motion", "combobox", "fps"]) + "\n</body>\n</html>\n";
    return finish(html, loc);
  }

  function finish(html, loc) {
    const re = /(<!-- FAQSCHEMA:START -->)[\s\S]*?(<!-- FAQSCHEMA:END -->)/;
    html = html.replace(re, (_, a, b) => `${a}\n  ${faqSchema(html)}\n  ${b}`);
    const file = path.join(ROOT, loc, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    return loc;
  }

  // ---------- Build ----------
  const pages = [];
  try {
    for (const lang of ["es", "ja"]) {
      const L = require(`./i18n/${lang}`);
      I18N.override = lang;
      pages.push(homePage(L), fpsPage(L));
    }
  } finally {
    I18N.override = null;
  }

  // hreflang alternates for a sitemap URL (null when the page has no translations).
  function alternates(loc) {
    const g = Object.values(GROUPS).find((x) => Object.values(x).includes(loc));
    if (!g) return null;
    return [...["en", "es", "ja"].map((l) => [l, abs(g[l])]), ["x-default", abs(g.en)]];
  }

  return { pages, alternates };
};
