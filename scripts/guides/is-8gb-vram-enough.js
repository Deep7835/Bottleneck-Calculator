// Guide: Is 8 GB of VRAM enough? (VRAM need by resolution and settings, 8 GB vs 16 GB twins)
module.exports = function (h) {
  const { Engine, BASE, cpu, gpu, ev, fmt, gain, name, expect, calc, compare, guide, link, table, td, limitTag } = h;

  const C = "ryzen-5-7600";
  const need = (o) => ev(C, "rtx-5060", o).vramNeed;
  const gb = (x) => `${x} GB`;

  // ---- VRAM need by resolution, quality and upscaling
  const QS = [["Low", { quality: "low" }], ["Medium", { quality: "medium" }], ["High", { quality: "high" }], ["Ultra", { quality: "ultra" }], ["High + RT", { quality: "high", workload: "raytracing" }]];
  const ROWS = [
    ["1080p", { res: "1080p" }], ["1080p, upscaling Quality", { res: "1080p", upscale: "quality" }],
    ["1440p", { res: "1440p" }], ["1440p, upscaling Quality", { res: "1440p", upscale: "quality" }],
    ["4K", { res: "4k" }], ["4K, upscaling Performance", { res: "4k", upscale: "performance" }],
  ];
  const mark = (x) => (x > 8 ? `<strong>${gb(x)}</strong>` : gb(x));
  const needTable = table(
    ["Resolution", ...QS.map(([l]) => [l, true])],
    ROWS.map(([l, o]) => [td(`<strong>${l}</strong>`), ...QS.map(([, q]) => td(mark(need({ ...o, ...q })), true))]),
  );
  const N = (res, quality = "high", o = {}) => need({ res, quality, ...o });
  expect(N("1080p") === 8 && N("1080p", "ultra") > 8 && N("1080p", "medium") < 8, "1080p High fits exactly in 8 GB, Ultra doesn't, Medium has room");
  expect(N("1440p", "medium") <= 8 && N("1440p") > 8 && N("1440p", "high", { upscale: "quality" }) > 8, "1440p: Medium fits, High doesn't even with upscaling");
  expect(N("4k", "ultra") > 12 && N("4k", "ultra") <= 16 && N("4k", "low") <= 8, "4K Ultra needs more than 12 GB; 4K Low fits in 8");
  expect(N("1080p", "high", { workload: "raytracing" }) > 8, "ray tracing pushes 1080p High past 8 GB");
  const step = { med: N("1080p") - N("1080p", "medium"), ultra: N("1080p", "ultra") - N("1080p"), rt: N("1080p", "high", { workload: "raytracing" }) - N("1080p"), up: N("1440p") - N("1440p", "high", { upscale: "quality" }), r1440: N("1440p") - N("1080p"), r4k: N("4k") - N("1080p") };
  expect(step.ultra > step.rt && step.rt > step.up, "Ultra adds more than RT, RT more than upscaling saves");

  // ---- Overflow penalty, read straight from the engine with a hypothetical card of unlimited VRAM
  const penalty = (deficit) => {
    const G = gpu("rtx-5060-ti-8gb"), o = { ...BASE, res: "1440p", quality: "ultra" };
    const full = Engine.evaluate(cpu(C), { ...G, vram: 99 }, o).gpuFps;
    const short = Engine.evaluate(cpu(C), { ...G, vram: Engine.evaluate(cpu(C), G, o).vramNeed - deficit }, o).gpuFps;
    return Math.round((1 - short / full) * 100);
  };
  const perGB = penalty(1), maxPen = penalty(40);
  expect(perGB >= 4 && perGB <= 6 && penalty(2) === 2 * perGB && maxPen >= 40 && maxPen <= 50, "penalty: ~5% per GB, capped");

  // ---- Natural experiment: same chip, 8 GB vs 16 GB
  const PAIRS = [["rtx-5060-ti-8gb", "rtx-5060-ti-16gb"], ["rx-9060-xt-8gb", "rx-9060-xt-16gb"]];
  const SET = [
    ["1080p Medium", { res: "1080p", quality: "medium" }],
    ["1080p High", { res: "1080p" }],
    ["1080p Ultra", { res: "1080p", quality: "ultra" }],
    ["1080p High + RT", { res: "1080p", workload: "raytracing" }],
    ["1440p Medium", { res: "1440p", quality: "medium" }],
    ["1440p High", { res: "1440p" }],
    ["1440p High, upscaling Quality", { res: "1440p", upscale: "quality" }],
    ["1440p Ultra", { res: "1440p", quality: "ultra" }],
  ];
  const fcell = (g, o) => `<td class="r">${calc(C, g, o, fmt(ev(C, g, o).fps))}</td>`;
  const gapOf = (a, b, o) => gain(ev(C, b, o).fps, ev(C, a, o).fps);
  const twinTable = table(
    ["Settings", ["VRAM need", true], ["5060 Ti 8 GB", true], ["5060 Ti 16 GB", true], ["Gap", true], ["9060 XT 8 GB", true], ["9060 XT 16 GB", true], ["Gap", true]],
    SET.map(([l, o]) => [td(`<strong>${l}</strong>`), td(gb(need(o)), true), ...PAIRS.flatMap(([a, b]) => [fcell(a, o), fcell(b, o), td(`+${gapOf(a, b, o)}%`, true)])]),
  );
  const chipGap = PAIRS.map(([a, b]) => gain(gpu(b).g, gpu(a).g));
  expect(PAIRS.every(([a, b]) => gpu(a).vram === 8 && gpu(b).vram === 16) && chipGap.every((x) => x <= 3), "twins differ by 3% or less in raw speed");
  const G = (i, k) => gapOf(...PAIRS[i], SET[k][1]);
  expect([0, 1].every((i) => G(i, 0) <= 3 && G(i, 1) <= 3 && G(i, 4) <= 3), "where 8 GB fits, the gap is just the chip difference");
  expect([0, 1].every((i) => G(i, 2) >= 10 && G(i, 5) >= 8 && G(i, 7) >= 20), "past 8 GB the 16 GB card pulls away");
  expect([0, 1].every((i) => G(i, 6) >= 5 && G(i, 6) < G(i, 5)), "upscaling narrows but doesn't close the 1440p gap");
  const tw = (g, k) => ev(C, g, SET[k][1]);
  expect(tw("rtx-5060-ti-8gb", 5).fps < 75 && tw("rtx-5060-ti-16gb", 5).fps >= 75, "5060 Ti 1440p High: 8 GB under 75, 16 GB over");
  const rt1080 = [tw("rtx-5060-ti-8gb", 3), tw("rtx-5060-ti-16gb", 3)];
  expect(rt1080[0].fps < 60 && rt1080[1].fps >= 60, "1080p RT: 8 GB under 60, 16 GB over");

  // ---- Other pairs
  const ti40 = ["rtx-4060-ti-8gb", "rtx-4060-ti-16gb"].map((g) => ev(C, g, { res: "1440p" }));
  const b580 = [["rtx-5060", "arc-b580"].map((g) => ev(C, g, { res: "1440p" })), ["rtx-5060", "arc-b580"].map((g) => ev(C, g, { res: "1440p", quality: "ultra" }))];
  expect(ti40[1].fps > ti40[0].fps * 1.08, "4060 Ti 16 GB clearly ahead at 1440p High");
  expect(gpu("rtx-5060").g > gpu("arc-b580").g && b580[0][0].fps > b580[0][1].fps && b580[1][1].fps > b580[1][0].fps, "5060 faster at 1440p High, B580 ahead at 1440p Ultra");
  const t5070 = ev(C, "rtx-5070", { res: "4k", quality: "ultra" });
  expect(t5070.vramNeed > gpu("rtx-5070").vram && ev(C, "rtx-5070", { res: "1440p", quality: "ultra" }).vramNeed <= 12, "12 GB: fine to 1440p Ultra, short at 4K Ultra");

  // ---- 8 GB cards at settings that fit
  const CARDS8 = ["rtx-5050", "rx-7600", "rtx-4060", "rtx-5060", "rx-9060-xt-8gb", "rtx-5060-ti-8gb"];
  const FIT = [["Esports, 1080p", { res: "1080p", workload: "esports" }], ["1080p Medium", { res: "1080p", quality: "medium" }], ["1080p High", { res: "1080p" }], ["1440p Medium", { res: "1440p", quality: "medium" }]];
  const fitTable = table(
    ["8 GB card", ...FIT.map(([l]) => [l, true])],
    CARDS8.map((g) => [td(`<strong>${name(g)}</strong>`), ...FIT.map(([, o]) => {
      const x = ev(C, g, o);
      return `<td class="r">${calc(C, g, o, fmt(x.fps))}<br>${limitTag(x)}</td>`;
    })]),
  );
  expect(FIT.every(([, o]) => need(o) <= 8), "every setting in the fit table fits in 8 GB");
  expect(CARDS8.every((g) => FIT.slice(1).every(([, o]) => ev(C, g, o).fps >= 60) && ev(C, g, FIT[0][1]).fps >= 200), "all 8 GB cards: 60+ at these settings, 200+ in esports");
  const es8 = CARDS8.map((g) => ev(C, g, FIT[0][1]).fps);
  expect(es8.some((x) => x < 240) && es8.filter((x) => x >= 240).length >= 3, "the faster 8 GB cards clear 240 Hz in esports, not all");
  expect(need({ res: "4k", workload: "esports" }) <= 8, "esports fits in 8 GB even at 4K");

  return {
    slug: "is-8gb-vram-enough",
    title: "Is 8 GB of VRAM Enough for Gaming in 2026? 1080p, 1440p and 4K",
    description: "Is 8 GB of VRAM still enough? VRAM needs by resolution and settings, what running out costs, 8 GB vs 16 GB RTX 5060 Ti and RX 9060 XT FPS, and what to buy.",
    h1: "Is 8 GB of VRAM enough in 2026? What runs out first, and when to buy 16 GB",
    crumb: "Is 8 GB VRAM enough?",
    card: "How much video memory games need at 1080p, 1440p and 4K, what running short costs, and the 8 GB vs 16 GB versions of the same card side by side.",
    lead: `Eight gigabytes of VRAM is still enough for 1080p at Medium to High settings and for esports at any resolution. It runs out at 1080p Ultra, with ray tracing, and at 1440p High, even with upscaling. The cleanest proof is cards sold in 8 GB and 16 GB versions of the same chip. Here's where the line falls, calculated with the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "answer", toc: "The short answer", h2: "The short answer",
        html: `
          <div class="callout">
            <p><strong>Enough:</strong> esports and competitive games at any resolution, 1080p at Medium or High, and 1440p at Medium or with lower textures.</p>
            <p><strong>Not enough:</strong> 1080p Ultra, ray tracing, and 1440p High or above in new AAA games, where the 16 GB version of the same card is ${Math.min(G(0, 5), G(1, 5))}–${Math.max(G(0, 7), G(1, 7))}% faster in our model.</p>
            <p><strong>Buying advice:</strong> if the 16 GB version of a card costs a little more, buy it. Choose an 8 GB card only for 1080p and esports on a tight budget.</p>
          </div>`,
      },
      {
        id: "how-much", toc: "How much VRAM games need", h2: "How much VRAM games need, by resolution and settings",
        html: `
          <p>Estimated video memory for a typical new AAA game. Figures above 8 GB are in bold.</p>
          ${needTable}
          <p>Each setting moves the total by a predictable amount in our model. Moving from 1080p to 1440p adds ${step.r1440} GB and to 4K adds ${step.r4k} GB. Ultra adds ${step.ultra} GB over High, ray tracing adds ${step.rt} GB, and dropping to Medium saves ${step.med} GB. Upscaling saves less than people expect: DLSS, FSR or XeSS in Quality mode renders fewer pixels, but the textures stay the same size, so 1440p High only drops by ${step.up} GB and still doesn't fit in 8 GB.</p>
          <p>These are averages. Some games need a good deal more, and older or lighter games far less. The trend only goes one way, though: new releases need more memory every year, which is the main reason 8 GB cards age faster than their raw speed suggests.</p>`,
      },
      {
        id: "running-out", toc: "What running out costs", h2: "What happens when you run out",
        html: `
          <p>When a game's data doesn't fit in VRAM, the card has to fetch the overflow from system RAM over the PCIe bus, which is many times slower than its own memory. In our model, each gigabyte you're short costs about ${perGB}% of the graphics card's frame rate, up to a limit of about ${maxPen}%.</p>
          <p>That's the average-FPS view, and it understates how running out feels. In real games, VRAM overflow shows up first as:</p>
          <ul>
            <li><strong>Stutter and poor 1% lows.</strong> Frames that need data from system RAM take much longer, so you get hitches while the average still looks fine.</li>
            <li><strong>Blurry or late-loading textures.</strong> Many modern games protect the frame rate by quietly loading lower-resolution textures, so the FPS counter looks fine while the image gets worse.</li>
            <li><strong>Worse results on older boards.</strong> Cards with an eight-lane link, such as the ${name("rtx-5060")} and ${name("rtx-5060-ti-8gb")}, have half the bandwidth to fall back on in a PCIe 3.0 slot, so overflow costs more there.</li>
          </ul>
          <p>Our calculator models the average-FPS loss, not the texture or stutter effects, so treat a VRAM warning in the results as a stronger signal than the FPS number alone. To check your own card, watch GPU memory usage in an overlay like MSI Afterburner, as our guide to ${guide("how-to-check-for-bottleneck", "checking for a bottleneck")} describes. If it sits at the maximum and you see stutter, VRAM is the limit.</p>`,
      },
      {
        id: "8-vs-16", toc: "8 GB vs 16 GB, same chip", h2: "8 GB vs 16 GB of the same card",
        html: `
          <p>The ${name("rtx-5060-ti-8gb")} and ${name("rtx-5060-ti-16gb")} use the same chip, and so do the ${name("rx-9060-xt-8gb")} and ${name("rx-9060-xt-16gb")}. In our GPU index the 16 GB versions are only ${chipGap[0] === chipGap[1] ? `${chipGap[0]}% faster in both cases` : `${chipGap[0]}% and ${chipGap[1]}% faster`}, so any bigger gap comes from memory. Average FPS with a ${name(C)}:</p>
          ${twinTable}
          <p>Where the game fits in 8 GB, the twins are practically identical. Once it doesn't, the 16 GB card pulls away: about ${G(0, 5)}% at 1440p High, ${G(0, 2)}% at 1080p Ultra and ${G(0, 7)}% at 1440p Ultra for the 5060 Ti. Upscaling narrows the 1440p High gap to ${G(0, 6)}% but doesn't close it. With ray tracing at 1080p, the 16 GB 5060 Ti holds ${fmt(rt1080[1].fps)} FPS and the 8 GB one drops to ${fmt(rt1080[0].fps)}. The RX 9060 XT pair behaves the same way.</p>
          <p>The older ${compare("rtx-4060-ti-16gb", "rtx-4060-ti-8gb", "RTX 4060 Ti 16 GB vs 8 GB")} shows the same effect at 1440p High (${fmt(ti40[1].fps)} vs ${fmt(ti40[0].fps)} FPS). Full head-to-heads: ${compare("rtx-5060-ti-16gb", "rtx-5060-ti-8gb", "RTX 5060 Ti 16 GB vs 8 GB")} and ${compare("rx-9060-xt-16gb", "rx-9060-xt-8gb", "RX 9060 XT 16 GB vs 8 GB")}.</p>
          <p>Extra memory can also beat extra speed. The ${name("rtx-5060")} has a faster chip than the 12 GB ${name("arc-b580")} and wins at 1440p High (${fmt(b580[0][0].fps)} vs ${fmt(b580[0][1].fps)} FPS), but at 1440p Ultra the B580 comes out ahead (${fmt(b580[1][1].fps)} vs ${fmt(b580[1][0].fps)}). See ${compare("rtx-5060", "arc-b580", "RTX 5060 vs Arc B580")}.</p>`,
      },
      {
        id: "settings", toc: "Settings that save VRAM", h2: "Settings that cut VRAM use the most",
        html: `
          <p>If you have an 8 GB card, these are the settings to change first, roughly in order of how much memory they save:</p>
          <ol class="steps">
            <li><strong>Texture quality.</strong> The biggest single lever. One step down from Ultra or Very High usually saves more memory than everything else combined, and at 1080p the visual difference is small. Some games also have a separate texture streaming budget or pool size; set it to match your card.</li>
            <li><strong>Ray tracing.</strong> It needs extra memory for the scene data on top of the extra GPU work (${step.rt} GB at 1080p High in our model). On an 8 GB card, turn it off or keep it to one effect.</li>
            <li><strong>Frame generation.</strong> DLSS Frame Generation and FSR Frame Generation need VRAM of their own, so they can push a card that just fits over the edge. On 8 GB, check memory usage before relying on them.</li>
            <li><strong>Resolution and upscaling.</strong> Rendering at a lower internal resolution saves some memory, but less than the FPS gain suggests.</li>
            <li><strong>Shadows, volumetrics and draw distance.</strong> Smaller savings each, but they add up in open-world games.</li>
          </ol>
          <p>Leave the rest at High. Most other settings cost GPU time rather than memory. For a broader list of free improvements, see our guide on ${guide("how-to-increase-fps", "how to increase FPS")}, and for the upscalers themselves, ${guide("dlss-vs-fsr-vs-xess", "DLSS vs FSR vs XeSS")}.</p>`,
      },
      {
        id: "still-fine", toc: "Where 8 GB is still fine", h2: "Where 8 GB cards are still fine",
        html: `
          <p>Six 8 GB cards at settings that fit in 8 GB, with a ${name(C)}:</p>
          ${fitTable}
          <p>At these settings every card clears 60 FPS, and in esports they all run at ${fmt(Math.min(...es8))}–${fmt(Math.max(...es8))} FPS, enough for a 240 Hz monitor on the faster ones. If you mainly play competitive games or are happy at 1080p Medium to High, an 8 GB card is a reasonable budget buy. For pairing one with a CPU, see the ${guide("best-cpu-for-rtx-5060", "best CPU for the RTX 5060")}.</p>`,
      },
      {
        id: "buying", toc: "What to buy", h2: "What to buy, by tier",
        html: `
          <h3>Budget, 1080p: 8 GB is acceptable</h3>
          <p>The ${name("rtx-5050")}, ${name("rtx-5060")} and ${name("rx-9060-xt-8gb")} are fine for 1080p and esports. If you can stretch, the 12 GB ${name("arc-b580")} or a 16 GB card ages better.</p>
          <h3>Mainstream, 1080p Ultra or 1440p: get 16 GB</h3>
          <p>The ${name("rtx-5060-ti-16gb")} and ${name("rx-9060-xt-16gb")} are the cards to buy here. At launch, NVIDIA and AMD priced each 16 GB version about $50 above its 8 GB twin (US list prices). Street prices move around, so check the gap when you buy, but at anything close to that difference the 16 GB version is the better buy for 1440p.</p>
          <h3>Upper mid-range: 12 GB is fine up to 1440p</h3>
          <p>The 12 GB ${name("rtx-5070")} covers 1440p Ultra in our model. At 4K Ultra it needs about ${t5070.vramNeed} GB, so lower textures a notch there. For 4K, 16 GB is the safer amount. Our guide to ${guide("1440p-gaming-pc-build", "building a 1440p gaming PC")} covers the full build.</p>
          <h3>Already own an 8 GB card?</h3>
          <p>Lower texture quality and ray tracing first, use upscaling, and keep an eye on GPU memory usage. Put your card and settings into the ${link.calculator("bottleneck calculator")}: it warns when your settings need more VRAM than the card has. You can also browse ${link.compare("graphics card comparisons")} before you upgrade.</p>`,
      },
    ],
    faq: [
      ["Is 8 GB of VRAM enough for 1080p?", "For Medium to High settings and esports, yes. At 1080p High, a typical new game needs about 8 GB, so it just fits. 1080p Ultra and ray tracing need more, and the card loses performance or lowers texture quality to cope."],
      ["Is 8 GB of VRAM enough for 1440p?", `Only at Medium settings or with lower textures. At 1440p High, new games need about ${N("1440p")} GB, and even with upscaling about ${N("1440p", "high", { upscale: "quality" })} GB. In our model the 16 GB RTX 5060 Ti is ${G(0, 5)}% faster than the 8 GB version at 1440p High.`],
      ["Is the RTX 5060 Ti 8 GB or 16 GB better?", `The 16 GB version. The chips are nearly identical, so they match where games fit in 8 GB, but the 16 GB card is ${G(0, 2)}% faster at 1080p Ultra and ${G(0, 7)}% faster at 1440p Ultra in our model. Buy the 8 GB version only for 1080p and esports on a tight budget.`],
      ["What happens when a game runs out of VRAM?", "The graphics card has to fetch data from system RAM over PCIe, which is much slower. You see stutter and poor 1% lows, textures that load late or look blurry, and a lower average frame rate. Lowering texture quality is the quickest fix."],
      ["How much VRAM do I need for 4K?", `About ${N("4k")} GB at 4K High and ${N("4k", "ultra")} GB at 4K Ultra for a typical new game. A 16 GB card is the safe choice for 4K. A 12 GB card works with textures one step lower.`],
      ["Which settings use the most VRAM?", "Texture quality by far, then ray tracing and frame generation. Resolution matters too, but upscaling saves less memory than it saves GPU time, because textures stay the same size. Lower textures first on an 8 GB card."],
    ],
    related: ["best-cpu-for-rtx-5060", "how-much-ram-for-gaming", "dlss-vs-fsr-vs-xess"],
  };
};
