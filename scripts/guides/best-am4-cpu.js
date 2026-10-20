// Guide: Best AM4 CPU upgrade in 2026
module.exports = function (h) {
  const { ev, cpu, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitTag } = h;

  const CPUS = ["ryzen-5-3600", "ryzen-5-5600", "ryzen-7-5700x", "ryzen-7-5700x3d", "ryzen-7-5800x3d"];
  const GPUS = ["rtx-4060", "rtx-5060-ti-16gb", "rtx-5070", "rx-9070-xt", "rtx-5070-ti"];
  // Cheapest-first ladder of current AM4 picks for the "which CPU for your GPU" table.
  const LADDER = ["ryzen-5-5600", "ryzen-7-5700x", "ryzen-7-5700x3d", "ryzen-7-5800x3d"];
  const FOR_GPUS = ["rtx-4060", "rtx-5060", "rx-9060-xt-16gb", "rtx-5060-ti-16gb", "rtx-4070-super", "rx-9070", "rtx-5070", "rx-9070-xt", "rtx-5070-ti", "rtx-5080"];
  const ok = (r) => r.limiter === "gpu" || r.pct < 10;
  function pick(g, r) {
    const hit = LADDER.find((c) => ok(ev(c, g, { res: r })));
    return hit ? { c: hit, x: ev(hit, g, { res: r }) } : { c: null, x: ev(LADDER[LADDER.length - 1], g, { res: r }) };
  }

  const cell = (c, g, r) => {
    const x = ev(c, g, { res: r });
    return `<td class="r">${build(c, g, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  const matrix = (r) => table(
    ["CPU", ...GPUS.map((g) => [name(g), true])],
    CPUS.map((c) => [td(`<strong>${name(c)}</strong>`), ...GPUS.map((g) => cell(c, g, r))]),
  );
  const forTable = table(
    ["Graphics card", "1080p", "1440p"],
    FOR_GPUS.map((g) => {
      const label = (p) => p.c ? name(p.c) : `${name(LADDER[3])} <small>(still CPU-bound ${pct(p.x)}%)</small>`;
      return [td(`<strong>${name(g)}</strong>`), td(label(pick(g, "1080p"))), td(label(pick(g, "1440p")))];
    }),
  );

  // Numbers used in the copy
  const x3dVs3600 = [ev("ryzen-5-3600", "rtx-5070", { res: "1080p" }), ev("ryzen-7-5700x3d", "rtx-5070", { res: "1080p" })];
  const upGain = gain(x3dVs3600[1].fps, x3dVs3600[0].fps);
  expect(upGain >= 30, "5700X3D is a big step up from the 3600 with an RTX 5070 at 1080p");
  const cap = (id) => ev(id, "rtx-5090", { res: "1080p" }).cpuFps; // CPU limit, independent of GPU and resolution
  const d5800 = gain(cap("ryzen-7-5800x3d"), cap("ryzen-7-5700x3d"));
  const d5600 = gain(cap("ryzen-7-5700x3d"), cap("ryzen-5-5600"));
  const dx = gain(cap("ryzen-7-5700x"), cap("ryzen-5-5600"));
  expect(d5800 > 0 && d5800 <= 10, "5800X3D is only slightly faster than 5700X3D");
  expect(d5600 >= 20, "5700X3D is much faster than 5600 when CPU-bound");
  expect(cpu("ryzen-5-5600x3d").g === cpu("ryzen-7-5700x3d").g, "5600X3D and 5700X3D share an index");
  const apu = ev("ryzen-7-5700g", "rtx-5070", { res: "1080p" });
  expect(apu.limiter === "cpu" && apu.pct >= 20, "5700G noticeably bottlenecks an RTX 5070 at 1080p");
  const r5600 = ev("ryzen-5-5600", "rtx-5070", { res: "1440p" });
  expect(r5600.verdict.key === "excellent", "5600 + RTX 5070 is balanced at 1440p");
  const x3d1080 = ev("ryzen-7-5700x3d", "rtx-5070-ti", { res: "1080p" });
  const x3d1440 = ev("ryzen-7-5700x3d", "rtx-5070-ti", { res: "1440p" });
  expect(x3d1080.limiter === "cpu" && x3d1440.verdict.key === "excellent", "5700X3D + 5070 Ti: CPU-bound at 1080p, balanced at 1440p");
  const top = ev("ryzen-7-5800x3d", "rtx-5090", { res: "1440p" });
  const am5 = ev("ryzen-7-9800x3d", "rtx-5090", { res: "1440p" });
  expect(top.limiter === "cpu" && top.pct >= 25, "5800X3D holds back an RTX 5090 at 1440p");
  const es = [ev("ryzen-7-5700x3d", "rtx-5070", { res: "1080p", workload: "esports" }), ev("ryzen-7-9800x3d", "rtx-5070", { res: "1080p", workload: "esports" })];
  expect(es[0].fps >= 240 && es[0].fps < 360, "5700X3D + 5070 esports FPS is between 240 and 360");
  const sim = [ev("ryzen-5-5600", "rtx-5070", { res: "1440p", workload: "cpuheavy" }), ev("ryzen-7-5700x3d", "rtx-5070", { res: "1440p", workload: "cpuheavy" })];
  const lowGpu = ev("ryzen-5-3600", "rtx-4060", { res: "1080p" });
  expect(lowGpu.limiter === "gpu", "3600 + RTX 4060 is GPU-bound at 1080p");
  const old = ["ryzen-5-1600", "ryzen-5-2600", "ryzen-5-3600"].map((c) => [c, gain(cap("ryzen-7-5700x3d"), cap(c))]);

  return {
    slug: "best-am4-cpu",
    title: "Best AM4 CPU for Gaming in 2026: 5700X3D vs 5800X3D vs 5600",
    description: "The best AM4 CPU upgrade in 2026 for gaming: Ryzen 7 5700X3D, 5800X3D or Ryzen 5 5600? FPS and bottleneck tables with RTX 5070, 5070 Ti, RX 9070 XT and more.",
    h1: "Best AM4 CPU upgrade in 2026",
    crumb: "Best AM4 CPU",
    card: "Ryzen 7 5700X3D, 5800X3D or Ryzen 5 5600? FPS and bottleneck tables against today's graphics cards, plus BIOS and cooler checks.",
    lead: `AM4 is the gift that keeps giving. A motherboard bought in 2018 can still take a CPU fast enough for an RTX 5070 Ti, with no new board and no DDR5. This guide compares the AM4 chips worth buying in 2026 against today's graphics cards, using the same data as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "picks", toc: "Quick picks", h2: "Quick picks",
        html: `
          <div class="callout">
            <p><strong>Best for most people: Ryzen 7 5700X3D.</strong> The 3D V-Cache chip you can still buy new. About ${d5600}% faster than a Ryzen 5 5600 when the CPU is the limit, and enough for an RTX 5070 Ti or RX 9070 XT at 1440p.</p>
            <p><strong>Fastest AM4 CPU: Ryzen 7 5800X3D.</strong> Only about ${d5800}% faster than the 5700X3D in games. It's out of production, so buy it only if you find one at a similar price.</p>
            <p><strong>Budget pick: Ryzen 5 5600.</strong> Plenty for RTX 4060- and 5060-class cards, and balanced with an RTX 5070 at 1440p.</p>
            <p><strong>Skip:</strong> the Ryzen 5 5500, 5600G, 5600GT and 5700G for gaming with a fast GPU. They have half the cache and PCIe 3.0, and a 5700G holds an RTX 5070 back by ${pct(apu)}% at 1080p. Also skip the 12- and 16-core chips unless you also do heavy rendering work.</p>
          </div>
          <p>If you're coming from a Ryzen 5 1600, 2600 or 3600, any of these is a big step. The 5700X3D is about ${old.map(([c, g]) => `${g}%`).join(", ").replace(/, ([^,]*)$/, " and $1")} faster than those three chips respectively when the processor is the bottleneck.</p>`,
      },
      {
        id: "why-am4", toc: "Why AM4 still makes sense", h2: "Why an AM4 upgrade still makes sense in 2026",
        html: `
          <p>A move to AM5 means a new CPU, a new motherboard and new DDR5 memory. A drop-in AM4 upgrade is just the CPU, plus a BIOS update and maybe a better cooler. For many people that's a third of the cost for most of the gaming performance.</p>
          <p>The reason it works is cache. AMD's X3D chips stack an extra 64 MB of L3 cache on top of the CPU die, for 96 MB in total. Games constantly fetch the same data (world state, AI and physics), and a bigger cache means fewer slow trips out to RAM. That helps exactly the CPU-bound, stutter-prone moments where an older Ryzen struggles. It's also why the X3D chips aren't fussy about memory speed, which matters on an older board running DDR4-3200.</p>
          <p>The catch is that AM4 is finished. There won't be a faster chip than the 5800X3D, so this is the last upgrade the platform gets. If you want a CPU that will keep up with the GPU after next, read the section on when to skip AM4.</p>`,
      },
      {
        id: "contenders", toc: "The contenders", h2: "The contenders",
        html: `
          <h3>Ryzen 7 5700X3D</h3>
          <p>Eight cores, 96 MB of L3 cache, and slightly lower clocks than the 5800X3D (boost up to 4.1 GHz versus 4.5 GHz). In games the clock gap barely shows, because the cache does the heavy lifting. It's still sold new and is the default AM4 upgrade. It doesn't come with a cooler.</p>
          <h3>Ryzen 7 5800X3D</h3>
          <p>The original gaming X3D chip and the fastest AM4 processor ever made, but only about ${d5800}% ahead of the 5700X3D in our gaming index. It's no longer produced, so most units for sale are used or old stock. If one costs much more than a 5700X3D, buy the 5700X3D.</p>
          <h3>Ryzen 5 5600X3D</h3>
          <p>A six-core X3D chip that was sold in limited numbers through one US retailer. It games about as well as the 5700X3D. If you find one at a good price it's a fine pick, but don't go hunting for it.</p>
          <h3>Ryzen 5 5600 and Ryzen 7 5700X</h3>
          <p>The value options. The 5600 is the cheapest Zen 3 chip with the full 32 MB of cache, and it's enough for most mid-range cards at 1440p. The 5700X adds two cores, which helps a little with streaming and multitasking, but in games it's only about ${dx}% faster. Neither one gets close to the X3D chips in CPU-heavy games.</p>
          <h3>What about the Ryzen 9 5900X and 5950X?</h3>
          <p>They're excellent for rendering and compiling, but games don't use 12 or 16 cores. Their gaming performance is close to a 5600X, so for a gaming upgrade they're poor value unless you find one very cheap.</p>`,
      },
      {
        id: "fps-1440p", toc: "FPS at 1440p", h2: "AM4 CPUs with today's graphics cards at 1440p",
        html: `
          <p>Estimated average FPS in AAA games at 1440p High, with the bottleneck underneath. The Ryzen 5 3600 is included as a starting point because it's one of the most common chips people upgrade from. Click any result for the full build page or the calculator.</p>
          ${matrix("1440p")}
          <p>At 1440p the ${name("ryzen-5-5600")} is already balanced with an ${name("rtx-5070")} (${fmt(r5600.fps)} FPS), so the X3D chips mostly earn their keep with faster cards. Pair a 5700X3D with an ${name("rtx-5070-ti")} and the two are balanced at 1440p (${fmt(x3d1440.fps)} FPS), while at 1080p the same build is ${pct(x3d1080)}% CPU-limited. Average FPS also undersells the X3D chips: in our model their 1% lows are about 4 points better relative to the average, and they shine in the CPU-heavy games covered below.</p>`,
      },
      {
        id: "which-for-gpu", toc: "Which one for your GPU", h2: "Which AM4 CPU for your graphics card?",
        html: `
          <p>The cheapest current AM4 chip that keeps each card within a 10% CPU bottleneck in AAA games at High settings. Anything faster works too.</p>
          ${forTable}
          <p>Two things the table can't show. First, <strong>CPU-heavy games</strong> such as strategy titles, simulators and MMOs need much more processor. In that kind of game at 1440p with an ${name("rtx-5070")}, the ${name("ryzen-5-5600")} manages about ${fmt(sim[0].fps)} FPS and the ${name("ryzen-7-5700x3d")} about ${fmt(sim[1].fps)}. If that's what you play, go X3D whatever your graphics card. Second, <strong>high-refresh esports</strong>: a 5700X3D drives an ${name("rtx-5070")} to roughly ${fmt(es[0].fps)} FPS in CS2-style games at 1080p, which is enough for 240 Hz but not 360 Hz. For a specific game, the ${link.fps("FPS calculator")} has per-title estimates.</p>`,
      },
      {
        id: "upgrade-gain", toc: "How much faster", h2: "How much faster than your current CPU?",
        html: `
          <p>The gain depends on how CPU-bound you are today. Here's a common case: an ${name("rtx-5070")} at 1080p. With a ${calc("ryzen-5-3600", "rtx-5070", { res: "1080p" }, name("ryzen-5-3600"))} the build is ${pct(x3dVs3600[0])}% CPU-limited at about ${fmt(x3dVs3600[0].fps)} FPS. Swap in a ${calc("ryzen-7-5700x3d", "rtx-5070", { res: "1080p" }, name("ryzen-7-5700x3d"))} and it's ${verdict(x3dVs3600[1])} at about ${fmt(x3dVs3600[1].fps)} FPS, a ${upGain}% jump from a CPU swap alone.</p>
          <p>If you're already GPU-bound, though, a faster CPU adds almost nothing to the average. A Ryzen 5 3600 with an ${name("rtx-4060")} at 1080p is already ${lowGpu.verdict.key === "excellent" ? "balanced" : "GPU-limited"} (${fmt(lowGpu.fps)} FPS), so upgrading the processor there buys better 1% lows in busy scenes and not much else. Put your parts into the ${link.calculator("bottleneck calculator")} first. If it says GPU-limited, spend the money on the graphics card instead.</p>`,
      },
      {
        id: "before-you-swap", toc: "Before you swap", h2: "Before you swap: BIOS, cooler and RAM",
        html: `
          <ol class="steps">
            <li><strong>Check your motherboard's CPU support list.</strong> All B550 and X570 boards and nearly all B450 and X470 boards support Ryzen 5000. Many A320, B350 and X370 boards gained support through later BIOS updates, but not all of them. Find your exact board on the manufacturer's site and note the first BIOS version that lists your new chip.</li>
            <li><strong>Update the BIOS before removing the old CPU.</strong> An old BIOS may not start at all with the new chip. If your board has BIOS Flashback, you can update without a working CPU, but it's simpler to flash first.</li>
            <li><strong>Plan for cooling.</strong> The X3D chips are 105 W parts and the 5700X3D comes without a cooler. The small stock cooler from a Ryzen 5 3600 isn't enough. A decent single-tower air cooler is.</li>
            <li><strong>Check your memory.</strong> Two sticks in dual channel with XMP enabled matters more than raw speed. DDR4-3200 to 3600 is the sweet spot, and the X3D chips are the least sensitive to slower kits.</li>
            <li><strong>Re-enable XMP and reinstall the chipset driver</strong> after the swap. A BIOS update usually resets memory settings to their slow defaults.</li>
          </ol>
          <p>The X3D chips can't be overclocked the usual way, but most boards let you use Curve Optimizer through Precision Boost Overdrive to lower voltage and run cooler at the same clocks. It's optional and worth a few degrees.</p>`,
      },
      {
        id: "skip-am4", toc: "When to skip AM4", h2: "When to skip AM4 and move to AM5",
        html: `
          <p>An AM4 upgrade stops making sense when the graphics card outgrows it. Even the 5800X3D holds an ${name("rtx-5090")} back by ${pct(top)}% at 1440p (${fmt(top.fps)} FPS), while a ${build("ryzen-7-9800x3d", "rtx-5090", name("ryzen-7-9800x3d"))} gets ${fmt(am5.fps)}. In esports at 1080p, the 9800X3D reaches about ${fmt(es[1].fps)} FPS with an ${name("rtx-5070")} against ${fmt(es[0].fps)} for the 5700X3D. Consider AM5 if:</p>
          <ul>
            <li>you're buying an RTX 5080, RTX 5090 or similar card, especially for 1440p high refresh;</li>
            <li>you play competitive games on a 360 Hz or faster monitor;</li>
            <li>your motherboard has no BIOS support for Ryzen 5000;</li>
            <li>you need a new motherboard or RAM anyway.</li>
          </ul>
          <p>For everyone else, a 5700X3D on the board you already own is one of the best-value upgrades in PC gaming. If you're unsure which processor suits a specific card, our guide to the ${guide("best-cpu-for-rtx-5070", "best CPU for the RTX 5070 and 5070 Ti")} covers AM5 and Intel options too.</p>`,
      },
    ],
    faq: [
      ["What is the best AM4 CPU for gaming?", `The Ryzen 7 5800X3D is the fastest, but the Ryzen 7 5700X3D is the best buy. It's still sold new and is only about ${d5800}% slower in games. Both have 96 MB of 3D V-Cache, which is what makes them so strong in games.`],
      ["Is the 5800X3D worth it over the 5700X3D?", `Usually not. The gap is about ${d5800}% when the CPU is the limit and smaller when the GPU is. The 5800X3D is out of production, so only buy it if it costs about the same as a 5700X3D.`],
      ["Will a Ryzen 7 5700X3D work on a B450 motherboard?", "Yes, on nearly all B450 and X470 boards, after a BIOS update. Check your board's CPU support list for the first BIOS version that lists the 5700X3D, and flash it before you remove your old CPU."],
      ["Is the Ryzen 5 5600 enough for an RTX 5070?", `At 1440p, yes. The two are balanced at about ${fmt(r5600.fps)} FPS in AAA games. At 1080p the 5600 holds the RTX 5070 back by about ${pct(ev("ryzen-5-5600", "rtx-5070", { res: "1080p" }))}%, so for 1080p high refresh the 5700X3D is the better match.`],
      ["Does the 5700X3D need a new cooler?", "It doesn't include one, so you need a cooler either way. A Ryzen 5 3600's stock cooler is too small for a 105 W chip. A decent single-tower air cooler keeps it at full boost."],
      ["Should I upgrade to a 5700X3D or switch to AM5?", "If your current board supports it and your graphics card is RTX 5070 Ti or RX 9070 XT class or slower, the 5700X3D gives most of the gaming performance for a fraction of the cost. Move to AM5 for an RTX 5080 or faster, very high refresh esports, or if you need a new board anyway."],
    ],
    related: ["best-cpu-for-rtx-5070", "how-to-fix-cpu-bottleneck", "how-to-check-for-bottleneck"],
  };
};
