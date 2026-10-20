// Guide: Does RAM speed matter for gaming? (XMP/EXPO, dual channel, sweet spots)
// The engine does not model memory speed or channels. The copy says so, keeps those claims
// general, and uses the engine only for what it can show: where the CPU is the limit.
module.exports = function (h) {
  const { Engine, BASE, cpu, gpu, ev, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitTag } = h;

  // What a 10% faster CPU ceiling (or GPU, for integrated graphics) is worth in FPS. An illustration
  // of "CPU-bound vs GPU-bound", not a model of any particular memory kit.
  const BOOST = 1.1;
  const boostPct = Math.round((BOOST - 1) * 100);
  const evBoost = (c, g, o = {}, part = "cpu") => {
    const C = { ...cpu(c) }, G = { ...gpu(g) };
    if (part === "cpu") C.g *= BOOST; else G.g *= BOOST;
    return Engine.evaluate(C, G, { ...BASE, ...o });
  };
  const lift = (c, g, o = {}, part) => Math.round((evBoost(c, g, o, part).fps / ev(c, g, o).fps - 1) * 100);

  // ---- Builds x resolutions
  const BUILDS = [
    ["ryzen-5-5600", "rtx-5060"],
    ["i5-12400f", "rtx-5070"],
    ["ryzen-5-3600", "rtx-5070"],
    ["ryzen-5-7600", "rtx-5070-ti"],
    ["ryzen-7-7800x3d", "rtx-5070-ti"],
  ];
  const RESES = ["1080p", "1440p", "4k"];
  const cell = (c, g, o) => {
    const x = ev(c, g, o);
    return `<td class="r">${calc(c, g, o, fmt(x.fps))} <small>(+${lift(c, g, o)}%)</small><br>${limitTag(x)}</td>`;
  };
  const resTable = table(
    ["CPU + GPU", ["1080p", true], ["1440p", true], ["4K", true]],
    BUILDS.map(([c, g]) => [td(build(c, g)), ...RESES.map((r) => cell(c, g, { res: r }))]),
  );
  const all = BUILDS.flatMap(([c, g]) => RESES.map((r) => ({ c, g, r, x: ev(c, g, { res: r }), up: lift(c, g, { res: r }) })));
  expect(all.filter((a) => a.r === "4k").every((a) => a.up <= 1), "at 4K a faster CPU is worth 1% or less in every build");
  expect(all.filter((a) => a.x.limiter === "cpu" && a.x.pct >= 15).every((a) => a.up >= 7), "clearly CPU-bound results gain most of the 10%");
  expect(all.filter((a) => a.x.limiter === "gpu" && a.x.pct >= 20).every((a) => a.up <= 1), "clearly GPU-bound results gain almost nothing");
  const at = (c, g, r) => all.find((a) => a.c === c && a.g === g && a.r === r);
  const old = at("ryzen-5-3600", "rtx-5070", "1440p"), mid = at("ryzen-5-7600", "rtx-5070-ti", "1080p"), bud = at("ryzen-5-5600", "rtx-5060", "1440p");
  expect(old.x.limiter === "cpu" && mid.x.limiter === "cpu" && bud.x.limiter === "gpu", "3600 + 5070 1440p and 7600 + 5070 Ti 1080p CPU-bound; 5600 + 5060 1440p GPU-bound");
  expect(at("ryzen-5-5600", "rtx-5060", "1080p").x.limiter === "gpu", "5600 + 5060 GPU-limited at 1080p");
  const maxUp = Math.max(...all.map((a) => a.up));
  expect(maxUp <= boostPct, "no build gains more than the boost itself");

  // ---- Game types on one build
  const W = ["ryzen-5-7600", "rtx-5070"];
  const TYPES = [
    ["AAA, 1440p High", { res: "1440p" }],
    ["Ray tracing, 1440p", { res: "1440p", workload: "raytracing" }],
    ["Esports, 1080p", { res: "1080p", workload: "esports" }],
    ["Sims and strategy, 1440p", { res: "1440p", workload: "cpuheavy" }],
  ];
  const typeTable = table(
    ["Game type", ["FPS", true], ["Bottleneck", true], [`+${boostPct}% CPU`, true]],
    TYPES.map(([label, o]) => {
      const x = ev(...W, o);
      return [td(`<strong>${label}</strong>`), `<td class="r">${calc(...W, o, fmt(x.fps))}</td>`, `<td class="r">${limitTag(x)}</td>`, td(`+${lift(...W, o)}%`, true)];
    }),
  );
  const T = TYPES.map(([, o]) => ({ x: ev(...W, o), up: lift(...W, o) }));
  expect(T[1].x.limiter === "gpu" && T[1].up <= 1, "ray tracing: GPU-bound, CPU speed irrelevant");
  expect(T[3].x.limiter === "cpu" && T[3].up >= 9, "sims: CPU-bound, nearly the full 10%");
  expect(T[2].x.limiter === "cpu" && T[2].up >= 7, "esports 1080p: CPU-bound");
  expect(T[0].x.limiter === "gpu" && T[0].up <= 1, "AAA 1440p: GPU-bound");

  // ---- Integrated graphics
  const APUS = [["ryzen-7-8700g", "780m"], ["ryzen-5-8600g", "760m"], ["ryzen-7-5700g", "vega-8"]];
  const AO = [["AAA, 1080p Low", { res: "1080p", quality: "low" }], ["Esports, 1080p Low", { res: "1080p", quality: "low", workload: "esports" }]];
  const apuTable = table(
    ["APU + integrated GPU", ...AO.map(([l]) => [l, true])],
    APUS.map(([c, g]) => [td(`${name(c)} + ${name(g)}`), ...AO.map(([, o]) => {
      const x = ev(c, g, o);
      return `<td class="r">${calc(c, g, o, fmt(x.fps))}<br>${limitTag(x)}</td>`;
    })]),
  );
  const apu = APUS.map(([c, g]) => AO.map(([, o]) => ev(c, g, o)));
  expect(apu.flat().every((x) => x.limiter === "gpu" && x.pct >= 50), "APUs are heavily GPU-bound everywhere");
  const apuUp = lift("ryzen-7-8700g", "780m", AO[0][1], "gpu");
  expect(apuUp >= 9, "a faster iGPU passes straight through to FPS");

  // ---- First-word latency (general formula, computed rather than typed)
  const ns = (cl, mts) => (cl * 2000 / mts).toFixed(1);
  expect(ns(30, 6000) === ns(16, 3200) && +ns(40, 4800) > +ns(16, 3200), "latency comparison in the copy");
  const KITS = [["DDR4-3200 CL16", 16, 3200], ["DDR4-3600 CL16", 16, 3600], ["DDR5-4800 CL40", 40, 4800], ["DDR5-6000 CL30", 30, 6000], ["DDR5-6000 CL36", 36, 6000]];
  const latTable = table(
    ["Kit", ["Bandwidth per channel", true], ["First-word latency", true]],
    KITS.map(([l, cl, mts]) => [td(l), td(`${fmt(mts * 8 / 1000)} GB/s`, true), td(`${ns(cl, mts)} ns`, true)]),
  );

  return {
    slug: "does-ram-speed-matter-for-gaming",
    title: "Does RAM Speed Matter for Gaming? XMP, EXPO and Dual Channel (2026)",
    description: "When RAM speed matters for gaming and when it doesn't: CPU- vs GPU-bound builds, XMP and EXPO, single vs dual channel, DDR4 and DDR5 sweet spots, and APUs.",
    h1: "Does RAM speed matter for gaming? XMP, EXPO and dual channel explained",
    crumb: "Does RAM speed matter?",
    card: "When faster memory raises FPS and when it can't, how to turn on XMP or EXPO, why two sticks beat one, and the sweet-spot kits for AM4, AM5 and Intel.",
    lead: `RAM speed matters when your processor is the limit, and barely at all when your graphics card is. Before you pay for a faster kit, check two free things: that XMP or EXPO is on, and that you have two sticks in dual channel. This guide shows where your build sits, using the same model as our ${link.calculator("bottleneck calculator")}, and covers the setup steps.`,
    sections: [
      {
        id: "answer", toc: "The short answer", h2: "The short answer",
        html: `
          <div class="callout">
            <p><strong>Configuration matters more than the kit.</strong> Memory running at its slow default speed, or a single stick in single channel, can cost a large share of performance in CPU-bound games. Both are free to fix.</p>
            <p><strong>Speed only shows when the CPU is the limit:</strong> 1080p with a fast graphics card, high-refresh esports, simulators and strategy games. At 1440p and 4K with a mid-range card, the graphics card hides it.</p>
            <p><strong>Sweet spots:</strong> DDR5-6000 CL30 on AM5, DDR4-3200 or 3600 on AM4 and DDR4 Intel boards, DDR5-6000 or a little faster on Intel DDR5 boards. Paying much more for faster kits rarely buys you frames.</p>
            <p><strong>Integrated graphics are the exception.</strong> APUs use system RAM as video memory, so memory speed and dual channel matter a lot.</p>
          </div>`,
      },
      {
        id: "model", toc: "What our numbers show", h2: "What our calculator does and doesn't model",
        html: `
          <p>To be clear up front: our ${link.calculator("bottleneck calculator")} models memory <em>capacity</em> (8, 16, 32 or 64 GB, covered in our guide to ${guide("how-much-ram-for-gaming", "how much RAM you need for gaming")}), but not memory speed, timings or channels. It assumes a correctly configured dual-channel kit. Everything this guide says about speed, XMP and dual channel comes from general, well-established knowledge about how PC memory works, not from the calculator, and we keep those claims general because the real effect varies a lot by game, CPU and kit.</p>
          <p>What the calculator can show is the part that decides whether speed matters for you at all: whether your build is CPU-bound or GPU-bound at the resolution you play. Faster memory helps the processor prepare frames sooner. If the graphics card is the limit, the processor already has time to spare, and a faster processor, or faster memory feeding it, can't raise the frame rate.</p>`,
      },
      {
        id: "when", toc: "When speed matters", h2: "When RAM speed matters: CPU-bound vs GPU-bound",
        html: `
          <p>To make that concrete, the table shows average FPS in AAA games at High settings, and in brackets what a ${boostPct}% faster CPU would add. That ${boostPct}% is an illustration of a CPU-side speed-up, of the kind memory tuning can give in CPU-bound games, not a measured result for any kit.</p>
          ${resTable}
          <p>The pattern is the same in every build. Where the result is clearly CPU-limited, such as the ${build("ryzen-5-7600", "rtx-5070-ti", "Ryzen 5 7600 + RTX 5070 Ti")} at 1080p (${verdict(mid.x)}) or the ${name("ryzen-5-3600")} with an ${name("rtx-5070")} at 1440p, most of the CPU speed-up turns into frames: ${mid.up === old.up ? `+${mid.up}% in both cases` : `+${mid.up}% and +${old.up}%`}. Where the graphics card is clearly the limit, it turns into nothing. At 4K, no build here gains more than 1%. The ${build("ryzen-5-5600", "rtx-5060", "Ryzen 5 5600 + RTX 5060")} is GPU-limited even at 1080p, so on that build a faster RAM kit is money better spent elsewhere.</p>
          <p>The type of game matters just as much. The same ${build(...W, "Ryzen 5 7600 + RTX 5070")} across four kinds of games:</p>
          ${typeTable}
          <p>Ray tracing and AAA at 1440p are GPU-limited, so a faster CPU side adds ${T[1].up}% and ${T[0].up}%. Simulators, strategy games and esports at high frame rates are CPU-limited, and they take nearly all of it. If those are your main games, memory configuration is worth getting right. Our guide to ${guide("cpu-vs-gpu-bottleneck", "CPU vs GPU bottlenecks")} explains why, and ${guide("does-resolution-affect-bottleneck", "how resolution affects bottlenecks")} shows how the balance moves.</p>`,
      },
      {
        id: "dual-channel", toc: "Single vs dual channel", h2: "Single vs dual channel",
        html: `
          <p>Desktop platforms (AM4, AM5 and Intel's LGA1700 and LGA1851) have two memory channels. One stick uses one channel; two sticks in the right slots use both and double the bandwidth. A single stick is the most common memory mistake in prebuilt and budget PCs, and in CPU-bound games it can cost a large share of your frame rate, often more than running a slow kit would. It hurts integrated graphics even more.</p>
          <ul>
            <li><strong>Use the right slots.</strong> With two sticks on a four-slot board, the manual almost always names A2 and B2, usually the second and fourth slots from the CPU. Two sticks side by side in the same channel still run in single channel.</li>
            <li><strong>Check it in CPU-Z.</strong> On the Memory tab, the Channel field should read Dual, or "2 x 64-bit" for DDR4. DDR5 splits each stick into two 32-bit subchannels, so a correct DDR5 pair usually shows "4 x 32-bit".</li>
            <li><strong>Two sticks beat four.</strong> Four sticks also run in dual channel, but they put more load on the memory controller, and four DDR5 sticks often won't run at the kit's rated speed. For more capacity, buy two bigger sticks.</li>
          </ul>`,
      },
      {
        id: "xmp", toc: "Turn on XMP or EXPO", h2: "XMP and EXPO: how to turn them on",
        html: `
          <p>Memory is sold with a rated speed, but it boots at a conservative standard speed: typically DDR4-2133 to 2666 and DDR5-4800 to 5600. The rated speed and timings are stored on the stick as a profile, called XMP (Intel's Extreme Memory Profile) or EXPO (AMD's equivalent). Until you enable it, you're running the slow default. Most AMD boards accept XMP kits and most Intel boards accept EXPO kits, but the matching profile is the safest choice.</p>
          <ol class="steps">
            <li><strong>Check the current speed.</strong> Open Task Manager (Ctrl + Shift + Esc), go to Performance › Memory and read Speed. In CPU-Z's Memory tab, DRAM Frequency shows half the effective rate because DDR transfers twice per clock, so DDR5-6000 shows about 3,000 MHz.</li>
            <li><strong>Enter the BIOS.</strong> Restart and press Delete or F2 during boot.</li>
            <li><strong>Find the profile.</strong> It's called XMP, EXPO, DOCP (older ASUS AMD boards) or A-XMP (older MSI AMD boards), usually on the main page or under Overclocking or Ai Tweaker. Select Profile 1.</li>
            <li><strong>Save and restart.</strong> On AM5, the first boot after a memory change can sit on a black screen for a minute or more while the board trains the memory. That's normal; don't power off.</li>
            <li><strong>Confirm</strong> the new speed in Task Manager, then run a stability test (see below).</li>
          </ol>
          <p>Enabling the profile is technically overclocking the memory, but it's supported by the board and the memory maker and is the normal way to run a gaming PC. A BIOS update or a cleared CMOS turns it off again, so check after every update. Our guide to ${guide("how-to-fix-cpu-bottleneck", "fixing a CPU bottleneck")} puts this step first for that reason.</p>`,
      },
      {
        id: "sweet-spots", toc: "Which speed to buy", h2: "Which speed to buy: DDR4 and DDR5 sweet spots",
        html: `
          <p>Two numbers describe a kit: the transfer rate (MT/s), which sets bandwidth, and CAS latency (CL), counted in clock cycles. Because faster kits have shorter cycles, compare latency in nanoseconds: CL × 2,000 ÷ MT/s.</p>
          ${latTable}
          <p>So DDR5-6000 CL30 responds as quickly as DDR4-3200 CL16 (${ns(30, 6000)} ns) with far more bandwidth, while a cheap DDR5-4800 CL40 kit is slower to respond than either.</p>
          <h3>AM5 (Ryzen 7000 and 9000): DDR5-6000 CL30</h3>
          <p>The memory controller runs in step with the memory (1:1) up to around DDR5-6000. Faster kits usually force it to half speed, which adds latency and can cancel out the extra bandwidth. That's why 6000 CL30 is the standard recommendation, and why paying more for 7200 or 8000 rarely helps games on AM5. See our guide to the ${guide("best-am5-cpu", "best AM5 CPU")} for the chips themselves.</p>
          <h3>AM4 (Ryzen 3000 and 5000): DDR4-3200 or 3600</h3>
          <p>The Infinity Fabric runs 1:1 with the memory up to about DDR4-3600 on most Ryzen 5000 chips. DDR4-3600 CL16 is the classic sweet spot and 3200 CL16 is nearly as good. Our ${guide("best-am4-cpu", "best AM4 CPU guide")} covers upgrades on the platform.</p>
          <h3>Intel 12th to 14th gen and Core Ultra 200S</h3>
          <p>On DDR4 boards, the same DDR4-3200 to 3600 advice applies. On DDR5 boards, a 6000 to 6400 kit is a sensible target, and Intel chips generally tolerate faster kits than AMD's, with smaller returns the further you go. On 13th and 14th gen, install the BIOS with Intel's stability microcode before tuning memory. See the ${guide("best-lga1700-cpu-upgrade", "best LGA1700 upgrade guide")}.</p>
          <h3>X3D chips care least</h3>
          <p>The ${name("ryzen-7-5700x3d")}, ${name("ryzen-7-7800x3d")} and ${name("ryzen-7-9800x3d")} carry a large stacked L3 cache, so games go out to main memory far less often. They're the least sensitive CPUs to RAM speed, and a sensible mid-range kit is all they need. Our ${guide("9800x3d-vs-7800x3d", "9800X3D vs 7800X3D comparison")} covers the two AM5 chips.</p>`,
      },
      {
        id: "apu", toc: "Integrated graphics", h2: "Integrated graphics: where RAM speed matters most",
        html: `
          <p>APUs have no video memory. The integrated GPU reads textures and frame buffers from system RAM, so memory bandwidth is often what holds it back. That makes memory speed and dual channel far more important on an APU than on a PC with a graphics card, and a single stick is especially costly. Here's how three APUs do in our model, which assumes a dual-channel kit:</p>
          ${apuTable}
          <p>Every result is heavily GPU-limited, the opposite of the builds above. On an APU, the integrated GPU is the part that benefits from faster memory, and anything that speeds it up passes straight through: in our model a ${boostPct}% faster Radeon 780M adds ${apuUp}% to the ${name("ryzen-7-8700g")}'s frame rate. For an APU build, buy the fastest sensible kit your platform supports (DDR5-6000 or a little faster for the 8000G series), always as two sticks, and enable EXPO. Our guide to ${guide("budget-gaming-pc-build", "budget gaming PC builds")} covers when a cheap graphics card is the better buy.</p>`,
      },
      {
        id: "stability", toc: "Stability tips", h2: "Stability tips",
        html: `
          <ul>
            <li><strong>Test after any change.</strong> Run a dedicated memory test such as MemTest86 (bootable) or TestMem5 for at least an hour. Windows Memory Diagnostic only catches obvious faults. Random crashes in games, corrupted saves or failed Windows updates can all be memory errors.</li>
            <li><strong>Update the BIOS first.</strong> Memory compatibility improves with BIOS updates, especially on newer platforms.</li>
            <li><strong>If the profile isn't stable, step down.</strong> Try the next speed down (6000 to 5600, or 3600 to 3200) with the same timings. A stable slower setting beats an unstable fast one.</li>
            <li><strong>Don't mix kits.</strong> Sticks from different packs, even the same model, may not run together at the rated speed.</li>
            <li><strong>Keep voltages at the kit's rating.</strong> Manual tuning beyond the profile is for enthusiasts and gains little in GPU-bound games.</li>
          </ul>
          <p>Once memory is set up, put your exact parts into the ${link.calculator("bottleneck calculator")} to see whether you're CPU- or GPU-bound, or use the ${link.fps("FPS calculator")} for individual games.</p>`,
      },
    ],
    faq: [
      ["Does RAM speed affect FPS?", "Only when the processor is the limit, such as 1080p with a fast graphics card, high-refresh esports, simulators and strategy games. When the graphics card is the limit, as in most AAA games at 1440p and 4K with a mid-range card, faster memory changes little. Integrated graphics are the exception, because they use system RAM as video memory."],
      ["Should I enable XMP or EXPO?", "Yes. Without it, memory runs at a slow default speed, typically DDR4-2133 to 2666 or DDR5-4800 to 5600, instead of its rated speed. It's supported by the board and the memory maker. Enable it in the BIOS, then run a memory test to confirm it's stable."],
      ["Is single-channel RAM bad for gaming?", "Yes, in CPU-bound games it can cost a large share of performance, and with integrated graphics even more. Use two matched sticks in the slots your motherboard manual recommends, usually A2 and B2, and check that CPU-Z shows dual channel."],
      ["What is the best RAM speed for AM5?", "DDR5-6000 CL30. Up to about that speed the memory controller runs in step with the memory. Faster kits usually push it to half speed, adding latency, so they rarely help games on Ryzen 7000 and 9000."],
      ["Is DDR4-3200 fast enough for gaming?", "Yes. DDR4-3200 CL16 is close to the sweet spot on AM4 and Intel DDR4 boards, with DDR4-3600 CL16 a little better. Dual channel and XMP being on matter more than the step between them."],
      ["Do X3D CPUs need fast RAM?", "Less than any other CPU. Their large stacked L3 cache keeps much of the game's data on the chip, so they're the least sensitive to memory speed. A standard DDR5-6000 kit on AM5, or DDR4-3200 to 3600 on AM4, is plenty."],
    ],
    related: ["how-much-ram-for-gaming", "how-to-fix-cpu-bottleneck", "cpu-vs-gpu-bottleneck"],
  };
};
