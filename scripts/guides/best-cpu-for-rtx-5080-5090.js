// Guide: Best CPU for RTX 5090 / RTX 5080
module.exports = function (h) {
  const { HW, ev, cpu, gpu, pct, gain, fmt, name, verdict, expect, calc, build, compare, guide, link, table, td, limitTag } = h;

  const CPUS = [
    "ryzen-7-5700x3d", "ryzen-7-5800x3d", "ryzen-5-7600", "ryzen-7-9700x", "i5-14600k", "i7-14700k",
    "i9-14900k", "ultra-7-265k", "ultra-9-285k", "ryzen-7-7800x3d", "ryzen-7-9800x3d", "ryzen-7-9850x3d",
  ];
  const X3D_TOP = ["ryzen-7-9800x3d", "ryzen-7-9850x3d"];
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

  // ---- GPU facts
  const g90 = gpu("rtx-5090"), g80 = gpu("rtx-5080"), g4090 = gpu("rtx-4090");
  const gap9080 = gain(g90.g, g80.g);
  const gap9040 = gain(g90.g, g4090.g);
  const gap4080 = gain(g4090.g, g80.g);
  expect(g90.vram === 32 && g80.vram === 16, "5090 has 32 GB, 5080 has 16 GB");
  const fastest = HW.cpus.filter((c) => c.type === "d").sort((a, b) => b.g - a.g)[0];
  const top1080 = at(fastest.id, "rtx-5090", "1080p");
  expect(fastest.id === "ryzen-7-9850x3d", "the 9850X3D is the fastest gaming CPU in the database");
  expect(top1080.gpuFps > top1080.cpuFps * 1.25, "5090 at 1080p can render 25%+ more frames than the fastest CPU prepares");

  // ---- RTX 5090 claims
  const n90 = Object.fromEntries(CPUS.map((c) => [c, RESES.map((r) => at(c, "rtx-5090", r))]));
  expect(CPUS.every((c) => n90[c][0].limiter === "cpu" && n90[c][0].pct >= 20), "every CPU limits a 5090 by 20%+ at 1080p");
  expect(X3D_TOP.every((c) => n90[c][1].verdict.key === "excellent"), "9800X3D/9850X3D are balanced with a 5090 at 1440p");
  expect(n90["ryzen-7-7800x3d"][1].limiter === "cpu" && n90["ryzen-7-7800x3d"][1].pct >= 10 && n90["ryzen-7-7800x3d"][1].pct < 20, "7800X3D: minor CPU limit with a 5090 at 1440p");
  const nonX3D = CPUS.filter((c) => !/x3d/.test(c));
  expect(nonX3D.every((c) => n90[c][1].limiter === "cpu" && n90[c][1].pct >= 15), "non-X3D CPUs are 15%+ CPU-limited with a 5090 at 1440p");
  const best1440i = at("i9-14900k", "rtx-5090", "1440p");
  const r7600 = n90["ryzen-5-7600"];
  expect(r7600[1].pct >= 25, "7600 is 25%+ CPU-limited with a 5090 at 1440p");
  const fps4k = CPUS.map((c) => n90[c][2].fps);
  expect((Math.max(...fps4k) - Math.min(...fps4k)) / Math.max(...fps4k) < 0.06, "all CPUs within 6% of each other with a 5090 at 4K");
  expect(CPUS.every((c) => n90[c][2].limiter === "gpu"), "every CPU in the table is GPU-limited with a 5090 at 4K");
  const r5600_4k = at("ryzen-5-5600", "rtx-5090", "4k");
  expect(r5600_4k.limiter === "cpu" && r5600_4k.pct < 20, "a 5600 is only a minor limit for a 5090 at 4K");
  const nine = n90["ryzen-7-9800x3d"];
  const gap4k7600 = gain(nine[2].fps, r7600[2].fps);
  const gap1080_7600 = gain(nine[0].fps, r7600[0].fps);
  const x9950 = at("ryzen-9-9950x3d", "rtx-5090", "1440p");
  expect(Math.abs(x9950.fps - nine[1].fps) / nine[1].fps < 0.02, "9950X3D games like a 9800X3D");
  const g9850 = gain(cpu("ryzen-7-9850x3d").g, cpu("ryzen-7-9800x3d").g);
  expect(g9850 > 0 && g9850 <= 5, "9850X3D is a few percent faster than the 9800X3D");

  // ---- RTX 5080 claims
  const n80 = Object.fromEntries(CPUS.map((c) => [c, RESES.map((r) => at(c, "rtx-5080", r))]));
  expect(X3D_TOP.every((c) => n80[c][0].verdict.key === "excellent"), "9800X3D/9850X3D are balanced with a 5080 at 1080p");
  expect(nonX3D.every((c) => n80[c][0].limiter === "cpu" && n80[c][0].pct >= 20), "non-X3D CPUs are 20%+ CPU-limited with a 5080 at 1080p");
  const s7800_80 = n80["ryzen-7-7800x3d"][0];
  expect(s7800_80.limiter === "cpu" && s7800_80.pct < 20, "7800X3D is a minor limit for a 5080 at 1080p");
  expect(CPUS.every((c) => ok(n80[c][1])), "every CPU in the table is balanced or GPU-limited with a 5080 at 1440p");
  expect(CPUS.every((c) => n80[c][2].limiter === "gpu"), "every CPU is GPU-limited with a 5080 at 4K");
  const am4_80 = at("ryzen-7-5700x3d", "rtx-5080", "1440p");
  expect(am4_80.verdict.key === "excellent", "5700X3D is balanced with a 5080 at 1440p");

  // ---- Upscaling and ray tracing (RTX 5090)
  const MODES = [
    ["Native, no upscaling", {}],
    ["DLSS Quality", { upscale: "quality" }],
    ["DLSS Performance", { upscale: "performance" }],
    ["Ray tracing, native", { workload: "raytracing" }],
    ["Ray tracing + DLSS Performance", { workload: "raytracing", upscale: "performance" }],
  ];
  const MODE_CPUS = [["ryzen-5-7600", "4k"], ["ryzen-7-9800x3d", "4k"], ["ryzen-5-7600", "1440p"], ["ryzen-7-9800x3d", "1440p"]];
  const modeTable = table(
    ["RTX 5090, AAA at High", ["7600, 4K", true], ["9800X3D, 4K", true], ["7600, 1440p", true], ["9800X3D, 1440p", true]],
    MODES.map(([label, o]) => [td(label), ...MODE_CPUS.map(([c, r]) => cell(c, "rtx-5090", r, o))]),
  );
  const m = (c, r, i) => at(c, "rtx-5090", r, MODES[i][1]);
  const perf4k = [m("ryzen-5-7600", "4k", 2), m("ryzen-7-9800x3d", "4k", 2)];
  expect(perf4k[0].limiter === "cpu" && perf4k[0].pct >= 30, "7600 + 5090 at 4K DLSS Performance is 30%+ CPU-limited");
  const perfGap = gain(perf4k[1].fps, perf4k[0].fps);
  expect(perfGap >= 30, "9800X3D is 30%+ faster than a 7600 at 4K DLSS Performance");
  const rtNat = [m("ryzen-5-7600", "4k", 3), m("ryzen-7-9800x3d", "4k", 3)];
  expect(rtNat.every((x) => x.limiter === "gpu") && Math.round(rtNat[0].fps) === Math.round(rtNat[1].fps), "native RT at 4K: same FPS on both CPUs");
  const rtCpuCost = Math.round((1 - m("ryzen-7-9800x3d", "4k", 3).cpuFps / m("ryzen-7-9800x3d", "4k", 0).cpuFps) * 100);
  expect(rtCpuCost >= 10, "ray tracing lowers the CPU frame-rate ceiling by 10%+");
  const rt1440 = m("ryzen-5-7600", "1440p", 3);
  expect(ok(rt1440) && r7600[1].limiter === "cpu", "RT native makes the 7600 + 5090 at 1440p balanced");
  const rtPerf = [m("ryzen-5-7600", "1440p", 4), m("ryzen-7-9800x3d", "1440p", 4)];
  expect(rtPerf.every((x) => x.limiter === "cpu"), "RT + DLSS Performance at 1440p: both CPUs are the limit");

  // ---- Esports and CPU-heavy (RTX 5090)
  const es = (c) => at(c, "rtx-5090", "1080p", { workload: "esports" });
  const esTop = X3D_TOP.map(es), es7800 = es("ryzen-7-7800x3d"), es14700 = es("i7-14700k"), es7600 = es("ryzen-5-7600");
  expect(esTop.every((x) => x.fps >= 480) && es7800.fps < 480 && es14700.fps >= 360 && es14700.fps < 480 && es7600.fps < 360, "esports tiers: only 9800X3D/9850X3D clear 480 Hz, 14700K clears 360, 7600 doesn't");
  const sim = (c) => at(c, "rtx-5090", "4k", { workload: "cpuheavy" });
  expect(CPUS.every((c) => sim(c).limiter === "cpu"), "CPU-heavy games are CPU-limited at 4K with a 5090 on every CPU");
  const sim7600 = sim("ryzen-5-7600"), sim9800 = sim("ryzen-7-9800x3d");

  // ---- Platform picks
  const i80 = at("i7-14700k", "rtx-5080", "1440p");
  const u90 = at("ultra-9-285k", "rtx-5090", "1440p");
  const am4_90 = ["ryzen-7-5700x3d", "ryzen-7-5800x3d"].map((c) => n90[c]);
  expect(am4_90.every((x) => x[2].limiter === "gpu" && x[1].limiter === "cpu" && x[1].pct >= 25), "AM4 X3D: fine for a 5090 at 4K, 25%+ limited at 1440p");

  return {
    slug: "best-cpu-for-rtx-5080-5090",
    title: "Best CPU for RTX 5090 and RTX 5080 (2026): No-Bottleneck Picks",
    description: "Which CPU keeps an RTX 5090 or 5080 busy? FPS and bottleneck for 12 CPUs at 1080p, 1440p and 4K, plus ray tracing, DLSS, PSU and picks by platform.",
    h1: "Best CPU for the RTX 5090 and RTX 5080",
    crumb: "Best CPU for RTX 5090",
    card: "FPS and bottleneck for 12 CPUs with each card at 1080p, 1440p and 4K, how DLSS shifts the load to the CPU, and picks for AM5, Intel and AM4.",
    lead: `The RTX 5090 is fast enough that no gaming CPU can keep up with it at 1080p, and only a couple can at 1440p. The RTX 5080 is far easier to feed. Here's how 12 processors pair with each card, what changes with ray tracing and DLSS, and which CPU to buy for your platform, calculated with the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "picks", toc: "Quick picks", h2: "Quick picks",
        html: `
          <div class="callout">
            <p><strong>RTX 5090: Ryzen 7 9800X3D or 9850X3D.</strong> The only CPUs that are balanced with the card at 1440p. At 1080p even these leave about ${pct(nine[0])}% of the GPU unused.</p>
            <p><strong>RTX 5080: Ryzen 7 9800X3D for 1080p high refresh, Ryzen 5 7600 or better for 1440p.</strong> Every CPU in our table is balanced or GPU-limited with a 5080 at 1440p.</p>
            <p><strong>4K only, either card:</strong> the CPU barely matters at native 4K. A ${name("ryzen-5-7600")} lands within ${gap4k7600}% of a 9800X3D with the 5090. Turn on DLSS, though, and the gap opens again.</p>
            <p><strong>Intel:</strong> Core i7-14700K, i9-14900K or Core Ultra 9 285K. Fine for a 5080 at 1440p and a 5090 at 4K, about ${pct(best1440i)}% CPU-limited with a 5090 at 1440p.</p>
            <p><strong>AM4 owners:</strong> a Ryzen 7 5700X3D or 5800X3D is balanced with a 5080 at 1440p and fine with a 5090 at 4K.</p>
          </div>`,
      },
      {
        id: "how-fast", toc: "How fast are these cards?", h2: "How fast are the RTX 5090 and RTX 5080?",
        html: `
          <p>In our GPU index (RTX 4090 = 100) the RTX 5090 scores ${g90.g} and the RTX 5080 ${g80.g}. That makes the 5090 about ${gap9080}% faster than the 5080 and ${gap9040}% faster than a 4090, while the 4090 stays about ${gap4080}% ahead of the 5080. The memory gap is just as wide: ${g90.vram} GB on the 5090 against ${g80.vram} GB on the 5080. Our ${compare("rtx-5090", "rtx-5080", "RTX 5090 vs RTX 5080")} and ${compare("rtx-5080", "rtx-4090", "RTX 5080 vs RTX 4090")} pages cover the cards head to head.</p>
          <p>For CPU pairing, what matters is how many frames each card can draw. At 1080p High the 5090 can render about ${fmt(top1080.gpuFps)} FPS in AAA games, but the fastest CPU in our database, the ${name(fastest.id)}, prepares only about ${fmt(top1080.cpuFps)}. No processor you can buy closes that gap, so at 1080p a 5090 is always CPU-limited. That's not a fault in your build: the card was made for 4K.</p>
          <p>Prices put these cards in their own tier. The RTX 5090 launched at $1,999 and the RTX 5080 at $999 (US MSRPs), and street prices have often run higher. Next to that, the price difference between a mid-range CPU and a top X3D chip is small, which is why we'd rarely pair either card with a budget processor.</p>`,
      },
      {
        id: "rtx-5090", toc: "CPUs for the RTX 5090", h2: "CPUs with the RTX 5090: FPS and bottleneck",
        html: `
          <p>Average FPS in AAA games at High settings without upscaling, with the bottleneck below each figure. Click a number to open that build in the calculator, or a CPU name for its build page.</p>
          ${matrix("rtx-5090")}
          <p><strong>At 1080p</strong> every CPU holds the 5090 back, from ${pct(n90["ryzen-7-9850x3d"][0])}% on the ${name("ryzen-7-9850x3d")} to ${pct(r7600[0])}% on the ${name("ryzen-5-7600")}. The CPU still decides your frame rate, which is why the ${name("ryzen-7-9800x3d")} runs about ${gap1080_7600}% faster than the 7600 here.</p>
          <p><strong>At 1440p</strong> only the ${name("ryzen-7-9800x3d")} and ${name("ryzen-7-9850x3d")} are balanced. The ${name("ryzen-7-7800x3d")} is ${verdict(n90["ryzen-7-7800x3d"][1])}, a minor bottleneck. Every non-X3D chip is at least ${Math.min(...nonX3D.map((c) => pct(n90[c][1])))}% CPU-limited, including the ${name("i9-14900k")}. The ${name("ryzen-9-9950x3d")} games like a 9800X3D (about ${fmt(x9950.fps)} FPS here), so only buy it if you also need 16 cores for work.</p>
          <p><strong>At 4K</strong> every CPU in the table is balanced or GPU-limited, and the spread from slowest to fastest is just ${fmt(Math.min(...fps4k))}–${fmt(Math.max(...fps4k))} FPS. Even a ${name("ryzen-5-5600")} is only ${pct(r5600_4k)}% CPU-limited. If you play only at native 4K, a mid-range CPU is a reasonable choice, but keep reading before you decide, because upscaling changes this.</p>`,
      },
      {
        id: "rtx-5080", toc: "CPUs for the RTX 5080", h2: "CPUs with the RTX 5080: FPS and bottleneck",
        html: `
          <p>Same settings, with the 5080:</p>
          ${matrix("rtx-5080")}
          <p>The 5080 is much easier to pair. <strong>At 1440p</strong> every CPU in the table is balanced or GPU-limited, from the ${name("ryzen-7-5700x3d")} up. A ${build("ryzen-5-7600", "rtx-5080", "Ryzen 5 7600 + RTX 5080")} runs at about ${fmt(n80["ryzen-5-7600"][1].fps)} FPS against ${fmt(n80["ryzen-7-9800x3d"][1].fps)} with a 9800X3D, so the expensive CPU buys you very little at this resolution.</p>
          <p><strong>At 1080p</strong> it's the opposite. Every non-X3D chip is at least ${Math.min(...nonX3D.map((c) => pct(n80[c][0])))}% CPU-limited, the ${name("ryzen-7-7800x3d")} is ${verdict(s7800_80)}, and only the 9800X3D and 9850X3D use the whole card. If you bought a 5080 for a 1080p 360 Hz monitor, that's the pairing to get. <strong>At 4K</strong> every CPU lands near ${fmt(n80["ryzen-5-7600"][2].fps)} FPS.</p>`,
      },
      {
        id: "rt-dlss", toc: "Ray tracing, DLSS and frame gen", h2: "Ray tracing, DLSS and frame generation shift the load",
        html: `
          <p>The tables above use native resolution. Most people with these cards play with DLSS on, and that matters for the CPU. Upscaling renders each frame at a lower internal resolution, so the GPU finishes faster and the CPU has to prepare more frames per second. Here's the RTX 5090 with a ${name("ryzen-5-7600")} and a ${name("ryzen-7-9800x3d")}:</p>
          ${modeTable}
          <p>At native 4K the two CPUs are nearly tied. With <strong>DLSS Performance at 4K</strong>, the 7600 becomes ${pct(perf4k[0])}% CPU-limited and the 9800X3D is about ${perfGap}% faster. That's the main reason to buy a top CPU for a 4K 5090 build: upscaling turns a GPU-bound 4K setup into something closer to 1080p for the processor.</p>
          <p><strong>Ray tracing</strong> works in two directions. It adds CPU work (building the scene structures the rays are traced against), which lowers the CPU's frame-rate ceiling by about ${rtCpuCost}% in our model. But it costs the GPU far more, so native ray tracing is GPU-bound: at 4K both CPUs land on about ${fmt(rtNat[0].fps)} FPS, and even at 1440p the 7600 becomes ${verdict(rt1440)}. Add DLSS on top, which is how ray tracing is usually played, and the CPU is the limit again: at 1440p with ray tracing and DLSS Performance both CPUs are CPU-limited, at ${fmt(rtPerf[0].fps)} and ${fmt(rtPerf[1].fps)} FPS.</p>
          <p><strong>DLSS 4 Multi Frame Generation</strong>, which needs an RTX 50 card, inserts generated frames between the ones your PC renders. It raises the number on the counter even when the CPU is the limit, but input still responds at the rendered rate. A faster CPU raises that base rate, so it still matters with frame generation on. Our ${guide("dlss-vs-fsr-vs-xess", "DLSS vs FSR vs XeSS guide")} explains the modes.</p>`,
      },
      {
        id: "high-refresh", toc: "Esports and CPU-heavy games", h2: "Esports, simulators and strategy games",
        html: `
          <p>Competitive games at low settings put almost all the work on the CPU. With a 5090 at 1080p, CS2-style esports titles run at about ${fmt(esTop[0].fps)} FPS on the 9800X3D and ${fmt(esTop[1].fps)} on the 9850X3D, the only two in the table that clear 480 Hz. The ${name("ryzen-7-7800x3d")} manages ${fmt(es7800.fps)}, the ${name("i7-14700k")} ${fmt(es14700.fps)}, and the ${name("ryzen-5-7600")} ${fmt(es7600.fps)}, just short of 360 Hz. Use the ${link.fps("FPS calculator")} for numbers in specific games.</p>
          <p>Simulators, strategy games and MMOs are CPU-limited even at 4K with a 5090. On every CPU in our table, this game type is held back by the processor, with about ${fmt(sim7600.fps)} FPS on the 7600 and ${fmt(sim9800.fps)} on the 9800X3D. If you play Flight Simulator, city builders or late-game strategy titles, the CPU is the part to prioritize, whatever your resolution.</p>`,
      },
      {
        id: "by-platform", toc: "Picks by platform", h2: "The best CPU for each platform",
        html: `
          <h3>AM5: Ryzen 7 9800X3D, or the 9850X3D</h3>
          <p>The 9800X3D (launch price $479) is the pairing we'd pick for either card. The ${name("ryzen-7-9850x3d")} (launch price $499) is a higher-clocked version, about ${g9850}% faster in our CPU index, which shows only where the CPU is the limit: 1080p, esports and upscaled 4K with a 5090. See ${compare("ryzen-7-9850x3d", "ryzen-7-9800x3d", "9850X3D vs 9800X3D")} for the full comparison. If you already own a 7800X3D, our ${guide("9800x3d-vs-7800x3d", "9800X3D vs 7800X3D guide")} shows when the upgrade pays off. With a 5080 at 1440p, or a 5090 at native 4K, the 7800X3D is fine as it is.</p>
          <h3>Intel 14th gen and Core Ultra</h3>
          <p>The ${name("i7-14700k")}, ${name("i9-14900k")} and ${name("ultra-9-285k")} are all strong pairings for a 5080 at 1440p (the 14700K is ${verdict(i80)} there) and for a 5090 at 4K. With a 5090 at 1440p they fall behind the X3D chips: the 285K is ${verdict(u90)}. Compare ${compare("ryzen-7-9800x3d", "i9-14900k", "9800X3D vs i9-14900K")} and ${compare("ryzen-7-9800x3d", "ultra-9-285k", "9800X3D vs Ultra 9 285K")}. If you use a 13th or 14th-gen chip, install the latest BIOS with Intel's stability microcode first. Our ${guide("best-lga1700-cpu-upgrade", "LGA1700 upgrade guide")} covers that platform in detail.</p>
          <h3>AM4 owners: Ryzen 7 5700X3D or 5800X3D</h3>
          <p>With an RTX 5080 at 1440p the ${build("ryzen-7-5700x3d", "rtx-5080", "5700X3D")} is ${verdict(am4_80)}, so an AM4 X3D chip is a sensible way to add a 5080 without a new platform. With a 5090 they work at 4K, but they're ${pct(am4_90[0][1])}% and ${pct(am4_90[1][1])}% CPU-limited at 1440p, which is a lot of an expensive card going unused. For a 5090, plan a move to AM5. Our ${guide("best-am4-cpu", "best AM4 CPU guide")} covers the drop-in options.</p>`,
      },
      {
        id: "power-pcie", toc: "PSU, 12V-2x6 and PCIe", h2: "Power supply, the 12V-2x6 connector and PCIe",
        html: `
          <p><strong>Power supply.</strong> NVIDIA rates the RTX 5090 at 575 W and recommends a 1000 W power supply, and the 5080 at 360 W with an 850 W recommendation. Those figures assume a typical CPU. An X3D chip draws far less than a Core i9 under gaming load, which gives you some margin, but don't go below the recommendation on a 5090. A quality ATX 3.1 unit with a native 12V-2x6 cable is the cleanest option.</p>
          <p><strong>The 12V-2x6 connector.</strong> Both cards take power through a single 16-pin connector. Push it in until it's fully seated with no gap, avoid bending the cable sharply right at the plug, and use either the PSU's native cable or the adapter that came with the card. Don't stack extra adapters or extensions. Check the connector again after moving the PC.</p>
          <p><strong>PCIe.</strong> Both cards are PCIe 5.0 x16. On a PCIe 4.0 board the difference is negligible. On PCIe 3.0 the loss is larger but still usually small, and a board that old usually comes with a CPU that holds these cards back far more than the slot does.</p>
          <p>If a 5080 or 5090 is more than you need, our ${guide("ryzen-7-7800x3d-rtx-5070-ti", "7800X3D + RTX 5070 Ti guide")} looks at the step down.</p>`,
      },
    ],
    faq: [
      ["What is the best CPU for an RTX 5090?", `The Ryzen 7 9800X3D or 9850X3D. They're the only CPUs balanced with a 5090 at 1440p, and they keep the most frames when DLSS shifts the load to the CPU. At 1080p even these hold the card back by about ${pct(nine[0])}%.`],
      ["Will a Ryzen 7 7800X3D bottleneck an RTX 5090?", `Slightly at 1440p, where it's ${pct(n90["ryzen-7-7800x3d"][1])}% CPU-limited, and clearly at 1080p (${pct(n90["ryzen-7-7800x3d"][0])}%). At native 4K it's GPU-limited and runs at about ${fmt(n90["ryzen-7-7800x3d"][2].fps)} FPS, close to a 9800X3D.`],
      ["Does the CPU matter for an RTX 5090 at 4K?", `At native 4K, hardly: every CPU from the Ryzen 5 7600 up lands within a few FPS. With DLSS Performance it matters a lot. The 7600 becomes ${pct(perf4k[0])}% CPU-limited and the 9800X3D runs about ${perfGap}% faster.`],
      ["What CPU do I need for an RTX 5080?", `For 1440p, a Ryzen 5 7600, Ryzen 7 5700X3D, Core i5-14600K or anything faster is balanced with the card. For 1080p high refresh, choose a Ryzen 7 9800X3D or 9850X3D. They're the only CPUs that keep a 5080 fully busy at 1080p.`],
      ["Is an Intel Core i9-14900K good for an RTX 5090?", `It's good at 4K, where the card is the limit. At 1440p it's ${pct(best1440i)}% CPU-limited with a 5090, and at 1080p ${pct(n90["i9-14900k"][0])}%. A Ryzen 7 9800X3D is the better match for this card.`],
      ["What power supply do I need for an RTX 5090 or 5080?", "NVIDIA recommends a 1000 W power supply for the RTX 5090 and 850 W for the RTX 5080. Choose a quality ATX 3.1 unit with a native 12V-2x6 cable, and make sure the connector is fully seated."],
    ],
    related: ["9800x3d-vs-7800x3d", "best-am5-cpu", "best-cpu-for-rx-9070-xt"],
  };
};
