// Guide: Does resolution affect bottleneck? (1080p vs 1440p vs 4K)
module.exports = function (h) {
  const { ev, Engine, res, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitCell } = h;

  const KEYS = Object.keys(Engine.RES);
  const px = (k) => Engine.RES[k].mp / Engine.RES["1080p"].mp;

  // One build across every resolution.
  const ONE = ["ryzen-5-5600", "rx-9070-xt"];
  const one = KEYS.map((k) => [k, ev(...ONE, { res: k })]);
  const gpuShare = (k) => Math.round((one.find(([x]) => x === k)[1].gpuFps / one[0][1].gpuFps) * 100);
  expect(one[0][1].limiter === "cpu" && one[0][1].pct >= 30, "5600 + 9070 XT is CPU-bound at 1080p");
  expect(one[3][1].limiter === "gpu", "5600 + 9070 XT is GPU-bound at 4K");
  expect(Math.round(one[0][1].cpuFps) === Math.round(one[3][1].cpuFps), "CPU limit doesn't change with resolution");
  const oneTable = table(
    ["Resolution", ["Pixels vs 1080p", true], ["CPU limit", true], ["GPU limit", true], ["Avg FPS", true], "Bottleneck"],
    one.map(([k, x]) => [td(res(k)), td(`${px(k).toFixed(1)}×`, true), td(fmt(x.cpuFps), true), td(fmt(x.gpuFps), true), td(fmt(x.fps), true), td(limitCell(x))]),
  );

  // 1080p → 1440p for builds from CPU-bound to GPU-bound.
  const SWITCH = [
    ["ryzen-5-3600", "rtx-5070-ti"],
    ["i5-12400f", "rtx-5070-ti"],
    ["ryzen-5-5600", "rtx-5070"],
    ["i5-13400f", "rtx-4070-super"],
    ["ryzen-7-7800x3d", "rtx-5070"],
    ["i5-12400f", "rtx-5060"],
  ];
  const sw = SWITCH.map(([c, g]) => ({ c, g, a: ev(c, g, { res: "1080p" }), b: ev(c, g, { res: "1440p" }) }));
  const loss = (s) => Math.round((1 - s.b.fps / s.a.fps) * 100);
  const switchTable = table(
    ["Build", ["1080p", true], ["1440p", true], ["FPS lost", true]],
    sw.map((s) => [
      td(`${build(s.c, s.g)}<br><small>${verdict(s.a)} → ${verdict(s.b)}</small>`),
      td(fmt(s.a.fps), true), td(fmt(s.b.fps), true), td(`${loss(s)}%`, true),
    ]),
  );
  const first = sw[0], last = sw[sw.length - 1];
  expect(first.a.limiter === "cpu" && loss(first) <= 5, "CPU-bound build loses almost nothing at 1440p");
  expect(last.a.limiter === "gpu" && loss(last) >= 30, "GPU-bound build loses a third at 1440p");
  expect(sw.every((s, i) => i === 0 || loss(s) >= loss(sw[i - 1])), "switch table is ordered from smallest to largest loss");

  // Upscaling at 4K brings the CPU back into play.
  const UPS = ["off", "quality", "performance"];
  const up = UPS.map((u) => [u, ev(...ONE, { res: "4k", upscale: u })]);
  expect(up[0][1].limiter === "gpu" && up[2][1].limiter === "cpu", "4K Performance upscaling makes the 5600 the limit again");
  const fast = ev("ryzen-7-7800x3d", ONE[1], { res: "4k", upscale: "performance" });
  expect(fast.limiter === "gpu" || fast.pct < 10, "7800X3D keeps up with 4K Performance upscaling");
  const sim = ["ryzen-5-5600", "ryzen-7-7800x3d"].map((c) => ev(c, "rtx-5070-ti", { res: "4k", workload: "cpuheavy" }));
  expect(sim[0].limiter === "cpu", "5600 is CPU-bound in sims even at 4K");
  const lows4k = ["ryzen-5-5600", "ryzen-7-7800x3d"].map((c) => ev(c, "rtx-5070-ti", { res: "4k" }));
  expect(lows4k[0].limiter === "gpu" && Math.abs(lows4k[0].fps - lows4k[1].fps) <= 2, "5600 and 7800X3D are within 2 FPS at 4K with a 5070 Ti");
  const esp = ["1080p", "1440p"].map((k) => ev("ryzen-7-7800x3d", "rtx-5070", { res: k, workload: "esports" }));
  expect(esp[0].fps > esp[1].fps && esp[1].fps >= 240, "esports: 1080p is faster, 1440p still clears 240");
  const uw = ev("i5-12400f", "rtx-5070-ti", { res: "uw1440" });
  const uwPx = gain(Engine.RES.uw1440.mp, Engine.RES["1440p"].mp);
  const big = ev("ryzen-7-9800x3d", "rtx-5090", { res: "1080p" });
  expect(big.limiter === "cpu", "even a 9800X3D limits an RTX 5090 at 1080p");

  return {
    slug: "does-resolution-affect-bottleneck",
    title: "Does Resolution Affect Bottleneck? 1080p vs 1440p vs 4K Explained",
    description: "Yes: higher resolution shifts the bottleneck from the CPU to the GPU. See how switching from 1080p to 1440p or 4K changes FPS and bottleneck, and when 4K still needs a fast CPU.",
    h1: "Does resolution affect bottleneck? 1080p vs 1440p vs 4K",
    crumb: "Resolution and bottleneck",
    card: "Why a higher resolution moves the bottleneck from CPU to GPU, what switching from 1080p to 1440p really costs, and when 4K still needs a fast CPU.",
    lead: "Yes, a lot. Resolution is the single biggest factor in whether your CPU or your graphics card sets the frame rate. The same PC can be badly CPU-limited at 1080p and completely GPU-limited at 4K. This guide shows why, with numbers, and what it means if you're thinking of moving up from 1080p.",
    sections: [
      {
        id: "short-answer", toc: "The short answer", h2: "The short answer",
        html: `
          <p><strong>Higher resolution shifts the bottleneck toward the GPU. Lower resolution shifts it toward the CPU.</strong> The CPU does about the same work per frame at any resolution, while the GPU's work grows with every extra pixel. So as resolution rises, the GPU's frame-rate limit falls and the CPU's stays where it was.</p>
          <p>That has two practical consequences. If your CPU holds back your graphics card at 1080p, moving to 1440p fixes it at almost no cost in frame rate. And at 4K you need a much less powerful CPU to keep a given card busy than you do at 1080p, with a couple of important exceptions covered below.</p>`,
      },
      {
        id: "why", toc: "Why resolution matters", h2: "Why resolution changes the bottleneck",
        html: `
          <p>Each frame is a two-step job. The CPU runs the game: input, AI, physics, animation, and the list of draw calls describing what's on screen. That list is the same whether the image ends up 1920 pixels wide or 3840. Then the GPU shades every pixel of the final image. 1440p has ${px("1440p").toFixed(1)} times as many pixels as 1080p, and 4K has ${px("4k").toFixed(1)} times as many.</p>
          <p>GPU frame rate doesn't fall in direct proportion to pixel count, though. Some of the GPU's work per frame, such as geometry, shadow maps and post-processing passes, doesn't scale with resolution, and bigger frames use the hardware more efficiently. In our model, calibrated against GPU-limited benchmarks, a card at 1440p keeps about ${gpuShare("1440p")}% of its 1080p frame rate, and about ${gpuShare("4k")}% at 4K, not the 25% the pixel count alone suggests. You can see the formula in the ${link.home("how-it-works", "how we calculate")} section of the calculator.</p>
          <p>Put the two together: the CPU's frame-rate limit is a flat line and the GPU's slopes down as resolution rises. Wherever the GPU line drops below the CPU line, the bottleneck flips from one part to the other.</p>`,
      },
      {
        id: "one-build", toc: "One build, four resolutions", h2: "One build at every resolution",
        html: `
          <p>Here's a ${calc(...ONE, { res: "1080p" }, `${name(ONE[0])} with an ${name(ONE[1])}`)} in AAA games at High settings. The CPU column doesn't move. Everything else does.</p>
          ${oneTable}
          <p>At 1080p this build is ${pct(one[0][1])}% CPU-limited: the graphics card could deliver about ${fmt(one[0][1].gpuFps)} FPS but gets fed only ${fmt(one[0][1].cpuFps)}. At 1440p the gap shrinks to ${verdict(one[1][1])}, and from ultrawide upward the GPU takes over. Note what happens to the average: it barely changes between 1080p and 1440p (${fmt(one[0][1].fps)} to ${fmt(one[1][1].fps)} FPS), because the CPU was setting the pace at both.</p>`,
      },
      {
        id: "1080p-to-1440p", toc: "Switching 1080p → 1440p", h2: "Switching from 1080p to 1440p: what happens to FPS",
        html: `
          <p>This is the most common question, and the answer depends entirely on which part limits you today. Here are six builds, from badly CPU-bound to fully GPU-bound, at both resolutions:</p>
          ${switchTable}
          <p>The ${name(first.c)} + ${name(first.g)} build loses just ${loss(first)}% when it moves to 1440p, because the CPU was the limit all along and the GPU had capacity to spare. The ${name(last.c)} + ${name(last.g)} build loses ${loss(last)}%, because its GPU was already maxed out at 1080p. Most builds fall somewhere in between.</p>
          <p>So, if you're thinking about a 1440p monitor:</p>
          <ul>
            <li><strong>CPU-bound at 1080p</strong> (low GPU usage, FPS doesn't rise when you lower settings)? Switch. You'll get a much sharper image for very little FPS, and the money goes on a monitor instead of a CPU.</li>
            <li><strong>GPU-bound at 1080p?</strong> Expect to lose up to a third of your frame rate. The last build in the table drops from ${fmt(last.a.fps)} to ${fmt(last.b.fps)} FPS. Plan on DLSS or FSR at 1440p, or a GPU upgrade.</li>
            <li><strong>Do you need a better CPU for 1440p?</strong> No. 1440p is <em>easier</em> on the CPU relative to the GPU. A CPU that keeps up at 1080p will keep up at 1440p. A faster CPU only helps if you also want higher frame rates than you had at 1080p.</li>
          </ul>
          <p>Check your own parts in the ${link.calculator("bottleneck calculator")} and flip the resolution switch to see the same comparison for your build.</p>`,
      },
      {
        id: "4k", toc: "Does 4K need a good CPU?", h2: "Does 4K need a good CPU?",
        html: `
          <p>Less than you'd think for averages, more than you'd think for everything else. At native 4K, even a mid-range processor keeps most graphics cards busy: the ${name("ryzen-5-5600")} with an ${name("rtx-5070-ti")} is ${verdict(lows4k[0])} at about ${fmt(lows4k[0].fps)} FPS, within a frame or two of a ${name("ryzen-7-7800x3d")} (${fmt(lows4k[1].fps)} FPS). But three things bring the CPU back into play.</p>
          <h3>1. Upscaling renders at a lower resolution</h3>
          <p>Almost nobody plays new games at native 4K. DLSS or FSR in Performance mode renders internally at 1080p and upscales the result, so the GPU's load drops and the CPU matters again. With the ${name(ONE[0])} and ${name(ONE[1])} at 4K:</p>
          <ul>
            ${up.map(([u, x]) => `<li><strong>${Engine.UPSCALE[u].label}:</strong> ${fmt(x.fps)} FPS, ${verdict(x)}</li>`).join("\n            ")}
          </ul>
          <p>With Performance upscaling, the ${name(ONE[0])} becomes the limit again. A ${name("ryzen-7-7800x3d")} in the same spot reaches about ${fmt(fast.fps)} FPS. If you plan to rely on upscaling at 4K, budget for a CPU that would suit the internal resolution, not the output.</p>
          <h3>2. CPU-heavy games don't care about resolution</h3>
          <p>Strategy games, simulators and MMOs can be CPU-bound at any resolution. In that kind of game, the ${name("ryzen-5-5600")} with an ${name("rtx-5070-ti")} averages about ${fmt(sim[0].fps)} FPS even at 4K (${verdict(sim[0])}), against ${fmt(sim[1].fps)} for the ${name("ryzen-7-7800x3d")}.</p>
          <h3>3. 1% lows still come from the CPU</h3>
          <p>A GPU-limited average hides the CPU spikes during explosions, crowds and streaming. A faster CPU won't raise your 4K average much, but it smooths out the hitches. In our model the 7800X3D's 1% lows at 4K are ${fmt(lows4k[1].low1)} FPS against ${fmt(lows4k[0].low1)} for the 5600.</p>`,
      },
      {
        id: "ultrawide", toc: "Ultrawide 1440p", h2: "What about ultrawide?",
        html: `
          <p>A 3440×1440 ultrawide has about ${uwPx}% more pixels than standard 1440p, so it sits between 1440p and 4K in GPU load. In practice it behaves like a slightly heavier 1440p: a ${build("i5-12400f", "rtx-5070-ti", `${name("i5-12400f")} + ${name("rtx-5070-ti")}`)}, which is balanced at 1440p, is ${verdict(uw)} on an ultrawide at about ${fmt(uw.fps)} FPS. Some games also render a wider field of view on ultrawide, which adds a little CPU work, but the GPU effect is far larger.</p>`,
      },
      {
        id: "esports", toc: "Why esports stays at 1080p", h2: "Why competitive players stay at 1080p",
        html: `
          <p>If higher resolution is so cheap on a CPU-bound PC, why do so many competitive players still run 1080p with low settings? Because they're chasing the opposite goal. On a 360 Hz or 500 Hz monitor, every extra frame cuts input latency and makes motion clearer, so they deliberately remove GPU load until the CPU is the only limit left.</p>
          <p>In CS2-style esports games, a ${name("ryzen-7-7800x3d")} with an ${name("rtx-5070")} runs at about ${fmt(esp[0].fps)} FPS at 1080p and ${fmt(esp[1].fps)} at 1440p. Both clear a 240 Hz panel, so 1440p is a fair trade for most people. Beyond that, the CPU decides how high you go. That's why X3D processors dominate high-refresh esports builds, and why “just play at a higher resolution” isn't the right fix for someone who bought a 500 Hz monitor.</p>`,
      },
      {
        id: "buying", toc: "What it means for buying", h2: "What this means when you buy parts",
        html: `
          <ul>
            <li><strong>Choose the graphics card for your resolution</strong> and the image quality you want. That's what decides whether the game looks good.</li>
            <li><strong>Choose the CPU for your target frame rate.</strong> If you want 144 FPS or more, the CPU has to manage it at any resolution. A 60 FPS 4K player and a 240 FPS esports player need very different processors, even with the same graphics card.</li>
            <li><strong>Don't pair a flagship card with 1080p.</strong> Even a ${name("ryzen-7-9800x3d")} holds an ${name("rtx-5090")} back by ${pct(big)}% at 1080p. Fast cards are built for 1440p and 4K.</li>
            <li><strong>Upgrading the monitor can be the cheapest fix</strong> for a CPU bottleneck, as long as you're happy with roughly the frame rate you have now.</li>
          </ul>
          <p>Our ${guide("best-cpu-for-rtx-5070", "best CPU for RTX 5070 guide")} shows this in practice, with every pairing at 1080p, 1440p and 4K. For game-specific numbers at each resolution, use the ${link.fps("FPS calculator")}, and if you want to see what your own PC is doing, follow the ${guide("how-to-check-for-bottleneck", "bottleneck check walkthrough")}.</p>`,
      },
    ],
    faq: [
      ["Does higher resolution reduce CPU bottleneck?", "Yes. Higher resolution adds work for the GPU but not for the CPU, so the GPU becomes the limiting part. Your average FPS won't go up, but the CPU stops holding the graphics card back and you get a sharper image at a similar frame rate."],
      ["Is 1440p more CPU or GPU intensive than 1080p?", `More GPU intensive. The CPU's work per frame is about the same at both resolutions, while the GPU has to render ${px("1440p").toFixed(1)} times as many pixels. That's why 1440p shifts the balance toward the graphics card.`],
      ["Do I need a better CPU for 1440p?", "No. If your CPU keeps up at 1080p, it will keep up at 1440p, because the frame rate at 1440p is lower and the CPU's job doesn't get harder. You only need a faster CPU if you want a higher frame rate than you get now."],
      ["Does 4K need a good CPU?", `Not for average FPS at native 4K, where most CPUs keep the graphics card busy. It does matter for 1% lows, for CPU-heavy games like simulators and strategy titles, and when you use DLSS or FSR Performance mode, which renders at 1080p internally.`],
      ["Why does my FPS stay the same when I lower the resolution?", "Because your CPU is the bottleneck. Lowering resolution only reduces the GPU's work. If the CPU was already the slower part, the frame rate stays where the CPU caps it. That's the standard way to confirm a CPU bottleneck."],
      ["Does DLSS change the bottleneck?", "Yes. Upscaling renders at a lower internal resolution, so it behaves like dropping the resolution: GPU load falls and the bottleneck shifts toward the CPU. At 4K with DLSS Performance, the GPU renders 1080p, so a CPU that's fine for native 4K can become the limit."],
    ],
    related: ["how-to-check-for-bottleneck", "best-cpu-for-rtx-5070", "cpu-vs-gpu-bottleneck"],
  };
};
