/*
 * Head-to-head comparison pages: /compare/<a>-vs-<b>/ for curated GPU and CPU
 * pairs people actually search for ("4090 vs 5080", "7800x3d vs 9800x3d"),
 * plus the /compare/ hub. Every number and every sentence that makes a claim
 * is computed from engine.js + hardware.js, so the pages agree with the
 * calculator. GPUs are tested with a Ryzen 7 9800X3D, CPUs with an RTX 5090.
 * Called from build.js; returns the generated URLs for the sitemap.
 */
const fs = require("fs");
const path = require("path");

// Curated pairs. The order written here doesn't matter: each pair is normalised
// (newer part first; same year → stronger first) so URLs never flip.
const GPU_PAIRS = [
  // NVIDIA, new generation vs previous
  ["rtx-5090", "rtx-4090"], ["rtx-5080", "rtx-4090"], ["rtx-5080", "rtx-4080-super"], ["rtx-5080", "rtx-4080"],
  ["rtx-5070-ti", "rtx-4070-ti-super"], ["rtx-5070-ti", "rtx-4080-super"], ["rtx-5070-ti", "rtx-4070-ti"],
  ["rtx-5070", "rtx-4070-super"], ["rtx-5070", "rtx-4070"], ["rtx-5070", "rtx-4070-ti"],
  ["rtx-5060-ti-16gb", "rtx-4060-ti-16gb"], ["rtx-5060-ti-8gb", "rtx-4060-ti-8gb"], ["rtx-5060", "rtx-4060"],
  ["rtx-5060", "rtx-3060-12gb"], ["rtx-5050", "rtx-3050-8gb"], ["rtx-5050", "rtx-4060"],
  ["rtx-4090", "rtx-3090-ti"], ["rtx-4080", "rtx-3090"], ["rtx-4070", "rtx-3080"], ["rtx-4070-super", "rtx-3080"],
  ["rtx-4060", "rtx-3060-12gb"], ["rtx-4060-ti-8gb", "rtx-3060-ti"], ["rtx-4060-ti-8gb", "rtx-3070"],
  ["rtx-3070", "rtx-2080-ti"], ["rtx-3060-12gb", "rtx-2060"],
  // NVIDIA, same generation
  ["rtx-5090", "rtx-5080"], ["rtx-5080", "rtx-5070-ti"], ["rtx-5070-ti", "rtx-5070"], ["rtx-5070", "rtx-5060-ti-16gb"],
  ["rtx-5060-ti-16gb", "rtx-5060-ti-8gb"], ["rtx-5060-ti-16gb", "rtx-5060"],
  ["rtx-4080-super", "rtx-4080"], ["rtx-4070-ti-super", "rtx-4070-super"], ["rtx-4070-super", "rtx-4070"],
  ["rtx-4060-ti-16gb", "rtx-4060-ti-8gb"], ["rtx-4060-ti-8gb", "rtx-4060"],
  ["rtx-3080", "rtx-3070"], ["rtx-3070", "rtx-3060-ti"], ["rtx-3060-ti", "rtx-3060-12gb"],
  // AMD
  ["rx-9070-xt", "rx-9070"], ["rx-9070-xt", "rx-7900-xtx"], ["rx-9070-xt", "rx-7900-xt"], ["rx-9070", "rx-7900-gre"],
  ["rx-9070", "rx-7800-xt"], ["rx-9060-xt-16gb", "rx-9060-xt-8gb"], ["rx-9060-xt-16gb", "rx-7600-xt"], ["rx-9060-xt-8gb", "rx-7600"],
  ["rx-7900-xtx", "rx-7900-xt"], ["rx-7800-xt", "rx-6800-xt"], ["rx-7800-xt", "rx-7700-xt"], ["rx-7700-xt", "rx-6700-xt"],
  ["rx-7600", "rx-6650-xt"],
  // NVIDIA vs AMD
  ["rtx-5070-ti", "rx-9070-xt"], ["rtx-5070", "rx-9070"], ["rtx-5070", "rx-9070-xt"], ["rtx-5080", "rx-9070-xt"],
  ["rtx-5060-ti-16gb", "rx-9060-xt-16gb"], ["rtx-5060", "rx-9060-xt-8gb"], ["rtx-4080-super", "rx-7900-xtx"],
  ["rtx-4090", "rx-7900-xtx"], ["rtx-4070-ti-super", "rx-7900-xt"], ["rtx-4070-super", "rx-7900-gre"],
  ["rtx-4070-super", "rx-7800-xt"], ["rtx-4070", "rx-7800-xt"], ["rtx-4060-ti-8gb", "rx-7700-xt"], ["rtx-4060", "rx-7600"],
  ["rtx-3060-12gb", "rx-6600"], ["rtx-3070", "rx-6700-xt"], ["rtx-3080", "rx-6800-xt"], ["rx-9070-xt", "rtx-4080-super"],
  // Intel Arc
  ["arc-b580", "rtx-4060"], ["arc-b580", "rtx-5060"], ["arc-b580", "rx-7600"], ["arc-b580", "rtx-3060-12gb"],
  ["arc-b570", "arc-b580"], ["arc-b580", "arc-a770-16gb"], ["arc-b570", "rx-7600"], ["arc-a750", "rx-6600"],
  // Upgrades from older cards
  ["rtx-5070", "rtx-3080"], ["rtx-5070-ti", "rtx-3080"], ["rtx-5060-ti-16gb", "rtx-3070"], ["rx-9060-xt-16gb", "rx-6700-xt"],
  ["rx-9070-xt", "rx-6800-xt"], ["rtx-4060", "gtx-1660-super"], ["rtx-3060-12gb", "gtx-1080-ti"],
];

const CPU_PAIRS = [
  // High end and X3D
  ["ryzen-7-9800x3d", "ryzen-7-7800x3d"], ["ryzen-7-9850x3d", "ryzen-7-9800x3d"], ["ryzen-9-9950x3d", "ryzen-7-9800x3d"],
  ["ryzen-9-9900x3d", "ryzen-7-9800x3d"], ["ryzen-7-9800x3d", "ryzen-9-7950x3d"], ["ryzen-9-9950x3d", "ryzen-9-7950x3d"],
  ["ryzen-7-9800x3d", "i9-14900k"], ["ryzen-7-9800x3d", "ultra-9-285k"], ["ryzen-7-7800x3d", "i9-14900k"],
  ["ryzen-7-7800x3d", "i7-14700k"], ["ryzen-7-7800x3d", "i5-14600k"], ["ryzen-7-7800x3d", "ryzen-7-7700x"],
  ["ryzen-7-7800x3d", "ryzen-7-5800x3d"], ["ryzen-7-7800x3d", "ryzen-7-9700x"], ["ryzen-5-7600x3d", "ryzen-7-7800x3d"],
  // AM4
  ["ryzen-7-5700x3d", "ryzen-7-5800x3d"], ["ryzen-5-5600x3d", "ryzen-7-5800x3d"], ["ryzen-7-5700x3d", "ryzen-5-5600x3d"],
  ["ryzen-7-5800x3d", "ryzen-7-5800x"], ["ryzen-7-5800x3d", "i9-12900k"], ["ryzen-7-5700x3d", "ryzen-5-5600"],
  ["ryzen-7-5700x", "ryzen-7-5800x"], ["ryzen-5-5600", "ryzen-5-5600x"], ["ryzen-5-5600", "ryzen-5-3600"],
  ["ryzen-5-5600", "ryzen-5-5500"], ["ryzen-5-5600", "i5-12400f"], ["i5-10400f", "ryzen-5-3600"],
  // AM5 mainstream
  ["ryzen-5-7600", "i5-13400f"], ["ryzen-5-7600", "ryzen-5-7600x"], ["ryzen-5-7600", "ryzen-5-5600"],
  ["ryzen-5-7600", "i5-12400f"], ["ryzen-5-7500f", "ryzen-5-7600"], ["ryzen-5-9600x", "ryzen-5-7600x"],
  ["ryzen-5-9600x", "ryzen-5-7600"], ["ryzen-7-9700x", "ryzen-7-7700x"], ["ryzen-7-9700x", "i7-14700k"],
  ["ryzen-7-5700x3d", "ryzen-5-7600"],
  // Intel
  ["ultra-7-265k", "ryzen-7-9700x"], ["ultra-7-265k", "i7-14700k"], ["ultra-9-285k", "i9-14900k"],
  ["ultra-9-285k", "ryzen-9-9950x"], ["ultra-5-245k", "i5-14600k"], ["ultra-5-245k", "ryzen-5-9600x"],
  ["i5-14600k", "i5-13600k"], ["i5-14600k", "ryzen-5-7600x"], ["i9-14900k", "i7-14700k"], ["i7-14700k", "i7-13700k"],
  ["i5-13600k", "i5-12600k"], ["i5-14400f", "i5-13400f"], ["i5-13400f", "i5-12400f"], ["i5-12400f", "i5-10400f"],
];

// Fixed reference parts and the "common" ladders used for the CPU-needed / GPU-driven answers.
const REF_CPU = "ryzen-7-9800x3d";
const REF_GPU = "rtx-5090";
const CPU_LADDER = [
  "ryzen-5-3600", "i5-10400f", "ryzen-5-5600", "i5-12400f", "i5-13400f", "ryzen-7-5700x3d", "ryzen-5-7600",
  "ryzen-7-7700x", "i5-14600k", "ryzen-7-7800x3d", "ryzen-7-9800x3d", "ryzen-7-9850x3d",
];
const GPU_LADDER = [
  "rtx-3060-12gb", "rtx-4060", "arc-b580", "rtx-5060", "rx-9060-xt-16gb", "rtx-5060-ti-16gb", "rtx-4070",
  "rx-7800-xt", "rtx-4070-super", "rtx-5070", "rx-9070", "rtx-4070-ti-super", "rx-9070-xt", "rtx-5070-ti",
  "rtx-4080-super", "rx-7900-xtx", "rtx-5080", "rtx-4090", "rtx-5090",
];
// Preferred partners when linking to existing /bottleneck/ build pages.
const BUILD_CPUS = ["ryzen-7-9800x3d", "ryzen-7-7800x3d", "ryzen-5-7600", "i5-14600k", "ryzen-7-5700x3d", "ultra-7-265k", "i5-13400f", "i5-12400f", "ryzen-5-5600", "ryzen-5-3600"];
const BUILD_GPUS = ["rtx-5070-ti", "rtx-5070", "rx-9070-xt", "rtx-5080", "rtx-4070-super", "rtx-5060-ti-16gb", "rtx-5090", "rx-9060-xt-16gb", "rtx-4060", "rtx-5060", "rtx-3060-12gb"];

const layout = require("./layout");

module.exports = function buildComparePages({ ROOT, SITE_URL, HW, Engine, buildPages }) {
  const short = Engine.shortName;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const find = (list, id) => list.find((x) => x.id === id) || (() => { throw new Error(`compare: unknown part id ${id}`); })();
  const { cpu: _c, gpu: _g, ...BASE } = Engine.DEFAULTS;
  const builds = new Set(buildPages);
  const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const pick = (seed, list) => list[hash(seed) % list.length];
  const o = (res, workload = "general") => ({ ...BASE, res, workload });
  // Lead of x over y in whole percent.
  const gap = (x, y) => Math.round((Math.max(x, y) / Math.min(x, y) - 1) * 100);
  // Bare model name for tight spots: "RTX 4090" → "4090", "Core Ultra 7 265K" → "265K".
  const tiny = (p) => short(p.name).replace(/^(RTX|RX|GTX|Arc|Core)\s+/, "").replace(/^(Ryzen|Ultra)\s+\d\s+/, "");
  const x3d = (p) => /X3D/.test(p.name);
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  const refCpu = find(HW.cpus, REF_CPU);
  const refGpu = find(HW.gpus, REF_GPU);
  const cpuLadder = CPU_LADDER.map((id) => find(HW.cpus, id)).sort((a, b) => a.g - b.g);
  const gpuLadder = GPU_LADDER.map((id) => find(HW.gpus, id)).sort((a, b) => a.g - b.g);
  const fed = (r) => r.limiter === "gpu" || r.pct < 10;

  // Slowest common CPU that keeps this GPU under a 10% bottleneck at 1440p.
  function needCpu(gpu) {
    const c = cpuLadder.find((x) => fed(Engine.evaluate(x, gpu, o("1440p"))));
    return c ? { part: c, first: c === cpuLadder[0], r: Engine.evaluate(c, gpu, o("1440p")) } : null;
  }
  // Strongest common GPU this CPU keeps under a 10% CPU bottleneck at 1440p.
  function driveGpu(cpu) {
    const g = [...gpuLadder].reverse().find((x) => fed(Engine.evaluate(cpu, x, o("1440p"))));
    return g ? { part: g, r: Engine.evaluate(cpu, g, o("1440p")) } : null;
  }

  // ---- Pair normalisation: newer first, then stronger, then id. Fails on duplicates.
  function normalise(list, parts, kind) {
    const seen = new Set();
    return list.map(([x, y]) => {
      let a = find(parts, x), b = find(parts, y);
      if (a.type !== "d" || b.type !== "d") throw new Error(`compare: ${kind} pair ${x}/${y} is not desktop-only`);
      if (a === b) throw new Error(`compare: ${kind} pair compares ${x} with itself`);
      if (b.year > a.year || (b.year === a.year && (b.g > a.g || (b.g === a.g && b.id < a.id)))) [a, b] = [b, a];
      const slug = `${a.id}-vs-${b.id}`;
      if (seen.has(slug)) throw new Error(`compare: duplicate ${kind} pair ${slug}`);
      seen.add(slug);
      return { kind, a, b, slug };
    });
  }
  const gpuPairs = normalise(GPU_PAIRS, HW.gpus, "gpu").map(gpuData);
  const cpuPairs = normalise(CPU_PAIRS, HW.cpus, "cpu").map(cpuData);
  const all = [...gpuPairs, ...cpuPairs];

  // ---- Numbers per pair
  function gpuData(p) {
    const ev = (g, res, wl) => Engine.evaluate(refCpu, g, o(res, wl));
    p.rows = [
      ["1080p", "1080p High", "general"], ["1440p", "1440p High", "general"], ["4k", "4K High", "general"],
      ["1440p", "1440p ray tracing", "raytracing"],
    ].map(([res, label, wl]) => ({ res, label, wl, a: ev(p.a, res, wl), b: ev(p.b, res, wl) }));
    const [r1080, r1440, r4k, rt] = p.rows;
    Object.assign(p, { r1080, r1440, r4k, rt });
    p.metrics = [
      { title: "1440p, AAA games", a: r1440.a.fps, b: r1440.b.fps },
      { title: "4K, AAA games", a: r4k.a.fps, b: r4k.b.fps },
      { title: "1440p, ray tracing", a: rt.a.fps, b: rt.b.fps },
    ];
    // The headline winner is decided at 4K, where the CPU can't mask the difference.
    p.aWins = r4k.a.fps >= r4k.b.fps;
    p.gap = gap(r4k.a.fps, r4k.b.fps);
    p.need = { a: needCpu(p.a), b: needCpu(p.b) };
    p.cardText = p.gap < 3 ? "Within 3% at 4K" : `${short((p.aWins ? p.a : p.b).name)} is ${p.gap}% faster at 4K`;
    return p;
  }

  function cpuData(p) {
    const ev = (c, res, wl) => Engine.evaluate(c, refGpu, o(res, wl));
    p.rows = [
      ["1080p", "1080p High, AAA", "general"], ["1440p", "1440p High, AAA", "general"],
      ["1080p", "1080p esports", "esports"], ["1440p", "1440p CPU-heavy", "cpuheavy"],
    ].map(([res, label, wl]) => ({ res, label, wl, a: ev(p.a, res, wl), b: ev(p.b, res, wl) }));
    const [r1080, r1440, es, ch] = p.rows;
    Object.assign(p, { r1080, r1440, es, ch });
    p.metrics = [
      { title: "AAA games, 1080p", a: r1080.a.fps, b: r1080.b.fps },
      { title: "Esports, 1080p", a: es.a.fps, b: es.b.fps },
      { title: "CPU-heavy games, 1440p", a: ch.a.fps, b: ch.b.fps },
    ];
    p.aWins = r1080.a.fps >= r1080.b.fps;
    p.gap = gap(r1080.a.fps, r1080.b.fps);
    p.drive = { a: driveGpu(p.a), b: driveGpu(p.b) };
    p.cardText = p.gap < 3 ? "Within 3% at 1080p" : `${short((p.aWins ? p.a : p.b).name)} is ${p.gap}% faster at 1080p`;
    return p;
  }

  // ---- Intro length: every priority-0 sentence, then optional ones (lowest
  // priority number first) while the paragraph stays within ~120–180 words.
  const words = (t) => t.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  function fit(list) {
    let total = list.filter((x) => x.pri === 0).reduce((n, x) => n + words(x.text), 0);
    const keep = new Set(list.filter((x) => x.pri === 0));
    for (const x of list.filter((y) => y.pri > 0).sort((a, b) => a.pri - b.pri)) {
      if (total + words(x.text) <= 178) { keep.add(x); total += words(x.text); }
    }
    return list.filter((x) => keep.has(x)).map((x) => x.text).join(" ");
  }

  // ---- Copy: GPU intro
  function trend(from, to) {
    if (to > from + 2) return `grows to ${to}% at 4K`;
    if (to < from - 2) return `narrows to ${to}% at 4K`;
    return "is about the same at 4K";
  }

  function gpuIntro(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const W = p.aWins ? p.a : p.b, L = p.aWins ? p.b : p.a;
    const w = short(W.name), l = short(L.name);
    const side = (row, part) => (part === p.a ? row.a : row.b);
    const fw = fmt(side(p.r1440, W).fps), fl = fmt(side(p.r1440, L).fps);
    const g4 = p.gap, g14 = gap(p.r1440.a.fps, p.r1440.b.fps), g10 = gap(p.r1080.a.fps, p.r1080.b.fps);
    const out = [];
    const add = (pri, text) => out.push({ pri, text }); // [priority, sentence]; 0 = always shown
    const s = p.slug;

    if (g4 < 4) {
      add(0, pick(s, [
        `The ${A} and ${B} are effectively tied: at 1440p High they average ${fmt(p.r1440.a.fps)} and ${fmt(p.r1440.b.fps)} FPS in AAA games with a Ryzen 7 9800X3D, and at 4K the gap is just ${g4}%.`,
        `There is almost nothing between the ${A} and ${B}. Paired with a Ryzen 7 9800X3D, our model puts them at ${fmt(p.r1440.a.fps)} vs ${fmt(p.r1440.b.fps)} FPS at 1440p High, and within ${g4}% of each other at 4K.`,
      ]));
    } else if (g4 < 12) {
      add(0, pick(s, [
        `The ${w} edges out the ${l} by ${g4}% at 4K and ${g14}% at 1440p, where it averages ${fw} FPS to ${fl} in AAA games at High settings with a Ryzen 7 9800X3D.`,
        `Expect a small but real lead for the ${w}: ${fw} FPS at 1440p High against ${fl} for the ${l} with a Ryzen 7 9800X3D, a ${g14}% gap that ${trend(g14, g4)}.`,
      ]));
    } else if (g4 < 30) {
      add(0, pick(s, [
        `The ${w} is clearly the faster card: ${g4}% ahead of the ${l} at 4K and ${g14}% at 1440p, where it averages ${fw} FPS to ${fl} in AAA games at High settings with a Ryzen 7 9800X3D.`,
        `With a Ryzen 7 9800X3D at 1440p High, the ${w} averages ${fw} FPS in AAA games to the ${l}'s ${fl}. That ${g14}% lead ${trend(g14, g4)}.`,
      ]));
    } else {
      add(0, pick(s, [
        `This is not a close contest. The ${w} is ${g4}% faster than the ${l} at 4K and ${g14}% faster at 1440p: ${fw} vs ${fl} FPS in AAA games at High settings with a Ryzen 7 9800X3D.`,
        `The ${w} sits in a higher performance class: ${fw} FPS at 1440p High against ${fl} for the ${l} with a Ryzen 7 9800X3D, and a ${g4}% lead at 4K.`,
      ]));
    }

    // Context: generation or brand
    const years = p.a.year - p.b.year;
    if (g4 >= 4 && years > 0 && !p.aWins) {
      add(3, `Newer isn't faster here: the ${B} came out ${plural(years, "year")} before the ${A} and still leads in raster performance.`);
    } else if (g4 >= 4 && years > 0 && p.a.brand === p.b.brand) {
      add(3, `For a card ${plural(years, "year")} newer, that is ${g4 >= 25 ? "a big" : g4 >= 12 ? "a solid" : "a modest"} generational step.`);
    } else if (p.a.brand !== p.b.brand) {
      add(3, years === 0
        ? `Both launched in ${p.a.year}, so this is a straight ${p.a.brand} vs ${p.b.brand} fight for the same buyers.`
        : `It's a cross-brand matchup: ${p.a.brand}'s ${p.a.year} card against ${p.b.brand}'s ${p.b.year} card.`);
    }

    // Resolution behaviour
    const w1080 = side(p.r1080, W);
    if (g4 >= 4 && w1080.limiter === "cpu" && w1080.pct >= 10 && g10 < g4 - 3) {
      add(0, `At 1080p the lead shrinks to ${g10}%, because even a 9800X3D can't feed the ${w} fast enough there, so it earns its keep at 1440p and 4K.`);
    } else if (g4 >= 4) {
      add(0, `The order holds at 1080p (${g10}% apart), so the ${w} is the quicker card at every resolution.`);
    } else {
      add(0, `At 1080p they're ${g10 < 2 ? "level" : `${g10}% apart`} too.`);
    }

    // Ray tracing
    const rtA = p.rt.a.fps, rtB = p.rt.b.fps, gRt = gap(rtA, rtB);
    const rtW = rtA >= rtB ? p.a : p.b, rtL = rtW === p.a ? p.b : p.a;
    const rtWhy = rtL.rt < rtW.rt ? `the ${short(rtL.name)}'s RT hardware is less efficient`
      : rtL.vram < rtW.vram ? "ray tracing needs extra VRAM"
      : "RT is so demanding that the graphics card alone sets the pace";
    if (rtL.rt === 0 && gRt >= 3) {
      add(0, `The ${short(rtL.name)} has no ray tracing hardware, so with RT on at 1440p it drops to ${fmt(Math.min(rtA, rtB))} FPS against ${fmt(Math.max(rtA, rtB))} for the ${short(rtW.name)}.`);
    } else if (g4 >= 4 && rtW !== W && gRt >= 3) {
      add(0, `Turn on ray tracing and the order flips: the ${short(rtW.name)} leads ${fmt(Math.max(rtA, rtB))} to ${fmt(Math.min(rtA, rtB))} FPS at 1440p, because ${rtWhy}.`);
    } else if (gRt >= Math.max(g14, 3) + 8) {
      add(0, `Ray tracing widens the gap to ${gRt}% (${fmt(Math.max(rtA, rtB))} vs ${fmt(Math.min(rtA, rtB))} FPS at 1440p), as ${rtWhy}.`);
    } else {
      const low = Math.min(rtA, rtB) < 60;
      add(0, `With ray tracing on at 1440p they manage ${fmt(rtA)} and ${fmt(rtB)} FPS respectively${low ? ", so plan on DLSS, FSR or XeSS upscaling" : ""}.`);
    }

    // Esports and 4K upscaling
    const esA = Engine.evaluate(refCpu, p.a, o("1080p", "esports")), esB = Engine.evaluate(refCpu, p.b, o("1080p", "esports"));
    const esLow = Math.min(esA.fps, esB.fps);
    add(4, `In esports games like CS2 or Valorant at 1080p they reach ${fmt(esA.fps)} and ${fmt(esB.fps)} FPS, ${esLow >= 360 ? "so either can feed a 360 Hz monitor" : esLow >= 240 ? "enough for a 240 Hz monitor" : esLow >= 144 ? "enough for a 144 Hz monitor" : "so lower settings help on a high-refresh monitor"}.`);
    const slow4k = p.r4k.a.fps <= p.r4k.b.fps ? p.a : p.b;
    const native4k = Math.min(p.r4k.a.fps, p.r4k.b.fps);
    if (native4k >= 60) {
      add(3, `At 4K High the ${A} averages ${fmt(p.r4k.a.fps)} FPS and the ${B} ${fmt(p.r4k.b.fps)}, both playable without upscaling.`);
    } else {
      const up = Engine.evaluate(refCpu, slow4k, { ...o("4k"), upscale: "quality" });
      add(5, `At 4K the ${short(slow4k.name)} manages ${fmt(native4k)} FPS native, and ${/RTX/.test(slow4k.name) ? "DLSS" : slow4k.brand === "Intel" ? "XeSS" : "FSR"} Quality lifts that to about ${fmt(up.fps)}.`);
    }

    // VRAM
    const need1440 = p.r1440.a.vramNeed, need4k = p.r4k.a.vramNeed;
    const tight = (v) => v < need1440 ? "already tight at 1440p High in new games" : v < need4k ? `short of the ~${Math.round(need4k)} GB that 4K High needs` : "";
    if (p.a.vram !== p.b.vram) {
      const more = p.a.vram > p.b.vram ? p.a : p.b, less = more === p.a ? p.b : p.a;
      const t = tight(less.vram);
      add(1, `The ${short(more.name)} also has more memory (${more.vram} GB vs ${less.vram} GB)${t ? `, and ${less.vram} GB is ${t}` : ", though both have enough for 4K High today"}.`);
    } else {
      const t = tight(p.a.vram);
      add(1, `Both carry ${p.a.vram} GB of VRAM, ${t ? `which is ${t}` : "enough for 4K High"}.`);
    }

    if (g4 < 4) add(0, "With frame rates this close, price and the features you value should decide, not benchmarks.");

    // CPU needed
    const na = p.need.a, nb = p.need.b;
    if (na && nb && na.part === nb.part) {
      add(2, `To stay under a 10% CPU bottleneck at 1440p, both need ${na.first ? "only a Ryzen 5 3600-class CPU" : `a ${short(na.part.name)} or faster`}.`);
    } else if (na && nb) {
      const cpuName = (n) => n.first ? "a Ryzen 5 3600-class chip" : `a ${short(n.part.name)}`;
      add(2, `To stay under a 10% CPU bottleneck at 1440p, the ${A} needs ${cpuName(na)} and the ${B} ${cpuName(nb)}.`);
    }
    return fit(out);
  }

  // ---- Copy: CPU intro
  function cpuIntro(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const W = p.aWins ? p.a : p.b, L = p.aWins ? p.b : p.a;
    const w = short(W.name), l = short(L.name);
    const side = (row, part) => (part === p.a ? row.a : row.b);
    const fw = fmt(side(p.r1080, W).fps), fl = fmt(side(p.r1080, L).fps);
    const g = p.gap, g14 = gap(p.r1440.a.fps, p.r1440.b.fps);
    const s = p.slug;
    const out = [];
    const add = (pri, text) => out.push({ pri, text }); // [priority, sentence]; 0 = always shown

    if (g < 4) {
      add(0, pick(s, [
        `The ${A} and ${B} are neck and neck in games: paired with an RTX 5090 at 1080p High they average ${fmt(p.r1080.a.fps)} and ${fmt(p.r1080.b.fps)} FPS in AAA titles, a ${g}% difference.`,
        `You won't feel a difference between the ${A} and ${B} in most games. With an RTX 5090 at 1080p High, our model has them at ${fmt(p.r1080.a.fps)} vs ${fmt(p.r1080.b.fps)} FPS.`,
      ]));
    } else if (g < 10) {
      add(0, pick(s, [
        `The ${w} is slightly faster for gaming: ${fw} vs ${fl} FPS in AAA games at 1080p High with an RTX 5090, a ${g}% lead over the ${l}.`,
        `With an RTX 5090 taking the graphics card out of the equation, the ${w} averages ${fw} FPS at 1080p High to the ${l}'s ${fl}, ${g}% more.`,
      ]));
    } else if (g < 25) {
      add(0, pick(s, [
        `The ${w} is the stronger gaming CPU, running ${g}% faster than the ${l} at 1080p with an RTX 5090 (${fw} vs ${fl} FPS in AAA games at High settings).`,
        `Paired with an RTX 5090 at 1080p High, the ${w} pushes ${fw} FPS in AAA games against ${fl} for the ${l}, a clear ${g}% advantage.`,
      ]));
    } else {
      add(0, pick(s, [
        `The ${w} is in a different league: ${g}% faster than the ${l} at 1080p with an RTX 5090, or ${fw} vs ${fl} FPS in AAA games at High settings.`,
        `There's a big gap here. With an RTX 5090 at 1080p High the ${w} averages ${fw} FPS in AAA games and the ${l} only ${fl}, so the ${w} is ${g}% faster.`,
      ]));
    }

    // Context
    const years = p.a.year - p.b.year;
    if (g >= 4 && years > 0 && !p.aWins) {
      add(3, `Newer isn't faster here: the ${B} is ${plural(years, "year")} older and still wins in games.`);
    } else if (x3d(W) && !x3d(L) && g >= 4) {
      add(3, `The ${w}'s 3D V-Cache is the reason: the extra L3 cache keeps more game data close to the cores.`);
    } else if (p.a.brand !== p.b.brand) {
      add(3, `It's a direct AMD vs Intel matchup${years === 0 ? ` between two ${p.a.year} chips` : ""}.`);
    }

    // 1440p
    if (g >= 4 && g14 < g - 2) {
      add(0, `At 1440p the gap narrows to ${g14}% as the RTX 5090 starts to set the pace; with a mid-range card it would shrink further.`);
    } else if (g >= 4) {
      add(0, `The gap holds at 1440p (${g14}%) because even there the CPU, not the RTX 5090, sets the frame rate.`);
    }

    // Esports + CPU-heavy
    add(0, `In esports games like CS2 it's ${fmt(p.es.a.fps)} vs ${fmt(p.es.b.fps)} FPS, and in CPU-heavy titles such as Microsoft Flight Simulator ${fmt(p.ch.a.fps)} vs ${fmt(p.ch.b.fps)} FPS at 1440p.`);

    // Smoothness and a typical GPU
    const la = p.r1080.a.low1, lb = p.r1080.b.low1;
    add(4, `1% lows, which decide how smooth a game feels, come in at ${fmt(la)} vs ${fmt(lb)} FPS${x3d(p.a) !== x3d(p.b) ? `, helped by the ${short((x3d(p.a) ? p.a : p.b).name)}'s large cache` : ""}.`);
    const mid = find(HW.gpus, "rtx-5070");
    const ma = Engine.evaluate(p.a, mid, o("1440p")), mb = Engine.evaluate(p.b, mid, o("1440p"));
    const gm = gap(ma.fps, mb.fps);
    add(2, `With a more typical RTX 5070 at 1440p they land at ${fmt(ma.fps)} and ${fmt(mb.fps)} FPS${gm < 2 ? ", effectively the same" : `, ${gm}% apart`}.`);

    // Platform and cores
    if (p.a.socket === p.b.socket) {
      add(0, `Both use ${p.a.socket}, so moving from one to the other is a drop-in swap${/^AM/.test(p.a.socket) ? " after a BIOS update" : ""}.`);
    } else {
      add(0, `The ${A} sits on ${p.a.socket} and the ${B} on ${p.b.socket}, so switching means a new motherboard.`);
    }
    if (g < 4) add(0, "With gaming performance this close, the price of the chip, the motherboard and the cooler matters more than the benchmark.");
    if (p.a.threads === p.b.threads) add(5, `Both have ${p.a.cores} cores and ${p.a.threads} threads.`);
    if (p.a.threads !== p.b.threads) {
      const more = p.a.threads > p.b.threads ? p.a : p.b, less = more === p.a ? p.b : p.a;
      add(5, `The ${short(more.name)} has more threads (${more.threads} vs ${less.threads}), which helps streaming and productivity more than gaming.`);
    }

    // GPU it can drive
    const da = p.drive.a, db = p.drive.b;
    if (da && db && da.part === db.part) {
      add(6, `Both keep up with GPUs up to the ${short(da.part.name)} at 1440p.`);
    } else if (da && db) {
      add(6, `Under a 10% CPU bottleneck at 1440p, the ${A} can drive up to the ${short(da.part.name)} and the ${B} up to the ${short(db.part.name)}.`);
    }
    return fit(out);
  }

  // ---- Which should you buy?
  function upgradeLine(p, W, L, gUp, res) {
    if (W.year < L.year) return `Already own the ${short(L.name)}? The ${short(W.name)} is only ${gUp}% faster at ${res} and is older hardware, so switching is rarely worth it.`;
    if (W.year === L.year && p.kind === "gpu" && W.brand !== L.brand) return "";
    const worth = gUp >= 25 ? "a worthwhile upgrade" : gUp >= 12 ? `a modest upgrade, worth it mainly if you can sell the ${short(L.name)}` : "too small to justify replacing it";
    const platform = p.kind === "cpu" ? (W.socket === L.socket ? " It drops into the same motherboard." : ` It also needs a new ${W.socket} motherboard.`) : "";
    return `Already own the ${short(L.name)}? Going to the ${short(W.name)} gains ${gUp}% at ${res}, which is ${worth}.${platform}`;
  }

  function verdictGpu(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const W = p.aWins ? p.a : p.b, L = p.aWins ? p.b : p.a;
    const g14 = gap(p.r1440.a.fps, p.r1440.b.fps), gRt = gap(p.rt.a.fps, p.rt.b.fps);
    const rtW = p.rt.a.fps >= p.rt.b.fps ? p.a : p.b;
    let summary;
    if (p.gap < 4) {
      summary = `On raster performance this is a coin toss, so buy whichever is cheaper where you shop.` +
        (gRt >= 5 ? ` If you play with ray tracing, the ${short(rtW.name)} is the safer pick (${gRt}% faster with RT at 1440p).` : "") +
        (p.a.vram !== p.b.vram ? ` At the same price, take the ${short((p.a.vram > p.b.vram ? p.a : p.b).name)} for its extra VRAM.` : "");
    } else {
      summary = `Buy the ${short(W.name)} if you want the faster card: it's ${p.gap}% ahead at 4K. The ${short(L.name)} is the better buy only if it costs at least ${Math.max(g14, 3)}% less, the gap at 1440p, because then it delivers more frames per dollar.` +
        (rtW !== W && gRt >= 3 ? ` Ray tracing is the exception: there the ${short(rtW.name)} leads by ${gRt}%.` : "");
    }
    const up = p.gap >= 4 ? upgradeLine(p, W, L, g14, "1440p") : "";

    const bullets = (me, other, mine, theirs) => {
      const out = [];
      const m = (row) => (me === p.a ? row.a : row.b), t = (row) => (me === p.a ? row.b : row.a);
      if (m(p.r4k).fps > t(p.r4k).fps * 1.03) out.push(`you want the most FPS: it's ${gap(m(p.r4k).fps, t(p.r4k).fps)}% faster at 4K and ${gap(m(p.r1440).fps, t(p.r1440).fps)}% at 1440p.`);
      if (m(p.rt).fps > t(p.rt).fps * 1.03) out.push(`you play with ray tracing: ${fmt(m(p.rt).fps)} vs ${fmt(t(p.rt).fps)} FPS at 1440p.`);
      if (me.vram > other.vram) out.push(`you play at 4K or use high-resolution texture packs: ${me.vram} GB of VRAM vs ${other.vram} GB.`);
      if (me.year > other.year) out.push(`you want the newer card (${me.year}) with the longer driver and feature support ahead of it.`);
      if (mine && theirs && mine.part.g < theirs.part.g) out.push(`your CPU is older: a ${mine.first ? "Ryzen 5 3600-class chip" : short(mine.part.name)} is enough to keep it fed at 1440p.`);
      if (m(p.r1440).fps < t(p.r1440).fps * 0.97) out.push(`it costs at least ${gap(m(p.r1440).fps, t(p.r1440).fps)}% less than the ${short(other.name)}, which makes it the better value per frame.`);
      const g10 = gap(p.r1080.a.fps, p.r1080.b.fps);
      if (out.length < 2 && m(p.r1080).fps < t(p.r1080).fps && g10 <= 12) out.push(`you play at 1080p, where the gap is only ${g10}% and upscaling hides it further.`);
      if (out.length < 2) out.push(`it's the cheaper of the two where you shop: performance is close enough that price decides.`);
      return out;
    };
    return { summary, up, picks: [[p.a, bullets(p.a, p.b, p.need.a, p.need.b)], [p.b, bullets(p.b, p.a, p.need.b, p.need.a)]], names: [A, B] };
  }

  function verdictCpu(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const W = p.aWins ? p.a : p.b, L = p.aWins ? p.b : p.a;
    const g14 = gap(p.r1440.a.fps, p.r1440.b.fps);
    let summary;
    if (p.gap < 4) {
      summary = `For gaming this is a wash, so the decision comes down to price, platform and what else you do with the PC.` +
        (p.a.threads !== p.b.threads ? ` If you stream or render too, the ${short((p.a.threads > p.b.threads ? p.a : p.b).name)}'s extra threads tip the balance.` : "");
    } else {
      summary = `Buy the ${short(W.name)} if you want the faster gaming CPU: it's ${p.gap}% ahead at 1080p with a high-end card${g14 < p.gap - 2 ? ` (${g14}% at 1440p)` : ""}. The ${short(L.name)} makes sense if it costs at least ${Math.max(g14, 3)}% less, or if you pair it with a mid-range GPU that hides the difference.`;
    }
    const up = p.gap >= 4 ? upgradeLine(p, W, L, p.gap, "1080p") : "";

    const bullets = (me, other, mine, theirs) => {
      const out = [];
      const m = (row) => (me === p.a ? row.a : row.b), t = (row) => (me === p.a ? row.b : row.a);
      if (m(p.r1080).fps > t(p.r1080).fps * 1.03) out.push(`you play at high refresh rates: ${gap(m(p.r1080).fps, t(p.r1080).fps)}% more FPS at 1080p with a fast GPU.`);
      if (m(p.r1080).low1 > t(p.r1080).low1 * 1.03) out.push(`you care about smoothness: 1% lows of ${fmt(m(p.r1080).low1)} vs ${fmt(t(p.r1080).low1)} FPS at 1080p.`);
      if (m(p.ch).fps > t(p.ch).fps * 1.03) out.push(`you play strategy, sims or MMOs: ${fmt(m(p.ch).fps)} vs ${fmt(t(p.ch).fps)} FPS in CPU-heavy games.`);
      if (me.threads > other.threads) out.push(`you also stream, edit video or compile code: ${me.cores} cores / ${me.threads} threads vs ${other.cores} / ${other.threads}.`);
      if (mine && theirs && mine.part.g > theirs.part.g) out.push(`you plan a faster graphics card: it keeps up with GPUs up to the ${short(mine.part.name)} at 1440p.`);
      if (me.socket !== other.socket && (me.socket === "AM4" || me.socket === "LGA1700")) out.push(`you already own an ${me.socket} motherboard: it's a drop-in upgrade with no new board or RAM.`);
      if (me.socket !== other.socket && me.socket === "AM5") out.push(`you're building new: AM5 is the platform AMD's current Ryzen CPUs use.`);
      if (m(p.r1080).fps < t(p.r1080).fps * 0.97) out.push(`it costs at least ${gap(m(p.r1080).fps, t(p.r1080).fps)}% less, or you game at 1440p and above where the gap shrinks.`);
      if (out.length < 2 && m(p.r1080).fps < t(p.r1080).fps) {
        const mid = find(HW.gpus, "rtx-5070");
        const gm = gap(Engine.evaluate(p.a, mid, o("1440p")).fps, Engine.evaluate(p.b, mid, o("1440p")).fps);
        if (gm <= 5) out.push(`you pair it with a mid-range card: with an RTX 5070 at 1440p the two are ${gm < 2 ? "level" : `only ${gm}% apart`}.`);
      }
      if (out.length < 2) out.push(`it's the cheaper of the two where you shop: gaming performance is close enough that price decides.`);
      return out;
    };
    return { summary, up, picks: [[p.a, bullets(p.a, p.b, p.drive.a, p.drive.b)], [p.b, bullets(p.b, p.a, p.drive.b, p.drive.a)]], names: [A, B] };
  }

  // ---- FAQ
  function faqGpu(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const W = short((p.aWins ? p.a : p.b).name), L = short((p.aWins ? p.b : p.a).name);
    const g14 = gap(p.r1440.a.fps, p.r1440.b.fps);
    const na = p.need.a, nb = p.need.b;
    const cpuText = (n, name) => n ? `the ${name} needs ${n.first ? "a Ryzen 5 3600 or faster" : `at least a ${short(n.part.name)}`}` : `the ${name} is CPU-limited even with a Ryzen 7 9850X3D`;
    return [
      [`Is the ${A} faster than the ${B}?`,
        p.gap < 4
          ? `They're within ${p.gap}% of each other at 4K and ${g14}% at 1440p, so in practice they perform the same. With ray tracing on at 1440p the ${A} gets about ${fmt(p.rt.a.fps)} FPS and the ${B} ${fmt(p.rt.b.fps)} FPS.`
          : `${p.aWins ? "Yes" : "No"}. The ${W} is about ${p.gap}% faster at 4K and ${g14}% faster at 1440p in AAA games at High settings. With ray tracing on at 1440p the ${A} gets about ${fmt(p.rt.a.fps)} FPS and the ${B} ${fmt(p.rt.b.fps)} FPS.`],
      [`How many FPS do the ${A} and ${B} get?`,
        `With a Ryzen 7 9800X3D at High settings in AAA games, the ${A} averages about ${fmt(p.r1080.a.fps)} FPS at 1080p, ${fmt(p.r1440.a.fps)} at 1440p and ${fmt(p.r4k.a.fps)} at 4K. The ${B} averages ${fmt(p.r1080.b.fps)}, ${fmt(p.r1440.b.fps)} and ${fmt(p.r4k.b.fps)} FPS. DLSS, FSR or XeSS upscaling adds roughly 40% where the graphics card is the limit.`],
      [`What CPU do I need for the ${A} or ${B}?`,
        `To keep the CPU bottleneck under 10% at 1440p, ${cpuText(na, A)} and ${cpuText(nb, B)}. At 1080p you need a faster CPU for the same result, and at 4K a slower one is fine.${p.gap >= 4 ? ` A slower CPU narrows the gap between the ${W} and the ${L}.` : ""}`],
    ];
  }

  function faqCpu(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const W = short((p.aWins ? p.a : p.b).name);
    const g14 = gap(p.r1440.a.fps, p.r1440.b.fps);
    const da = p.drive.a, db = p.drive.b;
    const gpuText = (d, name) => d ? `the ${name} keeps up with cards up to the ${short(d.part.name)}` : `the ${name} holds back even an RTX 3060 12GB`;
    return [
      [`Is the ${A} better than the ${B} for gaming?`,
        p.gap < 4
          ? `They're within ${p.gap}% of each other at 1080p with an RTX 5090, so for gaming they're effectively equal. Choose on price, platform and core count instead.`
          : `${p.aWins ? "Yes" : "No"}. The ${W} is about ${p.gap}% faster at 1080p with an RTX 5090 and ${g14}% faster at 1440p. The gap is smaller with a mid-range graphics card, which becomes the limit first.`],
      [`How many FPS do the ${A} and ${B} get?`,
        `Paired with an RTX 5090 at High settings, the ${A} averages about ${fmt(p.r1080.a.fps)} FPS at 1080p and ${fmt(p.r1440.a.fps)} at 1440p in AAA games, and ${fmt(p.es.a.fps)} FPS in esports titles. The ${B} averages ${fmt(p.r1080.b.fps)}, ${fmt(p.r1440.b.fps)} and ${fmt(p.es.b.fps)} FPS.`],
      [`Which graphics card should I pair with the ${A} or ${B}?`,
        `For a CPU bottleneck under 10% at 1440p, ${gpuText(da, A)} and ${gpuText(db, B)}. Any slower card is a safe match. At 4K both CPUs can drive faster GPUs, and at 1080p they need slower ones.`],
    ];
  }

  // ---- Related comparisons: same parts first, then nearest in performance
  function related(p) {
    const same = all.filter((x) => x !== p && x.kind === p.kind);
    const shares = (x) => [x.a, x.b].some((y) => y === p.a || y === p.b);
    const dist = (x) => Math.abs(x.a.g + x.b.g - p.a.g - p.b.g);
    return same.sort((x, y) => (shares(y) - shares(x)) || dist(x) - dist(y) || x.slug.localeCompare(y.slug)).slice(0, 6);
  }

  // ---- Existing /bottleneck/ build pages for these parts
  function buildLinks(p) {
    const out = [];
    for (const part of [p.a, p.b]) {
      const partners = p.kind === "gpu" ? BUILD_CPUS : BUILD_GPUS;
      const found = partners
        .map((id) => (p.kind === "gpu" ? [id, part.id] : [part.id, id]))
        .filter(([c, g]) => builds.has(`bottleneck/${c}-${g}/`))
        .slice(0, 3);
      for (const [c, g] of found) out.push({ cpu: find(HW.cpus, c), gpu: find(HW.gpus, g) });
    }
    return out;
  }
  function buildCard({ cpu, gpu }) {
    const r = Engine.evaluate(cpu, gpu, o("1440p"));
    const label = r.verdict.key === "excellent" ? "Balanced" : `${r.limiter.toUpperCase()}-limited ${Math.round(r.pct)}%`;
    return `<a class="combo-card" href="../../bottleneck/${cpu.id}-${gpu.id}/"><b>${short(cpu.name)} + ${short(gpu.name)}</b><span>1440p · <em data-tone="${r.verdict.tone}">${label}</em> · ≈${fmt(r.fps)} FPS</span></a>`;
  }
  const compareCard = (x, base) => `<a class="combo-card" href="${base}${x.slug}/"><b>${short(x.a.name)} vs ${short(x.b.name)}</b><span>${x.cardText}</span></a>`;
  const calcHref = (c, g) => `../../?cpu=${c}&amp;gpu=${g}#calculator`;

  // ---- Shared chrome (same as the guides)
  const header = (root) => `<a class="skip" href="#main">Skip to content</a>
  ${layout.header(root, "compare")}`;

  const footer = (root) => layout.footer(root);

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
  <link rel="stylesheet" href="${root}assets/css/style.css?v=12">
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
</head>`;
  }

  const crumbSchema = (items) => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map(([n, item], i) => ({ "@type": "ListItem", position: i + 1, name: n, item })),
  });
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  // ---- Page sections
  function overview(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const metric = (m) => {
      const max = Math.max(m.a, m.b);
      const row = (name, v) => {
        const rel = v / max, pc = Math.round(rel * 100);
        return `<div class="cmp-row${v === max ? " win" : ""}"><span class="cmp-name">${name}</span><span class="cmp-val num">${pc}%</span><div class="cmp-bar" role="img" aria-label="${name}: ${pc}% (${fmt(v)} FPS)"><i style="transform:scaleX(${rel.toFixed(3)})"></i></div></div>`;
      };
      const g = gap(m.a, m.b);
      return `<div class="cmp-metric">
            <h3>${m.title}</h3>
            ${row(A, m.a)}
            ${row(B, m.b)}
            <p class="cmp-note"><span class="num">${fmt(m.a)}</span> vs <span class="num">${fmt(m.b)}</span> FPS · ${g < 2 ? "level" : `${m.a >= m.b ? A : B} +${g}%`}</p>
          </div>`;
    };
    const sub = p.kind === "gpu" ? "Faster card = 100%. Average FPS at High settings with a Ryzen 7 9800X3D." : "Faster CPU = 100%. Average FPS at High settings with an RTX 5090.";
    return `<section class="card cmp-overview" aria-labelledby="perf">
        <h2 id="perf">Relative performance</h2>
        <p class="sub">${sub}</p>
        <div class="cmp-metrics">
          ${p.metrics.map(metric).join("\n          ")}
        </div>
      </section>`;
  }

  function fpsTable(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const cell = (r) => `<td class="r"><span class="num">${fmt(r.fps)}</span>${r.limiter === "cpu" && r.pct >= 10 && p.kind === "gpu" ? `<br><small>CPU-limited</small>` : ""}${r.limiter === "gpu" && r.pct >= 10 && p.kind === "cpu" ? `<br><small>GPU-limited</small>` : ""}</td>`;
    const leadCell = (x) => {
      const g = gap(x.a.fps, x.b.fps);
      return g < 2 ? `<td class="r">Level</td>` : `<td class="r"><small class="cmp-who">${tiny(x.a.fps >= x.b.fps ? p.a : p.b)}</small> <span class="cmp-lead">+${g}%</span></td>`;
    };
    const rows = p.rows.map((x) => `<tr><td>${x.label}</td>${cell(x.a)}${cell(x.b)}${leadCell(x)}</tr>`).join("");
    return `<div class="table-scroll"><table class="cmp-table"><thead><tr><th>Setting</th><th class="r">${A}</th><th class="r">${B}</th><th class="r">Lead</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function specTable(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const rtText = (g) => g.rt === 0 ? "None" : g.rt >= 1 ? "Yes, full speed" : `Yes, ${Math.round(g.rt * 100)}% efficiency`;
    const rows = p.kind === "gpu"
      ? [["VRAM", `${p.a.vram} GB`, `${p.b.vram} GB`], ["Ray tracing", rtText(p.a), rtText(p.b)], ["Released", p.a.year, p.b.year],
        ["Raster index", p.a.g, p.b.g]]
      : [["Cores / threads", `${p.a.cores} / ${p.a.threads}`, `${p.b.cores} / ${p.b.threads}`], ["Socket", p.a.socket, p.b.socket],
        ["Released", p.a.year, p.b.year], ["3D V-Cache", x3d(p.a) ? "Yes" : "No", x3d(p.b) ? "Yes" : "No"], ["Gaming index", p.a.g, p.b.g]];
    return `<div class="table-scroll"><table class="cmp-specs"><thead><tr><th>Spec</th><th class="r">${A}</th><th class="r">${B}</th></tr></thead><tbody>${rows.map(([k, a, b]) => `<tr><td>${k}</td><td class="r">${a}</td><td class="r">${b}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function needTable(p) {
    if (p.kind === "gpu") {
      const row = (g, n) => {
        if (!n) return `<tr><td>${short(g.name)}</td><td>Ryzen 7 9850X3D <small>(still CPU-bound)</small></td><td class="r">–</td></tr>`;
        const name = n.first ? "Ryzen 5 3600 or faster" : short(n.part.name);
        const href = builds.has(`bottleneck/${n.part.id}-${g.id}/`) ? `../../bottleneck/${n.part.id}-${g.id}/` : calcHref(n.part.id, g.id);
        return `<tr><td>${short(g.name)}</td><td><a href="${href}">${name}</a></td><td class="r num">${fmt(n.r.fps)}</td></tr>`;
      };
      return `<div class="table-scroll"><table><thead><tr><th>Graphics card</th><th>Slowest CPU</th><th class="r">FPS</th></tr></thead><tbody>${row(p.a, p.need.a)}${row(p.b, p.need.b)}</tbody></table></div>`;
    }
    const row = (c, d) => {
      if (!d) return `<tr><td>${short(c.name)}</td><td>Below RTX 3060 12GB</td><td class="r">–</td></tr>`;
      const href = builds.has(`bottleneck/${c.id}-${d.part.id}/`) ? `../../bottleneck/${c.id}-${d.part.id}/` : calcHref(c.id, d.part.id);
      return `<tr><td>${short(c.name)}</td><td><a href="${href}">${short(d.part.name)}</a></td><td class="r num">${fmt(d.r.fps)}</td></tr>`;
    };
    return `<div class="table-scroll"><table><thead><tr><th>Processor</th><th>Strongest GPU</th><th class="r">FPS</th></tr></thead><tbody>${row(p.a, p.drive.a)}${row(p.b, p.drive.b)}</tbody></table></div>`;
  }

  // ---- Comparison page
  function comparePage(p) {
    const A = short(p.a.name), B = short(p.b.name);
    const url = `${SITE_URL}compare/${p.slug}/`;
    const isGpu = p.kind === "gpu";
    const intro = isGpu ? gpuIntro(p) : cpuIntro(p);
    const n = words(intro);
    if (n < 120 || n > 180) console.warn(`compare: ${p.slug} intro has ${n} words (target 120–180)`);
    const v = isGpu ? verdictGpu(p) : verdictCpu(p);
    const faq = isGpu ? faqGpu(p) : faqCpu(p);
    const W = short((p.aWins ? p.a : p.b).name), L = short((p.aWins ? p.b : p.a).name);
    const h1 = `${A} vs ${B}: <span>Gaming Performance &amp; Bottleneck (2026)</span>`;
    const title = isGpu ? `${A} vs ${B}: FPS at 1080p, 1440p & 4K (2026)` : `${A} vs ${B}: Gaming FPS & Bottleneck (2026)`;
    const description = isGpu
      ? `${p.gap < 4 ? `${A} and ${B} are within ${p.gap}% at 4K` : `${W} is ${p.gap}% faster than the ${L} at 4K`} (≈${fmt(p.r4k.a.fps)} vs ${fmt(p.r4k.b.fps)} FPS). FPS at 1080p to 4K, ray tracing, VRAM and the CPU each card needs.`
      : `${p.gap < 4 ? `${A} and ${B} are within ${p.gap}% in games` : `${W} is ${p.gap}% faster than the ${L} in games`} (≈${fmt(p.r1080.a.fps)} vs ${fmt(p.r1080.b.fps)} FPS at 1080p, RTX 5090). Esports, CPU-heavy games, platform and GPU pairing.`;
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        crumbSchema([["Bottleneck Calculator", SITE_URL], ["Compare", `${SITE_URL}compare/`], [`${A} vs ${B}`, url]]),
        { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      ],
    };
    const bl = buildLinks(p);
    const checkA = isGpu ? calcHref((p.need.a || { part: refCpu }).part.id, p.a.id) : calcHref(p.a.id, (p.drive.a || { part: gpuLadder[0] }).part.id);
    const checkB = isGpu ? calcHref((p.need.b || { part: refCpu }).part.id, p.b.id) : calcHref(p.b.id, (p.drive.b || { part: gpuLadder[0] }).part.id);
    const pairName = (part, other) => isGpu ? `${short(other.name)} + ${short(part.name)}` : `${short(part.name)} + ${short(other.name)}`;
    const partnerA = isGpu ? (p.need.a || { part: refCpu }).part : (p.drive.a || { part: gpuLadder[0] }).part;
    const partnerB = isGpu ? (p.need.b || { part: refCpu }).part : (p.drive.b || { part: gpuLadder[0] }).part;

    return `${head({ title, description, url, root: "../../", schema, type: "article" })}
<body>
  ${header("../../")}

  <main id="main">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="../../">Bottleneck Calculator</a> <span aria-hidden="true">›</span> <a href="../">Compare</a> <span aria-hidden="true">›</span> <span aria-current="page">${A} vs ${B}</span></nav>
      <section class="hero combo-hero">
        <h1>${h1}</h1>
        <p class="lead">${intro}</p>
      </section>

      ${overview(p)}

      <div class="details cmp-details reveal-group">
        <section class="card panel panel-wide">
          <h3>${isGpu ? "FPS with a Ryzen 7 9800X3D" : "FPS with an RTX 5090"}</h3>
          <p class="sub">${isGpu ? "Average FPS in AAA games, no upscaling. A fast CPU, so the graphics card sets the pace." : "Average FPS, no upscaling. The fastest GPU, so the processor sets the pace."}</p>
          ${fpsTable(p)}
        </section>
        <section class="card panel">
          <h3>Specifications</h3>
          <p class="sub">${isGpu ? "Raster index: RTX 4090 = 100." : "Gaming index: Ryzen 7 9800X3D = 100."}</p>
          ${specTable(p)}
        </section>
        <section class="card panel">
          <h3>${isGpu ? "Which CPU do you need?" : "Which GPUs can it drive?"}</h3>
          <p class="sub">${isGpu ? "Slowest common CPU that keeps each card under a 10% bottleneck at 1440p High." : "Strongest common GPU each CPU keeps under a 10% CPU bottleneck at 1440p High."}</p>
          ${needTable(p)}
        </section>
      </div>

      <div class="article combo-article">
        <section id="verdict">
          <h2>Which should you buy?</h2>
          <p>${v.summary}${v.up ? ` ${v.up}` : ""}</p>
          <div class="cmp-picks">
            ${v.picks.map(([part, list]) => `<div class="card cmp-pick${part === (p.aWins ? p.a : p.b) && p.gap >= 4 ? " win" : ""}">
              <h3>Buy the ${short(part.name)} if…</h3>
              <ul>${list.map((t) => `<li>${t}</li>`).join("")}</ul>
            </div>`).join("\n            ")}
          </div>
        </section>

        <section id="check">
          <h2>Check your build</h2>
          <p>These numbers use ${isGpu ? "a Ryzen 7 9800X3D" : "an RTX 5090"} to isolate the ${isGpu ? "graphics card" : "processor"}. Your own ${isGpu ? "CPU" : "graphics card"}, resolution and settings change the result, so run your exact parts through the calculator.</p>
          <div class="cmp-actions">
            <a class="btn" href="${checkA}">Check ${pairName(p.a, partnerA)}${arrow}</a>
            <a class="btn-ghost" href="${checkB}">Check ${pairName(p.b, partnerB)}</a>
          </div>
          ${bl.length ? `<h3>Popular builds with these ${isGpu ? "cards" : "CPUs"}</h3>
          <div class="combos">${bl.map(buildCard).join("")}</div>` : ""}
        </section>

        <section id="related">
          <h2>Related comparisons</h2>
          <div class="combos">${related(p).map((x) => compareCard(x, "../")).join("")}</div>
          <p><a href="../">Browse all ${gpuPairs.length} GPU and ${cpuPairs.length} CPU comparisons</a>.</p>
        </section>

        <section class="faq">
          <h2>${A} vs ${B}: quick answers</h2>
          ${faq.map(([q, a], i) => `<details${i ? "" : " open"}><summary>${q}</summary><div><p>${a}</p></div></details>`).join("\n          ")}
        </section>
      </div>
    </div>
  </main>

  ${footer("../../")}
  <script src="../../assets/js/motion.js?v=12"></script>
  <script>Motion.initPage();</script>
</body>
</html>
`;
  }

  // ---- Hub
  function hubPage() {
    const url = `${SITE_URL}compare/`;
    const top = (x) => Math.max(x.a.g, x.b.g);
    const groups = [
      ["gpu", "High-end graphics cards", "RTX 5090, 4090, 5080 and RX 7900 XTX class. Compared at 1440p and 4K.", (x) => top(x) >= 78],
      ["gpu", "Upper mid-range graphics cards", "RTX 5070 Ti, RX 9070 XT and RTX 4070 Super class.", (x) => top(x) >= 55 && top(x) < 78],
      ["gpu", "Mid-range graphics cards", "RTX 5060 Ti, RX 9060 XT and RTX 3070 class.", (x) => top(x) >= 40 && top(x) < 55],
      ["gpu", "Budget graphics cards", "RTX 5060, RTX 4060, Arc B580 and RX 7600 class. Best judged at 1080p.", (x) => top(x) < 40],
      ["cpu", "High-end gaming CPUs", "X3D chips and Intel's fastest. Compared with an RTX 5090.", (x) => top(x) >= 80],
      ["cpu", "Mid-range gaming CPUs", "Ryzen 5 7600, Ryzen 7 9700X, Core i5-14600K class.", (x) => top(x) >= 62 && top(x) < 80],
      ["cpu", "Budget and AM4 CPUs", "Ryzen 5 5600, Core i5-12400F and upgrades for older platforms.", (x) => top(x) < 62],
    ];
    const ids = { gpu: "gpus", cpu: "cpus" };
    const groupHtml = (kind) => groups.filter(([k]) => k === kind).map(([, title, sub, fn], i) => {
      const list = all.filter((x) => x.kind === kind && fn(x)).sort((x, y) => top(y) - top(x) || x.slug.localeCompare(y.slug));
      return `<section class="build-group" id="${ids[kind]}-${i + 1}">
          <h3>${title}</h3>
          <p class="sub">${sub} ${list.length} comparisons.</p>
          <div class="combos">${list.map((x) => compareCard(x, "")).join("")}</div>
        </section>`;
    }).join("\n        ");
    // Every pair must land in exactly one group.
    for (const x of all) {
      const n = groups.filter(([k, , , fn]) => k === x.kind && fn(x)).length;
      if (n !== 1) throw new Error(`compare: ${x.slug} is in ${n} hub groups`);
    }
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        crumbSchema([["Bottleneck Calculator", SITE_URL], ["Compare", url]]),
        {
          "@type": "CollectionPage", name: "GPU and CPU gaming comparisons", url,
          mainEntity: { "@type": "ItemList", numberOfItems: all.length, itemListElement: all.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: `${url}${x.slug}/`, name: `${short(x.a.name)} vs ${short(x.b.name)}` })) },
        },
      ],
    };
    return `${head({
      title: "GPU vs GPU and CPU vs CPU Gaming Comparisons (2026)",
      description: `${gpuPairs.length} graphics card and ${cpuPairs.length} processor head-to-heads: FPS at 1080p, 1440p and 4K, ray tracing, VRAM and the bottleneck each part brings to your build.`,
      url, root: "../", schema, type: "website",
    })}
<body>
  ${header("../")}

  <main id="main">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="../">Bottleneck Calculator</a> <span aria-hidden="true">›</span> <span aria-current="page">Compare</span></nav>
      <section class="hero combo-hero">
        <h1>GPU and CPU comparisons: <span>gaming FPS head to head</span></h1>
        <p class="lead">${gpuPairs.length} graphics card and ${cpuPairs.length} processor matchups that people actually weigh up: new generation against old, AMD against NVIDIA and Intel, and the upgrade from what you own today. Graphics cards are tested with a Ryzen 7 9800X3D so the card sets the pace; processors are tested with an RTX 5090 so the CPU does. Every number comes from the same model as the <a href="../#calculator">bottleneck calculator</a>.</p>
      </section>

      <nav aria-label="Comparison groups"><ul class="chips"><li><a href="#gpus">Graphics cards</a></li><li><a href="#cpus">Processors</a></li></ul></nav>

      <div class="builds">
        <section class="cmp-hub-group" id="gpus">
          <h2>Graphics cards</h2>
          ${groupHtml("gpu")}
        </section>
        <section class="cmp-hub-group" id="cpus">
          <h2>Processors</h2>
          ${groupHtml("cpu")}
        </section>
      </div>
    </div>
  </main>

  ${footer("../")}
  <script src="../assets/js/motion.js?v=12"></script>
  <script>Motion.initPage();</script>
</body>
</html>
`;
  }

  // ---- Write (the folder is fully generated)
  const outDir = path.join(ROOT, "compare");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), hubPage());
  for (const p of all) {
    fs.mkdirSync(path.join(outDir, p.slug));
    fs.writeFileSync(path.join(outDir, p.slug, "index.html"), comparePage(p));
  }
  console.log(`  compare/: ${gpuPairs.length} GPU + ${cpuPairs.length} CPU comparisons + hub`);
  return ["compare/", ...all.map((x) => `compare/${x.slug}/`)];
};
