// Guide: Budget gaming PC build (about $700, 1080p), part list + CPU/GPU options
module.exports = function (h) {
  const { ev, gpu, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitTag, compare } = h;

  // Budget builds run 16 GB of RAM, so every figure here uses 16 GB.
  const R = { ram: 16 };
  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...R, ...o });
  const cell = (c, g, r, o = {}) => {
    const x = at(c, g, r, o);
    return `<td class="r">${calc(c, g, { res: r, ...R, ...o }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };

  // ---- Approximate US street prices, October 2026 (shared with the Mac comparison)
  const { BUDGET: PRICE, budgetTotal } = require("./prices");
  const usd = ([a, b]) => `$${fmt(a)}–${fmt(b)}`;

  // ---- The four builds: [tag, cpu, gpu, board, memory]
  const BUILDS = [
    ["Cheapest", "ryzen-5-5600", "arc-b580", "am4", "ddr4"],
    ["GeForce", "i5-12400f", "rtx-5060", "lga1700", "ddr4"],
    ["AM5", "ryzen-5-7500f", "rx-9060-xt-8gb", "am5", "ddr5"],
    ["AM5, 16 GB card", "ryzen-5-7500f", "rx-9060-xt-16gb", "am5", "ddr5"],
  ];
  const total = ([, c, g, b, m]) => budgetTotal(c, g, b, m);
  const B = BUILDS.map((b) => ({
    b, price: total(b),
    p: at(b[1], b[2], "1080p"), ul: at(b[1], b[2], "1080p", { quality: "ultra" }),
    q: at(b[1], b[2], "1440p"), qu: at(b[1], b[2], "1440p", { upscale: "quality" }),
    es: at(b[1], b[2], "1080p", { workload: "esports" }),
  }));
  const buildTable = table(
    ["Build", ["Approx. total", true], ["1080p High", true], ["1440p High", true], ["1440p, upscaling Quality", true], ["Esports 1080p", true]],
    B.map((x) => [
      td(`<strong>${x.b[0]}</strong><br><small>${build(x.b[1], x.b[2])}</small>`),
      td(usd(x.price), true),
      cell(x.b[1], x.b[2], "1080p"), cell(x.b[1], x.b[2], "1440p"), cell(x.b[1], x.b[2], "1440p", { upscale: "quality" }),
      td(fmt(x.es.fps), true),
    ]),
  );
  expect(B.every((x) => x.p.limiter === "gpu"), "every budget build is GPU-limited at 1080p High");
  expect(B[0].price[0] < 700 && B[0].price[1] > 700, "the cheapest build straddles $700");
  expect(B.slice(1).every((x) => x.price[0] > B[0].price[0]), "the B580 build is the cheapest");
  const fpsSorted = B.map((x) => x.p.fps);
  expect(fpsSorted[0] < fpsSorted[1] && fpsSorted[1] < fpsSorted[2] && fpsSorted[2] < fpsSorted[3], "1080p FPS rises down the table");
  expect(B.every((x) => x.p.fps >= 70 && x.p.fps < 110), "1080p High lands between 70 and 110 FPS");
  expect(B.every((x) => x.q.fps < 75 && x.q.fps >= 50), "1440p native 50-75 FPS");
  expect(B.every((x) => x.qu.fps >= 70), "1440p upscaled 70+ FPS");
  expect(B.every((x) => x.es.fps >= 200 && x.es.fps < 360), "esports 200-360 FPS");
  const es240 = B.filter((x) => x.es.fps >= 240).length;
  expect(es240 >= 2 && es240 < 4, "some but not all clear 240 in esports");

  // ---- CPU matrix at 1080p
  const CPUS = ["ryzen-5-5600", "i5-12400f", "ryzen-5-7500f", "ryzen-5-7600"];
  const GPUS = ["arc-b580", "rtx-5060", "rx-9060-xt-8gb", "rx-9060-xt-16gb"];
  const matrix = table(
    ["CPU", ...GPUS.map((g) => [name(g), true]), ["CPU-heavy games", true]],
    CPUS.map((c) => [td(`<strong>${name(c)}</strong>`), ...GPUS.map((g) => cell(c, g, "1080p")), cell(c, "rx-9060-xt-16gb", "1080p", { workload: "cpuheavy" })]),
  );
  expect(CPUS.every((c) => GPUS.every((g) => at(c, g, "1080p").limiter === "gpu")), "every CPU in the matrix is GPU-limited at 1080p");
  const spread = Math.round(at("ryzen-5-7500f", "rx-9060-xt-16gb", "1080p").fps - at("ryzen-5-5600", "rx-9060-xt-16gb", "1080p").fps);
  expect(spread >= 2 && spread <= 8, "5600 to 7500F with a 9060 XT 16GB: a handful of FPS");
  const hv = Object.fromEntries(CPUS.map((c) => [c, at(c, "rx-9060-xt-16gb", "1080p", { workload: "cpuheavy" })]));
  const hvGain = gain(hv["ryzen-5-7500f"].fps, hv["ryzen-5-5600"].fps);
  expect(CPUS.every((c) => hv[c].limiter === "cpu") && hvGain >= 20, "CPU-heavy: all CPU-bound, 7500F 20%+ over 5600");
  expect(hv["i5-12400f"].fps > hv["ryzen-5-5600"].fps && hv["i5-12400f"].fps < hv["ryzen-5-7500f"].fps, "12400F sits between in sims");
  expect(Math.abs(at("ryzen-5-7600", "rx-9060-xt-16gb", "1080p").fps - at("ryzen-5-7500f", "rx-9060-xt-16gb", "1080p").fps) < 2, "7600 = 7500F");

  // ---- GPU facts
  const g = (id, o = {}) => at("ryzen-5-7500f", id, "1080p", o);
  const ult = Object.fromEntries(GPUS.map((id) => [id, g(id, { quality: "ultra" })]));
  const high = Object.fromEntries(GPUS.map((id) => [id, g(id)]));
  expect(ult["rtx-5060"].vramNeed > 8 && ult["rtx-5060"].vramNeed <= 12, "1080p Ultra needs more than 8 GB but fits in 12");
  const xtGap = gain(high["rx-9060-xt-16gb"].fps, high["rx-9060-xt-8gb"].fps), xtGapU = gain(ult["rx-9060-xt-16gb"].fps, ult["rx-9060-xt-8gb"].fps);
  expect(xtGap <= 3 && xtGapU >= 10, "9060 XT 16 vs 8: tiny at High, big at Ultra");
  const b580vs5060 = gain(high["rtx-5060"].fps, high["arc-b580"].fps);
  expect(b580vs5060 >= 8 && b580vs5060 <= 20, "5060 roughly 10-15% faster than B580 at 1080p High");
  const rt = [g("rtx-5060", { workload: "raytracing" }), g("rtx-5060", { workload: "raytracing", upscale: "quality" })];
  expect(rt[0].fps < 60 && rt[1].fps >= 60, "RT on a 5060: under 60 native, 60+ with DLSS");

  // ---- Upgrade path
  const up = {
    am5_1440: at("ryzen-5-7500f", "rtx-5070", "1440p"), am5_1080: at("ryzen-5-7500f", "rtx-5070", "1080p"),
    am4_1440: at("ryzen-5-5600", "rtx-5070", "1440p"), am4_1080: at("ryzen-5-5600", "rtx-5070", "1080p"),
    x3d: at("ryzen-7-5700x3d", "rtx-5070", "1080p"), x3dSim: at("ryzen-7-5700x3d", "rx-9060-xt-16gb", "1080p", { workload: "cpuheavy" }),
  };
  expect(up.am5_1440.limiter === "gpu" && up.am4_1440.verdict.key === "excellent", "a 5070 at 1440p is fine on either platform");
  expect(up.am5_1080.pct < 20 && up.am4_1080.limiter === "cpu" && up.am4_1080.pct >= 20, "at 1080p the 5600 holds a 5070 back, the 7500F doesn't");
  expect(up.x3d.pct < up.am4_1080.pct && up.x3dSim.fps > hv["ryzen-5-5600"].fps * 1.15, "5700X3D drop-in helps");
  const ram8 = at("ryzen-5-5600", "rtx-5060", "1080p", { ram: 8 }), ram16 = at("ryzen-5-5600", "rtx-5060", "1080p");
  expect(ram8.low1 < ram16.low1 * 0.9 && ram16.limiter === "gpu", "8 GB hurts 1% lows; 16 GB stays GPU-limited");

  const Bp = (i) => B[i].p;
  const partRows = [
    ["Processor", `${name("ryzen-5-5600")}, ${name("i5-12400f")} or ${name("ryzen-5-7500f")}`, "$95–150", "Six cores is plenty for this tier"],
    ["Motherboard", "B550 (AM4), B760 DDR4 (Intel) or A620/B650 (AM5)", "$80–130", "Basic board is fine; check BIOS support"],
    ["Memory", "16 GB (2 × 8 GB) DDR4-3200 or DDR5-6000", "$70–150", "Most volatile line in 2026"],
    ["Graphics card", `${name("arc-b580")}, ${name("rtx-5060")} or ${name("rx-9060-xt-8gb")}/16GB`, "$250–470", "The part that sets your FPS"],
    ["Storage", "1 TB NVMe SSD, PCIe 4.0", usd(PRICE.ssd), "Avoid DRAM-less bargain drives if you can"],
    ["Power supply", "550–650 W, 80 Plus Bronze or better, reputable brand", usd(PRICE.psu), "Don't cut corners here"],
    ["Case", "Mid-tower or micro-ATX with two or more fans", usd(PRICE.case), "Front mesh for airflow"],
  ];
  const partTable = table(["Component", "Pick", ["Approx. price", true], "Note"], partRows.map(([a, b, c, d]) => [td(`<strong>${a}</strong>`), td(b), td(c, true), td(`<small>${d}</small>`)]));

  return {
    slug: "budget-gaming-pc-build",
    title: "Budget Gaming PC Build (2026): A $700 Part List with FPS",
    description: "Budget gaming PC build for 1080p at about $700: part list with approximate October 2026 prices, four CPU and GPU options with FPS, bottleneck and upgrade path.",
    h1: "Budget gaming PC build: a $700 part list with FPS and bottleneck numbers",
    crumb: "Budget PC build",
    card: "A concrete part list for a 1080p gaming PC around $700, four CPU and graphics card options compared, and how to upgrade it later.",
    lead: `This is a concrete version of our ${guide("balanced-gaming-pc-build", "balanced PC build guide")} for the cheapest tier worth building new: a 1080p gaming PC around $700. You get a part list, four CPU and graphics card combinations with FPS and bottleneck figures from the same model as our ${link.calculator("bottleneck calculator")}, and an upgrade path. Every FPS figure assumes 16 GB of RAM, since that's what fits the budget.`,
    sections: [
      {
        id: "parts", toc: "The part list", h2: "The part list",
        html: `
          <p>Prices are approximate US street prices, October 2026. They move constantly, and two lines move most: memory and SSD prices rose sharply from late 2025, and graphics card prices climbed through 2026 for the same reason. Treat the ranges as a guide and check current listings before you buy.</p>
          ${partTable}
          <p>Put together, the cheapest of the four builds below comes to about ${usd(B[0].price)}, depending on where prices sit when you buy, and the version with a 16 GB card to about ${usd(B[3].price)}. So $700 is the floor for a new 1080p gaming PC in late 2026, not the middle. If memory or graphics card prices drop, the GeForce and Radeon versions fall back toward it too.</p>
          <p>A few choices are fixed whatever you pick. Use two memory sticks, not one, so the memory runs in dual channel. Turn on XMP or EXPO in the BIOS so it runs at its rated speed. And buy the power supply from a brand with a good reputation: it's the one part that can take others with it when it fails.</p>`,
      },
      {
        id: "options", toc: "Four builds compared", h2: "Four CPU and graphics card combinations",
        html: `
          <p>Each row is a complete build from the list above. Figures are average FPS in AAA games at High settings, with the bottleneck underneath, then esports (CS2-style games) at 1080p. Click a number to open that build in the calculator.</p>
          ${buildTable}
          <p>All four are GPU-limited at 1080p, which is the healthy result. A GPU-limited figure with a large percentage means the processor has spare capacity, and that spare capacity is your upgrade path: a faster card later will use it.</p>
          <ul>
            <li><strong>Cheapest: ${name("ryzen-5-5600")} + ${name("arc-b580")}.</strong> About ${fmt(Bp(0).fps)} FPS at 1080p High, and 12 GB of video memory for the lowest price. It's the build that gets closest to $700.</li>
            <li><strong>GeForce: ${name("i5-12400f")} + ${name("rtx-5060")}.</strong> About ${fmt(Bp(1).fps)} FPS, ${gain(Bp(1).fps, Bp(0).fps)}% faster than the B580 build, with DLSS 4 and the best upscaling support in new games. The trade-off is 8 GB of VRAM.</li>
            <li><strong>AM5: ${name("ryzen-5-7500f")} + ${name("rx-9060-xt-8gb")}.</strong> About ${fmt(Bp(2).fps)} FPS, on the platform with the longest CPU upgrade path.</li>
            <li><strong>AM5 with a 16 GB card: ${name("ryzen-5-7500f")} + ${name("rx-9060-xt-16gb")}.</strong> About ${fmt(Bp(3).fps)} FPS. Barely faster than the 8 GB version at High, but the extra memory matters at Ultra and at 1440p (see below). If you can stretch the budget, this is the one that ages best.</li>
          </ul>
          <p>In esports, every build clears 200 FPS, from about ${fmt(Math.min(...B.map((x) => x.es.fps)))} to ${fmt(Math.max(...B.map((x) => x.es.fps)))}. ${es240 === 2 ? "Two" : "Three"} of the four reach 240 FPS, and none gets near 360, so a 144 Hz or 165 Hz monitor is the sensible match for this tier.</p>`,
      },
      {
        id: "cpu", toc: "Which CPU", h2: "Which CPU: Ryzen 5 5600, i5-12400F or Ryzen 5 7500F",
        html: `
          <p>Every pairing of these processors and cards at 1080p High, plus CPU-heavy games (simulators, strategy and MMOs) with the ${name("rx-9060-xt-16gb")}:</p>
          ${matrix}
          <p>In AAA games the CPU barely matters at this tier. Every combination is GPU-limited, and with the ${name("rx-9060-xt-16gb")} the gap from the ${name("ryzen-5-5600")} to the ${name("ryzen-5-7500f")} is about ${spread} FPS. The ${name("ryzen-5-7500f")} is essentially a ${name("ryzen-5-7600")} without integrated graphics, and in our model it lands within a frame of it, so there's no reason to pay more for the 7600 in a build with a graphics card.</p>
          <p>CPU-heavy games are different. There every chip is the limit, and the ${name("ryzen-5-7500f")} runs about ${hvGain}% faster than the ${name("ryzen-5-5600")} (${fmt(hv["ryzen-5-7500f"].fps)} vs ${fmt(hv["ryzen-5-5600"].fps)} FPS), with the ${name("i5-12400f")} in between at ${fmt(hv["i5-12400f"].fps)}. If you mostly play Microsoft Flight Simulator, Cities: Skylines II or a busy MMO, spend the extra on the 7500F.</p>
          <p>How to choose:</p>
          <ul>
            <li><strong>${name("ryzen-5-5600")}</strong> if the total price matters most. AM4 boards and DDR4 are the cheapest platform, and the money saved can go to the graphics card.</li>
            <li><strong>${name("i5-12400f")}</strong> if you find a good DDR4 B760 board deal. It's a little quicker than the 5600 in CPU-heavy games, but the LGA1700 socket has no faster chips coming.</li>
            <li><strong>${name("ryzen-5-7500f")}</strong> if you'll upgrade later. AM5 takes faster Ryzen chips, including the X3D models, without a new board.</li>
          </ul>
          <p>The head-to-heads go deeper: ${compare("i5-12400f", "ryzen-5-5600")}, ${compare("ryzen-5-7600", "ryzen-5-5600")} and ${compare("ryzen-5-7600", "ryzen-5-7500f")}. For more CPUs with these cards, see the ${guide("best-cpu-for-rtx-5060", "best CPU for the RTX 5060")}.</p>`,
      },
      {
        id: "gpu", toc: "Which graphics card", h2: "Which graphics card: B580, RTX 5060 or RX 9060 XT",
        html: `
          <p>The graphics card sets the frame rate here, so it's where the choice matters. With a ${name("ryzen-5-7500f")} at 1080p:</p>
          <ul>
            ${GPUS.map((id) => `<li><strong>${calc("ryzen-5-7500f", id, { res: "1080p", ...R }, name(id))}</strong> (${gpu(id).vram} GB, about ${usd(PRICE[id])}): ${fmt(high[id].fps)} FPS at High, ${fmt(ult[id].fps)} at Ultra.</li>`).join("\n            ")}
          </ul>
          <p><strong>Video memory decides how the cards age.</strong> At 1080p High, modern games fit in about ${Math.round(high["rtx-5060"].vramNeed)} GB. At Ultra they want around ${Math.round(ult["rtx-5060"].vramNeed)} GB, and the 8 GB cards slow down. The two RX 9060 XT versions show it best: the 16 GB card is only ${xtGap}% faster at High but ${xtGapU}% faster at Ultra. With an 8 GB card, set textures to High rather than Ultra and you avoid most of the loss. Our guide on ${guide("is-8gb-vram-enough", "whether 8 GB of VRAM is enough")} covers it in detail.</p>
          <p><strong>The ${name("arc-b580")}</strong> is the value pick: 12 GB for the least money, though the ${name("rtx-5060")} is about ${b580vs5060}% faster at 1080p High in our model. Intel's Arc cards need Resizable BAR switched on in the BIOS, and they've been reported to lose more performance than rival cards when paired with older, slower CPUs, so they suit a new build better than an old PC.</p>
          <p><strong>The ${name("rtx-5060")}</strong> has the widest upscaling support (DLSS 4) and the best ray tracing at this price. Ray tracing at 1080p runs at about ${fmt(rt[0].fps)} FPS natively and ${fmt(rt[1].fps)} with DLSS Quality, so it's usable with upscaling on.</p>
          <p><strong>The ${name("rx-9060-xt-16gb")}</strong> is the fastest of the four and the safest bet for the next few years, if the budget stretches. Our ${guide("dlss-vs-fsr-vs-xess", "DLSS vs FSR vs XeSS guide")} compares the upscalers, and the head-to-heads are here: ${compare("rtx-5060", "arc-b580")}, ${compare("rx-9060-xt-8gb", "rtx-5060")}, ${compare("rx-9060-xt-16gb", "rx-9060-xt-8gb")} and ${compare("rtx-5060", "rtx-4060")}.</p>`,
      },
      {
        id: "1440p", toc: "Can it do 1440p?", h2: "Can a $700 PC play at 1440p?",
        html: `
          <p>With upscaling, yes. Natively at 1440p High these builds run at about ${fmt(Math.min(...B.map((x) => x.q.fps)))}–${fmt(Math.max(...B.map((x) => x.q.fps)))} FPS, and the 8 GB cards run slightly short of video memory (games want about ${B[1].q.vramNeed} GB). With DLSS, FSR or XeSS on Quality, they reach about ${fmt(Math.min(...B.map((x) => x.qu.fps)))}–${fmt(Math.max(...B.map((x) => x.qu.fps)))} FPS, with the ${build("ryzen-5-7500f", "rx-9060-xt-16gb", "7500F and RX 9060 XT 16GB")} at the top.</p>
          <p>Upscaling makes the card faster, so the processor has to keep up with more frames. At 1440p with Quality upscaling the ${name("ryzen-5-7500f")} builds are still GPU-limited, and with the 16 GB card even a ${name("ryzen-5-5600")} is ${verdict(at("ryzen-5-5600", "rx-9060-xt-16gb", "1440p", { upscale: "quality" }))}.</p>
          <p>If 1440p is your main resolution, though, a 12 or 16 GB card is the better buy, and the next tier up makes more sense. Our ${guide("1440p-gaming-pc-build", "1440p gaming PC build")} picks up from here.</p>`,
      },
      {
        id: "upgrade", toc: "Upgrade path", h2: "The upgrade path",
        html: `
          <p>A budget build is a starting point. The graphics card is the usual first upgrade, and the platform decides how far the rest can go.</p>
          <h3>Graphics card first</h3>
          <p>Every CPU here has headroom. Add an ${name("rtx-5070")} later and the ${name("ryzen-5-7500f")} is ${verdict(up.am5_1440)} at 1440p, about ${fmt(up.am5_1440.fps)} FPS, while the ${name("ryzen-5-5600")} is ${verdict(up.am4_1440)}, about ${fmt(up.am4_1440.fps)}. At 1080p the picture changes: the 7500F is ${verdict(up.am5_1080)} with that card, a minor bottleneck, but the 5600 is ${verdict(up.am4_1080)}. So if you plan to keep a 1080p monitor and buy a much faster card, AM5 is the better start. A bigger card will also need more power: NVIDIA recommends a 650 W supply for an RTX 5070, so buying 650 W now saves replacing it.</p>
          <h3>Then the processor</h3>
          <p>On AM5, the ${name("ryzen-5-7500f")} can be swapped for any faster Ryzen chip, including the ${name("ryzen-7-7800x3d")} or ${name("ryzen-7-9800x3d")}, after a BIOS update. On AM4, the last big step is a ${name("ryzen-7-5700x3d")}: it raises CPU-heavy games from ${fmt(hv["ryzen-5-5600"].fps)} to ${fmt(up.x3dSim.fps)} FPS in our model and cuts the 5600's bottleneck with an RTX 5070 at 1080p to ${verdict(up.x3d)}. Our ${guide("best-am4-cpu", "best AM4 CPU guide")} covers the checks. The ${name("i5-12400f")} can move to a 13th- or 14th-gen Core i5 on the same board, which is a smaller step.</p>
          <h3>Memory</h3>
          <p>16 GB is the budget compromise. It keeps a ${name("ryzen-5-5600")} and ${name("rtx-5060")} GPU-limited at 1080p, but some new games and a browser in the background can push past it. When memory prices settle, adding a second pair to reach 32 GB is a cheap fix if the board has four slots. Going down to 8 GB is not an option: in our model it drops the 1% lows from ${fmt(ram16.low1)} to ${fmt(ram8.low1)} FPS, which you'd feel as stutter.</p>`,
      },
    ],
    faq: [
      ["Can you build a gaming PC for $700 in 2026?", `Yes, but it's close to the floor. At approximate US street prices in October 2026, a Ryzen 5 5600 and Arc B580 build costs about ${usd(B[0].price)} and averages about ${fmt(Bp(0).fps)} FPS at 1080p High in AAA games. Memory and graphics card prices rose through 2026, so the RTX 5060 and RX 9060 XT versions cost more.`],
      ["What is the best CPU for a budget gaming PC?", `For AAA games at 1080p, a Ryzen 5 5600, Core i5-12400F or Ryzen 5 7500F. All three keep an RTX 5060, RX 9060 XT or Arc B580 GPU-limited. The Ryzen 5 7500F is about ${hvGain}% faster in CPU-heavy games and sits on AM5, which has the best upgrade path.`],
      ["Is the RTX 5060 or RX 9060 XT better for a budget build?", `They're close. With a Ryzen 5 7500F at 1080p High the RTX 5060 averages about ${fmt(high["rtx-5060"].fps)} FPS and the RX 9060 XT 8GB about ${fmt(high["rx-9060-xt-8gb"].fps)}. The RTX 5060 has DLSS 4 and stronger ray tracing. The RX 9060 XT 16GB is the better long-term buy, because 16 GB of video memory holds up at Ultra settings and 1440p.`],
      ["Is the Arc B580 good for a budget gaming PC?", `Yes, as the cheapest option. It has 12 GB of video memory and averages about ${fmt(Bp(0).fps)} FPS at 1080p High with a Ryzen 5 5600. The RTX 5060 is about ${b580vs5060}% faster. Arc cards need Resizable BAR enabled and work best with a modern CPU.`],
      ["Is 16 GB of RAM enough for a budget gaming PC?", `Yes, in two 8 GB sticks. It keeps a Ryzen 5 5600 and RTX 5060 GPU-limited at 1080p. 32 GB is better for new games and multitasking, but memory prices rose sharply from late 2025, so 16 GB is the sensible compromise at this budget. 8 GB causes stutter in modern games.`],
      ["Can a budget gaming PC run games at 1440p?", `With upscaling, yes. At 1440p High these builds average about ${fmt(Math.min(...B.map((x) => x.q.fps)))}–${fmt(Math.max(...B.map((x) => x.q.fps)))} FPS natively and about ${fmt(Math.min(...B.map((x) => x.qu.fps)))}–${fmt(Math.max(...B.map((x) => x.qu.fps)))} FPS with DLSS, FSR or XeSS on Quality. For 1440p as the main resolution, a 16 GB card is the safer choice.`],
    ],
    related: ["balanced-gaming-pc-build", "best-cpu-for-rtx-5060", "1440p-gaming-pc-build"],
  };
};
