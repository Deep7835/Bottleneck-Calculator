// Guide: 1440p gaming PC build (about $1,200), part list + CPU/GPU options
module.exports = function (h) {
  const { ev, gpu, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitTag, compare } = h;

  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...o });
  const cell = (c, g, r, o = {}) => {
    const x = at(c, g, r, o);
    return `<td class="r">${calc(c, g, { res: r, ...o }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  const UP = { upscale: "quality" };

  // ---- Approximate US street prices, October 2026 (shared with the Mac comparison)
  const { MID: PRICE, sum: sumIn } = require("./prices");
  const usd = ([a, b]) => `$${fmt(a)}–${fmt(b)}`;
  const sum = (keys) => sumIn(PRICE, keys);
  const PLATFORM = ["cooler", "board", "ram32", "ssd", "psu", "case"];

  // ---- The builds: [tag, cpu, gpu]
  const BUILDS = [
    ["Value", "ryzen-5-7600", "rtx-5070"],
    ["Value, 16 GB card", "ryzen-5-7600", "rx-9070"],
    ["Faster card", "ryzen-5-7600", "rx-9070-xt"],
    ["Newer CPU", "ryzen-5-9600x", "rx-9070-xt"],
    ["X3D", "ryzen-5-7600x3d", "rx-9070-xt"],
  ];
  const B = BUILDS.map(([tag, c, g]) => ({
    tag, c, g, price: sum([c, g, ...PLATFORM]),
    n: at(c, g, "1440p"), u: at(c, g, "1440p", UP), rt: at(c, g, "1440p", { workload: "raytracing", ...UP }),
    es: at(c, g, "1440p", { workload: "esports" }), sim: at(c, g, "1440p", { workload: "cpuheavy" }),
  }));
  const buildTable = table(
    ["Build", ["Approx. total", true], ["1440p native", true], ["1440p, upscaling Quality", true], ["Ray tracing + upscaling", true], ["Esports", true]],
    B.map((x) => [
      td(`<strong>${x.tag}</strong><br><small>${build(x.c, x.g)}</small>`),
      td(usd(x.price), true),
      cell(x.c, x.g, "1440p"), cell(x.c, x.g, "1440p", UP), cell(x.c, x.g, "1440p", { workload: "raytracing", ...UP }),
      td(fmt(x.es.fps), true),
    ]),
  );
  const [V, V9, XT, N, X] = B;
  const cheap16 = sum(["ryzen-5-7600", "rtx-5070", "cooler", "board", "ram16", "ssd", "psu", "case"]);
  expect(cheap16[0] <= 1200 && V.price[0] > 1200, "7600 + 5070 reaches $1,200 only with 16 GB");
  expect(B.every((x) => x.n.limiter === "gpu"), "every build is GPU-limited at 1440p native");
  expect(B.every((x) => x.n.fps >= 95 && x.n.fps < 130), "1440p native ~100-125 FPS");
  expect(V.u.verdict.key === "excellent" && V9.u.verdict.key === "excellent", "7600 balanced with 5070/9070 with upscaling");
  expect(XT.u.limiter === "cpu" && XT.u.pct >= 20, "7600 + 9070 XT CPU-limited with upscaling");
  expect(N.u.limiter === "cpu" && N.u.pct < 20, "9600X + 9070 XT minor with upscaling");
  expect(X.u.verdict.key === "excellent" && X.u.fps > XT.u.fps * 1.1, "7600X3D balanced with 9070 XT upscaled, 10%+ faster");
  expect(Math.abs(X.n.fps - XT.n.fps) < 6, "native 1440p: X3D adds only a few FPS");
  const rt = { g70: V.rt, g90: V9.rt, xt: XT.rt, ti: at("ryzen-5-7600", "rtx-5070-ti", "1440p", { workload: "raytracing", ...UP }) };
  expect(rt.g70.fps > rt.g90.fps && Math.abs(rt.g70.fps - rt.xt.fps) < 5 && rt.ti.fps > rt.xt.fps * 1.1, "RT: 5070 beats 9070, ties 9070 XT; 5070 Ti ahead");
  expect(B.every((x) => x.es.fps >= 240) && X.es.fps >= 360 && B.filter((x) => x.es.fps >= 360).length === 1, "esports: all 240+, only X3D 360+");
  const simGain = gain(X.sim.fps, XT.sim.fps), simGainN = gain(N.sim.fps, XT.sim.fps);
  expect(B.every((x) => x.sim.limiter === "cpu") && simGain >= 15, "CPU-heavy: all CPU-bound, X3D 15%+");
  expect(X.n.low1 > XT.n.low1 * 1.05, "X3D better lows");

  // ---- Why the GPU gets the money: same extra spend on CPU or GPU
  const cpuFirst = at("ryzen-5-7600x3d", "rtx-5070", "1440p"), gpuFirst = XT.n;
  const extraCpu = PRICE["ryzen-5-7600x3d"].map((p, i) => p - PRICE["ryzen-5-7600"][i]);
  const extraGpu = PRICE["rx-9070-xt"].map((p, i) => p - PRICE["rtx-5070"][i]);
  expect(Math.abs(extraCpu[0] - extraGpu[0]) <= 20, "X3D upgrade and 9070 XT upgrade cost about the same");
  expect(gpuFirst.fps > cpuFirst.fps * 1.1 && cpuFirst.limiter === "gpu", "GPU upgrade beats CPU upgrade at 1440p");
  const gpuWin = gain(gpuFirst.fps, cpuFirst.fps), cpuOnly = gain(cpuFirst.fps, V.n.fps);
  const tiN = at("ryzen-5-7600", "rtx-5070-ti", "1440p");
  expect(Math.abs(tiN.fps - XT.n.fps) < 3, "5070 Ti and 9070 XT tie at 1440p");
  const xtVs70 = gain(XT.n.fps, V.n.fps), n90vs70 = gain(V9.n.fps, V.n.fps);
  // ---- VRAM
  const u4k = at("ryzen-5-7600", "rtx-5070", "4k", { quality: "ultra" }), uq = at("ryzen-5-7600", "rtx-5070", "1440p", { quality: "ultra" });
  expect(uq.vramNeed <= gpu("rtx-5070").vram && u4k.vramNeed > gpu("rtx-5070").vram && u4k.vramNeed <= 16, "12 GB fine at 1440p Ultra, short at 4K Ultra");
  const k4 = [at("ryzen-5-7600", "rtx-5070", "4k", UP), at("ryzen-5-7600", "rx-9070-xt", "4k", UP)];
  expect(k4.every((x) => x.limiter === "gpu"), "4K upscaled is GPU-bound");
  // ---- Upgrade path
  const later = { r5080: at("ryzen-5-7600", "rtx-5080", "1440p"), r5080u: at("ryzen-5-7600", "rtx-5080", "1440p", UP), x9800u: at("ryzen-7-9800x3d", "rtx-5080", "1440p", UP) };
  expect(later.r5080.verdict.key === "excellent" && later.r5080u.pct >= 25 && later.x9800u.verdict.key === "excellent", "7600 fine with 5080 native, not with upscaling; 9800X3D fixes it");
  const ram16 = at("ryzen-5-7600", "rtx-5070", "1440p", { ram: 16 });
  expect(ram16.limiter === "gpu" && Math.abs(ram16.fps - V.n.fps) < 1, "16 GB costs under 1 FPS here");
  const xtExtra = XT.price.map((p, i) => p - V.price[i]);
  const ultraXT = at("ryzen-5-7600", "rx-9070-xt", "1440p", { quality: "ultra" }), ultraLoss = -gain(ultraXT.fps, XT.n.fps);
  expect(ultraLoss >= 10 && ultraLoss <= 25, "Ultra costs 10-25%");
  const fg = at("ryzen-5-7600", "rtx-5070", "1440p", { workload: "raytracing" });
  expect(fg.fps < 60 && V.rt.fps >= 60, "RT native under 60, upscaled over 60 on the 5070");

  const partRows = [
    ["Processor", `${name("ryzen-5-7600")} (or ${name("ryzen-5-9600x")} / ${name("ryzen-5-7600x3d")})`, usd(PRICE["ryzen-5-7600"]), "Six-core AM5"],
    ["CPU cooler", "Single-tower air cooler", usd(PRICE.cooler), "The 9600X and 7600X3D need one"],
    ["Motherboard", "B650 or B850", usd(PRICE.board), "Check BIOS support for 9000-series"],
    ["Memory", "32 GB (2 × 16 GB) DDR5-6000 CL30", usd(PRICE.ram32), "Most volatile line in 2026"],
    ["Graphics card", `${name("rtx-5070")}, ${name("rx-9070")} or ${name("rx-9070-xt")}`, "$560–820", "Where most of the money goes"],
    ["Storage", "1 TB NVMe SSD, PCIe 4.0 (2 TB if you can)", usd(PRICE.ssd), "Big games take 100 GB+"],
    ["Power supply", "750 W, 80 Plus Gold, ATX 3.1", usd(PRICE.psu), "Covers all three cards"],
    ["Case", "Mid-tower with mesh front and three fans", usd(PRICE.case), "Airflow over looks"],
  ];
  const partTable = table(["Component", "Pick", ["Approx. price", true], "Note"], partRows.map(([a, b, c, d]) => [td(`<strong>${a}</strong>`), td(b), td(c, true), td(`<small>${d}</small>`)]));

  return {
    slug: "1440p-gaming-pc-build",
    title: "1440p Gaming PC Build (2026): $1,200 Part List with FPS",
    description: "1440p gaming PC build around $1,200: part list with approximate October 2026 prices, Ryzen 5 7600, 9600X or 7600X3D with RTX 5070, RX 9070 or 9070 XT, with FPS.",
    h1: "1440p gaming PC build: a $1,200 part list with FPS and bottleneck numbers",
    crumb: "1440p PC build",
    card: "A concrete part list for a 1440p gaming PC around $1,200, five CPU and graphics card options compared, when an X3D chip is worth it, and the upgrade path.",
    lead: `1440p is where a mid-range PC makes the most sense: sharp enough to see the difference from 1080p, light enough that a mid-range card runs it at high frame rates. This guide turns our ${guide("balanced-gaming-pc-build", "balanced PC build guide")} into a concrete part list for about $1,200, compares five CPU and graphics card combinations, and shows when a faster processor is worth the money. Figures come from the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "parts", toc: "The part list", h2: "The part list",
        html: `
          <p>Prices are approximate US street prices, October 2026, and they move. Memory and SSD prices rose sharply from late 2025, and graphics cards followed through 2026, so check current listings before you buy.</p>
          ${partTable}
          <p>With 32 GB of memory, the ${build("ryzen-5-7600", "rtx-5070", "Ryzen 5 7600 + RTX 5070")} version comes to about ${usd(V.price)}. To hit $1,200, start with 16 GB (2 × 8 GB), which brings it to about ${usd(cheap16)}. In our model 16 GB costs less than one FPS on average at 1440p with this pair, and you can add a second pair later when prices settle. The ${name("rx-9070-xt")} versions cost about $${xtExtra[0]}–${xtExtra[1]} more.</p>
          <p>The basics are the same as any build: two memory sticks, EXPO turned on in the BIOS, and a power supply from a reputable brand. A B650 or B850 board is plenty; pricier boards add connectivity, not frame rate.</p>`,
      },
      {
        id: "options", toc: "Five builds compared", h2: "Five CPU and graphics card combinations",
        html: `
          <p>Each row is a complete build from the list. Figures are average FPS in AAA games at 1440p High, natively and with DLSS or FSR on Quality, then ray tracing with upscaling, then CS2-style esports at 1440p. Click a number to open the build in the calculator.</p>
          ${buildTable}
          <p>At native 1440p every build is GPU-limited, from about ${fmt(V.n.fps)} FPS with the ${name("rtx-5070")} to ${fmt(X.n.fps)} with the ${name("rx-9070-xt")} and the X3D chip. That's what you want at this resolution: the money you put into the card turns straight into frames.</p>
          <ul>
            <li><strong>${name("rtx-5070")} or ${name("rx-9070")}?</strong> The ${name("rx-9070")} is about ${n90vs70}% faster in raster and has 16 GB instead of 12. The ${name("rtx-5070")} is faster with ray tracing (${fmt(rt.g70.fps)} vs ${fmt(rt.g90.fps)} FPS with upscaling) and has DLSS 4. See ${compare("rtx-5070", "rx-9070")}.</li>
            <li><strong>The ${name("rx-9070-xt")}</strong> is about ${xtVs70}% faster than the 5070 at native 1440p and matches the ${name("rtx-5070-ti")} in raster in our model (${fmt(XT.n.fps)} vs ${fmt(tiN.fps)} FPS), usually for less money. The 5070 Ti keeps the lead in ray tracing, at ${fmt(rt.ti.fps)} FPS. Compare ${compare("rx-9070-xt", "rx-9070")}, ${compare("rx-9070-xt", "rtx-5070")} and ${compare("rtx-5070-ti", "rx-9070-xt")}.</li>
            <li><strong>Esports</strong> runs at ${fmt(Math.min(...B.map((x) => x.es.fps)))} FPS or more on every build, so any of them suits a 240 Hz monitor. Only the X3D build reaches 360 FPS, at about ${fmt(X.es.fps)}.</li>
          </ul>`,
      },
      {
        id: "monitor", toc: "Monitor and settings", h2: "The monitor and settings to pair it with",
        html: `
          <p>These builds average roughly ${fmt(V.n.fps)}–${fmt(X.n.fps)} FPS in AAA games at native 1440p and ${fmt(V.u.fps)}–${fmt(X.u.fps)} with upscaling, so a 1440p monitor at 144 to 180 Hz is the natural match. Make sure it supports variable refresh (FreeSync or G-Sync Compatible): it keeps motion smooth when the frame rate sits below the refresh rate, which it will in most new games. A 240 Hz or faster panel only pays off if you mainly play competitive games. Our guide to ${guide("what-is-a-good-fps", "what counts as a good FPS")} covers the targets.</p>
          <p><strong>Use High rather than Ultra.</strong> Ultra costs about ${ultraLoss}% of the frame rate with the ${name("rx-9070-xt")} in our model (${fmt(ultraXT.fps)} vs ${fmt(XT.n.fps)} FPS) for a difference that's hard to spot in motion. Keep textures high if the card has the memory, since they cost little speed.</p>
          <p><strong>Use upscaling on Quality in demanding games.</strong> At 1440p, DLSS and FSR Quality render at a lower internal resolution and reconstruct the image, and the result holds up well in most games. It's what makes ray tracing practical here: the ${name("rtx-5070")} runs ray-traced games at about ${fmt(fg.fps)} FPS natively and ${fmt(V.rt.fps)} with DLSS Quality.</p>
          <p><strong>Treat frame generation as a bonus.</strong> DLSS 4 Multi Frame Generation (RTX 50 only) and AMD's frame generation multiply the displayed frame rate, but the game still responds at the rendered rate. Turn it on when the base frame rate is already around 60 or more. Our ${guide("dlss-vs-fsr-vs-xess", "DLSS vs FSR vs XeSS guide")} explains the modes.</p>`,
      },
      {
        id: "gpu-money", toc: "Why the GPU gets the money", h2: "Why the graphics card gets the money",
        html: `
          <p>At 1440p the graphics card sets the frame rate in most games, so the same extra money buys more there. Moving from the ${name("ryzen-5-7600")} to the ${name("ryzen-5-7600x3d")} costs about $${extraCpu[0]}–${extraCpu[1]} more, and so does moving from the ${name("rtx-5070")} to the ${name("rx-9070-xt")}. Spend it on the CPU and the 5070 build gains ${cpuOnly}% at native 1440p (${fmt(V.n.fps)} to ${fmt(cpuFirst.fps)} FPS), because the card was already the limit. Spend it on the card and you get ${fmt(gpuFirst.fps)} FPS, ${gpuWin}% more than the X3D with the 5070.</p>
          <p>Video memory is the other reason to put money into the card. At 1440p Ultra, modern games want about ${uq.vramNeed} GB, which the ${name("rtx-5070")}'s 12 GB covers. At 4K Ultra they want about ${u4k.vramNeed} GB, more than it has, so if a 4K monitor might come later, the 16 GB cards are the safer pick. At 4K with upscaling, every card here is still the limit: about ${fmt(k4[0].fps)} FPS for the 5070 and ${fmt(k4[1].fps)} for the 9070 XT.</p>
          <p>For more on the trade-off, see our guides to the ${guide("best-cpu-for-rtx-5070", "best CPU for the RTX 5070")} and the ${guide("best-cpu-for-rx-9070-xt", "best CPU for the RX 9070 XT")}.</p>`,
      },
      {
        id: "x3d", toc: "When an X3D is worth it", h2: "When the Ryzen 5 7600X3D or 9600X is worth it",
        html: `
          <p>At native 1440p, a faster CPU adds little: the X3D build is only ${fmt(X.n.fps - XT.n.fps)} FPS ahead of the ${name("ryzen-5-7600")} with the same ${name("rx-9070-xt")}. It starts to pay off in four situations.</p>
          <ul>
            <li><strong>You always use upscaling with a fast card.</strong> DLSS and FSR make the card faster, so the CPU has to keep up. With FSR Quality, the ${name("ryzen-5-7600")} becomes ${verdict(XT.u)} with the ${name("rx-9070-xt")} at about ${fmt(XT.u.fps)} FPS. The ${name("ryzen-5-9600x")} is ${verdict(N.u)} at ${fmt(N.u.fps)}, and the ${name("ryzen-5-7600x3d")} is balanced at ${fmt(X.u.fps)}. With the ${name("rtx-5070")} or ${name("rx-9070")}, the 7600 stays balanced even with upscaling, so the cheaper chip is fine there.</li>
            <li><strong>You play CPU-heavy games.</strong> In simulators, strategy games and MMOs at 1440p every build is CPU-limited. The X3D is about ${simGain}% faster than the 7600 (${fmt(X.sim.fps)} vs ${fmt(XT.sim.fps)} FPS), and the 9600X about ${simGainN}%.</li>
            <li><strong>You play esports on a 360 Hz monitor.</strong> Only the X3D build clears 360 FPS.</li>
            <li><strong>You care about 1% lows.</strong> The extra cache smooths frame times: in our model the X3D build holds ${fmt(X.n.low1)} FPS 1% lows at 1440p against ${fmt(XT.n.low1)} for the 7600.</li>
          </ul>
          <p>If none of those apply, the 7600 is the value pick and the money is better spent on the card. The ${name("ryzen-5-9600x")} sits in between: a little faster, usually a little more expensive, and it needs its own cooler. The ${name("ryzen-5-7600x3d")} has mainly been sold through Micro Center in the US, so availability varies; a ${name("ryzen-7-7800x3d")} is the wider-available alternative at a higher price. See ${compare("ryzen-5-9600x", "ryzen-5-7600")}, ${compare("ryzen-5-7600x3d", "ryzen-7-7800x3d")} and our ${guide("best-am5-cpu", "best AM5 CPU guide")}.</p>`,
      },
      {
        id: "upgrade", toc: "Upgrade path", h2: "The upgrade path",
        html: `
          <p>An AM5 build with a 750 W supply leaves room for both main upgrades.</p>
          <h3>A faster graphics card</h3>
          <p>The ${name("ryzen-5-7600")} keeps up with an ${name("rtx-5080")} at native 1440p (${verdict(later.r5080)}, about ${fmt(later.r5080.fps)} FPS). With DLSS Quality, though, it becomes ${verdict(later.r5080u)}. So a card upgrade on its own works if you play native, and pairs best with a CPU upgrade if you rely on upscaling. Check the power figure first: NVIDIA recommends 850 W for an RTX 5080.</p>
          <h3>A faster processor</h3>
          <p>AM5 takes later Ryzen chips on the same board after a BIOS update. A ${name("ryzen-7-9800x3d")} makes the RTX 5080 ${verdict(later.x9800u)} with DLSS at 1440p, about ${fmt(later.x9800u.fps)} FPS. Our ${guide("9800x3d-vs-7800x3d", "9800X3D vs 7800X3D comparison")} covers which X3D chip is worth it.</p>
          <h3>Memory and storage</h3>
          <p>If you started with 16 GB, adding a second pair to reach 32 GB is the cheapest upgrade with a real effect, mainly fewer stutters in big open-world games. Add a second NVMe drive when the first fills up.</p>
          <p>Coming from a cheaper build? Our ${guide("budget-gaming-pc-build", "budget gaming PC build")} shows the 1080p tier below this one.</p>`,
      },
    ],
    faq: [
      ["How much does a 1440p gaming PC cost in 2026?", `About $1,200 with 16 GB of RAM, or ${usd(V.price)} with 32 GB, for a Ryzen 5 7600 and RTX 5070 build at approximate October 2026 US street prices. Memory and graphics card prices rose through 2026, so check current listings.`],
      ["What is the best graphics card for 1440p gaming on a budget?", `The RTX 5070, RX 9070 or RX 9070 XT. With a Ryzen 5 7600 at 1440p High they average about ${fmt(V.n.fps)}, ${fmt(V9.n.fps)} and ${fmt(XT.n.fps)} FPS in AAA games. The RX 9070 cards have 16 GB of video memory; the RTX 5070 has 12 GB and stronger ray tracing.`],
      ["Is the Ryzen 5 7600 good enough for 1440p gaming?", `Yes. It keeps an RTX 5070, RX 9070 or RX 9070 XT GPU-limited at native 1440p. With upscaling, it stays balanced with the 5070 and 9070, but holds a 9070 XT back by about ${pct(XT.u)}%.`],
      ["Is the Ryzen 5 7600X3D worth it for 1440p?", `Only in specific cases: CPU-heavy games, where it's about ${simGain}% faster than a Ryzen 5 7600, esports on a 360 Hz monitor, or a fast card with upscaling always on. At native 1440p in AAA games it adds only a few FPS, and the money usually buys more as a faster graphics card.`],
      ["Is 12 GB of VRAM enough for 1440p?", `For 1440p in 2026, yes. Modern games want about ${uq.vramNeed} GB at 1440p Ultra, which fits in the RTX 5070's 12 GB. At 4K Ultra they want about ${u4k.vramNeed} GB, so a 16 GB card is safer if you might move to 4K.`],
      ["What power supply do I need for a 1440p gaming PC?", "A good 750 W unit covers the RTX 5070, RX 9070 and RX 9070 XT with headroom. NVIDIA recommends 650 W for an RTX 5070 and 850 W for an RTX 5080, so 750 W is a sensible middle if you might upgrade."],
    ],
    related: ["balanced-gaming-pc-build", "best-cpu-for-rtx-5070", "best-cpu-for-rx-9070-xt"],
  };
};
