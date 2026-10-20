/*
 * Programmatic build pages: /bottleneck/<cpu>-<gpu>/ for a curated set of
 * sensible CPU + GPU pairings, plus the /bottleneck/ index ("Popular builds").
 * Every number is pre-rendered from engine.js, so the pages need no JavaScript.
 * Called from build.js; returns the generated URLs for the sitemap.
 */
const fs = require("fs");
const path = require("path");

// Price/performance class. A CPU is paired with GPUs from its own class and one class
// either side, which rules out absurd builds (Ryzen 5 3600 + RTX 5090, 9800X3D + RTX 3060).
const CPU_TIERS = {
  1: ["ryzen-5-3600", "ryzen-5-5500", "i3-12100f", "i5-10400f", "i5-11400f"],
  2: ["ryzen-5-5600", "ryzen-5-5600x", "ryzen-7-5700x", "i5-12400f", "i5-13400f", "i5-14400f", "ryzen-5-7500f", "ryzen-5-7600"],
  3: ["ryzen-7-5700x3d", "ryzen-7-5800x3d", "ryzen-7-7700x", "ryzen-5-9600x", "ryzen-7-9700x", "i5-12600k", "i7-12700k", "i5-13600k", "i5-14600k"],
  4: ["ryzen-7-7800x3d", "ryzen-7-9800x3d", "ryzen-7-9850x3d", "i7-13700k", "i7-14700k", "i9-14900k", "ultra-7-265k", "ultra-9-285k"],
};
const GPU_TIERS = {
  1: ["rtx-3060-12gb", "rtx-4060", "rtx-5060", "rx-6600", "rx-7600", "arc-b580", "rtx-3060-ti"],
  2: ["rtx-4060-ti-8gb", "rtx-5060-ti-16gb", "rx-9060-xt-16gb", "rx-6700-xt", "rx-7700-xt", "rtx-3070", "rtx-4070"],
  3: ["rtx-5070", "rtx-4070-super", "rx-7800-xt", "rx-9070", "rx-6800-xt", "rtx-3080", "rtx-4070-ti-super", "rx-9070-xt", "rtx-5070-ti", "rx-7900-xt"],
  4: ["rtx-5080", "rtx-4080-super", "rtx-4090", "rtx-5090", "rx-7900-xtx"],
};
// The resolution each GPU class is usually bought for; used for the headline verdict.
const TIER_RES = { 1: "1080p", 2: "1440p", 3: "1440p", 4: "4k" };
// A worse CPU bottleneck than this at 1440p is a mistake, not a popular build.
const MAX_CPU_BOTTLENECK = 30;

const layout = require("./layout");

module.exports = function buildComboPages({ ROOT, SITE_URL, HW, Engine }) {
  const short = Engine.shortName;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const find = (list, id) => list.find((x) => x.id === id) || (() => { throw new Error(`Unknown part id: ${id}`); })();
  const BASE = { res: "1440p", quality: "high", workload: "general", upscale: "off", ram: 32, hz: 165, streaming: false };

  // ---- Pair selection
  const tiered = (tiers, list) => Object.entries(tiers).flatMap(([t, ids]) => ids.map((id) => ({ part: find(list, id), tier: +t })));
  const pairs = [];
  for (const c of tiered(CPU_TIERS, HW.cpus)) {
    for (const g of tiered(GPU_TIERS, HW.gpus)) {
      if (Math.abs(c.tier - g.tier) > 1) continue;
      const at1440 = Engine.evaluate(c.part, g.part, BASE);
      if (at1440.limiter === "cpu" && at1440.pct > MAX_CPU_BOTTLENECK) continue;
      const res = TIER_RES[g.tier];
      pairs.push({
        cpu: c.part, gpu: g.part, gpuTier: g.tier, res, o: { ...BASE, res },
        slug: `${c.part.id}-${g.part.id}`,
        r: Engine.evaluate(c.part, g.part, { ...BASE, res }),
      });
    }
  }
  const bySlug = new Map(pairs.map((p) => [p.slug, p]));

  // ---- Shared bits
  const toneLabel = (r) => r.verdict.key === "excellent" ? "Balanced" : `${r.limiter.toUpperCase()}-limited ${Math.round(r.pct)}%`;
  const limitCell = (r) => r.verdict.key === "excellent"
    ? '<span class="dot" data-tone="excellent"></span>Balanced'
    : `<span class="dot" data-tone="${r.verdict.tone}"></span>${r.limiter.toUpperCase()} ${Math.round(r.pct)}%`;
  const calcHref = (cpuId, gpuId, res, base) =>
    `${base}?cpu=${cpuId}&amp;gpu=${gpuId}${res !== BASE.res ? `&amp;res=${res}` : ""}#calculator`;
  const names = (p) => ({ c: short(p.cpu.name), g: short(p.gpu.name) });
  const resLabel = (key) => Engine.RES[key].label;
  // "Heavily GPU-limited" → "heavily GPU-limited", but "GPU-limited" stays as is.
  const lowerFirst = (s) => /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
  const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

  function card(p, base) {
    const { c, g } = names(p);
    return `<a class="combo-card" href="${base}${p.slug}/"><b>${c} + ${g}</b><span>${resLabel(p.res)} · <em data-tone="${p.r.verdict.tone}">${toneLabel(p.r)}</em> · ≈${fmt(p.r.fps)} FPS</span></a>`;
  }

  const header = (root, builds) => `<a class="skip" href="#main">Skip to content</a>
  ${layout.header(root, "builds")}`;

  const footer = (root) => `<footer class="site-footer">
    <div class="wrap">
      <nav class="footer-nav" aria-label="Site"><a href="${root}guides/">Guides</a><a href="${root}about/">About</a><a href="${root}editorial-policy/">Editorial policy</a><a href="${root}privacy/">Privacy</a><a href="${root}contact/">Contact</a></nav>
      <p>© 2026 Bottleneck Calculator. Estimates are for guidance only. Real performance varies by game, settings, drivers and cooling.</p>
      <p>Product names are trademarks of their respective owners. This site isn't affiliated with AMD, Intel or NVIDIA.</p>
    </div>
  </footer>`;

  function head({ title, description, url, root, schema }) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)">
  <link rel="icon" href="${root}favicon.svg" type="image/svg+xml">

  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="${SITE_URL}og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Bottleneck Calculator: CPU vs GPU balance, FPS and upgrade picks">
  <meta name="twitter:image" content="${SITE_URL}og-image.png">

  <script>document.documentElement.classList.add("js")</script>
  <link rel="preload" href="${root}assets/fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${root}assets/fonts/geist-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${root}assets/css/style.css?v=11">
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
</head>`;
  }

  const crumbSchema = (items) => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  });

  // ---- Copy built from the data
  function summary(p) {
    const { c, g } = names(p);
    const { r } = p;
    const res = resLabel(p.res);
    if (r.verdict.key === "excellent") {
      return `The ${c} and ${g} are an excellent match at ${res}. Neither part holds the other back, and you can expect around ${fmt(r.fps)} FPS in AAA games at High settings.`;
    }
    if (r.limiter === "cpu") {
      return `The ${c} limits the ${g} at ${res}. The graphics card could render about ${fmt(r.gpuFps - r.cpuFps)} more FPS, but the CPU can only prepare around ${fmt(r.cpuFps)} frames per second.` +
        (r.pct >= 20 ? " A faster CPU, or a higher resolution, makes better use of this GPU." : " That's a small gap you're unlikely to notice.");
    }
    return `The ${g} is the limiting part at ${res}, which is the normal and preferred situation for gaming. The ${c} has headroom for about ${fmt(r.cpuFps)} FPS, so it can handle a faster GPU later.` +
      (r.fps < 60 ? " FPS is below 60, so lower settings or enable upscaling." : "");
  }

  function opening(p) {
    const { c, g } = names(p);
    const { r } = p;
    const res = resLabel(p.res);
    const fps = fmt(r.fps), low = fmt(r.low1);
    const phrase = r.verdict.key === "excellent" ? "are an excellent match"
      : r.limiter === "cpu" ? (r.verdict.key === "good" ? "are well matched, with only a minor CPU bottleneck" : "are held back by the CPU")
      : r.verdict.key === "good" ? "are well balanced"
      : r.verdict.key === "moderate" ? "pair well, with the graphics card setting the pace"
      : "leave the CPU with plenty of spare headroom";
    const variants = [
      `The ${c} and ${g} ${phrase} at ${res}: about ${fps} FPS on average in AAA games at High settings, with 1% lows around ${low} FPS.`,
      `Paired with the ${g}, the ${c} delivers roughly ${fps} FPS at ${res} (1% lows ≈${low}) in modern AAA games, which our model rates as “${lowerFirst(r.verdict.label)}”.`,
      `At ${res}, a ${c} + ${g} build averages about ${fps} FPS in AAA games at High settings, with 1% lows near ${low} FPS: ${lowerFirst(r.verdict.label)}.`,
    ];
    return variants[hash(p.slug) % variants.length];
  }

  function intro(p, rows) {
    const { c, g } = names(p);
    const out = [opening(p)];

    const cpuBound = rows.filter(([, x]) => x.limiter === "cpu" && x.pct >= 10);
    const at1080 = rows[0][1];
    if (!cpuBound.length) {
      out.push(`The ${g} is the limiting part at every resolution, so the ${p.cpu.cores}-core ${c} (${p.cpu.socket}) still has headroom for about ${fmt(at1080.cpuFps)} FPS and room for a faster card later.`);
    } else if (cpuBound.length === rows.length) {
      out.push(`The ${c} is the limit even at 4K, so a faster CPU would unlock more of this graphics card.`);
    } else {
      const firstGpu = rows.find(([, x]) => !(x.limiter === "cpu" && x.pct >= 10));
      out.push(`At ${cpuBound.map(([k]) => resLabel(k)).join(" and ")} the ${c} becomes the limit (${Math.round(cpuBound[0][1].pct)}% CPU bottleneck at ${resLabel(cpuBound[0][0])}); from ${resLabel(firstGpu[0])} upward the ${g} takes over and the CPU has capacity to spare.`);
    }

    const es = Engine.evaluate(p.cpu, p.gpu, { ...p.o, workload: "esports" });
    const ch = Engine.evaluate(p.cpu, p.gpu, { ...p.o, workload: "cpuheavy" });
    const hz = es.fps >= 260 ? 240 : es.fps >= 160 ? 144 : 0;
    out.push(`In esports titles such as CS2 or Valorant expect around ${fmt(es.fps)} FPS${hz ? `, enough for a ${hz} Hz monitor` : ""}, while CPU-heavy games like Microsoft Flight Simulator drop to about ${fmt(ch.fps)} FPS${ch.limiter === "cpu" && ch.pct >= 15 ? ` with a ${Math.round(ch.pct)}% CPU bottleneck` : ""}.`);

    const need = p.r.vramNeed;
    const rt = Engine.evaluate(p.cpu, p.gpu, { ...p.o, workload: "raytracing" });
    if (p.gpu.vram < need) {
      out.push(`With ${p.gpu.vram} GB of VRAM, the ${g} is short of the ~${Math.round(need)} GB modern games use at ${resLabel(p.res)} High, so drop texture quality a notch to avoid stutter.`);
    } else if (p.gpu.vram < Engine.evaluate(p.cpu, p.gpu, { ...p.o, res: "4k" }).vramNeed) {
      out.push(`Its ${p.gpu.vram} GB of VRAM is fine at ${resLabel(p.res)} but gets tight at 4K High. With ray tracing on, expect about ${fmt(rt.fps)} FPS at ${resLabel(p.res)}.`);
    } else if (p.gpu.rt < 0.9) {
      out.push(`Ray tracing costs this ${p.gpu.brand} card more than an equivalent NVIDIA GPU: about ${fmt(rt.fps)} FPS with RT on at ${resLabel(p.res)}.`);
    } else {
      out.push(`With ray tracing enabled, expect about ${fmt(rt.fps)} FPS at ${resLabel(p.res)}${rt.fps < 60 ? ", so turn on DLSS or FSR to get back above 60" : ""}.`);
    }
    return out.join(" ");
  }

  // ---- Upgrade picks (same engine logic as the calculator, rendered as links)
  function upgradesHtml(p) {
    const up = Engine.upgrades(p.cpu, p.gpu, p.o, p.r, HW);
    const href = (cpu, gpu) => bySlug.has(`${cpu.id}-${gpu.id}`) ? `../${cpu.id}-${gpu.id}/` : calcHref(cpu.id, gpu.id, p.res, "../../");
    const upCard = (x, cpu, gpu, tag) => {
      const gain = Math.round((x.r.fps / p.r.fps - 1) * 100);
      return `<a class="up" href="${href(cpu, gpu)}"><span class="up-tag">${tag}</span><span class="up-name">${short(x.part.name)}</span><span class="up-gain">≈${fmt(x.r.fps)} FPS <b>(+${gain}%)</b> · ${x.r.verdict.key === "excellent" ? "balanced" : x.r.limiter.toUpperCase() + " " + Math.round(x.r.pct) + "%"}</span></a>`;
    };
    const { c, g } = names(p);
    if (up.cpu.length || up.sameSocket.length) {
      return {
        title: "CPU upgrades that fix this", sub: `Slowest CPUs that keep the ${g} fully fed at ${resLabel(p.res)}.`,
        html: up.sameSocket.map((x) => upCard(x, x.part, p.gpu, `Drop-in upgrade · ${x.part.socket}`)).join("") +
          up.cpu.map((x) => upCard(x, x.part, p.gpu, x.part.socket === p.cpu.socket ? `Same socket · ${x.part.socket}` : `New platform · ${x.part.socket}`)).join(""),
        text: `the ${[...up.sameSocket, ...up.cpu].map((x) => short(x.part.name)).slice(0, 2).join(" or ")}`,
      };
    }
    if (up.gpu.length) {
      return {
        title: "GPU upgrades for this CPU", sub: `The ${c} can drive a faster card at ${resLabel(p.res)}.`,
        html: up.gpu.map((x) => upCard(x, p.cpu, x.part, x.tag)).join(""),
        text: `the ${up.gpu.map((x) => short(x.part.name)).slice(0, 2).join(" or ")}`,
      };
    }
    // GPU-limited with nothing to suggest: either no faster card exists, or the CPU would cap the gain.
    const gpuBound = p.r.limiter === "gpu" && p.r.pct >= 20;
    const top = gpuBound && !HW.gpus.some((x) => x.type === "d" && x.g > p.gpu.g);
    const note = top
      ? `No faster graphics card than the ${g} is available, so this is as fast as this build gets at ${resLabel(p.res)}. Use DLSS or FSR for more FPS.`
      : gpuBound
        ? `No graphics card is a big enough step up from the ${g} (40%+ more FPS) with this CPU at ${resLabel(p.res)}. Use DLSS or FSR for more FPS.`
        : "No upgrade needed. These parts are well matched at these settings.";
    return { title: "Upgrade suggestions", sub: "The smallest upgrades that balance this build.", html: `<p class="empty-note">${note}</p>`, text: "", top, gpuBound };
  }

  // ---- Six related builds: nearest CPUs with the same GPU and nearest GPUs with the same CPU
  function related(p) {
    const near = (list, key) => list.sort((a, b) => Math.abs(a[key].g - p[key].g) - Math.abs(b[key].g - p[key].g) || a.slug.localeCompare(b.slug));
    const sameGpu = near(pairs.filter((x) => x.gpu === p.gpu && x !== p), "cpu");
    const sameCpu = near(pairs.filter((x) => x.cpu === p.cpu && x !== p), "gpu");
    const out = [];
    for (let i = 0; out.length < 6 && i < sameGpu.length + sameCpu.length; i++) {
      for (const list of [sameGpu, sameCpu]) if (list[i] && out.length < 6) out.push(list[i]);
    }
    return out;
  }

  const TIP_ICONS = {
    good: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/></svg>',
  };

  // ---- Combo page
  function comboPage(p) {
    const { c, g } = names(p);
    const { r, o } = p;
    const url = `${SITE_URL}bottleneck/${p.slug}/`;
    const res = resLabel(p.res);
    const rows = Object.keys(Engine.RES).map((k) => [k, Engine.evaluate(p.cpu, p.gpu, { ...o, res: k })]);
    const up = upgradesHtml(p);
    const tips = Engine.tips(p.cpu, p.gpu, o, r);
    if (!tips.length) tips.push({ type: "good", text: "This build is well matched at these settings. No changes needed." });
    const tone = r.verdict.tone;
    const es = Engine.evaluate(p.cpu, p.gpu, { ...o, workload: "esports" });

    const faq = [
      [`Does the ${c} bottleneck the ${g}?`,
        rows.map(([k, x]) => `${resLabel(k)}: ${x.verdict.key === "excellent" ? "balanced" : `${Math.round(x.pct)}% ${x.limiter.toUpperCase()}-limited`}`).join(". ") +
        `. ${r.limiter === "cpu" && r.pct >= 20 ? `At ${res} the CPU holds this GPU back noticeably.` : `At ${res} the CPU keeps up, so this is a sensible pairing.`} A GPU-limited result is the normal, healthy state for gaming.`],
      [`How many FPS does the ${c} with ${g} get?`,
        `About ${rows.map(([k, x]) => `${fmt(x.fps)} FPS at ${resLabel(k)}`).join(", ")} in AAA games at High settings without upscaling. In esports games like CS2 and Valorant it reaches roughly ${fmt(es.fps)} FPS at ${res}.`],
      [`What is the best upgrade for a ${c} + ${g} build?`,
        up.text ? `At ${res}, the most effective upgrade is ${up.text}. Use the calculator to check other resolutions and settings.`
          : up.top ? `There is no faster graphics card to move to, and the ${c} already keeps the ${g} fed at ${res}. Use DLSS or FSR upscaling for more FPS.`
          : up.gpuBound ? `No graphics card is a big enough step up from the ${g} to be worth it with the ${c} at ${res}. Use DLSS or FSR upscaling for more FPS.`
          : `None is needed at ${res}. The ${c} and ${g} are well matched, so upgrade only when you want more FPS overall.`],
    ];

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        crumbSchema([["Bottleneck Calculator", SITE_URL], ["Popular builds", `${SITE_URL}bottleneck/`], [`${c} + ${g}`, url]]),
        { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      ],
    };

    return `${head({
      title: `${c} + ${g} Bottleneck & FPS (2026)`,
      description: `Does the ${c} bottleneck the ${g}? At ${res}: ${lowerFirst(toneLabel(r))}, ≈${fmt(r.fps)} FPS in AAA games. FPS at 1080p to 4K, by game type, plus upgrade picks.`,
      url, root: "../../", schema,
    })}
<body>
  ${header("../../", "../")}

  <main id="main">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="../../">Bottleneck Calculator</a> <span aria-hidden="true">›</span> <a href="../">Popular builds</a> <span aria-hidden="true">›</span> <span aria-current="page">${c} + ${g}</span></nav>
      <section class="hero combo-hero">
        <h1>${c} with ${g}: <span>Bottleneck &amp; FPS</span></h1>
        <p class="lead">${intro(p, rows)}</p>
      </section>

      <section class="calc" aria-label="Result">
        <div class="card builder build-summary">
          <div class="builder-main">
            <div class="field">
              <span class="field-label">Processor</span>
              <div class="part">${p.cpu.name}</div>
              <div class="field-meta">${p.cpu.cores} cores / ${p.cpu.threads} threads · ${p.cpu.socket} · ${p.cpu.year}</div>
            </div>
            <div class="builder-plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></div>
            <div class="field">
              <span class="field-label">Graphics card</span>
              <div class="part">${p.gpu.name}</div>
              <div class="field-meta">${p.gpu.vram} GB VRAM · ${p.gpu.rt ? "Ray tracing ✓" : "No hardware RT"} · ${p.gpu.year}</div>
            </div>
          </div>
          <div class="builder-sub">
            <p class="assumed">${Engine.RES[p.res].full} · High · AAA games · Native · 32 GB · 165 Hz</p>
            <a class="btn" href="${calcHref(p.cpu.id, p.gpu.id, p.res, "../../")}">Change settings<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
          </div>
        </div>

        <section class="card results" data-tone="${tone}" aria-label="Result at ${res}">
          <div class="results-head">
            <div class="gauge" aria-hidden="true">
              <svg viewBox="0 0 220 124">
                <path class="track" d="M15 115 A95 95 0 0 1 205 115" fill="none" stroke-width="14" stroke-linecap="round"/>
                <path class="fill draw" d="M15 115 A95 95 0 0 1 205 115" fill="none" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="100" style="stroke-dashoffset:${(100 - Math.max(2, Math.min(100, r.pct))).toFixed(1)}"/>
              </svg>
              <div class="gauge-value"><strong class="num">${Math.round(r.pct)}%</strong><small>${r.verdict.key === "excellent" ? "bottleneck" : `${r.limiter.toUpperCase()} bottleneck`}</small></div>
            </div>
            <div class="verdict">
              <span class="tone-pill">${r.verdict.key === "excellent" ? "Balanced" : r.limiter === "cpu" ? "CPU-limited" : "GPU-limited"}</span>
              <h2>${r.verdict.label} at ${res}</h2>
              <p>${summary(p)}</p>
            </div>
          </div>

          <div class="pipeline" role="img" aria-label="CPU can deliver ${fmt(r.cpuFps)} FPS, GPU ${fmt(r.gpuFps)} FPS, display 165 Hz." data-fps="${r.fps.toFixed(1)}" data-limiter="${r.limiter}" data-pct="${r.pct.toFixed(1)}">
            <canvas aria-hidden="true"></canvas>
            <div class="pipe-node node-cpu${r.verdict.key !== "excellent" && r.limiter === "cpu" ? " limit" : ""}"><span class="pipe-name">CPU</span><span class="pipe-val num">${fmt(r.cpuFps)}<span class="pu"> FPS</span></span><span class="pipe-tag">Bottleneck</span></div>
            <div class="pipe-node node-gpu${r.verdict.key !== "excellent" && r.limiter === "gpu" ? " limit" : ""}"><span class="pipe-name">GPU</span><span class="pipe-val num">${fmt(r.gpuFps)}<span class="pu"> FPS</span></span><span class="pipe-tag">Bottleneck</span></div>
            <div class="pipe-node node-display"><span class="pipe-name">Display</span><span class="pipe-val num">165 Hz</span></div>
          </div>
          <p class="pipe-note">Max frames each part can deliver. Frames pile up in front of the slower one.</p>

          <div class="stats">
            <div class="stat"><small>Avg FPS</small><strong class="num">${fmt(r.fps)}</strong></div>
            <div class="stat"><small>1% low</small><strong class="num">${fmt(r.low1)}</strong></div>
            <div class="stat"><small>CPU load</small><strong class="num">${Math.round(r.cpuLoad)}<span class="unit">%</span></strong><div class="meter"><i class="grow${r.verdict.key !== "excellent" && r.limiter === "cpu" ? " hot" : ""}" style="transform:scaleX(${(r.cpuLoad / 100).toFixed(3)})"></i></div></div>
            <div class="stat"><small>GPU load</small><strong class="num">${Math.round(r.gpuLoad)}<span class="unit">%</span></strong><div class="meter"><i class="grow${r.verdict.key !== "excellent" && r.limiter === "gpu" ? " hot" : ""}" style="transform:scaleX(${(r.gpuLoad / 100).toFixed(3)})"></i></div></div>
          </div>
        </section>
      </section>

      <div class="details reveal-group">
        <section class="card panel">
          <h3>Bottleneck by resolution</h3>
          <p class="sub">${c} + ${g} at High settings in AAA games.</p>
          <div class="table-scroll"><table><thead><tr><th>Resolution</th><th class="r">Avg FPS</th><th class="r">1% low</th><th>Bottleneck</th></tr></thead><tbody>${rows.map(([k, x]) =>
            `<tr class="${k === p.res ? "current" : ""}"><td>${resLabel(k)}<span class="hide-sm"> ${Engine.RES[k].full.replace(/^[^(]*/, "")}</span></td><td class="r num">${fmt(x.fps)}</td><td class="r num">${fmt(x.low1)}</td><td>${limitCell(x)}</td></tr>`).join("")}</tbody></table></div>
        </section>
        <section class="card panel">
          <h3>FPS by game type</h3>
          <p class="sub">At ${res}, High settings.</p>
          <div class="table-scroll"><table><thead><tr><th>Game type</th><th class="r">Avg FPS</th><th>Limited by</th></tr></thead><tbody>${Object.entries(Engine.WORKLOAD).map(([k, wl]) => {
            const x = Engine.evaluate(p.cpu, p.gpu, { ...o, workload: k });
            return `<tr class="${k === o.workload ? "current" : ""}"><td>${wl.label}<br><small>${wl.examples}</small></td><td class="r num">${fmt(x.fps)}</td><td>${limitCell(x)}</td></tr>`;
          }).join("")}</tbody></table></div>
        </section>
        <section class="card panel">
          <h3>Recommendations</h3>
          <p class="sub">Specific to these parts at ${res}.</p>
          <ul class="tips">${tips.map((t) => `<li class="${t.type}">${TIP_ICONS[t.type] || TIP_ICONS.info}<span>${t.text}</span></li>`).join("")}</ul>
        </section>
        <section class="card panel">
          <h3>${up.title}</h3>
          <p class="sub">${up.sub}</p>
          <div class="upgrades">${up.html}</div>
        </section>
      </div>

      <div class="article combo-article">
        <section>
          <h2>Related builds</h2>
          <div class="combos">${related(p).map((x) => card(x, "../")).join("")}</div>
          <p><a href="../">Browse all ${pairs.length} popular builds</a> or <a href="${calcHref(p.cpu.id, p.gpu.id, p.res, "../../")}">open this build in the bottleneck calculator</a> to try other settings.</p>
        </section>

        <section class="faq">
          <h2>${c} + ${g}: quick answers</h2>
          ${faq.map(([q, a], i) => `<details${i ? "" : " open"}><summary>${q}</summary><div><p>${a}</p></div></details>`).join("\n          ")}
        </section>
      </div>
    </div>
  </main>

  ${footer("../../")}
  <script src="../../assets/js/motion.js?v=11"></script>
  <script>Motion.initPage(); Motion.autoPipelines();</script>
</body>
</html>
`;
  }

  // ---- /bottleneck/ index, grouped by graphics card
  function indexPage() {
    const url = `${SITE_URL}bottleneck/`;
    const gpus = [...new Set(pairs.map((p) => p.gpu))].sort((a, b) => b.g - a.g);
    const groups = gpus.map((gpu) => {
      const list = pairs.filter((p) => p.gpu === gpu).sort((a, b) => b.cpu.g - a.cpu.g);
      return `<section class="build-group" id="${gpu.id}">
          <h2>${short(gpu.name)} builds</h2>
          <p class="sub">${gpu.vram} GB VRAM · results at ${resLabel(list[0].res)}, High settings · ${list.length} CPUs</p>
          <div class="combos">${list.map((p) => card(p, "")).join("")}</div>
        </section>`;
    });
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        crumbSchema([["Bottleneck Calculator", SITE_URL], ["Popular builds", url]]),
        { "@type": "CollectionPage", name: "Popular CPU + GPU builds", url, numberOfItems: pairs.length },
      ],
    };
    return `${head({
      title: `Popular CPU + GPU Builds: Bottleneck & FPS for ${pairs.length} Pairings (2026)`,
      description: `Pre-calculated bottleneck and FPS results for ${pairs.length} popular CPU and GPU pairings, from Ryzen 5 5600 + RTX 4060 to Ryzen 7 9800X3D + RTX 5090. Find your build.`,
      url, root: "../", schema,
    })}
<body>
  ${header("../", "./")}

  <main id="main">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="../">Bottleneck Calculator</a> <span aria-hidden="true">›</span> <span aria-current="page">Popular builds</span></nav>
      <section class="hero combo-hero">
        <h1>Popular CPU + GPU builds: <span>Bottleneck &amp; FPS</span></h1>
        <p class="lead">Pre-calculated results for ${pairs.length} sensible pairings of current and previous-generation processors and graphics cards. Each page shows the bottleneck and estimated FPS at 1080p, 1440p, ultrawide and 4K, results by game type, and the upgrade that balances the build. Budget cards are rated at 1080p, mid-range at 1440p and high-end at 4K. Not listed? <a href="../#calculator">Check any CPU and GPU in the calculator</a>.</p>
      </section>

      <nav aria-label="Graphics cards"><ul class="chips">${gpus.map((g) => `<li><a href="#${g.id}">${short(g.name)}</a></li>`).join("")}</ul></nav>

      <div class="builds">
        ${groups.join("\n        ")}
      </div>
    </div>
  </main>

  ${footer("../")}
  <script src="../assets/js/motion.js?v=11"></script>
  <script>Motion.initPage(); Motion.autoPipelines();</script>
</body>
</html>
`;
  }

  // ---- Write (the folder is fully generated, so stale pairs are removed)
  const outDir = path.join(ROOT, "bottleneck");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), indexPage());
  for (const p of pairs) {
    fs.mkdirSync(path.join(outDir, p.slug));
    fs.writeFileSync(path.join(outDir, p.slug, "index.html"), comboPage(p));
  }
  return ["bottleneck/", ...pairs.map((p) => `bottleneck/${p.slug}/`)];
};
