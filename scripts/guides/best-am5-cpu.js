// Guide: Best AM5 CPU for gaming in 2026
module.exports = function (h) {
  const { ev, cpu, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, compare, table, td, limitTag } = h;

  const CPUS = [
    "ryzen-5-7500f", "ryzen-5-7600", "ryzen-5-9600x", "ryzen-7-9700x", "ryzen-5-7600x3d",
    "ryzen-7-7800x3d", "ryzen-7-9800x3d", "ryzen-7-9850x3d", "ryzen-9-9950x3d",
  ];
  const GPUS = ["rtx-5070", "rtx-5070-ti", "rtx-5080", "rtx-5090"];
  // Cheapest-first ladder of widely sold AM5 gaming chips for the "which CPU for your GPU" table.
  const LADDER = ["ryzen-5-7600", "ryzen-5-9600x", "ryzen-7-7800x3d", "ryzen-7-9800x3d"];
  const FOR_GPUS = ["rtx-5060", "rx-9060-xt-16gb", "rtx-5060-ti-16gb", "rtx-5070", "rx-9070", "rx-9070-xt", "rtx-5070-ti", "rtx-5080", "rtx-5090"];
  const ok = (r) => r.limiter === "gpu" || r.pct < 10;
  function pick(g, r) {
    const hit = LADDER.find((c) => ok(ev(c, g, { res: r })));
    return hit ? { c: hit, x: ev(hit, g, { res: r }) } : { c: null, x: ev(LADDER[LADDER.length - 1], g, { res: r }) };
  }

  const cell = (c, g, r) => {
    const x = ev(c, g, { res: r });
    return `<td class="r">${calc(c, g, { res: r }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  const matrix = (r) => table(
    ["CPU", ...GPUS.map((g) => [name(g), true])],
    CPUS.map((c) => [td(`<strong>${name(c)}</strong>`), ...GPUS.map((g) => cell(c, g, r))]),
  );
  const forTable = table(
    ["Graphics card", "1080p", "1440p"],
    FOR_GPUS.map((g) => {
      const label = (p) => p.c ? name(p.c) : `${name(LADDER[LADDER.length - 1])} <small>(still CPU-bound ${pct(p.x)}%)</small>`;
      return [td(`<strong>${name(g)}</strong>`), td(label(pick(g, "1080p"))), td(label(pick(g, "1440p")))];
    }),
  );

  // CPU limit in AAA at High: independent of GPU and resolution.
  const cap = (id) => ev(id, "rtx-5090", { res: "1080p" }).cpuFps;
  const d7500f = gain(cap("ryzen-5-7600"), cap("ryzen-5-7500f"));
  const d9600 = gain(cap("ryzen-5-9600x"), cap("ryzen-5-7600"));
  const d9700 = gain(cap("ryzen-7-9700x"), cap("ryzen-5-9600x"));
  const dX3d = gain(cap("ryzen-7-7800x3d"), cap("ryzen-5-7600"));
  const d7600x3d = gain(cap("ryzen-5-7600x3d"), cap("ryzen-5-7600"));
  const d7800 = gain(cap("ryzen-7-7800x3d"), cap("ryzen-5-7600x3d"));
  const d9800 = gain(cap("ryzen-7-9800x3d"), cap("ryzen-7-7800x3d"));
  const d9850 = gain(cap("ryzen-7-9850x3d"), cap("ryzen-7-9800x3d"));
  const d7500x3d = gain(cap("ryzen-5-7600x3d"), cap("ryzen-5-7500x3d"));
  expect(d7500f >= 0 && d7500f <= 3, "7600 and 7500F game almost identically");
  expect(d9600 >= 5 && d9600 <= 12, "9600X is a modest step over the 7600");
  expect(d9700 >= 0 && d9700 <= 6, "9700X is barely faster than 9600X in games");
  expect(dX3d >= 25, "7800X3D is much faster than the 7600 when CPU-bound");
  expect(d7600x3d >= 15 && d7800 > 0, "7600X3D sits between the 7600 and 7800X3D");
  expect(d9800 >= 10 && d9800 <= 18, "9800X3D is a clear step over the 7800X3D");
  expect(d9850 > 0 && d9850 <= 5, "9850X3D is only slightly faster than the 9800X3D");
  expect(d7500x3d > 0 && d7500x3d <= 6, "7500X3D is a little slower than the 7600X3D");
  expect(Math.abs(gain(cap("ryzen-9-9900x3d"), cap("ryzen-7-7800x3d"))) <= 3, "9900X3D games like a 7800X3D");
  expect(Math.abs(gain(cap("ryzen-9-9950x3d"), cap("ryzen-7-9800x3d"))) <= 3, "9950X3D games like a 9800X3D");
  expect(cap("ryzen-7-9700x") < cap("ryzen-5-7600x3d"), "even the 7600X3D beats the 9700X in games");

  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...o });
  const s7600 = { "5070": [at("ryzen-5-7600", "rtx-5070", "1080p"), at("ryzen-5-7600", "rtx-5070", "1440p")], ti: [at("ryzen-5-7600", "rtx-5070-ti", "1080p"), at("ryzen-5-7600", "rtx-5070-ti", "1440p")] };
  expect(s7600["5070"][0].verdict.key === "excellent" && s7600["5070"][1].limiter === "gpu", "7600 + 5070: balanced at 1080p, GPU-bound at 1440p");
  expect(s7600.ti[1].verdict.key === "excellent" && s7600.ti[0].limiter === "cpu" && s7600.ti[0].pct >= 15, "7600 + 5070 Ti: balanced at 1440p, CPU-bound at 1080p");
  const r5080 = { "7600": at("ryzen-5-7600", "rtx-5080", "1080p"), x78: at("ryzen-7-7800x3d", "rtx-5080", "1080p"), x98: at("ryzen-7-9800x3d", "rtx-5080", "1080p"), q7600: at("ryzen-5-7600", "rtx-5080", "1440p") };
  expect(r5080["7600"].limiter === "cpu" && r5080["7600"].pct >= 25, "7600 badly limits a 5080 at 1080p");
  expect(r5080.x78.limiter === "cpu" && r5080.x78.pct >= 10 && r5080.x78.pct < 20 && r5080.x98.verdict.key === "excellent", "5080 at 1080p: 7800X3D minor, 9800X3D balanced");
  expect(r5080.q7600.verdict.key === "excellent", "7600 is balanced with a 5080 at 1440p");
  const r5090 = { x78: at("ryzen-7-7800x3d", "rtx-5090", "1440p"), x98: at("ryzen-7-9800x3d", "rtx-5090", "1440p"), s76: at("ryzen-5-7600", "rtx-5090", "1440p"), k4: at("ryzen-7-7800x3d", "rtx-5090", "4k") };
  expect(r5090.x98.verdict.key === "excellent" && r5090.x78.limiter === "cpu" && r5090.x78.pct >= 10 && r5090.s76.pct >= 25, "5090 at 1440p: only 9800X3D-class is balanced");
  expect(r5090.k4.verdict.key === "excellent" || r5090.k4.limiter === "gpu", "7800X3D is fine for a 5090 at 4K");

  const es = ["ryzen-5-7600", "ryzen-5-9600x", "ryzen-7-7800x3d", "ryzen-7-9800x3d"].map((c) => at(c, "rtx-5070", "1080p", { workload: "esports" }));
  expect(es[0].fps >= 240 && es[0].fps < 360 && es[1].fps >= 360 && es[2].fps >= 400, "esports: 7600 under 360, 9600X over 360, 7800X3D over 400");
  const es5080 = at("ryzen-7-9800x3d", "rtx-5080", "1080p", { workload: "esports" });
  expect(es5080.fps >= 480, "9800X3D + 5080 reaches 480 Hz territory in esports");
  const sim = ["ryzen-5-7600", "ryzen-7-7800x3d", "ryzen-7-9800x3d"].map((c) => at(c, "rtx-5070-ti", "1440p", { workload: "cpuheavy" }));
  expect(sim.every((x) => x.limiter === "cpu"), "CPU-heavy games are CPU-bound for every chip with a 5070 Ti at 1440p");
  const lows = ["ryzen-5-7600", "ryzen-7-7800x3d"].map((c) => at(c, "rtx-5080", "1440p"));
  const lowGain = gain(lows[1].low1, lows[0].low1);
  const avgGain = gain(lows[1].fps, lows[0].fps);
  expect(lowGain > avgGain, "X3D 1% lows gain more than the average with a 5080 at 1440p");

  const apu = { g87: at("ryzen-7-8700g", "rtx-5070", "1080p"), g86: at("ryzen-5-8600g", "rtx-5070", "1080p"), f84: at("ryzen-5-8400f", "rtx-5070", "1080p") };
  expect([apu.g87, apu.g86, apu.f84].every((x) => x.limiter === "cpu" && x.pct >= 15), "8000G/8400F hold back an RTX 5070 at 1080p");
  expect(cap("ryzen-7-8700g") < cap("ryzen-5-7500f"), "8700G is slower in games than the 7500F");
  expect(Math.abs(gain(cap("ryzen-7-5700x3d"), cap("ryzen-5-7600"))) <= 5, "5700X3D games close to a 7600");
  expect(at("ryzen-5-7600", "rtx-5090", "4k").verdict.key === "excellent" || at("ryzen-5-7600", "rtx-5090", "4k").limiter === "gpu", "7600 is fine for a 5090 at 4K");
  expect(pick("rx-9070-xt", "1080p").c === "ryzen-7-7800x3d" && pick("rx-9070", "1080p").c === "ryzen-5-9600x" && pick("rtx-5070", "1080p").c === "ryzen-5-7600", "budget tier bullets match the table");
  expect(["rx-9070-xt", "rtx-5070-ti", "rtx-5080"].every((g) => pick(g, "1440p").c === "ryzen-5-7600"), "7600 is enough at 1440p up to the 5080");
  const lowEnd = at("ryzen-5-7600", "rtx-5060-ti-16gb", "1080p");
  expect(lowEnd.limiter === "gpu", "7600 + 5060 Ti is GPU-bound at 1080p");

  // Upgrade path: start on a 7600, drop in a 9800X3D with the next GPU.
  const path = [at("ryzen-5-7600", "rtx-5070", "1440p"), at("ryzen-5-7600", "rtx-5090", "1440p"), at("ryzen-7-9800x3d", "rtx-5090", "1440p")];
  const pathGain = gain(path[2].fps, path[1].fps);
  expect(pathGain >= 25, "dropping a 9800X3D into a 7600 build with a 5090 is a big gain");

  return {
    slug: "best-am5-cpu",
    title: "Best AM5 CPU for Gaming (2026): 7600 vs 9600X vs 7800X3D vs 9800X3D",
    description: "The best AM5 CPU for gaming in 2026, from Ryzen 5 7500F to 9850X3D. FPS and bottleneck tables with RTX 5070 to 5090, picks by GPU and budget, and setup tips.",
    h1: "Best AM5 CPU for gaming in 2026",
    crumb: "Best AM5 CPU",
    card: "Ryzen 5 7600, 9600X, 7800X3D or 9800X3D? FPS and bottleneck against RTX 5070 to 5090, picks by graphics card, plus BIOS and EXPO setup.",
    lead: `AM5 has a CPU for every graphics card, from a six-core Ryzen 5 that keeps an RTX 5070 busy at 1440p to the X3D chips that can feed an RTX 5090. The trick is not overspending on the processor for your card, while leaving room to drop in a faster one later. Every table here uses the same data as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "picks", toc: "Quick picks", h2: "Quick picks",
        html: `
          <div class="callout">
            <p><strong>Best value: Ryzen 5 7600.</strong> Balanced with an RTX 5070 at 1080p and with an RTX 5070 Ti at 1440p. The Ryzen 5 7500F is the same chip without integrated graphics, within ${d7500f}% in games.</p>
            <p><strong>Best for most gamers: Ryzen 7 7800X3D.</strong> About ${dX3d}% faster than the 7600 when the CPU is the limit, with better 1% lows and enough headroom for an RTX 5080.</p>
            <p><strong>Fastest: Ryzen 7 9800X3D.</strong> Another ${d9800}% over the 7800X3D, and the chip to buy for an RTX 5090 or a 360 Hz monitor. The newer 9850X3D adds only about ${d9850}%.</p>
            <p><strong>Gaming plus heavy work: Ryzen 9 9950X3D.</strong> Games like a 9800X3D and has 16 cores for rendering and compiling.</p>
            <p><strong>Skip for a gaming build with a real graphics card:</strong> the Ryzen 8000G APUs and the 8400F. An 8700G holds an RTX 5070 back by ${pct(apu.g87)}% at 1080p.</p>
          </div>`,
      },
      {
        id: "lineup", toc: "The AM5 lineup", h2: "The AM5 gaming lineup, chip by chip",
        html: `
          <h3>Ryzen 5 7500F and Ryzen 5 7600</h3>
          <p>Six Zen 4 cores and 32 MB of L3 cache. The 7500F drops the small integrated GPU and a sliver of clock speed, which makes no real difference with a graphics card installed. Either one is plenty for RTX 5060 to RTX 5070 class cards. See ${compare("ryzen-5-7600", "ryzen-5-7500f")}.</p>
          <h3>Ryzen 5 9600X and Ryzen 7 9700X</h3>
          <p>Zen 5 brings about ${d9600}% more gaming speed over the 7600 for the six-core 9600X, and the eight-core 9700X adds only ${d9700}% more on top in games. They're good chips, but at their usual prices an X3D part is the better gaming buy. Compare ${compare("ryzen-5-9600x", "ryzen-5-7600")} and ${compare("ryzen-7-9700x", "ryzen-7-7800x3d")} before you pick one.</p>
          <h3>Ryzen 5 7600X3D and 7500X3D</h3>
          <p>Six-core X3D chips with 96 MB of L3. The 7600X3D is about ${d7600x3d}% faster than a 7600 when CPU-bound and only ${d7800}% behind the 7800X3D, and the 7500X3D trails the 7600X3D by about ${d7500x3d}%. Neither is sold everywhere, so availability and price vary a lot by country. See ${compare("ryzen-5-7600x3d", "ryzen-7-7800x3d")}.</p>
          <h3>Ryzen 7 7800X3D</h3>
          <p>The chip that made X3D the default for gaming: eight cores, 96 MB of L3, modest power draw. It still keeps an ${name("rtx-5070-ti")} or ${name("rx-9070-xt")} fully fed at 1080p, and it runs cool on a mid-range air cooler.</p>
          <h3>Ryzen 7 9800X3D and 9850X3D</h3>
          <p>The 9800X3D moves the cache underneath the CPU die, which lets it clock higher and be overclocked. It's about ${d9800}% ahead of the 7800X3D in our index. The 9850X3D is a higher-clocked version of the same design and only about ${d9850}% faster. Buy whichever costs less. The ${guide("9800x3d-vs-7800x3d", "9800X3D vs 7800X3D guide")} covers whether the upgrade is worth it, and ${compare("ryzen-7-9850x3d", "ryzen-7-9800x3d")} has the newer pair.</p>
          <h3>Ryzen 9 9900X3D and 9950X3D</h3>
          <p>Two chiplets (eight cores each on the 9950X3D, six on the 9900X3D), with the extra cache on only one. AMD's chipset driver steers games onto the cache chiplet, so the 9950X3D performs like a 9800X3D, and the 9900X3D, with six cores under the cache, lands near a 7800X3D. They make sense when you also render, encode or compile. For gaming alone, the eight-core chips are better value. See ${compare("ryzen-9-9950x3d", "ryzen-7-9800x3d")} and ${compare("ryzen-9-9900x3d", "ryzen-7-9800x3d")}.</p>
          <h3>Ryzen 8000G and 8400F: a caution</h3>
          <p>The 8700G, 8600G and 8500G are laptop-derived APUs with strong integrated graphics, half the L3 cache of the 7600 and PCIe 4.0 instead of 5.0. They're great for a small PC with no graphics card. With one, they're slower than they look: the 8700G is behind even the 7500F in games, and with an ${name("rtx-5070")} at 1080p the 8700G, 8600G and 8400F are ${pct(apu.g87)}%, ${pct(apu.g86)}% and ${pct(apu.f84)}% CPU-limited.</p>`,
      },
      {
        id: "fps-tables", toc: "FPS at 1080p and 1440p", h2: "AM5 CPUs with today's graphics cards",
        html: `
          <p>Estimated average FPS in AAA games at High settings, with the bottleneck underneath. Click any number to open that build in the calculator.</p>
          <h3>1080p</h3>
          ${matrix("1080p")}
          <h3>1440p</h3>
          ${matrix("1440p")}
          <p>Two patterns stand out. At 1440p, most of the field sits within a few FPS of each other with an ${name("rtx-5070")} or ${name("rtx-5070-ti")}, because the graphics card sets the pace. With an ${name("rtx-5080")} or ${name("rtx-5090")}, the gap opens up: at 1440p the 9800X3D is ${verdict(r5090.x98)} with a 5090 at ${fmt(r5090.x98.fps)} FPS, the 7800X3D is ${pct(r5090.x78)}% CPU-limited at ${fmt(r5090.x78.fps)}, and the 7600 is ${pct(r5090.s76)}% CPU-limited at ${fmt(r5090.s76.fps)}. At 1080p even the fastest chip can't keep a 5090 busy.</p>`,
      },
      {
        id: "which-for-gpu", toc: "Which one for your GPU", h2: "Which AM5 CPU for your graphics card and budget?",
        html: `
          <p>The cheapest widely sold AM5 chip from the ladder ${LADDER.map(name).join(", ")} that keeps each card within a 10% CPU bottleneck in AAA games at High. Anything faster works too.</p>
          ${forTable}
          <p>By budget tier, that works out as follows:</p>
          <ul>
            <li><strong>Budget build</strong> (RTX 5060, RX 9060 XT, RTX 5060 Ti): Ryzen 5 7500F or 7600. A ${build("ryzen-5-7600", "rtx-5060-ti-16gb", "7600 with an RTX 5060 Ti 16GB")} is already GPU-bound at 1080p, so a faster CPU wouldn't add average FPS.</li>
            <li><strong>Mid-range</strong> (RTX 5070, RX 9070): Ryzen 5 7600, or a 9600X for 1080p high refresh.</li>
            <li><strong>Upper mid-range</strong> (RX 9070 XT, RTX 5070 Ti, RTX 5080): Ryzen 5 7600 at 1440p, Ryzen 7 7800X3D at 1080p. At 1440p a 7600 is ${verdict(r5080.q7600)} with an ${name("rtx-5080")}, but at 1080p it's ${pct(r5080["7600"])}% CPU-limited against the 7800X3D's ${pct(r5080.x78)}%.</li>
            <li><strong>High-end</strong> (RTX 5090, or any card on a 360 Hz monitor): Ryzen 7 9800X3D or 9850X3D. More on that pairing in ${guide("best-cpu-for-rtx-5080-5090", "the best CPU for the RTX 5080 and 5090")}.</li>
          </ul>`,
      },
      {
        id: "x3d", toc: "The X3D advantage", h2: "The X3D advantage: where the extra cache pays",
        html: `
          <p>AMD's X3D chips stack 64 MB of extra L3 cache onto a CPU chiplet. Games reuse the same world, AI and physics data every frame, and a bigger cache means fewer slow trips to memory. That's why the gain shows up where the CPU is under the most pressure:</p>
          <ul>
            <li><strong>1% lows.</strong> With an ${name("rtx-5080")} at 1440p, the 7800X3D's average is ${avgGain}% higher than the 7600's in our model, but its 1% lows are ${lowGain}% higher. Smoother frame pacing matters more than a few extra average FPS.</li>
            <li><strong>CPU-heavy games.</strong> In strategy, simulation and MMO-style games at 1440p with an ${name("rtx-5070-ti")}, the 7600 manages about ${fmt(sim[0].fps)} FPS, the 7800X3D ${fmt(sim[1].fps)} and the 9800X3D ${fmt(sim[2].fps)}. Every chip is still the limit there, which is why these games are the best case for X3D.</li>
            <li><strong>High-refresh esports.</strong> In CS2-style games at 1080p with an ${name("rtx-5070")}, the 7600 reaches about ${fmt(es[0].fps)} FPS, the 9600X ${fmt(es[1].fps)}, the 7800X3D ${fmt(es[2].fps)} and the 9800X3D ${fmt(es[3].fps)}. Pair a 9800X3D with an ${name("rtx-5080")} and it's about ${fmt(es5080.fps)}.</li>
          </ul>
          <p>In a GPU-bound build, such as most 1440p builds with an ${name("rtx-5070")}, the cache shows up in lows and CPU-heavy titles, not the average. The ${link.fps("FPS calculator")} has per-game numbers.</p>`,
      },
      {
        id: "upgrade-path", toc: "AM5 upgrade path", h2: "The AM5 upgrade path: buy for today, drop in later",
        html: `
          <p>AMD has kept AM5 as its desktop socket since 2022 and has said it plans to support it through at least 2027. Ryzen 7000 and 9000 chips share the socket, so a cheap CPU now and a fast one later is a sensible plan.</p>
          <p>Here's how it plays out. A ${calc("ryzen-5-7600", "rtx-5070", { res: "1440p" }, "Ryzen 5 7600 with an RTX 5070")} at 1440p is ${verdict(path[0])} at ${fmt(path[0].fps)} FPS. Keep that CPU and move to an ${name("rtx-5090")}, and it becomes ${pct(path[1])}% CPU-limited at ${fmt(path[1].fps)} FPS. Drop in a ${build("ryzen-7-9800x3d", "rtx-5090", "9800X3D")} on the same board and memory and it's ${verdict(path[2])} at ${fmt(path[2].fps)} FPS, ${pathGain}% more, with no rebuild.</p>
          <p>That's the main reason to choose AM5 over a dead-end platform. On a 12th to 14th gen Intel board, see the ${guide("best-lga1700-cpu-upgrade", "LGA1700 upgrade guide")} first. On AM4, a ${compare("ryzen-7-5700x3d", "ryzen-5-7600", "5700X3D games close to a 7600")}, so read the ${guide("best-am4-cpu", "AM4 upgrade guide")} too.</p>`,
      },
      {
        id: "setup", toc: "BIOS, EXPO and cooling", h2: "Setup: BIOS, EXPO memory, board and cooler",
        html: `
          <ol class="steps">
            <li><strong>Check the BIOS version.</strong> Every AM5 board supports Ryzen 7000, but boards built before Ryzen 9000 arrived need a newer BIOS (a newer AMD AGESA) for 9000-series and 9000X3D chips. Check your board's CPU support list for the first BIOS that lists your chip. Many boards have BIOS Flashback, which updates from a USB stick with no CPU installed.</li>
            <li><strong>Update even if it already boots.</strong> Early 2023 releases let some boards apply too much SoC voltage to X3D chips, which later updates corrected. Newer versions also improve memory compatibility and boot times.</li>
            <li><strong>Enable EXPO.</strong> AM5 is DDR5-only. A 32 GB kit (two sticks) of DDR5-6000 CL30 is the usual sweet spot, because it keeps the memory controller running in sync with the memory. Without EXPO enabled, DDR5 runs at a slow default speed.</li>
            <li><strong>Expect a long first boot.</strong> AM5 trains the memory on the first start and after BIOS changes, which can leave a black screen for a minute or more. Let it finish.</li>
            <li><strong>Pick a sensible board.</strong> An A620 board is fine for a 65 W chip like the 7600 or 7500F. For an X3D or 12- and 16-core chip, a B650 or B850 board is the safer floor. You don't need X870E for gaming.</li>
            <li><strong>Install AMD's chipset driver,</strong> especially for the 9900X3D and 9950X3D, which rely on it to keep games on the cache chiplet.</li>
          </ol>
          <p>The X3D chips don't include a cooler, but a decent single-tower air cooler handles a 7800X3D or 9800X3D in games. Give the 12- and 16-core chips a bigger cooler if you render.</p>`,
      },
    ],
    faq: [
      ["What is the best AM5 CPU for gaming?", `The Ryzen 7 9800X3D is the fastest widely available choice, about ${d9800}% ahead of the 7800X3D when the CPU is the limit. The newer 9850X3D adds only about ${d9850}%. For most builds with an RTX 5070 Ti or RTX 5080, the Ryzen 7 7800X3D is the better-value pick.`],
      ["Is the Ryzen 5 7600 good enough for gaming in 2026?", `Yes, for most graphics cards. In our model it's balanced with an RTX 5070 at 1080p and with an RTX 5070 Ti at 1440p. It starts to hold back an RTX 5080 at 1080p and an RTX 5090 below 4K.`],
      ["Is the Ryzen 5 9600X worth it over the 7600?", `Only if the price gap is small. The 9600X is about ${d9600}% faster in CPU-bound games, which shows at 1080p high refresh. At 1440p with an RTX 5070 or 5070 Ti, the two land within a few FPS because the graphics card is the limit.`],
      ["Should I buy the 9950X3D for gaming?", `Only if you also do heavy multi-core work. In games it performs like a 9800X3D, because games run on the chiplet with the extra cache. For gaming alone, the eight-core 9800X3D costs less and is just as fast.`],
      ["Are the Ryzen 8000G APUs good for gaming with a graphics card?", `Not with a fast card. They have half the L3 cache of the Ryzen 5 7600 and slower PCIe. An 8700G holds an RTX 5070 back by about ${pct(apu.g87)}% at 1080p. They make sense in a small PC that uses the integrated graphics.`],
      ["What RAM should I use with an AM5 CPU?", "32 GB of DDR5 in two sticks, ideally DDR5-6000 CL30, with EXPO enabled in the BIOS. X3D chips are the least sensitive to memory speed, but without EXPO any AM5 chip runs memory at a slow default speed."],
    ],
    related: ["9800x3d-vs-7800x3d", "best-cpu-for-rtx-5080-5090", "best-am4-cpu"],
  };
};
