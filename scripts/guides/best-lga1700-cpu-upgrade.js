// Guide: Best LGA1700 (12th to 14th gen Intel) CPU upgrade in 2026
module.exports = function (h) {
  const { ev, cpu, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, compare, table, td, limitTag } = h;

  const CPUS = ["i3-12100f", "i5-12400f", "i5-13400f", "i5-12600k", "i5-14400f", "i5-13600k", "i5-14600k", "i7-13700k", "i7-14700k", "i9-14900k"];
  const COLS = [["rtx-5070", "1080p"], ["rtx-5070", "1440p"], ["rtx-5070-ti", "1080p"], ["rtx-5070-ti", "1440p"]];
  const cell = (c, g, r) => {
    const x = ev(c, g, { res: r });
    return `<td class="r">${calc(c, g, { res: r }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  const matrix = table(
    ["CPU", ...COLS.map(([g, r]) => [`${name(g)} ${r}`, true])],
    CPUS.map((c) => [td(`<strong>${name(c)}</strong>`), ...COLS.map(([g, r]) => cell(c, g, r))]),
  );

  // CPU limit in AAA at High: independent of GPU and resolution.
  const cap = (id) => ev(id, "rtx-5090", { res: "1080p" }).cpuFps;
  const up = (a, b) => gain(cap(b), cap(a));
  const PATHS = [
    ["i3-12100f", "i5-14400f"], ["i3-12100f", "i5-14600k"],
    ["i5-12400f", "i5-14400f"], ["i5-12400f", "i5-14600k"], ["i5-12400f", "i7-14700k"],
    ["i5-12600k", "i5-14600k"], ["i5-12600k", "i7-14700k"],
    ["i5-13400f", "i5-14600k"], ["i5-13400f", "i7-14700k"],
    ["i5-13600k", "i7-14700k"],
  ];
  const pathTable = table(
    ["Upgrade", ["Faster when CPU-bound", true], [`${name("rtx-5070-ti")} 1080p, before`, true], ["After", true]],
    PATHS.map(([a, b]) => {
      const x = ev(a, "rtx-5070-ti", { res: "1080p" });
      const y = ev(b, "rtx-5070-ti", { res: "1080p" });
      return [td(`${name(a)} › <strong>${name(b)}</strong>`), td(`${up(a, b)}%`, true),
        `<td class="r">${fmt(x.fps)}<br>${limitTag(x)}</td>`, `<td class="r">${calc(b, "rtx-5070-ti", { res: "1080p" }, fmt(y.fps))}<br>${limitTag(y)}</td>`];
    }),
  );

  // Facts the copy relies on
  const g = {
    i14400vs12400: up("i5-12400f", "i5-14400f"), i14400vs13400: up("i5-13400f", "i5-14400f"),
    i14600vs13600: up("i5-13600k", "i5-14600k"), i14700vs13700: up("i7-13700k", "i7-14700k"),
    i14900vs14700: up("i7-14700k", "i9-14900k"), i14700vs14600: up("i5-14600k", "i7-14700k"),
    i14600vs12400: up("i5-12400f", "i5-14600k"), i14600vs12600: up("i5-12600k", "i5-14600k"),
    i14600vs13400: up("i5-13400f", "i5-14600k"), i14400vs12100: up("i3-12100f", "i5-14400f"),
    i13600vs12600: up("i5-12600k", "i5-13600k"),
    x78: up("i7-14700k", "ryzen-7-7800x3d"), x98: up("i7-14700k", "ryzen-7-9800x3d"),
  };
  expect(g.i14400vs12400 > 0 && g.i14400vs12400 <= 10 && g.i14400vs13400 <= 3, "14400F is a small step over 12400F/13400F");
  expect(cap("i5-14400f") === cap("i5-12600k"), "14400F games like a 12600K");
  expect(g.i14600vs13600 <= 4 && g.i14700vs13700 <= 7 && g.i14900vs14700 <= 2, "14th gen refreshes are small steps");
  expect(cap("i5-14600k") === cap("i7-13700k"), "14600K games like a 13700K");
  expect(g.i14600vs12400 >= 20 && g.i14600vs12600 >= 15 && g.i14600vs13400 >= 15, "14600K is a real step from 12400F/12600K/13400F");
  expect(g.i14400vs12100 >= 20, "14400F is a big step from the i3-12100F");
  expect(g.i14700vs14600 > 0 && g.i14700vs14600 <= 7, "14700K is a little faster than 14600K");
  expect(g.x78 >= 8 && g.x98 >= 20, "AM5 X3D chips are clearly faster than the 14700K");

  const at = (c, gp, r, o = {}) => ev(c, gp, { res: r, ...o });
  const i3 = [at("i3-12100f", "rtx-5070", "1080p"), at("i3-12100f", "rtx-5070", "1440p")];
  expect(i3[0].limiter === "cpu" && i3[0].pct >= 25 && i3[1].verdict.key === "excellent", "12100F + 5070: CPU-bound at 1080p, balanced at 1440p");
  const i12 = [at("i5-12400f", "rtx-5070-ti", "1080p"), at("i5-12400f", "rtx-5070-ti", "1440p")];
  expect(i12[0].limiter === "cpu" && i12[0].pct >= 25 && i12[1].verdict.key === "excellent", "12400F + 5070 Ti: CPU-bound at 1080p, balanced at 1440p");
  const k14 = [at("i5-14600k", "rtx-5070", "1080p"), at("i5-14600k", "rtx-5070-ti", "1080p"), at("i7-14700k", "rtx-5070-ti", "1080p")];
  expect(k14[0].verdict.key === "excellent" && k14[1].pct < 20 && k14[2].pct < 15, "14600K/14700K handle a 5070/5070 Ti at 1080p");
  const top = [at("i7-14700k", "rtx-5090", "1440p"), at("ryzen-7-9800x3d", "rtx-5090", "1440p"), at("i7-14700k", "rtx-5080", "1440p"), at("i7-14700k", "rtx-5080", "1080p")];
  expect(top[0].limiter === "cpu" && top[0].pct >= 15 && top[1].verdict.key === "excellent", "14700K limits a 5090 at 1440p, 9800X3D doesn't");
  expect(top[2].verdict.key === "excellent" || top[2].limiter === "gpu", "14700K is fine for a 5080 at 1440p");
  expect(top[3].limiter === "cpu" && top[3].pct >= 15, "14700K is CPU-bound with a 5080 at 1080p");
  const es = ["i5-12400f", "i5-14600k", "i7-14700k", "ryzen-7-7800x3d"].map((c) => at(c, "rtx-5070", "1080p", { workload: "esports" }));
  expect(es[0].fps >= 240 && es[0].fps < 360 && es[1].fps >= 360 && es[2].fps >= 360 && es[2].fps < 400 && es[3].fps >= 400, "esports thresholds");
  const sim = ["i5-12400f", "i5-14600k", "i7-14700k", "ryzen-7-9800x3d"].map((c) => at(c, "rtx-5070-ti", "1440p", { workload: "cpuheavy" }));
  const gpuFirst = at("i5-12400f", "rtx-5060", "1080p");
  expect(gpuFirst.limiter === "gpu" && gpuFirst.pct >= 20, "12400F + 5060 is GPU-bound: upgrade the GPU first");
  expect(cap("ultra-7-265k") < cap("i7-14700k") && cap("ultra-5-245k") < cap("i5-14600k"), "Core Ultra 200S isn't faster in games");
  const s14700f = up("i7-14700f", "i7-14700k");
  expect(s14700f > 0 && s14700f <= 8 && Math.abs(up("i5-14600k", "i7-14700f")) <= 2, "14700F games like a 14600K, a bit behind the 14700K");

  return {
    slug: "best-lga1700-cpu-upgrade",
    title: "Best LGA1700 CPU Upgrade (2026): 12th, 13th and 14th Gen Intel",
    description: "The best LGA1700 CPU upgrade for 12th to 14th gen Intel PCs: FPS gains with RTX 5070 and 5070 Ti, the stability BIOS to flash first, and when AM5 is better.",
    h1: "Best LGA1700 CPU upgrade for 12th to 14th gen Intel PCs",
    crumb: "Best LGA1700 upgrade",
    card: "From an i3-12100F, i5-12400F, 12600K or 13400F to a 14400F, 14600K or 14700K: gains, the stability BIOS to flash first, and when AM5 is better.",
    lead: `LGA1700 is finished as a platform, but it ends on strong chips. If you own a 12th gen Intel PC, a 13th or 14th gen processor can be a large drop-in upgrade with no new board or memory. This guide shows how much each upgrade path gains with today's graphics cards, using the same model as our ${link.calculator("bottleneck calculator")}, and the BIOS step you must not skip.`,
    sections: [
      {
        id: "picks", toc: "Quick picks", h2: "Quick picks",
        html: `
          <div class="callout">
            <p><strong>Best for most upgrades: Core i5-14600K or 14600KF.</strong> About ${g.i14600vs12400}% faster than an i5-12400F and ${g.i14600vs12600}% faster than an i5-12600K when the CPU is the limit. The i5-13600K is within ${g.i14600vs13600}% and fine if it's cheaper.</p>
            <p><strong>Fastest sensible chip: Core i7-14700K.</strong> Another ${g.i14700vs14600}% over the 14600K, with more cores for streaming and work. The i9-14900K adds only ${g.i14900vs14700}% in games and draws more power.</p>
            <p><strong>Budget: Core i5-14400F.</strong> A big step from an i3-12100F (${g.i14400vs12100}%), but only ${g.i14400vs12400}% over a 12400F, so skip it if you already have a six-core i5.</p>
            <p><strong>On a basic B660 or B760 board:</strong> an i5-14400F or i7-14700F. The 14700F games like a 14600K without needing a Z-series board.</p>
            <p><strong>Before anything else:</strong> flash a BIOS with Intel's 0x12B microcode or newer. Details below.</p>
          </div>`,
      },
      {
        id: "the-chips", toc: "The chips worth buying", h2: "The 13th and 14th gen chips worth buying",
        html: `
          <p>Every 12th, 13th and 14th gen desktop Core processor uses the same LGA1700 socket, so any of them fits any 600- or 700-series board with the right BIOS. The 14th gen chips are mostly refreshes of 13th gen with slightly higher clocks, so the gaps between generations are small and the price usually decides.</p>
          <h3>Core i5-14400F and i5-13400F</h3>
          <p>Six performance cores plus four efficient cores. In our index the 14400F games exactly like an i5-12600K and only ${g.i14400vs13400}% faster than a 13400F. It's the right move from a quad-core i3, not from another i5. See ${compare("i5-14400f", "i5-13400f")} and ${compare("i5-13400f", "i5-12400f")}.</p>
          <h3>Core i5-13600K and i5-14600K</h3>
          <p>Six performance and eight efficient cores, with much higher clocks and more cache than the 12th gen i5s. This is where the LGA1700 upgrade gets worthwhile: the 14600K games like an i7-13700K. Compare ${compare("i5-14600k", "i5-13600k")} and ${compare("i5-13600k", "i5-12600k")} (${g.i13600vs12600}% apart when CPU-bound).</p>
          <h3>Core i7-13700K and i7-14700K</h3>
          <p>The 14700K got four more efficient cores than the 13700K, which helps work more than games: it's about ${g.i14700vs13700}% faster in games in our model. It's the best gaming chip the socket offers before power and price climb. See ${compare("i7-14700k", "i7-13700k")}.</p>
          <h3>Core i9-13900K and i9-14900K</h3>
          <p>Fastest on paper, but only ${g.i14900vs14700}% ahead of the 14700K in games, with the highest power draw and the most exposure to the stability issue below. Buy one for heavy multi-core work, not for gaming. See ${compare("i9-14900k", "i7-14700k")}.</p>
          <h3>K, KF and F</h3>
          <p>K chips are unlocked for overclocking, F chips have no integrated graphics, and KF is both. With a graphics card installed, F versions game the same and usually cost less. Non-K chips such as the i7-14700F run at lower clocks and power limits, which in our index puts the 14700F about ${s14700f}% behind the 14700K.</p>`,
      },
      {
        id: "gains", toc: "How much faster", h2: "How much faster than your current CPU?",
        html: `
          <p>The gain when the CPU is the limit, plus what it means with an ${name("rtx-5070-ti")} at 1080p, a setup where the processor matters. Click an after number to open that build in the calculator.</p>
          ${pathTable}
          <p>Whether you'll feel it depends on your graphics card. An i5-12400F with an ${name("rtx-5060")} at 1080p is already ${pct(gpuFirst)}% GPU-limited, so a faster CPU would add almost nothing to the average. Upgrade the graphics card first. With an ${name("rtx-5070-ti")}, the same 12400F is ${pct(i12[0])}% CPU-limited at 1080p but ${verdict(i12[1])} at 1440p. If you play at 1440p, a CPU swap mostly improves the 1% lows.</p>`,
      },
      {
        id: "fps", toc: "FPS with RTX 5070 and 5070 Ti", h2: "LGA1700 CPUs with an RTX 5070 and RTX 5070 Ti",
        html: `
          <p>Estimated average FPS in AAA games at High settings, with the bottleneck underneath.</p>
          ${matrix}
          <p>Even an ${calc("i3-12100f", "rtx-5070", { res: "1440p" }, "i3-12100F")} is ${verdict(i3[1])} with an ${name("rtx-5070")} at 1440p, while at 1080p it's ${pct(i3[0])}% CPU-limited. From the 14600K up, the ${name("rtx-5070")} is ${verdict(k14[0])} at 1080p and the ${name("rtx-5070-ti")} is within a small bottleneck. Two cases need more CPU than the table suggests. In CPU-heavy strategy and simulation games at 1440p with a 5070 Ti, the 12400F manages about ${fmt(sim[0].fps)} FPS, the 14600K ${fmt(sim[1].fps)} and the 14700K ${fmt(sim[2].fps)}. In CS2-style esports at 1080p with an ${name("rtx-5070")}, the 12400F reaches about ${fmt(es[0].fps)} FPS, the 14600K ${fmt(es[1].fps)} and the 14700K ${fmt(es[2].fps)}. For a specific game, use the ${link.fps("FPS calculator")}.</p>`,
      },
      {
        id: "stability", toc: "Stability BIOS first", h2: "Before you install a 13th or 14th gen chip: the stability BIOS",
        html: `
          <div class="callout">
            <p><strong>Some 13th and 14th gen desktop processors can become unstable over time because of elevated operating voltage, a problem Intel calls Vmin shift instability.</strong> Intel fixed the cause with microcode delivered through BIOS updates. 12th gen chips aren't affected.</p>
          </div>
          <ol class="steps">
            <li><strong>Update the BIOS before you swap the CPU.</strong> Your 12th gen chip boots on the old BIOS, so flash first, while it's still installed. Pick a release whose notes list Intel microcode 0x12B or newer. On a 600-series board, the update is also what adds 13th and 14th gen support.</li>
            <li><strong>Load the Intel Default Settings profile.</strong> Recent BIOS versions offer it (sometimes under a slightly different name). It keeps power and current limits at Intel's specification instead of a board's "unlimited" defaults.</li>
            <li><strong>Check the microcode in Windows.</strong> Tools such as HWiNFO show the running microcode revision. It should read 0x12B or higher.</li>
            <li><strong>Be careful buying used.</strong> The microcode prevents the damage but doesn't reverse it. A chip that already crashes in games, during shader compilation or under load may be degraded.</li>
            <li><strong>Know the warranty.</strong> Intel extended the warranty on boxed 13th and 14th gen Core desktop processors by two years. If a chip is unstable on stock settings with a current BIOS, contact Intel support. Tray chips in prebuilt PCs go through the system maker.</li>
          </ol>
          <p>With a current BIOS and default settings, a 13th or 14th gen chip is a reasonable buy. If you'd rather avoid the question entirely, the next sections cover the alternatives.</p>`,
      },
      {
        id: "board-ram-cooling", toc: "Board, RAM and cooling", h2: "Your board, memory and cooler",
        html: `
          <h3>DDR4 or DDR5 board</h3>
          <p>LGA1700 boards take either DDR4 or DDR5 (almost never both), and every 12th to 14th gen chip works with either. If your board is DDR4, the new processor runs on the memory you already own. Fast DDR5 helps most on the i7 and i9 in CPU-bound games, but a good DDR4-3200 or 3600 kit still gets you most of the gain. With memory prices up sharply since late 2025, keeping your RAM is a big part of why this upgrade is good value. Enable XMP after the BIOS update, since flashing resets it.</p>
          <h3>B660 and B760 versus Z690 and Z790</h3>
          <p>B-series boards can't overclock the CPU, but any chip runs at its stock speed on them, and they still allow memory overclocking. That makes non-K chips such as the i5-14400F and i7-14700F the natural match. A K chip on a B board works, it just can't be pushed further. Very cheap B660 and H610 boards can have weak power delivery that limits an i7 or i9 in long all-core work. Games rarely load the CPU that hard. Z690 and Z790 boards make sense if you want to overclock a K chip.</p>
          <h3>Cooling</h3>
          <p>K chips come without a cooler, and the i7-14700K and i9-14900K can draw well over 200 W in all-core work at Intel's default limits. Games use far less, but plan on a large dual-tower air cooler or a 240 to 360 mm liquid cooler for those two. A 14600K is happy on a good single-tower cooler. The small cooler bundled with a 12400F isn't enough for any K chip.</p>`,
      },
      {
        id: "am5", toc: "When AM5 is better", h2: "When to move to AM5 instead",
        html: `
          <p>The best LGA1700 chip for gaming still trails AMD's X3D processors. In our index a Ryzen 7 7800X3D is ${g.x78}% faster than the i7-14700K and a 9800X3D ${g.x98}% faster. With an ${name("rtx-5090")} at 1440p, the ${build("i7-14700k", "rtx-5090", "14700K")} is ${pct(top[0])}% CPU-limited at ${fmt(top[0].fps)} FPS, while the ${build("ryzen-7-9800x3d", "rtx-5090", "9800X3D")} is ${verdict(top[1])} at ${fmt(top[1].fps)}. In the CPU-heavy test above, the 9800X3D reaches about ${fmt(sim[3].fps)} FPS. Moving to AM5 is the better plan if:</p>
          <ul>
            <li>you're buying an RTX 5080 or faster for 1080p or 1440p high refresh (at 1080p the 14700K is ${pct(top[3])}% CPU-limited with a 5080);</li>
            <li>you play esports on a 360 Hz or faster monitor, or mostly CPU-heavy games;</li>
            <li>your board is a basic H610, or needs replacing anyway;</li>
            <li>you want a socket that will take another CPU upgrade later.</li>
          </ul>
          <p>Intel's own newer socket, LGA1851 for the Core Ultra 200S chips, isn't a gaming upgrade: in our index the ${compare("ultra-7-265k", "i7-14700k", "Core Ultra 7 265K is slower than the i7-14700K")}. For the AM5 side, read the ${guide("best-am5-cpu", "best AM5 CPU guide")}, or compare ${compare("ryzen-7-7800x3d", "i7-14700k")} directly. For an RTX 5070 Ti or slower at 1440p, a 14600K or 14700K drop-in on the board you own is the cheaper path to the same frame rate.</p>`,
      },
    ],
    faq: [
      ["What is the best CPU upgrade for an LGA1700 motherboard?", `For gaming, the Core i5-14600K or i7-14700K. The 14600K is about ${g.i14600vs12400}% faster than an i5-12400F when the CPU is the limit, and the 14700K adds about ${g.i14700vs14600}% more. The i9-14900K is only ${g.i14900vs14700}% faster than the 14700K in games.`],
      ["Is upgrading from an i5-12400F to an i5-14400F worth it?", `Usually not. The 14400F is only about ${g.i14400vs12400}% faster in CPU-bound games. If you want a noticeable gain on the same board, the i5-14600K or i7-14700K is the upgrade, at about ${g.i14600vs12400}% or more.`],
      ["Do I need a BIOS update for a 13th or 14th gen CPU?", "Yes. Flash a BIOS with Intel microcode 0x12B or newer before installing the new chip, while your old processor is still in place. That microcode includes Intel's fix for the Vmin shift instability on 13th and 14th gen, and on 600-series boards, adds support for the newer chips. Then load the Intel Default Settings profile."],
      ["Are 12th gen Intel CPUs affected by the instability problem?", "No. The Vmin shift instability affects 13th and 14th gen desktop processors. 12th gen chips such as the i5-12400F and i5-12600K are not affected, but it's still worth running a current BIOS."],
      ["Can I use a 14th gen CPU on a DDR4 motherboard?", "Yes. Every 12th to 14th gen chip supports both DDR4 and DDR5, and the board decides which one you use. On a DDR4 board you keep your current memory. Fast DDR5 is a little quicker in CPU-bound games, but the upgrade still delivers most of its gain on DDR4."],
      ["Can I put a K processor on a B760 motherboard?", "Yes. It runs at its stock speeds, but you can't overclock the CPU on a B-series board. If you don't plan to overclock, a non-K chip such as the i5-14400F or i7-14700F is usually better value on a B660 or B760 board."],
      ["Should I upgrade within LGA1700 or switch to AM5?", `Stay on LGA1700 with a 14600K or 14700K if your graphics card is RTX 5070 Ti class or slower and you play at 1440p. Switch to AM5 for an RTX 5080 or faster, very high refresh esports, or if you need a new board anyway. A Ryzen 7 9800X3D is about ${g.x98}% faster than the i7-14700K in games.`],
    ],
    related: ["best-am5-cpu", "best-cpu-for-rtx-5070", "how-to-fix-cpu-bottleneck"],
  };
};
