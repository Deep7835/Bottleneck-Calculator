/*
 * Guides: /guides/ hub plus one page per guide in scripts/guides/<slug>.js.
 * Each guide module returns its copy as HTML sections; every number in the copy
 * and the tables is computed here from engine.js + hardware.js, so the guides
 * always agree with the calculator. Claims the copy makes about a result
 * ("CPU-bound at 1080p") are checked with expect() and fail the build if the
 * data changes underneath them.
 * Called from build.js; returns the generated URLs for the sitemap.
 */
const fs = require("fs");
const path = require("path");

// Display order on the hub and in "More guides".
const GUIDES = [
  "how-to-check-for-bottleneck",
  "cpu-vs-gpu-bottleneck",
  "does-resolution-affect-bottleneck",
  "how-to-fix-cpu-bottleneck",
  "best-cpu-for-rtx-5070",
  "best-am4-cpu",
];
const MODIFIED = "2026-10-20";
const PUBLISHED = "2026-10-20";

const layout = require("./layout");

module.exports = function buildGuides({ ROOT, SITE_URL, HW, Engine, buildPages }) {
  const short = Engine.shortName;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
  const find = (list, id) => list.find((x) => x.id === id) || (() => { throw new Error(`guides: unknown part id ${id}`); })();
  const { cpu: _c, gpu: _g, ...BASE } = Engine.DEFAULTS;
  const combos = new Set(buildPages);

  // ---- Helpers handed to every guide module
  const cpu = (id) => find(HW.cpus, id);
  const gpu = (id) => find(HW.gpus, id);
  const ev = (c, g, o = {}) => Engine.evaluate(cpu(c), gpu(g), { ...BASE, ...o });
  const res = (key) => Engine.RES[key].label;
  const pct = (r) => Math.round(r.pct);
  const gain = (to, from) => Math.round((to / from - 1) * 100);
  const name = (id) => short((HW.cpus.find((x) => x.id === id) || HW.gpus.find((x) => x.id === id) || find(HW.cpus, id)).name);
  const verdict = (r) => r.verdict.key === "excellent" ? "balanced" : `${pct(r)}% ${r.limiter.toUpperCase()}-limited`;
  const limitCell = (r) => r.verdict.key === "excellent"
    ? '<span class="dot" data-tone="excellent"></span>Balanced'
    : `<span class="dot" data-tone="${r.verdict.tone}"></span>${r.limiter.toUpperCase()} ${pct(r)}%`;
  // Compact label under a number in a matrix cell; kept on one line so narrow columns don't break it.
  const limitTag = (r) => `<small style="white-space:nowrap">${limitCell(r)}</small>`;
  function expect(ok, msg) { if (!ok) throw new Error(`guides: copy no longer matches the data: ${msg}`); }

  // Calculator link with the build pre-filled. Options use the calculator's URL names.
  const PARAM = { res: "res", quality: "q", workload: "game", upscale: "up", ram: "ram", hz: "hz" };
  function calcHref(c, g, o = {}) {
    cpu(c); gpu(g);
    const q = [`cpu=${c}`, `gpu=${g}`];
    for (const [k, v] of Object.entries(o)) if (PARAM[k] && v !== BASE[k]) q.push(`${PARAM[k]}=${v}`);
    if (o.streaming) q.push("stream=1");
    return `../../?${q.join("&amp;")}#calculator`;
  }
  const calc = (c, g, o, text) => `<a href="${calcHref(c, g, o)}">${text || `${name(c)} + ${name(g)}`}</a>`;
  // Build page if one exists for this pairing, otherwise the pre-filled calculator.
  const hasBuild = (c, g) => combos.has(`bottleneck/${c}-${g}/`);
  function build(c, g, text) {
    cpu(c); gpu(g);
    const href = hasBuild(c, g) ? `../../bottleneck/${c}-${g}/` : calcHref(c, g);
    return `<a href="${href}">${text || `${name(c)} + ${name(g)}`}</a>`;
  }
  function guide(slug, text) {
    if (!GUIDES.includes(slug)) throw new Error(`guides: unknown guide ${slug}`);
    return `<a href="../${slug}/">${text}</a>`;
  }
  const link = {
    calculator: (text) => `<a href="../../#calculator">${text}</a>`,
    fps: (text) => `<a href="../../fps-calculator/">${text}</a>`,
    builds: (text) => `<a href="../../bottleneck/">${text}</a>`,
    home: (hash, text) => `<a href="../../#${hash}">${text}</a>`,
  };
  const table = (head, rows, cls = "") =>
    `<div class="table-scroll"><table${cls ? ` class="${cls}"` : ""}><thead><tr>${head.map((h) => {
      const [label, right] = Array.isArray(h) ? h : [h, false];
      return `<th${right ? ' class="r"' : ""}>${label}</th>`;
    }).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.join("")}</tr>`).join("")}</tbody></table></div>`;
  const td = (v, num) => num ? `<td class="r num">${v}</td>` : `<td>${v}</td>`;

  const h = { HW, Engine, BASE, cpu, gpu, ev, res, pct, gain, name, fmt, verdict, limitCell, limitTag, expect, calc, calcHref, build, hasBuild, guide, link, table, td };

  // ---- Shared chrome (same header/footer as the rest of the site)
  const header = (root) => `<a class="skip" href="#main">Skip to content</a>
  ${layout.header(root, "guides")}`;

  const footer = (root) => `<footer class="site-footer">
    <div class="wrap">
      <nav class="footer-nav" aria-label="Site"><a href="${root}">Bottleneck calculator</a><a href="${root}fps-calculator/">FPS calculator</a><a href="${root}bottleneck/">Popular builds</a><a href="${root}guides/">Guides</a><a href="${root}about/">About</a><a href="${root}editorial-policy/">Editorial policy</a><a href="${root}privacy/">Privacy</a><a href="${root}contact/">Contact</a></nav>
      <p>© 2026 Bottleneck Calculator. Estimates are for guidance only. Real performance varies by game, settings, drivers and cooling.</p>
      <p>Product names are trademarks of their respective owners. This site isn't affiliated with AMD, Intel or NVIDIA.</p>
    </div>
  </footer>`;

  function head({ title, description, url, root, schema, type }) {
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

  <meta property="og:type" content="${type}">
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
  <link rel="stylesheet" href="${root}assets/css/style.css?v=9">
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
</head>`;
  }

  const crumbSchema = (items) => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map(([n, item], i) => ({ "@type": "ListItem", position: i + 1, name: n, item })),
  });
  const ORG = { "@type": "Organization", name: "Bottleneck Calculator", url: SITE_URL };
  const longDate = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  // ---- Load guide modules
  const guides = GUIDES.map((slug) => {
    const g = require(`./guides/${slug}`)(h);
    if (g.slug !== slug) throw new Error(`guides: ${slug}.js returned slug ${g.slug}`);
    const body = g.sections.map((s) => s.html).join(" ") + g.faq.map(([q, a]) => `${q} ${a}`).join(" ");
    g.words = strip(body).split(" ").length;
    if (g.words < 1500 || g.words > 2500) console.warn(`guides: ${slug} has ${g.words} words (target 1,500–2,500)`);
    return g;
  });
  const bySlug = new Map(guides.map((g) => [g.slug, g]));

  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const card = (g, base) => `<a class="combo-card" href="${base}${g.slug}/"><b>${g.h1}</b><span>${g.card}</span></a>`;

  // ---- Guide page
  function guidePage(g) {
    const url = `${SITE_URL}guides/${g.slug}/`;
    const minutes = Math.max(1, Math.round(g.words / 230));
    const more = (g.related || GUIDES.filter((s) => s !== g.slug)).slice(0, 3).map((s) => bySlug.get(s));
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        crumbSchema([["Bottleneck Calculator", SITE_URL], ["Guides", `${SITE_URL}guides/`], [g.h1, url]]),
        {
          "@type": "Article",
          headline: g.h1,
          description: g.description,
          image: `${SITE_URL}og-image.png`,
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
          wordCount: g.words,
          author: { ...ORG, url: `${SITE_URL}about/` },
          publisher: ORG,
          mainEntityOfPage: url,
        },
        { "@type": "FAQPage", mainEntity: g.faq.map(([q, a]) => ({ "@type": "Question", name: strip(q), acceptedAnswer: { "@type": "Answer", text: strip(a) } })) },
      ],
    };
    if (g.h1.length > 110) throw new Error(`guides: ${g.slug} headline is over 110 characters`);

    return `${head({ title: g.title, description: g.description, url, root: "../../", schema, type: "article" })}
<body>
  ${header("../../")}

  <main id="main">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="../../">Bottleneck Calculator</a> <span aria-hidden="true">›</span> <a href="../">Guides</a> <span aria-hidden="true">›</span> <span aria-current="page">${g.crumb}</span></nav>
      <section class="hero combo-hero">
        <h1>${g.h1}</h1>
        <p class="lead">${g.lead}</p>
        <p class="updated">Updated <time datetime="${MODIFIED}">${longDate(MODIFIED)}</time> · ${minutes} min read · Numbers from our <a href="../../#how-it-works">bottleneck model</a></p>
      </section>
    </div>

    <div class="wrap content">
      <nav class="toc" aria-label="On this page">
        <p>On this page</p>
        <ol>
          ${g.sections.map((s) => `<li><a href="#${s.id}">${s.toc}</a></li>`).join("\n          ")}
          <li><a href="#faq">FAQ</a></li>
        </ol>
      </nav>

      <article class="article">
        ${g.sections.map((s) => `<section id="${s.id}">
          <h2>${s.h2}</h2>
          ${s.html.trim()}
        </section>`).join("\n\n        ")}

        <section id="faq" class="faq">
          <h2>Frequently asked questions</h2>
          ${g.faq.map(([q, a], i) => `<details${i ? "" : " open"}><summary>${q}</summary><div><p>${a}</p></div></details>`).join("\n          ")}
        </section>

        <section id="more">
          <h2>More guides</h2>
          <div class="combos">${more.map((x) => card(x, "../")).join("")}</div>
          <p><a class="btn" href="${g.cta ? g.cta.href : "../../#calculator"}">${g.cta ? g.cta.text : "Check your CPU and GPU"}${arrow}</a></p>
        </section>
      </article>
    </div>
  </main>

  ${footer("../../")}
  <script src="../../assets/js/motion.js?v=9"></script>
  <script>Motion.initPage();</script>
</body>
</html>
`;
  }

  // ---- Hub
  function hubPage() {
    const url = `${SITE_URL}guides/`;
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        crumbSchema([["Bottleneck Calculator", SITE_URL], ["Guides", url]]),
        {
          "@type": "CollectionPage", name: "PC bottleneck guides", url, dateModified: MODIFIED,
          mainEntity: { "@type": "ItemList", itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${url}${g.slug}/`, name: g.h1 })) },
        },
      ],
    };
    const groups = [
      ["Diagnose", "Find out what's actually limiting your frame rate.", ["how-to-check-for-bottleneck", "cpu-vs-gpu-bottleneck", "does-resolution-affect-bottleneck"]],
      ["Fix and upgrade", "Get more FPS from the parts you have, then spend upgrade money where it counts.", ["how-to-fix-cpu-bottleneck", "best-cpu-for-rtx-5070", "best-am4-cpu"]],
    ];
    return `${head({
      title: "PC Bottleneck Guides: Check, Fix and Upgrade (2026)",
      description: "Practical guides to CPU and GPU bottlenecks: how to check yours with MSI Afterburner, how resolution changes it, how to fix a CPU bottleneck, and which CPU to buy.",
      url, root: "../", schema, type: "website",
    })}
<body>
  ${header("../")}

  <main id="main">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="../">Bottleneck Calculator</a> <span aria-hidden="true">›</span> <span aria-current="page">Guides</span></nav>
      <section class="hero combo-hero">
        <h1>PC bottleneck guides</h1>
        <p class="lead">The calculator tells you what to expect. These guides cover the rest: how to confirm a bottleneck on your own PC, why it moves when you change resolution, what fixes it without spending money, and which CPU to buy when it's time to upgrade. Every table is calculated from the same data as the <a href="../#calculator">bottleneck calculator</a> and the <a href="../fps-calculator/">FPS calculator</a>, so the numbers match.</p>
      </section>

      <div class="article combo-article">
        ${groups.map(([title, sub, slugs]) => `<section class="build-group">
          <h2>${title}</h2>
          <p class="sub">${sub}</p>
          <div class="combos">${slugs.map((s) => card(bySlug.get(s), "")).join("")}</div>
        </section>`).join("\n        ")}
        <section>
          <h2>Prefer a quick answer?</h2>
          <p>Pick your parts in the <a href="../#calculator">bottleneck calculator</a> for the verdict, FPS at every resolution and the upgrade that balances your build, or browse <a href="../bottleneck/">${buildPages.length - 1} popular CPU + GPU builds</a> with the results already worked out.</p>
        </section>
      </div>
    </div>
  </main>

  ${footer("../")}
  <script src="../assets/js/motion.js?v=9"></script>
  <script>Motion.initPage();</script>
</body>
</html>
`;
  }

  // ---- Write (the folder is fully generated)
  const outDir = path.join(ROOT, "guides");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), hubPage());
  for (const g of guides) {
    fs.mkdirSync(path.join(outDir, g.slug));
    fs.writeFileSync(path.join(outDir, g.slug, "index.html"), guidePage(g));
  }
  guides.forEach((g) => console.log(`  guides/${g.slug}/: ${g.words} words`));
  return ["guides/", ...guides.map((g) => `guides/${g.slug}/`)];
};
