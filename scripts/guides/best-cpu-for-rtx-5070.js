// Guide: Best CPU for RTX 5070 / 5070 Ti
module.exports = function (h) {
  const { ev, gpu, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitTag } = h;

  const CPUS = [
    "ryzen-5-3600", "ryzen-5-5600", "i5-12400f", "i5-13400f", "ryzen-7-5700x3d", "ryzen-5-7600",
    "ryzen-5-9600x", "i5-14600k", "ultra-7-265k", "ryzen-7-7800x3d", "ryzen-7-9800x3d",
  ];
  const RESES = ["1080p", "1440p", "4k"];
  const cell = (c, g, r) => {
    const x = ev(c, g, { res: r });
    return `<td class="r">${calc(c, g, { res: r }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  const matrix = (g) => table(
    ["CPU", ["1080p", true], ["1440p", true], ["4K", true]],
    CPUS.map((c) => [td(build(c, g, `<strong>${name(c)}</strong>`)), ...RESES.map((r) => cell(c, g, r))]),
  );

  // Facts the copy relies on
  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...o });
  const v7600 = [at("ryzen-5-7600", "rtx-5070", "1080p"), at("ryzen-5-7600", "rtx-5070", "1440p")];
  expect(v7600[0].verdict.key === "excellent" && v7600[1].limiter === "gpu", "7600 is balanced with a 5070 at 1080p and GPU-bound at 1440p");
  const min5070 = at("ryzen-5-5600", "rtx-5070", "1440p");
  const min5070i = at("i5-12400f", "rtx-5070", "1440p");
  expect(min5070.verdict.key === "excellent" && min5070i.limiter === "gpu", "5600 and 12400F are enough for a 5070 at 1440p");
  const ti = {
    "7800": RESES.map((r) => at("ryzen-7-7800x3d", "rtx-5070-ti", r)),
    "7600": RESES.map((r) => at("ryzen-5-7600", "rtx-5070-ti", r)),
    "13400": at("i5-13400f", "rtx-5070-ti", "1440p"),
    "12400": at("i5-12400f", "rtx-5070-ti", "1440p"),
    "14600": RESES.map((r) => at("i5-14600k", "rtx-5070-ti", r)),
    "3600": RESES.map((r) => at("ryzen-5-3600", "rtx-5070-ti", r)),
  };
  expect(ti["7800"][0].verdict.key === "excellent" && ti["7800"][1].limiter === "gpu", "7800X3D + 5070 Ti: balanced at 1080p, GPU-bound at 1440p");
  expect(ti["7600"][1].verdict.key === "excellent" && ti["7600"][0].limiter === "cpu" && ti["7600"][0].pct >= 15, "7600 + 5070 Ti: balanced at 1440p, CPU-bound at 1080p");
  expect(ti["13400"].verdict.key === "excellent" && ti["12400"].verdict.key === "excellent", "12400F/13400F are balanced with a 5070 Ti at 1440p");
  expect(ti["3600"][1].limiter === "cpu" && ti["3600"][1].pct >= 25, "3600 badly limits a 5070 Ti at 1440p");
  const tiLow = [at("ryzen-7-7800x3d", "rtx-5070-ti", "1440p").low1, at("ryzen-5-7600", "rtx-5070-ti", "1440p").low1];
  const es = ["ryzen-5-7600", "ryzen-7-7800x3d", "ryzen-7-9800x3d"].map((c) => [c, at(c, "rtx-5070-ti", "1080p", { workload: "esports" })]);
  const sim = ["ryzen-5-7600", "ryzen-7-7800x3d"].map((c) => at(c, "rtx-5070-ti", "1440p", { workload: "cpuheavy" }));
  const vram4k = at("ryzen-7-7800x3d", "rtx-5070", "4k", { quality: "ultra" });
  expect(vram4k.vramNeed > gpu("rtx-5070").vram && vram4k.vramNeed <= gpu("rtx-5070-ti").vram, "4K Ultra needs more than 12 GB but fits in 16 GB");
  const gpuGap = gain(gpu("rtx-5070-ti").g, gpu("rtx-5070").g);
  const tiNine = at("ryzen-7-9800x3d", "rtx-5070-ti", "1440p");
  expect(Math.round(tiNine.fps) === Math.round(ti["7800"][1].fps), "9800X3D and 7800X3D land on the same FPS with a 5070 Ti at 1440p");
  expect(CPUS.filter((c) => !/7800x3d|9800x3d/.test(c)).every((c) => { const x = at(c, "rtx-5070-ti", "1080p"); return x.limiter === "cpu" && x.pct >= 10; }), "only the 7800X3D/9800X3D keep a 5070 Ti busy at 1080p");
  for (const c of ["i5-14600k", "ultra-7-265k"]) {
    expect(at(c, "rtx-5070", "1080p").verdict.key === "excellent", `${c} is balanced with a 5070 at 1080p`);
    const x = at(c, "rtx-5070-ti", "1080p"); expect(x.pct < 20, `${c} is within a minor bottleneck with a 5070 Ti at 1080p`);
  }
  expect(at("ryzen-5-5600", "rtx-5070-ti", "1440p").pct < 20 && at("i5-12400f", "rtx-5070", "1080p").pct < 20, "FAQ: minor bottlenecks");
  expect(es[0][1].fps >= 240 && es[0][1].fps < 360 && es[1][1].fps >= 360 && es[2][1].fps >= 360, "esports: all clear 240 Hz, only X3D clear 360 Hz");
  const x3d5070 = at("ryzen-7-5700x3d", "rtx-5070", "1080p");
  expect(x3d5070.verdict.key === "excellent", "5700X3D is balanced with a 5070 at 1080p");

  return {
    slug: "best-cpu-for-rtx-5070",
    title: "Best CPU for RTX 5070 and RTX 5070 Ti (2026): No-Bottleneck Picks",
    description: "Which CPU should you pair with an RTX 5070 or 5070 Ti? FPS and bottleneck at 1080p, 1440p and 4K for 11 CPUs, from Ryzen 5 5600 to 9800X3D, plus picks by budget.",
    h1: "Best CPU for the RTX 5070 and RTX 5070 Ti",
    crumb: "Best CPU for RTX 5070",
    card: "FPS and bottleneck for 11 CPUs with each card at 1080p, 1440p and 4K, plus the best pick for every budget and platform.",
    lead: `The RTX 5070 and 5070 Ti are 1440p cards first, and at 1440p they're easier to feed than most people think. At 1080p, or with a high-refresh monitor, the CPU starts to matter a lot more. Here's how 11 popular processors pair with each card, calculated with the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "picks", toc: "Quick picks", h2: "Quick picks",
        html: `
          <div class="callout">
            <p><strong>RTX 5070, best value: Ryzen 5 7600.</strong> ${verdict(v7600[0]).replace(/^b/, "B")} at 1080p and GPU-limited at 1440p, on a platform with an upgrade path.</p>
            <p><strong>RTX 5070 Ti, best value: Ryzen 5 7600 or Core i5-13400F</strong> for 1440p, where both are balanced with the card.</p>
            <p><strong>Best for either card: Ryzen 7 7800X3D or 9800X3D.</strong> No meaningful CPU bottleneck at any resolution, the best 1% lows, and headroom for your next graphics card.</p>
            <p><strong>Already on AM4?</strong> A Ryzen 7 5700X3D drop-in is ${verdict(x3d5070)} with an RTX 5070 at 1080p and balanced with a 5070 Ti at 1440p.</p>
            <p><strong>Intel:</strong> Core i5-14600K or Core Ultra 7 265K for 1080p high refresh. A Core i5-12400F is enough for 1440p.</p>
          </div>`,
      },
      {
        id: "how-fast", toc: "How fast are these cards?", h2: "How fast are the RTX 5070 and 5070 Ti?",
        html: `
          <p>In our GPU index (RTX 4090 = 100) the RTX 5070 scores ${gpu("rtx-5070").g} and the RTX 5070 Ti ${gpu("rtx-5070-ti").g}, so the Ti is about ${gpuGap}% faster. The 5070 lands near an RTX 4070 Super, and the 5070 Ti sits between an RTX 4070 Ti Super and a 4080. They also differ in memory: 12 GB on the 5070 and 16 GB on the Ti.</p>
          <p>That memory gap matters more than it sounds. At 4K Ultra, modern games want around ${Math.round(vram4k.vramNeed)} GB of VRAM, more than the 5070 has, so you'll want to drop textures a notch at 4K. The 5070 Ti has room to spare. At 1080p and 1440p, 12 GB is fine for now.</p>
          <p>The higher the GPU's frame rate, the faster the CPU has to be to keep up. That's why the 5070 Ti is noticeably fussier about its partner, especially at 1080p, where it can push past ${fmt(ti["7800"][0].gpuFps)} FPS in AAA games at High settings.</p>`,
      },
      {
        id: "rtx-5070", toc: "CPUs for the RTX 5070", h2: "CPUs with the RTX 5070: FPS and bottleneck",
        html: `
          <p>Average FPS in AAA games at High settings without upscaling, with the bottleneck below each figure. Click a number to open that build in the calculator, or a CPU name for its build page where we have one.</p>
          ${matrix("rtx-5070")}
          <p>The pattern is clear. At <strong>1440p</strong> almost any modern six-core is enough: a ${name("ryzen-5-5600")} is ${verdict(min5070)} and a ${name("i5-12400f")} is GPU-limited, both around ${fmt(min5070.fps)}–${fmt(min5070i.fps)} FPS. At <strong>4K</strong> the CPU barely matters at all. At <strong>1080p</strong> the older chips fall behind, and you need a ${name("ryzen-5-7600")}, ${name("ryzen-7-5700x3d")} or faster to use the whole card.</p>`,
      },
      {
        id: "rtx-5070-ti", toc: "CPUs for the RTX 5070 Ti", h2: "CPUs with the RTX 5070 Ti: FPS and bottleneck",
        html: `
          <p>Same settings, faster card:</p>
          ${matrix("rtx-5070-ti")}
          <p>At 1440p the ${name("ryzen-5-7600")}, ${name("i5-13400f")} and even the ${name("i5-12400f")} are balanced with a 5070 Ti, so you don't need an expensive processor for a 1440p build. At 1080p it's a different story: the ${name("ryzen-5-7600")} is ${pct(ti["7600"][0])}% CPU-limited, and only the ${name("ryzen-7-7800x3d")} and ${name("ryzen-7-9800x3d")} keep the card fully busy. An older ${name("ryzen-5-3600")} holds the 5070 Ti back by ${pct(ti["3600"][1])}% even at 1440p, so that pairing needs a CPU upgrade first.</p>`,
      },
      {
        id: "7800x3d-5070-ti", toc: "7800X3D with a 5070 Ti?", h2: "Does the Ryzen 7 7800X3D work well with the RTX 5070 Ti?",
        html: `
          <p>Yes, it's one of the best pairings you can build. At 1080p the ${build("ryzen-7-7800x3d", "rtx-5070-ti", "Ryzen 7 7800X3D + RTX 5070 Ti")} is balanced (${verdict(ti["7800"][0])}, about ${fmt(ti["7800"][0].fps)} FPS in AAA games). At 1440p the graphics card becomes the limit at about ${fmt(ti["7800"][1].fps)} FPS, and at 4K it's about ${fmt(ti["7800"][2].fps)} FPS. That's GPU-limited, which is what you want, with the CPU's spare capacity showing up as steadier frame times.</p>
          <p>The 7800X3D's real advantage over a cheaper chip at 1440p is the 1% lows and the CPU-heavy games. In our model it holds ${fmt(tiLow[0])} FPS 1% lows at 1440p against ${fmt(tiLow[1])} for the ${name("ryzen-5-7600")}, and in simulators and strategy games it averages about ${fmt(sim[1].fps)} FPS against ${fmt(sim[0].fps)}. Is the 9800X3D worth it on top? Not for this card. At 1440p it lands on the same ${fmt(tiNine.fps)} FPS because the GPU is the limit. Its extra speed only shows at 1080p in esports or with a faster card later.</p>`,
      },
      {
        id: "by-budget", toc: "Picks by budget", h2: "The best CPU for each budget and platform",
        html: `
          <h3>Budget: keep what you have, if it's a Ryzen 5 5600 or Core i5-12400F</h3>
          <p>For a 1440p gamer either card is a better first purchase than a new platform. Both CPUs are close to balanced with the 5070 at 1440p and the 12400F is balanced with the Ti. Upgrade the CPU later if you move to a high-refresh 1080p monitor.</p>
          <h3>AM4 owners: Ryzen 7 5700X3D</h3>
          <p>The cheapest big upgrade for either card if you're on AM4 already. No new board or RAM. Our ${guide("best-am4-cpu", "best AM4 CPU guide")} covers the BIOS and cooler checks.</p>
          <h3>New build, mid-range: Ryzen 5 7600 or 9600X</h3>
          <p>AM5 with DDR5, enough for either card at 1440p, and a socket that takes faster chips later. The 9600X is a little quicker, but the 7600 is usually the better value.</p>
          <h3>Intel: Core i5-14600K or Core Ultra 7 265K</h3>
          <p>Both keep the RTX 5070 balanced at 1080p and the 5070 Ti within a minor bottleneck. The ${name("i5-14600k")} is ${verdict(ti["14600"][0])} with the Ti at 1080p. If you go with 13th or 14th gen, install the latest BIOS with Intel's stability microcode before anything else.</p>
          <h3>No compromises: Ryzen 7 7800X3D or 9800X3D</h3>
          <p>The fastest gaming CPUs, with the best 1% lows. Worth it if you play at 1080p, play CPU-heavy or competitive games, or plan to move up to an RTX 5080-class card on the same platform.</p>`,
      },
      {
        id: "older", toc: "Older CPUs, PCIe and frame gen", h2: "Older CPUs, PCIe 3.0 and frame generation",
        html: `
          <p><strong>Pairing with an older CPU.</strong> Plenty of people drop one of these cards into an existing PC. With a ${name("ryzen-5-3600")} the RTX 5070 is ${verdict(at("ryzen-5-3600", "rtx-5070", "1440p"))} at 1440p, which is livable, but the 5070 Ti is ${pct(ti["3600"][1])}% CPU-limited, so a chunk of what you paid for goes unused. A ${name("i5-10400f")} behaves much the same. The card still works and you'll still gain FPS over an older GPU. You just won't see all of it until the CPU catches up, and playing at 1440p or higher is the easiest way to hide the gap in the meantime.</p>
          <p><strong>PCIe 3.0 boards.</strong> Both cards are PCIe 5.0 x16, but they run fine in older slots. Because they use all 16 lanes, the loss on PCIe 4.0 is negligible and on PCIe 3.0 (B450, A520 and 10th-gen Intel boards) usually only a few percent. It's not a reason to replace a motherboard.</p>
          <p><strong>DLSS 4 frame generation needs a decent CPU too.</strong> Multi Frame Generation multiplies the frames your PC renders, but it can't fix a low base frame rate. Input still responds at the rendered rate, and NVIDIA recommends starting from around 60 FPS or more. If your CPU caps the base frame rate at 50, frame generation will show a big number on the counter while still feeling sluggish. A balanced CPU gives frame generation a solid base to build on.</p>`,
      },
      {
        id: "high-refresh", toc: "High refresh and esports", h2: "1080p high refresh and esports",
        html: `
          <p>Competitive games at low settings move almost all the work to the processor. With an RTX 5070 Ti at 1080p, CS2-style esports titles run at about ${es.map(([c, x]) => `${fmt(x.fps)} FPS on the ${name(c)}`).join(", ").replace(/, ([^,]*)$/, " and $1")}. On a 240 Hz monitor any of them will do. On 360 Hz or faster, the X3D chips are the ones that keep up. For game-by-game numbers, use the ${link.fps("FPS calculator")}.</p>
          <p>If you're torn between 1080p and 1440p for either of these cards, the answer is usually 1440p. Both cards are GPU-limited there with a mid-range CPU, so you get a sharper image at little FPS cost. Our guide on ${guide("does-resolution-affect-bottleneck", "how resolution affects bottlenecks")} shows why.</p>`,
      },
    ],
    faq: [
      ["What CPU do I need for an RTX 5070?", `For 1440p, a Ryzen 5 5600 or Core i5-12400F is enough. The 5600 is ${verdict(min5070)} with the card in AAA games. For 1080p high refresh, choose a Ryzen 5 7600, Ryzen 7 5700X3D, Core i5-14600K or faster.`],
      ["Will a Ryzen 5 5600 bottleneck an RTX 5070 Ti?", `Slightly at 1440p (${pct(at("ryzen-5-5600", "rtx-5070-ti", "1440p"))}% CPU-limited, which is minor) and clearly at 1080p (${pct(at("ryzen-5-5600", "rtx-5070-ti", "1080p"))}%). At 4K it's GPU-limited. For a 1440p build it's acceptable. For 1080p, pair the 5070 Ti with a faster CPU.`],
      ["Is the Ryzen 7 7800X3D good with the RTX 5070 Ti?", `Yes. It's balanced at 1080p and GPU-limited at 1440p and 4K, so the card is fully used everywhere. Expect about ${fmt(ti["7800"][1].fps)} FPS at 1440p High in AAA games.`],
      ["Is the Ryzen 5 7600 good enough for an RTX 5070 Ti?", `At 1440p, yes: the two are balanced at about ${fmt(ti["7600"][1].fps)} FPS. At 1080p the 7600 holds the card back by about ${pct(ti["7600"][0])}%, so a 7800X3D is the better match for 1080p high refresh.`],
      ["Is 12 GB of VRAM on the RTX 5070 enough?", `For 1080p and 1440p in 2026, yes. At 4K Ultra, games want around ${Math.round(vram4k.vramNeed)} GB, so lower texture quality one step at 4K. The 5070 Ti's 16 GB has more headroom for the next few years.`],
      ["Is the Core i5-12400F enough for an RTX 5070?", `At 1440p, yes. It's GPU-limited at about ${fmt(min5070i.fps)} FPS. At 1080p it holds the card back by about ${pct(at("i5-12400f", "rtx-5070", "1080p"))}%, which is a minor bottleneck.`],
    ],
    related: ["ryzen-7-7800x3d-rtx-5070-ti", "best-cpu-for-rtx-5060", "best-am4-cpu"],
  };
};
