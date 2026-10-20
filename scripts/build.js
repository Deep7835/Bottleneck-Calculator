#!/usr/bin/env node
/*
 * Pre-renders the data tables into index.html so search engines see real
 * numbers without running JavaScript, generates FAQ schema + sitemap, and
 * writes the static CPU + GPU build pages (see combo-pages.js).
 * Run after editing hardware.js or engine.js:  node scripts/build.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = process.env.SITE_URL || "https://bottleneckcalculator.si/";

global.window = {};
require(path.join(ROOT, "assets/js/hardware.js"));
require(path.join(ROOT, "assets/js/engine.js"));
const { HW, Engine } = global.window;

const cpu = (id) => HW.cpus.find((x) => x.id === id) || fail("cpu", id);
const gpu = (id) => HW.gpus.find((x) => x.id === id) || fail("gpu", id);
function fail(kind, id) { throw new Error(`Unknown ${kind} id: ${id}`); }
const short = Engine.shortName;
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const BASE = { res: "1440p", quality: "high", workload: "general", upscale: "off", ram: 32, hz: 165, streaming: false };

function limitCell(r) {
  if (r.verdict.key === "excellent") return '<span class="dot" data-tone="excellent"></span>Balanced';
  return `<span class="dot" data-tone="${r.verdict.tone}"></span>${r.limiter.toUpperCase()} ${Math.round(r.pct)}%`;
}

// ---- Resolution example
function resExample() {
  const c = cpu("ryzen-5-3600"), g = gpu("rtx-4070-super");
  const rows = Object.entries(Engine.RES).map(([key, res]) => {
    const r = Engine.evaluate(c, g, { ...BASE, res: key });
    return `<tr><td>${res.full}</td><td class="r num">${fmt(r.cpuFps)}</td><td class="r num">${fmt(r.gpuFps)}</td><td class="r num">${fmt(r.fps)}</td><td>${limitCell(r)}</td></tr>`;
  });
  return `<div class="table-scroll"><table><thead><tr><th>Resolution</th><th class="r">CPU limit</th><th class="r">GPU limit</th><th class="r">Avg FPS</th><th>Bottleneck</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

// ---- Minimum CPU per GPU
const LADDER = [
  "ryzen-5-3600", "i5-10400f", "ryzen-5-5600", "i5-12400f", "i5-13400f", "ryzen-5-7600",
  "ryzen-7-5700x3d", "i5-14600k", "ryzen-7-7700x", "ryzen-7-7800x3d", "ryzen-7-9800x3d",
].map(cpu).sort((a, b) => a.g - b.g);

const TABLE_GPUS = [
  "rtx-5090", "rtx-5080", "rtx-5070-ti", "rx-9070-xt", "rtx-5070", "rx-9070", "rtx-4070-super",
  "rx-7800-xt", "rtx-5060-ti-16gb", "rx-9060-xt-16gb", "rtx-5060", "rtx-4060", "arc-b580", "rtx-3060-12gb",
].map(gpu);

function minCpu(g, res) {
  const ok = LADDER.find((c) => {
    const r = Engine.evaluate(c, g, { ...BASE, res });
    return r.limiter === "gpu" || r.pct < 10;
  });
  if (!ok) return "Ryzen 7 9800X3D <small>(still CPU-bound)</small>";
  return ok === LADDER[0] ? "Ryzen 5 3600+" : short(ok.name);
}

function minCpuTable() {
  const rows = TABLE_GPUS.map((g) =>
    `<tr><td><strong>${short(g.name)}</strong></td><td>${minCpu(g, "1080p")}</td><td>${minCpu(g, "1440p")}</td><td>${minCpu(g, "4k")}</td></tr>`);
  return `<div class="table-scroll"><table><thead><tr><th>Graphics card</th><th>1080p</th><th>1440p</th><th>4K</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

// ---- Popular combos
const COMBOS = [
  ["ryzen-7-7800x3d", "rtx-5070-ti", "1440p"],
  ["ryzen-7-9800x3d", "rtx-5090", "4k"],
  ["ryzen-7-9800x3d", "rtx-5080", "1440p"],
  ["ryzen-5-7600", "rtx-5070", "1440p"],
  ["ryzen-5-5600", "rtx-4060", "1080p"],
  ["i5-12400f", "rtx-5060", "1080p"],
  ["i5-13400f", "rtx-4070-super", "1440p"],
  ["i5-14600k", "rx-9070-xt", "1440p"],
  ["ryzen-7-5700x3d", "rx-9070", "1440p"],
  ["ryzen-5-3600", "rtx-3060-12gb", "1080p"],
  ["i7-14700k", "rtx-4070-ti-super", "1440p"],
  ["ultra-7-265k", "rtx-5070-ti", "1440p"],
  ["ryzen-7-5800x3d", "rtx-4080-super", "1440p"],
  ["ryzen-5-5600x", "rx-7800-xt", "1440p"],
  ["i5-12400f", "arc-b580", "1080p"],
  ["ryzen-7-9700x", "rx-9060-xt-16gb", "1080p"],
];

function combos() {
  const cards = COMBOS.map(([c, g, res]) => {
    const r = Engine.evaluate(cpu(c), gpu(g), { ...BASE, res });
    const label = r.verdict.key === "excellent" ? "Balanced" : `${r.limiter.toUpperCase()}-limited ${Math.round(r.pct)}%`;
    const href = `?cpu=${c}&amp;gpu=${g}${res !== BASE.res ? `&amp;res=${res}` : ""}#calculator`;
    return `<a class="combo-card" href="${href}"><b>${short(cpu(c).name)} + ${short(gpu(g).name)}</b><span>${Engine.RES[res].label} · <em data-tone="${r.verdict.tone}">${label}</em> · ≈${fmt(r.fps)} FPS</span></a>`;
  });
  return `<div class="combos">${cards.join("")}</div>`;
}

// ---- FAQ schema from the FAQ markup (single source of truth)
function faqSchema(html) {
  const faq = html.slice(html.indexOf('id="faq"'), html.indexOf("</section>", html.indexOf('id="faq"')));
  const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const items = [...faq.matchAll(/<summary>([\s\S]*?)<\/summary><div>([\s\S]*?)<\/div><\/details>/g)].map((m) => ({
    "@type": "Question", name: strip(m[1]), acceptedAnswer: { "@type": "Answer", text: strip(m[2]) },
  }));
  return `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items }, null, 2)}\n  </script>`;
}

// ---- Default result baked into the HTML: the first paint already matches the final
// layout (no layout shift while JS loads) and crawlers see a real result.
function prerenderDefault(html) {
  const o = Engine.DEFAULTS, c = cpu(o.cpu), g = gpu(o.gpu);
  const r = Engine.evaluate(c, g, o);
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const setText = (id, text) => {
    const re = new RegExp(`(<[^>]*\\bid="${id}"[^>]*>)[^<]*(<)`);
    if (!re.test(html)) throw new Error(`prerender: #${id} missing in index.html`);
    html = html.replace(re, (_, open, close) => open + esc(text) + close);
  };
  const setAttr = (id, attr, value) => {
    const re = new RegExp(`(<[^>]*\\bid="${id}")([^>]*>)`);
    if (!re.test(html)) throw new Error(`prerender: #${id} missing in index.html`);
    html = html.replace(re, (_, start, rest) => {
      rest = rest.replace(new RegExp(`\\s${attr}="[^"]*"`), "");
      return `${start} ${attr}="${esc(value)}"${rest}`;
    });
  };
  const limited = r.verdict.key !== "excellent";
  setAttr("cpu-input", "value", c.name);
  setAttr("gpu-input", "value", g.name);
  setText("cpu-meta", `${c.cores} cores / ${c.threads} threads · ${c.socket} · ${c.year}`);
  setText("gpu-meta", `${g.vram ? g.vram + " GB VRAM · " : "Shared memory · "}${g.rt ? "Ray tracing ✓" : "No hardware RT"} · ${g.year}`);
  setAttr("results", "data-tone", r.verdict.tone);
  setText("pct", Math.round(r.pct) + "%");
  setText("pct-label", limited ? `${r.limiter.toUpperCase()} bottleneck` : "bottleneck");
  setText("tone-pill", !limited ? "Balanced" : r.limiter === "cpu" ? "CPU-limited" : "GPU-limited");
  setText("verdict-title", r.verdict.label);
  setText("verdict-text", Engine.summary(c, g, r, o));
  setText("cap-cpu-val", fmt(r.cpuFps));
  setText("cap-gpu-val", fmt(r.gpuFps));
  setText("cap-hz-val", `${o.hz} Hz`);
  setText("s-fps", fmt(r.fps));
  setText("s-low", fmt(r.low1));
  setText("s-cpu", Math.round(r.cpuLoad));
  setText("s-gpu", Math.round(r.gpuLoad));
  setText("opt-summary", `${Engine.QUALITY[o.quality].label} · ${Engine.WORKLOAD[o.workload].short} · ${o.ram} GB · ${o.hz} Hz`);
  setText("context-line", `${Engine.RES[o.res].full} · ${Engine.QUALITY[o.quality].label} · ${Engine.WORKLOAD[o.workload].short}`);
  return html;
}

function inject(html, name, content) {
  const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
  if (!re.test(html)) throw new Error(`Marker ${name} missing`);
  return html.replace(re, `$1\n          ${content}\n          $2`);
}

const file = path.join(ROOT, "index.html");
let html = fs.readFileSync(file, "utf8");
html = inject(html, "RESEXAMPLE", resExample());
html = inject(html, "MINCPU", minCpuTable());
html = inject(html, "COMBOS", combos());
if (!html.includes("<!-- FAQSCHEMA:START -->")) {
  html = html.replace("</head>", "  <!-- FAQSCHEMA:START -->\n  <!-- FAQSCHEMA:END -->\n</head>");
}
html = inject(html, "FAQSCHEMA", faqSchema(html));
html = prerenderDefault(html);
html = html.replace(/https:\/\/www\.example\.com\//g, SITE_URL);
fs.writeFileSync(file, html);

// ---- Programmatic CPU + GPU pages (/bottleneck/...)
const buildPages = require("./combo-pages")({ ROOT, SITE_URL, HW, Engine });

// ---- FPS calculator page (/fps-calculator/)
const fpsPage = require("./fps-page")({ ROOT, SITE_URL, HW, Engine, inject, faqSchema });

// ---- Spanish + Japanese calculator pages (/es/, /ja/, and their FPS calculators)
const i18n = require("./i18n-pages")({ ROOT, SITE_URL, HW, Engine, faqSchema });

// ---- Guides (/guides/ and one page per guide)
const guidePages = require("./guides")({ ROOT, SITE_URL, HW, Engine, buildPages });

// ---- GPU vs GPU and CPU vs CPU comparisons (/compare/ and one page per pair)
const comparePages = require("./compare-pages")({ ROOT, SITE_URL, HW, Engine, buildPages });

// ---- Mac gaming calculator + one page per Apple Silicon Mac (/mac/...)
const macPages = require("./mac-pages")({ ROOT, SITE_URL, HW, Engine, faqSchema });

// ---- Trust pages (hand-written; only the domain placeholder is filled in)
const TRUST_PAGES = ["about/", "editorial-policy/", "privacy/", "contact/"];
const host = new URL(SITE_URL).hostname.replace(/^www\./, "");
for (const loc of TRUST_PAGES) {
  const f = path.join(ROOT, loc, "index.html");
  fs.writeFileSync(f, fs.readFileSync(f, "utf8")
    .replace(/https:\/\/www\.example\.com\//g, SITE_URL)
    .replace(/@example\.com\b/g, `@${host}`));
}

// ---- One shared header on every hand-written page (generated pages call layout.header directly)
const layout = require("./layout");
for (const [loc, root, current] of [
  ["index.html", "", "calculator"],
  ["fps-calculator/index.html", "../", "fps"],
  ...TRUST_PAGES.map((t) => [`${t}index.html`, "../", ""]),
  ["404.html", "/", ""],
]) {
  const f = path.join(ROOT, loc);
  fs.writeFileSync(f, layout.stampFooter(layout.stampHeader(fs.readFileSync(f, "utf8"), root, current), root));
}

const today = new Date().toISOString().slice(0, 10);
const hreflang = (loc) => (i18n.alternates(loc) || []).map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`).join("");
const sitemapUrl = (loc, freq, priority) => `  <url><loc>${SITE_URL}${loc}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority>${hreflang(loc)}</url>\n`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  sitemapUrl("", "weekly", "1.0") +
  sitemapUrl(fpsPage, "weekly", "0.9") +
  i18n.pages.map((loc) => sitemapUrl(loc, "weekly", "0.9")).join("") +
  buildPages.map((loc, i) => sitemapUrl(loc, "monthly", i ? "0.6" : "0.8")).join("") +
  guidePages.map((loc, i) => sitemapUrl(loc, "monthly", i ? "0.7" : "0.8")).join("") +
  comparePages.map((loc, i) => sitemapUrl(loc, "monthly", i ? "0.6" : "0.7")).join("") +
  macPages.map((loc, i) => sitemapUrl(loc, "monthly", i ? "0.6" : "0.8")).join("") +
  TRUST_PAGES.map((loc) => sitemapUrl(loc, "yearly", "0.3")).join("") +
  `</urlset>\n`);
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);

console.log(`Built index.html (${HW.cpus.length} CPUs, ${HW.gpus.length} GPUs), ${buildPages.length - 1} build pages + index in bottleneck/, ${guidePages.length - 1} guides + hub in guides/, ${macPages.length - 1} Mac pages + calculator in mac/, ${TRUST_PAGES.length} trust pages, ${fpsPage}, ${i18n.pages.join(", ")}, sitemap.xml, robots.txt for ${SITE_URL}`);
