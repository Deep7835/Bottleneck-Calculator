/*
 * Mac gaming section: /mac/ (interactive calculator + guide) and one page per
 * Apple Silicon Mac configuration (/mac/<model>/). Every number comes from
 * assets/js/macs.js on top of the shared engine.
 */
const fs = require("fs");
const path = require("path");
const layout = require("./layout");

module.exports = function buildMacPages({ ROOT, SITE_URL, HW, Engine, faqSchema }) {
  require(path.join(ROOT, "assets/js/macs.js"));
  const { Macs } = global.window;
  const V = "?v=26";
  const MODIFIED = "2026-10-20";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const short = Engine.shortName;
  const DEFAULT = { mac: "macbook-pro-14-m4-pro-20-core-gpu", game: "cyberpunk", res: "1080p", quality: "high", upscale: "off" };
  const RUN_BADGE = {
    native: '<span class="run run-native">Native</span>',
    translated: '<span class="run run-translated">CrossOver</span>',
    blocked: '<span class="run run-blocked">Not on Mac</span>',
    cloud: '<span class="run run-blocked">Cloud only</span>',
  };
  const ram16 = (m) => (m.ram.includes(16) ? 16 : m.ram.find((r) => r >= 16) || m.ram[m.ram.length - 1]);
  const ev = (m, game, res, extra = {}) => Macs.evaluate(m, { res, quality: "high", upscale: "off", ram: ram16(m), game, ...extra });
  const fpsCell = (r) => (r.playable ? `<td class="r num">${fmt(r.fps)}</td>` : '<td class="r">–</td>');
  const current = Macs.models.filter((m) => m.year >= 2024);

  const crumbSchema = (items) => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  });

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

  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="${SITE_URL}og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Bottleneck Calculator: CPU vs GPU balance, FPS and upgrade picks">
  <meta name="twitter:image" content="${SITE_URL}og-image.png">

  <script>document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}</script>
  <link rel="preload" href="${root}assets/fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${root}assets/fonts/geist-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${root}assets/css/style.css${V}">
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
</head>`;
  }

  const { verdictLine, tips, sixtyList } = Macs;

  // ---------- /mac/ hub with the calculator ----------
  function hubPage() {
    const url = `${SITE_URL}mac/`;
    const m = Macs.byId[DEFAULT.mac];
    const g = Macs.game(DEFAULT.game);
    const o = { ...DEFAULT, ram: m.defaultRam };
    const r = Macs.evaluate(m, o);
    const pc = Macs.pcEquivalent(m);
    const tone = Macs.tone(r);
    const families = ["MacBook Air", "MacBook Pro", "Mac mini", "iMac", "Mac Studio", "Mac Pro"];
    const macOptions = families.map((f) => `<optgroup label="${f}">${Macs.models.filter((x) => x.family === f).sort((a, b) => b.year - a.year || b.gpu - a.gpu)
      .map((x) => `<option value="${x.id}"${x.id === m.id ? " selected" : ""}>${esc(x.name)} · ${x.year}</option>`).join("")}</optgroup>`).join("");
    const gameGroups = [["Native Mac games", "native"], ["Windows games via CrossOver", "translated"], ["Not playable on Mac", "blocked"]];
    const gameOptions = gameGroups.map(([label, run]) => `<optgroup label="${label}">${Macs.games.filter((x) => x.run === run || (run === "blocked" && x.run === "cloud"))
      .map((x) => `<option value="${x.id}"${x.id === g.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</optgroup>`).join("")
      + `<optgroup label="Any game">${Object.values(Macs.GENERIC).map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}</optgroup>`;
    const resRows = [["1080p", "1080p"], ["1440p", "1440p"], ["4k", "4K"], ["native", "Built-in display"]].filter(([k]) => k !== "native" || m.display)
      .map(([k, label]) => { const x = Macs.evaluate(m, { ...o, res: k }); return `<tr class="${k === o.res ? "current" : ""}"><td>${label}</td><td class="r num">${fmt(x.fps)}</td><td class="r num">${fmt(x.low1)}</td></tr>`; }).join("");
    const gameRows = Macs.games.map((x) => { const y = Macs.evaluate(m, { ...o, game: x.id }); return `<tr class="${x.id === g.id ? "current" : ""}"><td>${esc(x.name)}</td><td>${RUN_BADGE[x.run]}</td>${fpsCell(y)}</tr>`; }).join("");
    const t = tips(m, g, r, o);
    const sixty = sixtyList(g.id, o.res);

    // Best Mac for gaming table: current lineup, Cyberpunk at 1080p and 1440p High.
    const tier = current.filter((x) => x.family !== "Mac Pro").map((x) => ({ x, a: ev(x, "cyberpunk", "1080p"), b: ev(x, "cyberpunk", "1440p"), c: ev(x, "bg3", "1080p") }))
      .sort((p, q) => p.x.gpu - q.x.gpu);
    const seen = new Set();
    const tierRows = tier.filter((p) => { const k = `${p.x.chip.id}-${p.x.gpuCores}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .map((p) => `<tr><td><a href="${p.x.id}/">${esc(p.x.chip.name)} ${p.x.gpuCores}-core GPU</a><br><small>${esc(Macs.models.filter((y) => y.chip.id === p.x.chip.id && y.gpuCores === p.x.gpuCores && y.year >= 2024).map((y) => y.product).filter((v, i, a) => a.indexOf(v) === i).join(", "))}</small></td><td class="r num">${fmt(p.a.fps)}</td><td class="r num">${fmt(p.b.fps)}</td><td class="r num">${fmt(p.c.fps)}</td></tr>`).join("");

    const modelLinks = families.map((f) => {
      const list = Macs.models.filter((x) => x.family === f).sort((a, b) => b.year - a.year || b.gpu - a.gpu);
      return `<section class="build-group"><h3>${f}</h3><div class="combos">${list.map((x) => { const y = ev(x, "cyberpunk", "1080p"); return `<a class="combo-card" href="${x.id}/"><b>${esc(x.name)}</b><span>${x.year} · Cyberpunk 2077 1080p High ≈${fmt(y.fps)} FPS</span></a>`; }).join("")}</div></section>`;
    }).join("\n          ");

    const faq = [
      ["Can a Mac run games in 2026?", "Yes. Apple Silicon Macs run a growing list of native games, including Cyberpunk 2077, Baldur's Gate 3, Resident Evil 4, Assassin's Creed Shadows and World of Warcraft, and many Windows games through CrossOver. A MacBook Air handles lighter games and older AAA titles at 1080p; an M4 Pro or M4 Max runs modern AAA games well."],
      ["Which Mac is best for gaming?", "For the money, the Mac mini with M4 Pro (20-core GPU) or a MacBook Pro 14″ with M4 Pro. The M4 Max (40-core GPU) is the fastest laptop option, and the Mac Studio with M3 Ultra is the fastest Mac overall. Avoid 8 GB models for gaming."],
      ["Is the MacBook Air good for gaming?", "For light and older games, yes. Its GPU is similar to a GTX 1650-class card and it has no fan, so it slows down in long sessions. Expect about 25–35 FPS in demanding AAA games at 1080p High, and 60+ FPS in esports titles and games like League of Legends or Minecraft."],
      ["How much RAM does a Mac need for gaming?", "16 GB is the realistic minimum, because graphics use the same unified memory as everything else. macOS gives the GPU about two-thirds of it. 24–36 GB is comfortable for AAA games at higher resolutions."],
      ["Can I play Valorant, Fortnite or Warzone on a Mac?", "Not natively. Their kernel anti-cheat doesn't run on macOS, and Fortnite isn't sold for Mac. Cloud gaming services like GeForce NOW and Xbox Cloud Gaming are the way to play them on a Mac."],
      ["Do Windows games run on Apple Silicon Macs?", "Many do, through CrossOver or Apple's Game Porting Toolkit, which translate DirectX to Metal. Expect roughly 30–40% lower FPS than a native port, and games with kernel anti-cheat won't start."],
      ["Can I add an external GPU to an Apple Silicon Mac?", "No. Apple Silicon Macs don't support eGPUs. The graphics are built into the chip, so choosing the right chip and GPU core count when you buy is what matters."],
    ];
    const faqHtml = faq.map(([q, a], i) => `<details${i ? "" : " open"}><summary>${q}</summary><div><p>${a}</p></div></details>`).join("\n          ");
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        crumbSchema([["Bottleneck Calculator", SITE_URL], ["Mac gaming", url]]),
        { "@type": "WebApplication", name: "Mac Gaming FPS Calculator", url, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: layout.OWNER_SCHEMA, dateModified: MODIFIED },
        { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      ],
    };
    const icon = (k) => ({ good: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>', warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>', info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/></svg>' })[k];

    return `${head({
      title: "Mac Gaming FPS Calculator (2026): MacBook, iMac & Mac mini Game Performance",
      description: "How well does your Mac run games? FPS estimates for every M1–M5 MacBook Air, MacBook Pro, Mac mini, iMac and Mac Studio in Cyberpunk 2077, Baldur's Gate 3, CS2 and more, with native vs CrossOver and memory checks.",
      url, root: "../", schema,
    })}
<body>
  <a class="skip" href="#calculator">Skip to calculator</a>
  ${layout.header("../", "mac")}

  <main id="main">
    <div class="wrap">
      <section class="hero">
        <p class="eyebrow reveal"><span class="live-dot" aria-hidden="true"></span>Apple Silicon M1 to M5 · ${Macs.models.length} Mac configurations</p>
        <h1 class="reveal">Mac Gaming FPS Calculator</h1>
        <p class="lead reveal">Pick your Mac and a game to see how many frames per second to expect, whether it runs natively or through CrossOver, and which Mac you'd need for 60 FPS.</p>
      </section>

      <section id="calculator" class="calc reveal" aria-label="Mac gaming calculator">
        <form class="card builder" id="mac-form" autocomplete="off" onsubmit="return false">
          <div class="builder-main">
            <div class="field">
              <label for="mac">Your Mac</label>
              <select id="mac" name="mac" class="big-select">${macOptions}</select>
              <div class="field-meta" id="mac-meta">${esc(`${m.chip.cpuLabel} · ${m.gpuCores}-core GPU · ${m.fanless ? "fanless" : "with fans"}`)}</div>
            </div>
            <div class="builder-plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></div>
            <div class="field">
              <label for="game">Game</label>
              <select id="game" name="game" class="big-select">${gameOptions}</select>
              <div class="field-meta" id="game-meta">${esc(Macs.RUN[g.run] ? Macs.RUN[g.run].label : g.note)}</div>
            </div>
          </div>
          <div class="builder-sub">
            <div class="field field-res">
              <span class="field-label" id="res-label">Resolution</span>
              <div class="seg" role="radiogroup" aria-labelledby="res-label">
                <span class="seg-thumb" aria-hidden="true"></span>
                <label><input type="radio" name="res" value="1080p" checked><span>1080p</span></label>
                <label><input type="radio" name="res" value="1440p"><span>1440p</span></label>
                <label><input type="radio" name="res" value="4k"><span>4K</span></label>
                <label><input type="radio" name="res" value="native"><span>Retina</span></label>
              </div>
            </div>
            <button type="button" class="more-toggle" id="more-toggle" aria-expanded="false" aria-controls="more">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>
              <span class="more-text"><b>Settings</b><span id="opt-summary">High · ${o.ram} GB · MetalFX off</span></span>
              <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
          <div class="more" id="more">
            <div class="more-inner">
              <div class="more-grid">
                <div class="field">
                  <span class="field-label" id="q-label">Graphics quality</span>
                  <div class="seg" role="radiogroup" aria-labelledby="q-label">
                    <span class="seg-thumb" aria-hidden="true"></span>
                    <label><input type="radio" name="quality" value="low"><span>Low</span></label>
                    <label><input type="radio" name="quality" value="medium"><span>Med</span></label>
                    <label><input type="radio" name="quality" value="high" checked><span>High</span></label>
                    <label><input type="radio" name="quality" value="ultra"><span>Ultra</span></label>
                  </div>
                </div>
                <div class="field">
                  <label for="ram">Unified memory</label>
                  <select id="ram" name="ram">${m.ram.map((v) => `<option value="${v}"${v === o.ram ? " selected" : ""}>${v} GB</option>`).join("")}</select>
                </div>
                <div class="field">
                  <label for="upscale">MetalFX upscaling</label>
                  <select id="upscale" name="upscale">
                    <option value="off">Off (native)</option>
                    <option value="quality">MetalFX Quality</option>
                    <option value="balanced">MetalFX Balanced</option>
                    <option value="performance">MetalFX Performance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>

        <section class="card results" id="results" data-tone="${tone}" aria-label="Result">
          <div class="results-head">
            <div class="gauge" aria-hidden="true">
              <svg viewBox="0 0 220 124">
                <path class="track" d="M15 115 A95 95 0 0 1 205 115" fill="none" stroke-width="14" stroke-linecap="round"/>
                <path class="fill" id="gauge-fill" d="M15 115 A95 95 0 0 1 205 115" fill="none" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
              </svg>
              <div class="gauge-value"><strong class="num" id="big-fps">${fmt(r.fps)}</strong><small id="big-label">FPS average</small></div>
            </div>
            <div class="verdict" aria-live="polite">
              <span class="tone-pill" id="tone-pill">${r.limiter === "gpu" ? "GPU-limited" : "CPU-limited"}</span>
              <h2 id="verdict-title">${Macs.label(r)} on this Mac</h2>
              <p id="verdict-text">${esc(verdictLine(m, g, r, "1080p High"))}</p>
            </div>
          </div>
          <div class="stats">
            <div class="stat"><small>Avg FPS</small><strong class="num" id="s-fps">${fmt(r.fps)}</strong></div>
            <div class="stat"><small>1% low</small><strong class="num" id="s-low">${fmt(r.low1)}</strong></div>
            <div class="stat"><small>Memory for graphics</small><strong class="num"><span id="s-vram">${r.vram}</span><span class="unit">GB</span></strong></div>
            <div class="stat stat-pc"><small>Similar PC</small><strong id="s-pc">${esc(`${short(pc.gpu.name)}`)}</strong><span class="pc-cpu" id="s-pc-cpu">+ ${esc(short(pc.cpu.name))}</span></div>
          </div>
          <div class="result-actions">
            <span class="context" id="context-line">${esc(`${m.name} · 1080p · High · ${o.ram} GB`)}</span>
            <button type="button" class="btn-ghost" id="share-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>Copy link</button>
          </div>
        </section>
      </section>

      <div class="details reveal-group" id="details">
        <section class="card panel">
          <h3>FPS by resolution</h3>
          <p class="sub" id="res-sub">${esc(g.name)} at High settings.</p>
          <div class="table-scroll"><table id="res-table"><thead><tr><th>Resolution</th><th class="r">Avg FPS</th><th class="r">1% low</th></tr></thead><tbody>${resRows}</tbody></table></div>
        </section>
        <section class="card panel">
          <h3>Every game on this Mac</h3>
          <p class="sub" id="games-sub">At 1080p High with ${o.ram} GB.</p>
          <div class="table-scroll"><table id="games-table"><thead><tr><th>Game</th><th>Runs as</th><th class="r">Avg FPS</th></tr></thead><tbody>${gameRows}</tbody></table></div>
        </section>
        <section class="card panel">
          <h3>Recommendations</h3>
          <p class="sub">Specific to this Mac and game.</p>
          <ul class="tips" id="tips">${t.map(([k, txt]) => `<li class="${k}">${icon(k)}<span>${esc(txt)}</span></li>`).join("")}</ul>
        </section>
        <section class="card panel">
          <h3>Macs that hold 60 FPS here</h3>
          <p class="sub" id="sixty-sub">Current Macs (2024 and later), slowest first.</p>
          <div class="upgrades" id="sixty">${sixty.length ? sixty.map((x) => `<a class="up" href="${x.m.id}/"><span class="up-tag">${esc(x.m.product)}</span><span class="up-name">${esc(x.m.chip.name)} ${x.m.gpuCores}-core GPU</span><span class="up-gain">≈${fmt(x.r.fps)} FPS</span></a>`).join("") : '<p class="empty-note">No current Mac reaches 60 FPS at these settings. Try 1080p, Medium or MetalFX.</p>'}</div>
        </section>
      </div>
    </div>

    <div class="wrap content">
      <nav class="toc" aria-label="On this page">
        <p>On this page</p>
        <ol>
          <li><a href="#mac-gaming">Can you game on a Mac?</a></li>
          <li><a href="#how-mac">How we estimate</a></li>
          <li><a href="#native-vs-crossover">Native vs CrossOver</a></li>
          <li><a href="#memory">How much memory</a></li>
          <li><a href="#best-mac">Best Mac for gaming</a></li>
          <li><a href="#cant-play">Games you can't play</a></li>
          <li><a href="#all-macs">All Mac models</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ol>
      </nav>
      <article class="article">
        <section id="mac-gaming">
          <h2>Can you game on a Mac in 2026?</h2>
          <p>Yes, and better than ever. Every Mac since late 2020 uses an Apple Silicon chip with the graphics built in, and the list of native games keeps growing: <strong>Cyberpunk 2077, Baldur's Gate 3, Resident Evil 4, Assassin's Creed Shadows, Death Stranding, No Man's Sky and World of Warcraft</strong> all run natively. Many other Windows games run through CrossOver.</p>
          <p>What you can't do is upgrade the graphics later. Apple Silicon Macs don't support external GPUs, so the chip and its GPU core count decide your gaming performance for the life of the machine. That's why this calculator works by Mac model rather than by separate CPU and graphics card.</p>
        </section>

        <section id="how-mac">
          <h2>How the Mac calculator works</h2>
          <p>It uses the same engine as the PC <a href="../">bottleneck calculator</a>. Each Apple chip gets a CPU index (Ryzen 7 9800X3D = 100) and a GPU index for every GPU core configuration (RTX 4090 = 100), estimated from published Mac game benchmarks. On top of that it models what's different about Macs:</p>
          <ul>
            <li><strong>How the game runs.</strong> Native Mac ports lose about 10% to the PC version on the same hardware. Windows games through CrossOver or the Game Porting Toolkit lose about 35–40%.</li>
            <li><strong>Unified memory.</strong> Graphics share RAM with everything else. macOS lets the GPU use about two-thirds, which acts as the Mac's "VRAM".</li>
            <li><strong>Cooling.</strong> The MacBook Air has no fan and slows down by about 15% in long sessions.</li>
            <li><strong>Display.</strong> "Retina" uses your Mac's real panel resolution, which is often more pixels than 1440p.</li>
          </ul>
          <p>Like all estimates, real results vary by game patch, macOS version and settings. Treat the numbers as a guide to what's smooth and what isn't.</p>
        </section>

        <section id="native-vs-crossover">
          <h2>Native Mac games vs CrossOver</h2>
          <p>A <strong>native</strong> game is built for macOS and Apple's Metal graphics API, usually with MetalFX upscaling. It's the fastest and most stable way to play.</p>
          <p><strong>CrossOver</strong> (and Apple's free Game Porting Toolkit, which it builds on) runs the Windows version by translating DirectX calls to Metal on the fly. It's impressive, but the translation costs performance. Games with kernel-level anti-cheat (Valorant, Call of Duty) won't start at all. If a game has both, always pick the native version.</p>
        </section>

        <section id="memory">
          <h2>How much unified memory do you need for gaming?</h2>
          <div class="table-scroll"><table><thead><tr><th>Memory</th><th class="r">For graphics</th><th>Good for</th></tr></thead><tbody>
            <tr><td>8 GB</td><td class="r num">${Macs.vramFor(8)} GB</td><td>Esports and older games only. Modern AAA games stutter.</td></tr>
            <tr><td>16 GB</td><td class="r num">${Macs.vramFor(16)} GB</td><td>AAA games at 1080p–1440p, Medium–High.</td></tr>
            <tr><td>24 GB</td><td class="r num">${Macs.vramFor(24)} GB</td><td>AAA at 1440p High with headroom for Discord and a browser.</td></tr>
            <tr><td>36–48 GB</td><td class="r num">${Macs.vramFor(36)}–${Macs.vramFor(48)} GB</td><td>4K and the heaviest games on M4 Pro/Max.</td></tr>
          </tbody></table></div>
        </section>

        <section id="best-mac">
          <h2>Best Mac for gaming: current lineup compared</h2>
          <p>Estimated FPS at High settings, native versions, with at least 16 GB of memory. Click a chip for the full breakdown.</p>
          <div class="table-scroll"><table><thead><tr><th>Chip</th><th class="r">Cyberpunk 1080p</th><th class="r">Cyberpunk 1440p</th><th class="r">BG3 1080p</th></tr></thead><tbody>${tierRows}</tbody></table></div>
          <p><strong>Our picks:</strong> the Mac mini with M4 Pro (20-core GPU) is the best value gaming Mac, the MacBook Pro 14″ with M4 Pro is the best gaming laptop for most people, and the M4 Max 40-core GPU is the fastest portable Mac. The MacBook Air is fine for lighter games but not for demanding AAA titles.</p>
        </section>

        <section id="cant-play">
          <h2>Games you can't play on a Mac (and the workaround)</h2>
          <p>Games with kernel-level anti-cheat don't run on macOS, natively or through CrossOver: <strong>Valorant, Call of Duty: Warzone, and the online modes of GTA V and many competitive shooters</strong>. Fortnite isn't sold for Mac at all.</p>
          <p>The workaround is <strong>cloud gaming</strong>. GeForce NOW and Xbox Cloud Gaming run the game on a PC in a data center and stream it to your Mac, so even a MacBook Air plays at high settings if your connection is fast and stable.</p>
        </section>

        <section id="all-macs">
          <h2>Gaming performance for every Apple Silicon Mac</h2>
          ${modelLinks}
        </section>

        <section id="faq" class="faq">
          <h2>Mac gaming FAQ</h2>
          ${faqHtml}
        </section>
      </article>
    </div>
  </main>

  ${layout.footer("../")}

  <div class="toast" id="toast" role="status"></div>
  <script src="../assets/js/i18n.js${V}"></script>
  <script src="../assets/js/hardware.js${V}"></script>
  <script src="../assets/js/engine.js${V}"></script>
  <script src="../assets/js/macs.js${V}"></script>
  <script src="../assets/js/motion.js${V}"></script>
  <script src="../assets/js/mac.js${V}"></script>
</body>
</html>
`;
  }

  // ---------- /mac/<model>/ ----------
  function modelPage(m) {
    const url = `${SITE_URL}mac/${m.id}/`;
    const ram = ram16(m);
    const pc = Macs.pcEquivalent(m);
    const hasNative = !!m.display;
    const resCols = [["1080p", "1080p"], ["1440p", "1440p"], ...(hasNative ? [["native", `Retina (${m.display.w}×${m.display.h})`]] : [["4k", "4K"]])];
    const gameRows = Macs.games.map((g) => {
      const cells = resCols.map(([res]) => fpsCell(ev(m, g.id, res))).join("");
      return `<tr><td>${esc(g.name)}</td><td>${RUN_BADGE[g.run]}</td>${cells}</tr>`;
    }).join("");
    const cp = { q: ["low", "medium", "high", "ultra"].map((q) => [q, ev(m, "cyberpunk", "1080p", { quality: q }), ev(m, "cyberpunk", "1440p", { quality: q }), ev(m, "cyberpunk", "1440p", { quality: q, upscale: "quality" })]) };
    const cyb = ev(m, "cyberpunk", "1080p"), bg3 = ev(m, "bg3", "1080p"), lol = ev(m, "lol", "1080p"), cs2 = ev(m, "cs2", "1080p");
    const level = cyb.fps >= 60 ? "a strong gaming Mac" : cyb.fps >= 40 ? "a capable gaming Mac" : cyb.fps >= 28 ? "fine for lighter games and older AAA titles" : "best suited to light games and cloud gaming";
    const intro = `The ${m.name} (${m.year}) is ${level}. In native games it runs Cyberpunk 2077 at about ${fmt(cyb.fps)} FPS and Baldur's Gate 3 at about ${fmt(bg3.fps)} FPS at 1080p High, and League of Legends at about ${fmt(lol.fps)} FPS. Windows games through CrossOver, like Counter-Strike 2, reach about ${fmt(cs2.fps)} FPS. Its ${m.gpuCores}-core GPU performs roughly like a desktop ${short(pc.gpu.name)} in native games${m.fanless ? ", although the fanless design slows it down in long sessions" : ""}. With ${ram} GB of unified memory, about ${Macs.vramFor(ram)} GB is available for graphics.`;
    const siblings = Macs.models.filter((x) => x.id !== m.id && (x.chip.id === m.chip.id || (x.family === m.family && Math.abs(x.year - m.year) <= 1))).slice(0, 6);
    const faq = [
      [`Is the ${m.name} good for gaming?`, `${intro.split(". ")[0]}. Expect about ${fmt(cyb.fps)} FPS in Cyberpunk 2077 and ${fmt(lol.fps)} FPS in League of Legends at 1080p High.`],
      [`What PC is the ${m.name} equal to for gaming?`, `In native Mac games its graphics perform roughly like a ${short(pc.gpu.name)}, with CPU performance close to a ${short(pc.cpu.name)}. Windows games through CrossOver run about a third slower.`],
      [`How much memory does the ${m.name} need for gaming?`, `${m.ram.includes(8) ? "Avoid the 8 GB version for modern games. " : ""}${ram} GB gives about ${Macs.vramFor(ram)} GB to graphics, which is enough for 1080p–1440p High. ${m.ram[m.ram.length - 1] >= 32 ? `Configurations up to ${m.ram[m.ram.length - 1]} GB help at 4K.` : ""}`.trim()],
    ];
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        crumbSchema([["Bottleneck Calculator", SITE_URL], ["Mac gaming", `${SITE_URL}mac/`], [m.name, url]]),
        { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      ],
    };
    return `${head({
      title: `${m.name} Gaming Performance: FPS in ${Macs.games.length} Games (2026)`,
      description: `How well does the ${m.name} (${m.year}) run games? About ${fmt(cyb.fps)} FPS in Cyberpunk 2077 and ${fmt(bg3.fps)} in Baldur's Gate 3 at 1080p High, plus CrossOver games, memory and the PC it matches.`,
      url, root: "../../", schema,
    })}
<body>
  <a class="skip" href="#main">Skip to content</a>
  ${layout.header("../../", "mac")}

  <main id="main">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="../../">Bottleneck Calculator</a> <span aria-hidden="true">›</span> <a href="../">Mac gaming</a> <span aria-hidden="true">›</span> <span aria-current="page">${esc(m.name)}</span></nav>
      <section class="hero combo-hero">
        <h1>${esc(m.name)}: <span>gaming performance</span></h1>
        <p class="lead">${esc(intro)}</p>
      </section>

      <div class="details reveal-group">
        <section class="card panel">
          <h2>Specs that matter for gaming</h2>
          <p class="sub">${m.year} · ${esc(m.product)}</p>
          <div class="table-scroll"><table><tbody>
            <tr><td>Chip</td><td class="r">Apple ${esc(m.chip.name)}</td></tr>
            <tr><td>CPU</td><td class="r">${esc(m.chip.cpuLabel)}</td></tr>
            <tr><td>GPU</td><td class="r">${m.gpuCores}-core${m.chip.rt ? " · hardware ray tracing" : ""}</td></tr>
            <tr><td>Unified memory</td><td class="r">${m.ram.map((v) => `${v} GB`).join(" / ")}</td></tr>
            <tr><td>Display</td><td class="r">${m.display ? `${m.display.w}×${m.display.h}` : "External monitor"}</td></tr>
            <tr><td>Cooling</td><td class="r">${m.fanless ? "Fanless (throttles in long sessions)" : "Active (fans)"}</td></tr>
            <tr><td>Similar PC</td><td class="r">${esc(short(pc.gpu.name))} + ${esc(short(pc.cpu.name))}</td></tr>
          </tbody></table></div>
        </section>
        <section class="card panel">
          <h2>Cyberpunk 2077 by settings</h2>
          <p class="sub">Native Mac version, ${ram} GB memory.</p>
          <div class="table-scroll"><table><thead><tr><th>Quality</th><th class="r">1080p</th><th class="r">1440p</th><th class="r">1440p + MetalFX</th></tr></thead><tbody>${cp.q.map(([q, a, b, c]) => `<tr><td>${q[0].toUpperCase() + q.slice(1)}</td><td class="r num">${fmt(a.fps)}</td><td class="r num">${fmt(b.fps)}</td><td class="r num">${fmt(c.fps)}</td></tr>`).join("")}</tbody></table></div>
        </section>
        <section class="card panel wide">
          <h2>FPS in ${Macs.games.length} games</h2>
          <p class="sub">High settings, ${ram} GB memory, average FPS. "CrossOver" means the Windows version through translation.</p>
          <div class="table-scroll"><table><thead><tr><th>Game</th><th>Runs as</th>${resCols.map(([, l]) => `<th class="r">${l}</th>`).join("")}</tr></thead><tbody>${gameRows}</tbody></table></div>
        </section>
      </div>

      <div class="article combo-article">
        <section>
          <p class="cmp-actions"><a class="btn" href="../?mac=${m.id}#calculator">Try other games and settings<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></p>
          <h2>Similar Macs</h2>
          <div class="combos">${siblings.map((x) => { const y = ev(x, "cyberpunk", "1080p"); return `<a class="combo-card" href="../${x.id}/"><b>${esc(x.name)}</b><span>${x.year} · Cyberpunk 1080p ≈${fmt(y.fps)} FPS</span></a>`; }).join("")}</div>
        </section>
        <section class="faq">
          <h2>${esc(m.name)}: quick answers</h2>
          ${faq.map(([q, a], i) => `<details${i ? "" : " open"}><summary>${esc(q)}</summary><div><p>${esc(a)}</p></div></details>`).join("\n          ")}
        </section>
      </div>
    </div>
  </main>

  ${layout.footer("../../")}
  <script src="../../assets/js/motion.js${V}"></script>
  <script>Motion.initPage();</script>
</body>
</html>
`;
  }

  // ---------- Write ----------
  const outDir = path.join(ROOT, "mac");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), hubPage());
  for (const m of Macs.models) {
    fs.mkdirSync(path.join(outDir, m.id));
    fs.writeFileSync(path.join(outDir, m.id, "index.html"), modelPage(m));
  }
  return ["mac/", ...Macs.models.map((m) => `mac/${m.id}/`)];
};
