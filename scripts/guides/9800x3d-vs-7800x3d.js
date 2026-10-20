// Guide: Ryzen 7 9800X3D vs 7800X3D: is the upgrade worth it?
module.exports = function (h) {
  const { Games, BASE, ev, cpu, gpu, pct, gain, fmt, name, verdict, expect, calc, build, compare, guide, link, table, td, limitTag } = h;

  const OLD = "ryzen-7-7800x3d", NEW = "ryzen-7-9800x3d", NEXT = "ryzen-7-9850x3d";
  const GPUS = ["rtx-5070-ti", "rtx-5080", "rtx-5090"];
  const RESES = ["1080p", "1440p", "4k"];
  const RES_LABEL = { "1080p": "1080p", "1440p": "1440p", "4k": "4K" };
  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...o });
  const cell = (c, g, r, o = {}) => {
    const x = at(c, g, r, o);
    return `<td class="r">${calc(c, g, { res: r, ...o }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  const diff = (a, b) => { const d = gain(b.fps, a.fps); return d > 0 ? `+${d}%` : "same"; };

  // ---- CPU facts
  const idx = gain(cpu(NEW).g, cpu(OLD).g);
  const idxNext = gain(cpu(NEXT).g, cpu(NEW).g), idxNextOld = gain(cpu(NEXT).g, cpu(OLD).g);
  expect(idx >= 10 && idx <= 18, "9800X3D is 10–18% faster in the CPU index");
  expect(cpu(OLD).socket === "AM5" && cpu(NEW).socket === "AM5" && cpu(NEXT).socket === "AM5", "all three are AM5");
  expect(cpu(OLD).cores === 8 && cpu(NEW).cores === 8 && cpu(NEXT).cores === 8, "all three are 8-core");

  // ---- Main table: GPU x resolution
  const R = Object.fromEntries(GPUS.map((g) => [g, RESES.map((r) => [at(OLD, g, r), at(NEW, g, r)])]));
  const G = (g, r) => { const [a, b] = R[g][RESES.indexOf(r)]; return gain(b.fps, a.fps); };
  const mainTable = table(
    ["GPU and resolution", ["7800X3D", true], ["9800X3D", true], ["Difference", true], ["1% lows", true]],
    GPUS.flatMap((g) => RESES.map((r, i) => {
      const [a, b] = R[g][i];
      return [td(`${build(NEW, g, name(g))}, ${RES_LABEL[r]}`), cell(OLD, g, r), cell(NEW, g, r), td(diff(a, b), true), td(`${fmt(a.low1)} → ${fmt(b.low1)}`, true)];
    })),
  );
  expect(G("rtx-5070-ti", "1440p") === 0 && G("rtx-5070-ti", "4k") === 0 && G("rtx-5070-ti", "1080p") <= 6, "5070 Ti: same at 1440p/4K, small at 1080p");
  expect(G("rtx-5080", "1440p") <= 2 && G("rtx-5080", "4k") === 0 && G("rtx-5080", "1080p") >= 5 && G("rtx-5080", "1080p") <= 12, "5080: tiny at 1440p, moderate at 1080p");
  expect(G("rtx-5090", "1080p") >= 10 && G("rtx-5090", "1440p") >= 5 && G("rtx-5090", "4k") === 0, "5090: double-digit at 1080p, noticeable at 1440p, none at 4K");
  const o90 = R["rtx-5090"][1];
  expect(o90[0].limiter === "cpu" && o90[1].verdict.key === "excellent", "5090 at 1440p: 7800X3D CPU-limited, 9800X3D balanced");
  const ti1440 = R["rtx-5070-ti"][1];
  expect(ti1440.every((x) => x.limiter === "gpu"), "both GPU-limited with a 5070 Ti at 1440p");
  expect(R["rtx-5080"][0][1].verdict.key === "excellent" && R["rtx-5080"][0][0].limiter === "cpu", "5080 at 1080p: 9800X3D balanced, 7800X3D CPU-limited");

  // ---- Game types at 1440p
  const TYPES = [
    ["AAA games, native", {}],
    ["Ray tracing, native", { workload: "raytracing" }],
    ["Esports (CS2, Valorant)", { workload: "esports" }],
    ["CPU-heavy (sims, strategy, MMO)", { workload: "cpuheavy" }],
  ];
  const typeTable = table(
    ["Game type, 1440p High", ["5080 + 7800X3D", true], ["5080 + 9800X3D", true], ["5090 + 7800X3D", true], ["5090 + 9800X3D", true]],
    TYPES.map(([label, o]) => [td(label), cell(OLD, "rtx-5080", "1440p", o), cell(NEW, "rtx-5080", "1440p", o), cell(OLD, "rtx-5090", "1440p", o), cell(NEW, "rtx-5090", "1440p", o)]),
  );
  const ty = (i, g, r = "1440p") => [at(OLD, g, r, TYPES[i][1]), at(NEW, g, r, TYPES[i][1])];
  const rt80 = ty(1, "rtx-5080"), rt90 = ty(1, "rtx-5090");
  expect(gain(rt80[1].fps, rt80[0].fps) <= 1 && gain(rt90[1].fps, rt90[0].fps) <= 2, "ray tracing: no real gain at 1440p");
  const sims = GPUS.map((g) => ty(3, g));
  const simGain = gain(sims[2][1].fps, sims[2][0].fps);
  expect(sims.every(([a, b]) => a.limiter === "cpu" && b.limiter === "cpu" && Math.abs(gain(b.fps, a.fps) - idx) <= 2), "CPU-heavy: both CPU-limited, gain tracks the CPU index on every GPU");
  const es90 = ty(2, "rtx-5090", "1080p"), es80 = ty(2, "rtx-5080");
  const esGain = gain(es90[1].fps, es90[0].fps);
  expect(es90[0].fps < 480 && es90[1].fps >= 480, "esports 1080p with a 5090: only the 9800X3D clears 480 Hz");

  // ---- Upscaled 4K with a 5090
  const up4k = [at(OLD, "rtx-5090", "4k", { upscale: "performance" }), at(NEW, "rtx-5090", "4k", { upscale: "performance" })];
  const upGain = gain(up4k[1].fps, up4k[0].fps);
  expect(up4k[0].limiter === "cpu" && upGain >= 8, "5090 at 4K DLSS Performance: 7800X3D CPU-limited, 9800X3D 8%+ faster");

  // ---- Per game, RTX 5090 at 1440p
  const gm = (c, game) => Games.evaluate(cpu(c), gpu("rtx-5090"), game, { ...BASE, res: "1440p" });
  const fpsHref = (c, game) => `../../fps-calculator/?cpu=${c}&amp;gpu=rtx-5090&amp;game=${game}&amp;res=1440p`;
  const GAMES = ["cs2", "valorant", "fortnite", "cyberpunk", "warzone", "gta-5", "bg3", "msfs-2024", "apex", "elden-ring"];
  const gameRows = GAMES.map((id) => [id, gm(OLD, id), gm(NEW, id)]);
  const gameTable = table(
    ["Game (RTX 5090, 1440p High)", ["7800X3D", true], ["9800X3D", true], ["Difference", true]],
    gameRows.map(([id, a, b]) => [
      td(Games.byId[id].name),
      td(`<a href="${fpsHref(OLD, id)}">${fmt(a.fps)}</a>${a.capped ? " (cap)" : ""}`, true),
      td(`<a href="${fpsHref(NEW, id)}">${fmt(b.fps)}</a>${b.capped ? " (cap)" : ""}`, true),
      td(diff(a, b), true),
    ]),
  );
  const gRow = (id) => gameRows.find((x) => x[0] === id);
  const elden = gRow("elden-ring"), apex = gRow("apex"), bg3 = gRow("bg3"), msfs = gRow("msfs-2024"), cyber = gRow("cyberpunk");
  expect(elden[1].capped && elden[2].capped, "Elden Ring hits its 60 FPS cap on both");
  expect(apex[2].capped && !apex[1].capped, "Apex: 9800X3D hits the 300 FPS cap, 7800X3D just under");
  const uncapped = gameRows.filter(([, a, b]) => !a.capped && !b.capped).map(([, a, b]) => gain(b.fps, a.fps));
  expect(Math.min(...uncapped) >= 5 && Math.max(...uncapped) <= 16, "uncapped games: 5–16% gain with a 5090 at 1440p");

  expect(gain(cyber[2].fps, cyber[1].fps) === Math.min(...uncapped) && gain(bg3[2].fps, bg3[1].fps) === Math.max(...uncapped), "Cyberpunk gains least, BG3 most");

  // ---- Still good in 2026 / not worth it with slower cards
  const old9070 = ["1080p", "1440p"].map((r) => at(OLD, "rx-9070-xt", r));
  expect(R["rtx-5070-ti"][0][0].verdict.key === "excellent" && old9070.every((x) => x.verdict.key === "excellent" || x.limiter === "gpu"), "7800X3D keeps a 5070 Ti / 9070 XT busy at 1080p+");
  expect(R["rtx-5080"][1][0].limiter === "gpu", "7800X3D is GPU-limited with a 5080 at 1440p");
  expect(["rx-9070-xt", "rtx-5070-ti"].every((g) => ["1440p", "4k"].every((r) => at(OLD, g, r).limiter === "gpu" && gain(at(NEW, g, r).fps, at(OLD, g, r).fps) <= 1)), "same FPS with a 5070 Ti / 9070 XT at 1440p and 4K");

  // ---- 9850X3D
  const n90 = at(NEXT, "rtx-5090", "1440p"), n90_1080 = at(NEXT, "rtx-5090", "1080p");
  expect(gain(n90.fps, o90[1].fps) <= 3, "9850X3D adds 3% or less over the 9800X3D with a 5090 at 1440p");

  return {
    slug: "9800x3d-vs-7800x3d",
    title: "Ryzen 7 9800X3D vs 7800X3D (2026): Is the Upgrade Worth It?",
    description: "Should you upgrade from a Ryzen 7 7800X3D to a 9800X3D? FPS and 1% lows with an RTX 5070 Ti, 5080 and 5090 at every resolution, game by game, plus the 9850X3D.",
    h1: "Ryzen 7 9800X3D vs 7800X3D: is the upgrade worth it?",
    crumb: "9800X3D vs 7800X3D",
    card: "FPS and 1% lows for both chips with an RTX 5070 Ti, 5080 and 5090 at 1080p, 1440p and 4K, game by game, and when swapping actually pays off.",
    lead: `The 9800X3D is the faster gaming CPU, but if you already own a 7800X3D, the gap you'll see depends almost entirely on your graphics card and resolution. Here's what each chip delivers with an RTX 5070 Ti, 5080 and 5090, calculated with the same model as our ${link.calculator("bottleneck calculator")}, and when the swap is worth the money.`,
    sections: [
      {
        id: "short-answer", toc: "The short answer", h2: "The short answer",
        html: `
          <div class="callout">
            <p><strong>Upgrade if</strong> you have an RTX 5090 and play at 1080p or 1440p on a high-refresh monitor, an RTX 5080 at 1080p, or you mostly play simulators, strategy games or esports. With a 5090 at 1440p the 9800X3D is about ${G("rtx-5090", "1440p")}% faster and removes the CPU bottleneck entirely.</p>
            <p><strong>Don't upgrade if</strong> you play at 4K native, use an RTX 5070 Ti-class card or slower, or play mostly ray-traced single-player games. In those cases the graphics card is the limit and both CPUs land on the same frame rate.</p>
            <p><strong>Buying new?</strong> Get the 9800X3D if the price gap is small. The 7800X3D is still a top gaming CPU and the better value when it's clearly cheaper.</p>
          </div>`,
      },
      {
        id: "differences", toc: "What changed", h2: "What changed between the 7800X3D and 9800X3D",
        html: `
          <p>Both are 8-core, 16-thread AM5 chips with 96 MB of L3 cache, most of it in a stacked 3D V-Cache die. The 7800X3D uses Zen 4 cores with the cache die on top. The 9800X3D moves to Zen 5 and puts the cache die underneath the cores, which lets them run at higher clocks and, for the first time on an X3D chip, be overclocked.</p>
          <p>In our CPU index the 9800X3D scores ${cpu(NEW).g} to the 7800X3D's ${cpu(OLD).g}, so it can prepare about ${idx}% more frames per second when the processor is the limit. That's the most you'll ever gain. Whether you see it depends on whether your graphics card can draw those extra frames, which is the theme of this whole comparison. The ${compare(NEW, OLD, "9800X3D vs 7800X3D")} page has the full side-by-side.</p>
          <p>The 7800X3D launched at $449 and the 9800X3D at $479 (US MSRPs). Prices have shifted since, so check current listings, but the newer chip has usually cost somewhat more.</p>`,
      },
      {
        id: "by-gpu", toc: "FPS with each GPU", h2: "FPS with an RTX 5070 Ti, 5080 and 5090",
        html: `
          <p>Average FPS in AAA games at High settings without upscaling, with the bottleneck below each figure and the 1% lows on the right. Click a number to open that build in the calculator.</p>
          ${mainTable}
          <p><strong>RTX 5070 Ti:</strong> the two chips are tied at 1440p and 4K, and only ${G("rtx-5070-ti", "1080p")}% apart at 1080p. Both are GPU-limited at 1440p. A 7800X3D owner with this card gains nothing worth paying for. Our ${guide("ryzen-7-7800x3d-rtx-5070-ti", "7800X3D + RTX 5070 Ti guide")} covers that pairing in depth.</p>
          <p><strong>RTX 5080:</strong> at 1080p the 9800X3D is ${verdict(R["rtx-5080"][0][1])} and about ${G("rtx-5080", "1080p")}% faster, while the 7800X3D is ${verdict(R["rtx-5080"][0][0])}. At 1440p the gap shrinks to ${G("rtx-5080", "1440p")}%, because the card is the limit for both.</p>
          <p><strong>RTX 5090:</strong> the only card where the upgrade shows at 1440p. The 7800X3D is ${verdict(o90[0])} there and the 9800X3D is ${verdict(o90[1])}, about ${G("rtx-5090", "1440p")}% faster, with 1% lows of ${fmt(o90[1].low1)} against ${fmt(o90[0].low1)} FPS. At 1080p the gap is ${G("rtx-5090", "1080p")}%. At native 4K both run at about ${fmt(R["rtx-5090"][2][0].fps)} FPS. Turn on DLSS Performance at 4K, though, and the CPU matters again: the 9800X3D is about ${upGain}% faster there. Our ${guide("best-cpu-for-rtx-5080-5090", "best CPU for RTX 5080 and 5090 guide")} covers those cards with more CPUs.</p>`,
      },
      {
        id: "game-types", toc: "Esports, sims and 1% lows", h2: "Esports, CPU-heavy games and ray tracing",
        html: `
          <p>The averages above are for typical AAA games. The gap changes a lot by game type. Here's 1440p High with the two fastest cards:</p>
          ${typeTable}
          <p><strong>CPU-heavy games</strong> are where the 9800X3D earns its price. Simulators, strategy games and MMOs are CPU-limited on both chips with every card here, so the 9800X3D's ${idx}% advantage shows up almost in full, about ${simGain}% with a 5090, even at 1440p and with an RTX 5070 Ti.</p>
          <p><strong>Esports</strong> gain with fast cards. With a 5090 at 1080p, CS2-style games run at about ${fmt(es90[0].fps)} FPS on the 7800X3D and ${fmt(es90[1].fps)} on the 9800X3D, ${esGain}% more, which is the difference between falling short of and clearing a 480 Hz monitor. With a 5080 at 1440p the two are ${fmt(es80[0].fps)} and ${fmt(es80[1].fps)} FPS.</p>
          <p><strong>Ray tracing</strong> barely moves. The GPU is so heavily loaded that both chips land on about ${fmt(rt90[0].fps)} FPS with a 5090 and ${fmt(rt80[0].fps)} with a 5080 at 1440p native.</p>`,
      },
      {
        id: "by-game", toc: "Game by game", h2: "Game by game with an RTX 5090 at 1440p",
        html: `
          <p>Per-game estimates from our ${link.fps("FPS calculator")}, with the fastest card so the CPU difference shows clearly. Click a number to open it.</p>
          ${gameTable}
          <p>Most games gain between ${Math.min(...uncapped)}% and ${Math.max(...uncapped)}%. The CPU-bound titles gain the most: ${Games.byId.bg3.name} goes from ${fmt(bg3[1].fps)} to ${fmt(bg3[2].fps)} FPS and Flight Simulator 2024 from ${fmt(msfs[1].fps)} to ${fmt(msfs[2].fps)}. ${Games.byId.cyberpunk.name}, which leans harder on the graphics card, gains the least, from ${fmt(cyber[1].fps)} to ${fmt(cyber[2].fps)}. Elden Ring is locked to 60 FPS, so neither chip can show a difference, and in Apex Legends the 9800X3D reaches the 300 FPS engine cap while the 7800X3D sits just below it at ${fmt(apex[1].fps)}.</p>`,
      },
      {
        id: "when-upgrade", toc: "When to upgrade", h2: "When upgrading makes sense, and when it doesn't",
        html: `
          <h3>Worth it</h3>
          <ul>
            <li>You own an RTX 5090 and play at 1080p or 1440p above 144 Hz.</li>
            <li>You own an RTX 5080 and play at 1080p on a 240 Hz or faster monitor.</li>
            <li>Most of your time goes to simulators, strategy games, MMOs or competitive shooters, where the CPU is the limit at any resolution.</li>
            <li>You play at 4K with DLSS Performance on a 5090 and want the highest frame rate.</li>
          </ul>
          <h3>Not worth it</h3>
          <ul>
            <li>You play at native 4K. Both CPUs are GPU-limited and land on the same FPS.</li>
            <li>Your card is an RTX 5070 Ti, RX 9070 XT or slower. The GPU is the limit at 1440p and above.</li>
            <li>You play mostly ray-traced single-player games at 60–120 FPS.</li>
            <li>You have a fixed budget. A faster graphics card almost always adds more FPS than this CPU swap.</li>
          </ul>
          <p>Not sure which side you're on? Watch GPU usage in your own games. If it sits near 99%, a faster CPU won't help. Our ${guide("how-to-check-for-bottleneck", "guide to checking for a bottleneck")} explains how.</p>`,
      },
      {
        id: "upgrade", toc: "9850X3D and the swap", h2: "The 9850X3D, and what the swap involves",
        html: `
          <p><strong>The 9850X3D.</strong> AMD's higher-clocked version of the 9800X3D (launch price $499) scores ${cpu(NEXT).g} in our index, about ${idxNext}% above the 9800X3D and ${idxNextOld}% above the 7800X3D. With a 5090 at 1440p it runs at about ${fmt(n90.fps)} FPS against ${fmt(o90[1].fps)}, and at 1080p ${fmt(n90_1080.fps)} against ${fmt(R["rtx-5090"][0][1].fps)}. If you're upgrading from a 7800X3D anyway, buy whichever of the two is cheaper on the day. See ${compare(NEXT, NEW, "9850X3D vs 9800X3D")} for the details.</p>
          <p><strong>Same board, same RAM.</strong> All three chips use socket AM5, so the swap is a drop-in: no new motherboard, memory or cooler mounting. Update the BIOS first, while the 7800X3D is still installed. B650 and X670 boards need a BIOS release that supports Ryzen 9000, and boards from the 800 series support it out of the box. Your DDR5 kit carries over, and DDR5-6000 with EXPO enabled suits both chips.</p>
          <p><strong>Cooling.</strong> The 9800X3D draws a little more power than the 7800X3D in games, but a decent tower cooler or 240 mm AIO that handled the 7800X3D is fine.</p>
          <p><strong>The real cost.</strong> You pay full price for the new chip and get back part of it by selling the old one. If that net cost is close to the price of a GPU tier step, the GPU is usually the better upgrade. Our ${guide("best-am5-cpu", "best AM5 CPU guide")} compares every option on the socket.</p>`,
      },
    ],
    faq: [
      ["Is the 9800X3D worth it over the 7800X3D?", `Only with a very fast graphics card at 1080p or 1440p, or in CPU-heavy games. With an RTX 5090 at 1440p it's about ${G("rtx-5090", "1440p")}% faster. With an RTX 5070 Ti at 1440p, or any card at native 4K, the two deliver the same frame rate.`],
      ["How much faster is the 9800X3D than the 7800X3D?", `Up to about ${idx}% when the CPU is the limit, as in simulators, strategy games and esports with a fast card. In typical AAA games at 1440p the gap ranges from none with an RTX 5070 Ti to about ${G("rtx-5090", "1440p")}% with an RTX 5090.`],
      ["Does the 7800X3D bottleneck an RTX 5090?", `A little at 1440p, where it's ${pct(o90[0])}% CPU-limited, and more at 1080p (${pct(R["rtx-5090"][0][0])}%). At native 4K the card is the limit and the 7800X3D matches the 9800X3D at about ${fmt(R["rtx-5090"][2][0].fps)} FPS.`],
      ["Can I put a 9800X3D in my 7800X3D motherboard?", "Yes. Both use socket AM5 and DDR5. On a B650 or X670 board, update the BIOS to a version that supports Ryzen 9000 before you swap the chips. Your RAM and cooler carry over."],
      ["Should I get the 9850X3D instead of the 9800X3D?", `Only if it costs about the same. It's about ${idxNext}% faster in our CPU index, which shows only where the CPU is the limit. With an RTX 5090 at 1440p it's within a few FPS of the 9800X3D.`],
      ["Is the 7800X3D still good in 2026?", `Yes. It keeps an RTX 5070 Ti or RX 9070 XT fully busy at 1080p and above, is GPU-limited with an RTX 5080 at 1440p, and only falls behind with an RTX 5090 below 4K or in CPU-heavy games.`],
    ],
    related: ["best-cpu-for-rtx-5080-5090", "best-am5-cpu", "ryzen-7-7800x3d-rtx-5070-ti"],
  };
};
