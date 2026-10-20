// Guide: Best CPU for RX 9070 XT / RX 9070
module.exports = function (h) {
  const { ev, gpu, pct, gain, fmt, name, verdict, expect, calc, build, compare, guide, link, table, td, limitTag } = h;

  const CPUS = [
    "ryzen-5-5600", "i5-12400f", "i5-13400f", "ryzen-7-5700x3d", "ryzen-5-7600", "ryzen-5-9600x",
    "i5-14600k", "ultra-7-265k", "ryzen-7-7800x3d", "ryzen-7-9800x3d",
  ];
  const RESES = ["1080p", "1440p", "4k"];
  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...o });
  const cell = (c, g, r, o = {}) => {
    const x = at(c, g, r, o);
    return `<td class="r">${calc(c, g, { res: r, ...o }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  const matrix = (g) => table(
    ["CPU", ["1080p", true], ["1440p", true], ["4K", true]],
    CPUS.map((c) => [td(build(c, g, `<strong>${name(c)}</strong>`)), ...RESES.map((r) => cell(c, g, r))]),
  );
  const ok = (x) => x.verdict.key === "excellent" || x.limiter === "gpu";
  const grid = (g) => Object.fromEntries(CPUS.map((c) => [c, RESES.map((r) => at(c, g, r))]));

  // ---- GPU facts
  const xt = gpu("rx-9070-xt"), non = gpu("rx-9070"), ti = gpu("rtx-5070-ti");
  const gapXt = gain(xt.g, non.g);
  expect(xt.vram === 16 && non.vram === 16, "both cards have 16 GB");
  expect(Math.abs(xt.g - ti.g) <= 2, "9070 XT and 5070 Ti are within 2 points in raster");
  const vram4k = at("ryzen-7-7800x3d", "rx-9070-xt", "4k", { quality: "ultra" });
  expect(vram4k.vramNeed <= 16, "4K Ultra fits in 16 GB");

  // ---- RX 9070 XT
  const X = grid("rx-9070-xt");
  expect(CPUS.filter((c) => c !== "ryzen-5-5600").every((c) => ok(X[c][1])), "every CPU but the 5600 is balanced or GPU-limited with a 9070 XT at 1440p");
  expect(X["ryzen-5-5600"][1].limiter === "cpu" && X["ryzen-5-5600"][1].pct < 20, "5600: minor limit with a 9070 XT at 1440p");
  expect(X["i5-12400f"][1].verdict.key === "excellent", "12400F balanced with a 9070 XT at 1440p");
  expect(ok(X["ryzen-7-7800x3d"][0]) && ok(X["ryzen-7-9800x3d"][0]), "X3D chips use the whole 9070 XT at 1080p");
  expect(CPUS.filter((c) => !/x3d/.test(c)).every((c) => X[c][0].limiter === "cpu" && X[c][0].pct >= 10), "non-X3D CPUs are 10%+ limited with a 9070 XT at 1080p");
  expect(X["ryzen-5-7600"][0].pct >= 20 && X["i5-14600k"][0].pct < 20, "7600 moderate, 14600K minor at 1080p with a 9070 XT");
  expect(CPUS.every((c) => X[c][2].limiter === "gpu"), "everything GPU-limited with a 9070 XT at 4K");
  const x4k = CPUS.map((c) => X[c][2].fps);
  const lows = ["ryzen-7-5700x3d", "ryzen-5-5600", "ryzen-5-7600", "ryzen-7-7800x3d"].map((c) => X[c][1].low1);
  expect(lows[0] > lows[2] && lows[2] > lows[1] && Math.abs(X["ryzen-7-5700x3d"][1].fps - X["ryzen-5-7600"][1].fps) < 3, "5700X3D has better lows than the 7600 at similar averages");
  expect(["i5-14600k", "ultra-7-265k"].every((c) => X[c][1].limiter === "gpu" && X[c][0].pct < 20), "14600K/265K: minor at 1080p, GPU-limited at 1440p");
  expect(non.g > gpu("rtx-5070").g && non.g < ti.g, "9070 sits between the 5070 and 5070 Ti");

  // ---- RX 9070
  const N = grid("rx-9070");
  expect(CPUS.every((c) => ok(N[c][1])), "every CPU is balanced or GPU-limited with a 9070 at 1440p");
  expect(N["ryzen-5-5600"][1].verdict.key === "excellent", "5600 balanced with a 9070 at 1440p");
  const n1080ok = ["ryzen-5-9600x", "i5-14600k", "ultra-7-265k", "ryzen-7-7800x3d", "ryzen-7-9800x3d"];
  expect(n1080ok.every((c) => ok(N[c][0])), "9600X/14600K/265K/X3D are balanced with a 9070 at 1080p");
  expect(["ryzen-5-7600", "ryzen-7-5700x3d", "i5-13400f"].every((c) => N[c][0].limiter === "cpu" && N[c][0].pct < 20), "7600/5700X3D/13400F: minor limit with a 9070 at 1080p");
  expect(N["i5-12400f"][0].pct >= 20 && N["ryzen-5-5600"][0].pct >= 20, "12400F and 5600 are 20%+ limited with a 9070 at 1080p");

  // ---- vs RTX 5070 Ti
  const T = grid("rtx-5070-ti");
  const signed = (x) => (x.limiter === "cpu" ? x.pct : -x.pct);
  const sameCpu = CPUS.every((c) => RESES.every((r, i) => Math.abs(signed(X[c][i]) - signed(T[c][i])) < 3));
  expect(sameCpu, "9070 XT and 5070 Ti have the same CPU needs in raster");
  const rt = (c, g, r) => at(c, g, r, { workload: "raytracing" });
  const rtX = rt("ryzen-7-7800x3d", "rx-9070-xt", "1440p"), rtT = rt("ryzen-7-7800x3d", "rtx-5070-ti", "1440p");
  const rtGap = gain(rtT.fps, rtX.fps);
  expect(rtGap >= 10, "5070 Ti is 10%+ faster in ray tracing");
  const rt5600 = [rt("ryzen-5-5600", "rx-9070-xt", "1080p"), rt("ryzen-5-5600", "rtx-5070-ti", "1080p")];
  expect(ok(rt5600[0]) && rt5600[1].limiter === "cpu" && rt5600[1].pct >= 10, "RT 1080p: 5600 fine with 9070 XT, 10%+ limits 5070 Ti");

  // ---- Upscaling (FSR 4) at 1440p
  const up = (c) => at(c, "rx-9070-xt", "1440p", { upscale: "quality" });
  const up7600 = up("ryzen-5-7600"), up7800 = up("ryzen-7-7800x3d"), up5700 = up("ryzen-7-5700x3d");
  expect(X["ryzen-5-7600"][1].limiter === "gpu" && up7600.limiter === "cpu" && up7600.pct >= 15, "FSR Quality makes the 7600 + 9070 XT CPU-limited at 1440p");
  expect(up7800.verdict.key === "excellent", "7800X3D balanced with 9070 XT at 1440p FSR Quality");
  const upGain = gain(up7800.fps, up7600.fps);

  // ---- AM4
  const am4 = { x3d: X["ryzen-7-5700x3d"], s: X["ryzen-5-5600"] };
  expect(am4.x3d[1].verdict.key === "excellent" && am4.s[1].limiter === "cpu", "5700X3D balanced at 1440p, 5600 not");
  const am4Gain = gain(am4.x3d[0].fps, am4.s[0].fps);
  const am4n = N["ryzen-7-5700x3d"];

  // ---- Esports and CPU-heavy (9070 XT)
  const es = (c) => at(c, "rx-9070-xt", "1080p", { workload: "esports" });
  const esR = Object.fromEntries(["ryzen-5-5600", "ryzen-5-7600", "i5-14600k", "ryzen-7-7800x3d", "ryzen-7-9800x3d"].map((c) => [c, es(c)]));
  expect(Object.values(esR).every((x) => x.fps >= 240), "every CPU clears 240 Hz in esports");
  expect(esR["ryzen-5-7600"].fps < 360 && ["i5-14600k", "ryzen-7-7800x3d", "ryzen-7-9800x3d"].every((c) => esR[c].fps >= 360), "360 Hz needs a 14600K or X3D");
  const sim = (c) => at(c, "rx-9070-xt", "1440p", { workload: "cpuheavy" });
  const sims = ["ryzen-5-5600", "ryzen-5-7600", "ryzen-7-7800x3d", "ryzen-7-9800x3d"].map(sim);
  expect(sims.every((x) => x.limiter === "cpu"), "CPU-heavy games are CPU-limited at 1440p with a 9070 XT");

  return {
    slug: "best-cpu-for-rx-9070-xt",
    title: "Best CPU for RX 9070 XT and RX 9070 (2026): No-Bottleneck Picks",
    description: "Which CPU should you pair with an RX 9070 XT or RX 9070? FPS and bottleneck for 10 CPUs at 1080p, 1440p and 4K, FSR 4 and SAM notes, and AM4 picks.",
    h1: "Best CPU for the RX 9070 XT and RX 9070",
    crumb: "Best CPU for RX 9070 XT",
    card: "FPS and bottleneck for 10 CPUs with each Radeon card at 1080p, 1440p and 4K, plus FSR 4, Smart Access Memory and the AM4 option.",
    lead: `The RX 9070 XT and RX 9070 are 1440p cards, and at 1440p they're happy with a modest CPU. At 1080p, with FSR on, or in CPU-heavy games, the processor matters a lot more. Here's how 10 popular CPUs pair with each card, calculated with the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "picks", toc: "Quick picks", h2: "Quick picks",
        html: `
          <div class="callout">
            <p><strong>RX 9070 XT, best value: Ryzen 5 7600 or Core i5-12400F</strong> for 1440p, where both are balanced or GPU-limited with the card.</p>
            <p><strong>RX 9070, best value: keep your Ryzen 5 5600.</strong> It's ${verdict(N["ryzen-5-5600"][1])} with the 9070 at 1440p.</p>
            <p><strong>AM4 upgrade: Ryzen 7 5700X3D.</strong> ${verdict(am4.x3d[1]).replace(/^b/, "B")} with a 9070 XT at 1440p, with no new board or RAM.</p>
            <p><strong>1080p high refresh: Ryzen 7 7800X3D or 9800X3D.</strong> The only CPUs in our table that keep a 9070 XT fully busy at 1080p.</p>
            <p><strong>Intel:</strong> Core i5-14600K or Core Ultra 7 265K, each ${verdict(X["i5-14600k"][0])} with a 9070 XT at 1080p and GPU-limited at 1440p.</p>
          </div>`,
      },
      {
        id: "how-fast", toc: "How fast are these cards?", h2: "How fast are the RX 9070 XT and RX 9070?",
        html: `
          <p>In our GPU index (RTX 4090 = 100) the RX 9070 XT scores ${xt.g} and the RX 9070 ${non.g}, so the XT is about ${gapXt}% faster. Both have ${xt.vram} GB of VRAM, which covers 4K Ultra in current games (about ${Math.round(vram4k.vramNeed)} GB in our model) with room to spare. The ${compare("rx-9070-xt", "rx-9070", "RX 9070 XT vs RX 9070")} page has the full comparison.</p>
          <p>In raster games the 9070 XT sits level with an RTX 5070 Ti (${ti.g} in our index), and the 9070 lands between an RTX 5070 and a 5070 Ti. The cards launched at $599 (9070 XT) and $549 (9070) as US MSRPs, against $749 for the 5070 Ti. Street prices have moved around since, so compare current prices before you buy.</p>
          <p>What this means for the CPU: the faster the card, the more frames per second the processor has to prepare. At 1080p High the 9070 XT can render about ${fmt(X["ryzen-7-9800x3d"][0].gpuFps)} FPS in AAA games, which is more than most mid-range CPUs can deliver.</p>`,
      },
      {
        id: "rx-9070-xt", toc: "CPUs for the RX 9070 XT", h2: "CPUs with the RX 9070 XT: FPS and bottleneck",
        html: `
          <p>Average FPS in AAA games at High settings without upscaling, with the bottleneck below each figure. Click a number to open that build in the calculator, or a CPU name for its build page.</p>
          ${matrix("rx-9070-xt")}
          <p><strong>At 1440p</strong> nearly any modern six-core is enough. The ${build("i5-12400f", "rx-9070-xt", "Core i5-12400F")} is ${verdict(X["i5-12400f"][1])}, the ${name("ryzen-5-7600")} is ${verdict(X["ryzen-5-7600"][1])}, and only the ${name("ryzen-5-5600")} falls slightly behind at ${pct(X["ryzen-5-5600"][1])}% CPU-limited. <strong>At 4K</strong> every CPU lands between ${fmt(Math.min(...x4k))} and ${fmt(Math.max(...x4k))} FPS.</p>
          <p><strong>At 1080p</strong> the card outruns every non-X3D chip in the table. The ${name("ryzen-5-7600")} is ${pct(X["ryzen-5-7600"][0])}% CPU-limited, the ${name("i5-14600k")} ${pct(X["i5-14600k"][0])}%, and only the ${name("ryzen-7-7800x3d")} and ${name("ryzen-7-9800x3d")} use the whole card. The X3D chips also lead on 1% lows: at 1440p the ${name("ryzen-7-5700x3d")} holds ${fmt(lows[0])} FPS lows against ${fmt(lows[1])} on the 5600 and ${fmt(lows[2])} on the 7600, even where the averages are close.</p>`,
      },
      {
        id: "rx-9070", toc: "CPUs for the RX 9070", h2: "CPUs with the RX 9070: FPS and bottleneck",
        html: `
          <p>Same settings, with the non-XT card:</p>
          ${matrix("rx-9070")}
          <p>The 9070 is about ${gapXt}% slower, so it's easier to feed. At <strong>1440p</strong> every CPU in the table is balanced or GPU-limited, including the ${build("ryzen-5-5600", "rx-9070", "Ryzen 5 5600")} at about ${fmt(N["ryzen-5-5600"][1].fps)} FPS. At <strong>1080p</strong> the ${name("ryzen-5-9600x")}, ${name("i5-14600k")}, ${name("ultra-7-265k")} and both X3D chips keep it fully busy, while the ${name("ryzen-5-7600")} and ${name("ryzen-7-5700x3d")} are only ${pct(N["ryzen-5-7600"][0])}% and ${pct(N["ryzen-7-5700x3d"][0])}% CPU-limited. The 5600 and 12400F are ${pct(N["ryzen-5-5600"][0])}% and ${pct(N["i5-12400f"][0])}% behind at 1080p, so for a 1080p high-refresh build, pair the 9070 with something newer.</p>`,
      },
      {
        id: "vs-5070-ti", toc: "Same CPU as an RTX 5070 Ti?", h2: "Does the 9070 XT need the same CPU as an RTX 5070 Ti?",
        html: `
          <p>In raster games, yes. The two cards are so close in speed that every CPU in our table lands within a few points of the same bottleneck with either one, at every resolution. Our ${guide("best-cpu-for-rtx-5070", "best CPU for RTX 5070 and 5070 Ti guide")} covers the NVIDIA side, and ${compare("rtx-5070-ti", "rx-9070-xt", "RTX 5070 Ti vs RX 9070 XT")} compares the cards directly. For the cheaper pair, see ${compare("rx-9070", "rtx-5070", "RX 9070 vs RTX 5070")}.</p>
          <p>Ray tracing is where they part ways. RDNA 4 improved Radeon ray tracing a lot, but in our model the 5070 Ti is still about ${rtGap}% faster in ray-traced games (${fmt(rtT.fps)} against ${fmt(rtX.fps)} FPS at 1440p with a 7800X3D). A slower GPU is easier for the CPU to keep up with, so with ray tracing on, even a ${name("ryzen-5-5600")} is ${verdict(rt5600[0])} with a 9070 XT at 1080p, while it's ${verdict(rt5600[1])} with a 5070 Ti. If you mostly play ray-traced games, a 9070 XT is one of the more forgiving cards to pair with an older CPU.</p>
          <p>The other differences are features. DLSS 4 is NVIDIA-only, and its Multi Frame Generation needs an RTX 50 card, while the 9070 cards get FSR 4. Both upscalers shift work to the CPU the same way, which the next section shows.</p>`,
      },
      {
        id: "amd-features", toc: "FSR 4 and Smart Access Memory", h2: "FSR 4, Smart Access Memory and what they mean for the CPU",
        html: `
          <p><strong>FSR 4 needs an RDNA 4 card.</strong> AMD's machine-learning upscaler runs on the RX 9000 series. Older Radeon cards stay on FSR 3.1. In games that support FSR 3.1, the AMD driver can often switch the game to FSR 4. Our ${guide("dlss-vs-fsr-vs-xess", "DLSS vs FSR vs XeSS guide")} compares the upscalers.</p>
          <p><strong>Upscaling raises the CPU's share of the work.</strong> FSR renders each frame at a lower internal resolution, so the GPU finishes sooner and the CPU has to prepare more frames. With a 9070 XT at 1440p, the ${name("ryzen-5-7600")} goes from ${verdict(X["ryzen-5-7600"][1])} at native resolution to ${verdict(up7600)} with FSR Quality. The ${name("ryzen-7-7800x3d")} is ${verdict(up7800)} there and runs about ${upGain}% faster. If you plan to use FSR at 1440p every day, a faster CPU is worth more than the native tables suggest.</p>
          <p><strong>Turn on Smart Access Memory.</strong> SAM is AMD's name for Resizable BAR, which lets the CPU address the card's whole memory at once. It usually adds a few percent, more in some games, and it's worth leaving on with these cards. Enable it in the BIOS (often called Above 4G Decoding and Re-Size BAR Support). Windows must boot in UEFI mode with CSM off. It works on Intel boards too, under the name Resizable BAR. Most AM4 boards with a Ryzen 3000 or newer CPU support it after a BIOS update.</p>`,
      },
      {
        id: "by-platform", toc: "Picks by platform", h2: "The best CPU for each budget and platform",
        html: `
          <h3>AM4: Ryzen 7 5700X3D</h3>
          <p>The classic budget pairing for these cards. The ${build("ryzen-7-5700x3d", "rx-9070-xt", "5700X3D + 9070 XT")} is ${verdict(am4.x3d[1])} at 1440p and about ${am4Gain}% faster than a ${name("ryzen-5-5600")} at 1080p. With the 9070 it's ${verdict(am4n[1])} at 1440p. It drops into your existing board with your DDR4, after a BIOS update. Our ${guide("best-am4-cpu", "best AM4 CPU guide")} covers the checks.</p>
          <h3>New AM5 build: Ryzen 5 7600, or a 7800X3D for 1080p</h3>
          <p>The 7600 is the value choice for 1440p with either card. For 1080p high refresh or CPU-heavy games, the 7800X3D or 9800X3D is the better buy. Our ${guide("best-am5-cpu", "best AM5 CPU guide")} compares the whole range.</p>
          <h3>Intel: Core i5-12400F to i5-14600K</h3>
          <p>A 12400F or 13400F is enough for 1440p. The 14600K or Core Ultra 7 265K handles 1080p with a minor bottleneck. On 13th or 14th gen, install the latest BIOS with Intel's stability microcode first.</p>
          <h3>Power supply</h3>
          <p>A quality 750 W unit covers a 9070 XT with any CPU in this guide, and 650 W is plenty for the 9070. Check which power connectors your model uses, since partner cards differ. Both cards are PCIe 5.0 x16 and run fine in a PCIe 4.0 slot, with only a small loss on PCIe 3.0.</p>`,
      },
      {
        id: "high-refresh", toc: "Esports and CPU-heavy games", h2: "Esports, simulators and strategy games",
        html: `
          <p>In CS2-style esports games at 1080p low settings, a 9070 XT runs at about ${fmt(esR["ryzen-5-5600"].fps)} FPS on a ${name("ryzen-5-5600")}, ${fmt(esR["ryzen-5-7600"].fps)} on a ${name("ryzen-5-7600")}, ${fmt(esR["i5-14600k"].fps)} on a ${name("i5-14600k")} and ${fmt(esR["ryzen-7-9800x3d"].fps)} on a ${name("ryzen-7-9800x3d")}. Every one clears 240 Hz. For 360 Hz you need the 14600K or an X3D chip.</p>
          <p>Simulators, strategy games and MMOs are CPU-limited even at 1440p with a 9070 XT, on every CPU we checked: about ${fmt(sims[0].fps)} FPS on the 5600, ${fmt(sims[1].fps)} on the 7600, ${fmt(sims[2].fps)} on the 7800X3D and ${fmt(sims[3].fps)} on the 9800X3D. If those are your games, spend more on the CPU. The ${link.fps("FPS calculator")} has game-by-game numbers.</p>`,
      },
    ],
    faq: [
      ["What is the best CPU for an RX 9070 XT?", `For 1440p, a Ryzen 5 7600 or Core i5-12400F is enough. For 1080p high refresh, a Ryzen 7 7800X3D or 9800X3D, the only CPUs in our table that keep the card fully busy at 1080p. On AM4, a Ryzen 7 5700X3D is ${verdict(am4.x3d[1])} at 1440p.`],
      ["Will a Ryzen 5 5600 bottleneck an RX 9070 XT?", `A little at 1440p (${pct(X["ryzen-5-5600"][1])}% CPU-limited, a minor bottleneck) and clearly at 1080p (${pct(X["ryzen-5-5600"][0])}%). At 4K it's GPU-limited. With the non-XT RX 9070, the 5600 is balanced at 1440p.`],
      ["Is the Ryzen 7 5700X3D good with an RX 9070 XT?", `Yes. It's ${verdict(am4.x3d[1])} at 1440p, about ${fmt(am4.x3d[1].fps)} FPS in AAA games at High, and about ${am4Gain}% faster than a Ryzen 5 5600 at 1080p. It's the best upgrade for an AM4 owner buying this card.`],
      ["Does the RX 9070 XT need a faster CPU than the RTX 5070 Ti?", `No. In raster games the two cards need the same CPU at every resolution. With ray tracing on, the 9070 XT is slower, so it's actually easier for an older CPU to keep up with.`],
      ["Does FSR 4 work on older Radeon cards?", "FSR 4 runs on RDNA 4, the RX 9000 series. Older Radeon cards use FSR 3.1. With an RX 9070 or 9070 XT, the AMD driver can often upgrade FSR 3.1 games to FSR 4."],
      ["Should I enable Smart Access Memory with an RX 9070 XT?", "Yes. Smart Access Memory (Resizable BAR) usually adds a few percent and more in some games. Enable Above 4G Decoding and Re-Size BAR in the BIOS, with Windows booting in UEFI mode."],
    ],
    related: ["best-cpu-for-rtx-5070", "best-am4-cpu", "best-cpu-for-rtx-5080-5090"],
  };
};
