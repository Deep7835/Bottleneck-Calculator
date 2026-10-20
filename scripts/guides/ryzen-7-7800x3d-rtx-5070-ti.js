// Guide: Is the Ryzen 7 7800X3D good with the RTX 5070 Ti?
module.exports = function (h) {
  const { ev, cpu, gpu, pct, gain, fmt, name, verdict, expect, calc, build, hasBuild, guide, link, table, td, limitTag, limitCell, Engine } = h;

  const C = "ryzen-7-7800x3d", G = "rtx-5070-ti";
  const RESES = ["1080p", "1440p", "4k"];
  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...o });
  const cell = (c, g, r, o = {}) => {
    const x = at(c, g, r, o);
    return `<td class="r">${calc(c, g, { res: r, ...o }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  expect(hasBuild(C, G), "7800X3D + 5070 Ti build page exists");

  // ---- Resolution table
  const RES_ROWS = ["1080p", "1440p", "uw1440", "4k"];
  const byRes = Object.fromEntries(RES_ROWS.map((r) => [r, at(C, G, r)]));
  const resTable = table(
    ["Resolution", ["CPU limit", true], ["GPU limit", true], ["Avg FPS", true], ["1% low", true], "Bottleneck"],
    RES_ROWS.map((r) => {
      const x = byRes[r];
      return [td(Engine.RES[r].full), td(fmt(x.cpuFps), true), td(fmt(x.gpuFps), true), td(fmt(x.fps), true), td(fmt(x.low1), true), td(limitCell(x))];
    }),
  );
  const [r1080, r1440, r4k] = RESES.map((r) => byRes[r]);
  expect(r1080.verdict.key === "excellent", "7800X3D + 5070 Ti is balanced at 1080p");
  expect(r1440.limiter === "gpu" && r4k.limiter === "gpu", "7800X3D + 5070 Ti is GPU-bound at 1440p and 4K");
  expect(byRes.uw1440.limiter === "gpu", "GPU-bound at ultrawide 1440p");
  const headroom = gain(r1440.cpuFps, r1440.gpuFps);
  expect(headroom >= 30, "the CPU has 30%+ headroom over the GPU at 1440p");

  // ---- Game types
  const TYPES = [
    ["AAA games, native", {}],
    ["AAA games, DLSS Quality", { upscale: "quality" }],
    ["Ray tracing, native", { workload: "raytracing" }],
    ["Ray tracing, DLSS Quality", { workload: "raytracing", upscale: "quality" }],
    ["Esports (CS2, Valorant)", { workload: "esports" }],
    ["CPU-heavy (sims, strategy, MMO)", { workload: "cpuheavy" }],
  ];
  const typeTable = table(
    ["Game type", ["1080p", true], ["1440p", true], ["4K", true]],
    TYPES.map(([label, o]) => [td(label), ...RESES.map((r) => cell(C, G, r, o))]),
  );
  const t = Object.fromEntries(TYPES.map(([label, o], i) => [i, RESES.map((r) => at(C, G, r, o))]));
  const [aaaDlss, rt, rtDlss, es, heavy] = [t[1], t[2], t[3], t[4], t[5]];
  expect(aaaDlss[1].verdict.key === "excellent" && aaaDlss[1].fps >= 144, "DLSS Quality at 1440p is balanced and over 144 FPS");
  expect(rt.every((x) => x.limiter === "gpu") && rt[2].fps < 60, "ray tracing is GPU-bound everywhere and under 60 at 4K native");
  expect(rtDlss[1].fps >= 90 && rtDlss[2].fps >= 60, "RT + DLSS Quality: 90+ at 1440p, 60+ at 4K");
  expect(es[0].fps >= 360 && es[1].fps >= 360, "esports over 360 FPS at 1080p and 1440p");
  expect(heavy[0].limiter === "cpu" && heavy[1].limiter === "cpu" && heavy[2].verdict.key === "excellent", "CPU-heavy: CPU-bound at 1080p/1440p, balanced at 4K");

  // ---- Versus other CPUs
  const VS = ["ryzen-5-7600", "i5-14600k", "ultra-7-265k", "ryzen-5-7600x3d", C, "ryzen-7-9800x3d"];
  const vsTable = table(
    ["CPU", ["1080p", true], ["1440p", true], ["4K", true], ["1440p 1% low", true], ["CPU-heavy 1440p", true]],
    VS.map((c) => [
      td(build(c, G, `<strong>${name(c)}</strong>`)),
      ...RESES.map((r) => cell(c, G, r)),
      td(fmt(at(c, G, "1440p").low1), true),
      td(fmt(at(c, G, "1440p", { workload: "cpuheavy" }).fps), true),
    ]),
  );
  const nine = RESES.map((r) => at("ryzen-7-9800x3d", G, r));
  const six = RESES.map((r) => at("ryzen-5-7600", G, r));
  const nineCap = gain(cpu("ryzen-7-9800x3d").g, cpu(C).g);
  const nine1080 = gain(nine[0].fps, r1080.fps);
  expect(nine1080 > 0 && nine1080 <= 7, "9800X3D is only a few percent faster at 1080p");
  expect(Math.round(nine[1].fps) === Math.round(r1440.fps) && Math.round(nine[2].fps) === Math.round(r4k.fps), "9800X3D = 7800X3D at 1440p and 4K");
  const six1080 = gain(r1080.fps, six[0].fps);
  const six1440 = gain(r1440.fps, six[1].fps);
  expect(six[0].limiter === "cpu" && six[0].pct >= 20 && six1080 >= 15, "7600 is clearly CPU-bound at 1080p");
  expect(six[1].verdict.key === "excellent" && six1440 <= 6, "7600 is balanced and close at 1440p");
  const lows = [at("ryzen-5-7600", G, "1440p").low1, r1440.low1];
  const heavyVs = [at("ryzen-5-7600", G, "1440p", { workload: "cpuheavy" }).fps, heavy[1].fps, at("ryzen-7-9800x3d", G, "1440p", { workload: "cpuheavy" }).fps];
  const heavyGain = gain(heavyVs[1], heavyVs[0]);
  expect(heavyGain >= 20, "7800X3D is much faster than 7600 in CPU-heavy games");
  const esNine = at("ryzen-7-9800x3d", G, "1080p", { workload: "esports" });
  const esSix = at("ryzen-5-7600", G, "1080p", { workload: "esports" });
  expect(esSix.fps < 360 && esSix.fps >= 300, "7600 esports between 300 and 360");
  const x3d76 = at("ryzen-5-7600x3d", G, "1080p");
  expect(x3d76.verdict.key === "excellent", "7600X3D is balanced at 1080p");
  for (const c of ["i5-14600k", "ultra-7-265k"]) expect(at(c, G, "1080p").verdict.key === "good" && at(c, G, "1440p").limiter === "gpu", `${c}: minor at 1080p, GPU-bound at 1440p`);

  // ---- Future GPUs
  const FUT = ["rtx-5070-ti", "rtx-5080", "rtx-4090", "rtx-5090"];
  const futTable = table(
    ["Graphics card", ["1080p", true], ["1440p", true], ["4K", true], ["4K DLSS Quality", true]],
    FUT.map((g) => [td(build(C, g, `<strong>${name(g)}</strong>`)), ...RESES.map((r) => cell(C, g, r)), cell(C, g, "4k", { upscale: "quality" })]),
  );
  const f80 = RESES.map((r) => at(C, "rtx-5080", r));
  const f90 = RESES.map((r) => at(C, "rtx-5090", r));
  const n90 = RESES.map((r) => at("ryzen-7-9800x3d", "rtx-5090", r));
  const f90d = at(C, "rtx-5090", "4k", { upscale: "quality" });
  const n90d = at("ryzen-7-9800x3d", "rtx-5090", "4k", { upscale: "quality" });
  expect(f80[0].verdict.key === "good" && f80[0].limiter === "cpu" && f80[1].limiter === "gpu" && f80[2].limiter === "gpu", "5080: minor CPU limit at 1080p, GPU-bound above");
  expect(f90[0].limiter === "cpu" && f90[0].pct >= 35, "5090 is badly CPU-bound at 1080p");
  expect(f90[1].limiter === "cpu" && f90[1].verdict.key === "good", "5090 at 1440p: minor CPU bottleneck");
  expect(f90[2].limiter === "gpu" && Math.abs(f90[2].fps - n90[2].fps) < 3, "5090 at 4K native: GPU-bound, 7800X3D ~ 9800X3D");
  expect(f90d.verdict.key === "excellent", "5090 at 4K DLSS Quality is balanced with the 7800X3D");
  const f90gap = gain(n90[1].fps, f90[1].fps);
  const fut5080gain = gain(f80[1].fps, r1440.fps);

  // ---- RAM / streaming
  const ram16 = at(C, G, "1080p", { ram: 16 });
  expect(ram16.verdict.key === "excellent", "16 GB is still balanced at 1080p");
  const stream = [at(C, G, "1080p", { streaming: true }), at(C, G, "1440p", { streaming: true })];
  expect(stream[0].verdict.key === "good" && stream[1].limiter === "gpu", "x264 streaming: minor at 1080p, GPU-bound at 1440p");
  const vram4k = at(C, G, "4k", { quality: "ultra", workload: "raytracing" }).vramNeed;
  expect(vram4k <= gpu(G).vram, "4K Ultra RT fits in 16 GB");

  return {
    slug: "ryzen-7-7800x3d-rtx-5070-ti",
    title: "Ryzen 7 7800X3D + RTX 5070 Ti: A Good Pairing? FPS and Bottleneck",
    description: "Does the Ryzen 7 7800X3D work well with the RTX 5070 Ti? Bottleneck and FPS at 1080p, 1440p and 4K, by game type, vs 9800X3D and 7600, plus PSU and RAM advice.",
    h1: "Is the Ryzen 7 7800X3D good with the RTX 5070 Ti?",
    crumb: "7800X3D + RTX 5070 Ti",
    card: "The verdict at 1080p, 1440p and 4K, FPS by game type, how it compares to the 9800X3D and 7600, and whether it can drive an RTX 5080 or 5090 later.",
    lead: `Short answer: yes, it's one of the best-balanced builds you can put together in 2026. The longer answer depends on your monitor and the games you play, so here are the numbers for every resolution and game type, a comparison with the CPUs people usually cross-shop, and what happens if you upgrade the graphics card later. Every figure comes from the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "verdict", toc: "The verdict", h2: "The verdict at 1080p, 1440p and 4K",
        html: `
          <div class="callout">
            <p><strong>1080p: balanced.</strong> The 7800X3D and RTX 5070 Ti are ${verdict(r1080)} at about ${fmt(r1080.fps)} FPS in AAA games at High settings. Neither part is waiting on the other.</p>
            <p><strong>1440p: GPU-limited, the way it should be.</strong> About ${fmt(r1440.fps)} FPS, with the CPU able to prepare roughly ${headroom}% more frames than the card can draw.</p>
            <p><strong>4K: GPU-limited.</strong> About ${fmt(r4k.fps)} FPS natively, or ${fmt(aaaDlss[2].fps)} with DLSS Quality.</p>
            <p><strong>Who should look elsewhere:</strong> almost nobody. If you only play at 1440p or 4K and want to save money, a ${name("ryzen-5-7600")} gets within ${six1440}% at 1440p. If you play competitive shooters on a 360 Hz or faster monitor, the 9800X3D has a small edge.</p>
          </div>
          <p>A bottleneck isn't a fault: one part always sets the frame rate, and in a gaming PC you want it to be the graphics card. The 7800X3D clears that bar with room to spare: its frame-rate ceiling in modern AAA games is around ${fmt(r1080.cpuFps)} FPS, and the 5070 Ti only gets that high at 1080p. For the full build page with upgrade suggestions, see ${build(C, G, "Ryzen 7 7800X3D + RTX 5070 Ti")}.</p>`,
      },
      {
        id: "resolution", toc: "FPS by resolution", h2: "FPS and bottleneck at each resolution",
        html: `
          <p>AAA games at High settings, native resolution, 32 GB of RAM. The CPU limit is how many frames per second the processor can prepare; the GPU limit is how many the graphics card can draw at that resolution. The lower one sets your frame rate.</p>
          ${resTable}
          <p>Notice that the CPU limit stays at ${fmt(r1080.cpuFps)} FPS in every row. The processor does the same work per frame whatever the resolution, while the graphics card's limit falls as the pixel count rises. At 1080p the two lines almost meet, which is why the build is balanced there. From 1440p up the card is the limit, and the bottleneck percentage you see is the CPU's unused headroom, not lost performance. Our guide to ${guide("does-resolution-affect-bottleneck", "how resolution affects bottlenecks")} explains the effect in detail.</p>
          <p>The 1% lows are the number to watch for smoothness. At 1440p this build holds about ${fmt(r1440.low1)} FPS in the worst 1% of frames, which is excellent. X3D chips get a bonus here because the 96 MB of L3 cache cuts the slow trips to system memory that cause most CPU-side stutter.</p>`,
      },
      {
        id: "game-types", toc: "FPS by game type", h2: "FPS by game type",
        html: `
          <p>Average FPS for the 7800X3D and RTX 5070 Ti in different kinds of games.</p>
          ${typeTable}
          <h3>AAA and ray tracing</h3>
          <p>In regular AAA games at 1440p, turning on DLSS Quality lifts the frame rate to about ${fmt(aaaDlss[1].fps)} FPS, and the build stays ${verdict(aaaDlss[1])}. That's a good fit for a 144 to 165 Hz monitor. Ray tracing is where the 5070 Ti works hardest: about ${fmt(rt[1].fps)} FPS at 1440p and ${fmt(rt[2].fps)} at 4K natively, GPU-limited at every resolution. With DLSS Quality those become about ${fmt(rtDlss[1].fps)} and ${fmt(rtDlss[2].fps)} FPS, which is how most people will play. Frame generation can multiply that further, and the high base frame rate keeps it feeling responsive.</p>
          <h3>Esports</h3>
          <p>Competitive games shift the load onto the processor. At 1080p the build reaches about ${fmt(es[0].fps)} FPS in CS2-style titles, ${verdict(es[0])}, and still about ${fmt(es[1].fps)} FPS at 1440p. That's comfortably above 360 Hz at either resolution. For game-by-game estimates, the ${link.fps("FPS calculator")} has per-title presets.</p>
          <h3>Simulators, strategy and MMOs</h3>
          <p>This is the one category where the CPU limits the build: around ${fmt(heavy[1].fps)} FPS at 1440p in games like Microsoft Flight Simulator, Cities: Skylines II or a busy World of Warcraft raid, with the card partly idle. These games are limited by the processor on any hardware, and the 7800X3D is one of the best chips for them. Only at 4K does the graphics card catch up, where the two are ${verdict(heavy[2])}.</p>`,
      },
      {
        id: "vs-cpus", toc: "vs 9800X3D and 7600", h2: "How it compares to the 9800X3D, the 7600 and Intel",
        html: `
          <p>The same RTX 5070 Ti with the usual alternatives. AAA games at High; the last column is a CPU-heavy game at 1440p.</p>
          ${vsTable}
          <h3>Ryzen 7 9800X3D</h3>
          <p>The 9800X3D is about ${nineCap}% faster than the 7800X3D when the processor is the limit. With a 5070 Ti that shows up only at 1080p, where it's ${nine1080}% ahead (${fmt(nine[0].fps)} vs ${fmt(r1080.fps)} FPS). At 1440p and 4K the two land on exactly the same ${fmt(r1440.fps)} and ${fmt(r4k.fps)} FPS, because the graphics card is the limit. In CPU-heavy games and esports the newer chip keeps its lead: about ${fmt(heavyVs[2])} vs ${fmt(heavyVs[1])} FPS in a simulator at 1440p, and ${fmt(esNine.fps)} vs ${fmt(es[0].fps)} FPS in esports at 1080p.</p>
          <p>If you already own a 7800X3D, upgrading to a 9800X3D for this card makes no sense. If you're buying now, pick whichever costs less unless you play simulators or competitive shooters on a very fast monitor, or you plan to move up to an RTX 5090.</p>
          <h3>Ryzen 5 7600</h3>
          <p>The ${name("ryzen-5-7600")} is the value alternative, and at 1440p it's a perfectly good one: ${verdict(six[1])} at about ${fmt(six[1].fps)} FPS, just ${six1440}% behind. At 1080p it's ${pct(six[0])}% CPU-limited, and the 7800X3D is ${six1080}% faster. The 7600 also holds about ${fmt(lows[0])} FPS 1% lows at 1440p against ${fmt(lows[1])}, and in CPU-heavy games the 7800X3D is ${heavyGain}% faster. In esports the 7600 manages about ${fmt(esSix.fps)} FPS, fine for 240 Hz but short of 360 Hz.</p>
          <p>A sensible plan on a tighter budget: buy the 7600 now, play at 1440p, and drop in an X3D chip later on the same AM5 board. The six-core ${name("ryzen-5-7600x3d")}, where you can find it, is ${verdict(x3d76)} with this card even at 1080p.</p>
          <h3>Intel alternatives</h3>
          <p>The ${name("i5-14600k")} and ${name("ultra-7-265k")} both have a minor CPU bottleneck at 1080p and are GPU-limited at 1440p, so either is a reasonable partner for a 5070 Ti. Neither matches the 7800X3D's 1% lows or simulator performance, and both draw more power in games. For the full field of options, read our ${guide("best-cpu-for-rtx-5070", "best CPU for the RTX 5070 and 5070 Ti")} guide.</p>`,
      },
      {
        id: "future-gpu", toc: "Upgrading to a 5080 or 5090", h2: "Can the 7800X3D handle an RTX 5080 or 5090 later?",
        html: `
          <p>The 7800X3D with faster cards, AAA games at High:</p>
          ${futTable}
          <p><strong>RTX 5080: yes, comfortably.</strong> With a 5080 the 7800X3D is only ${verdict(f80[0])} at 1080p, a minor bottleneck, and the card is the limit at 1440p and 4K. Moving from the 5070 Ti to a 5080 would lift 1440p performance by about ${fut5080gain}% with no CPU change.</p>
          <p><strong>RTX 5090: at 4K, yes. Below that, partly.</strong> At native 4K the 7800X3D and 9800X3D both reach about ${fmt(f90[2].fps)} FPS with a 5090, and with DLSS Quality the 7800X3D is ${verdict(f90d)} at about ${fmt(f90d.fps)} FPS (${fmt(n90d.fps)} with a 9800X3D). At 1440p the 7800X3D is ${verdict(f90[1])}, a minor bottleneck, and the 9800X3D is about ${f90gap}% faster. At 1080p the 5090 is ${pct(f90[0])}% CPU-limited, but nobody should buy a 5090 for 1080p.</p>
          <p>The other half of the answer is the platform. AM5 takes current and future Ryzen chips, so if a future graphics card does outgrow the 7800X3D, the fix is a CPU swap and a BIOS update, not a new motherboard and memory.</p>`,
      },
      {
        id: "psu-ram", toc: "PSU, RAM and the rest", h2: "PSU, RAM, motherboard and cooling",
        html: `
          <h3>Power supply</h3>
          <p>NVIDIA recommends a 750 W power supply for a system with an RTX 5070 Ti, and that's the right size here. The 7800X3D typically draws well under 100 W in games, so the card is most of the load. Buy a quality 750 W unit, ideally ATX 3.1 with a native 12V-2x6 (16-pin) cable, since most 5070 Ti models use that connector. If your supply only has 8-pin PCIe cables, the adapter in the graphics card's box is fine; just push every plug in until it clicks. If a 5080 is in your plans, an 850 W unit now saves buying twice. For a 5090, NVIDIA's recommendation is 1000 W.</p>
          <h3>Memory</h3>
          <p>32 GB of DDR5 in two sticks is the right amount for a gaming PC in 2026. DDR5-6000 CL30 is the usual sweet spot for AM5; enable EXPO in the BIOS or it'll run at a much slower default speed. X3D chips are less sensitive to memory speed than other Ryzens, so you don't need an expensive kit. With 16 GB the build is still ${verdict(ram16)} at 1080p in our model (${fmt(ram16.fps)} FPS), but 32 GB leaves room for newer games plus Discord and a browser in the background.</p>
          <h3>Motherboard and cooling</h3>
          <p>A B650 or B850 board is plenty. The 7800X3D can't be overclocked the usual way, so expensive X670E or X870E boards add connectivity, not gaming speed. Update the BIOS before installing Windows to get the latest stability and memory fixes. Many B650 boards run the graphics slot at PCIe 4.0 rather than 5.0, which costs the 5070 Ti nothing measurable. The 7800X3D doesn't come with a cooler; a decent single-tower air cooler keeps it at full boost.</p>
          <h3>Streaming</h3>
          <p>Use NVENC, the 5070 Ti's hardware encoder, and streaming costs almost nothing. If you stream with the CPU-based x264 encoder instead, the 7800X3D gives up some headroom: our model puts it at ${verdict(stream[0])} at 1080p and still GPU-limited at 1440p.</p>`,
      },
      {
        id: "monitor", toc: "Best monitor for this build", h2: "Which monitor suits this build?",
        html: `
          <p>A <strong>1440p monitor at 144 to 180 Hz</strong> is the natural match. The card is fully used, AAA games run at around ${fmt(r1440.fps)} FPS natively and ${fmt(aaaDlss[1].fps)} with DLSS Quality, and esports titles run well past the refresh rate. A 1440p ultrawide works too: about ${fmt(byRes.uw1440.fps)} FPS natively, still GPU-limited.</p>
          <p>A <strong>4K monitor</strong> is fine if you're happy to use DLSS, which the 5070 Ti does very well. The card's 16 GB of VRAM covers 4K Ultra with ray tracing, which wants around ${Math.round(vram4k)} GB in our model.</p>
          <p>A <strong>1080p monitor</strong> only makes sense for competitive play at 240 Hz or more. For everything else, 1080p leaves image quality on the table with a card this fast. If you're still choosing parts, our guide to ${guide("balanced-gaming-pc-build", "planning a balanced gaming PC build")} shows how this pairing fits into the wider range of builds.</p>`,
      },
    ],
    faq: [
      ["Does the Ryzen 7 7800X3D bottleneck the RTX 5070 Ti?", `No. The two are balanced at 1080p (${pct(r1080)}% apart) and the graphics card is the limit at 1440p and 4K. The only exception is CPU-heavy games such as simulators and strategy titles, which are limited by the processor on any hardware.`],
      ["How many FPS does a 7800X3D and RTX 5070 Ti get at 1440p?", `About ${fmt(r1440.fps)} FPS in AAA games at High settings natively, ${fmt(aaaDlss[1].fps)} FPS with DLSS Quality, and over ${Math.floor(es[1].fps / 10) * 10} FPS in esports titles. Ray tracing at 1440p runs at about ${fmt(rt[1].fps)} FPS natively or ${fmt(rtDlss[1].fps)} with DLSS Quality.`],
      ["Is the 9800X3D worth it over the 7800X3D for an RTX 5070 Ti?", `Usually not. They produce the same ${fmt(r1440.fps)} FPS at 1440p and ${fmt(r4k.fps)} FPS at 4K with this card. The 9800X3D is ${nine1080}% faster at 1080p and leads in simulators and esports, so it's worth it only for those uses or if you plan to buy an RTX 5090.`],
      ["What PSU do I need for a 7800X3D and RTX 5070 Ti?", "A quality 750 W power supply, which is NVIDIA's recommendation for the RTX 5070 Ti. An ATX 3.1 unit with a native 16-pin 12V-2x6 cable is the tidiest option. Choose 850 W if you might upgrade to an RTX 5080."],
      ["Can the Ryzen 7 7800X3D handle an RTX 5090?", `At 4K, yes: it reaches about ${fmt(f90[2].fps)} FPS natively, the same as a 9800X3D. At 1440p it's ${verdict(f90[1])}, a minor bottleneck, and the 9800X3D is about ${f90gap}% faster. With an RTX 5080 the 7800X3D is GPU-limited at 1440p and 4K.`],
      ["Is a Ryzen 5 7600 good enough for an RTX 5070 Ti instead?", `For 1440p, yes. It's ${verdict(six[1])} at about ${fmt(six[1].fps)} FPS, within ${six1440}% of the 7800X3D. At 1080p it's ${pct(six[0])}% CPU-limited, and the 7800X3D is ${heavyGain}% faster in CPU-heavy games.`],
    ],
    related: ["best-cpu-for-rtx-5070", "balanced-gaming-pc-build", "does-resolution-affect-bottleneck"],
  };
};
