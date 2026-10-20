// Guide: CPU bottleneck vs GPU bottleneck: which is worse?
module.exports = function (h) {
  const { ev, res, fmt, name, expect, calc, build, guide, link, table, td, limitCell } = h;

  // Builds with similar average FPS, some limited by the CPU and some by the GPU.
  const PAIRS = [
    ["ryzen-5-3600", "rtx-4070-super", "1080p"],
    ["i5-10400f", "rtx-5070", "1440p"],
    ["ryzen-5-3600", "rtx-5070-ti", "1440p"],
    ["i5-12400f", "rtx-4060-ti-16gb", "1080p"],
    ["ryzen-5-5600", "rtx-5060-ti-16gb", "1440p"],
    ["ryzen-7-7800x3d", "rtx-5060-ti-16gb", "1440p"],
  ];
  const lows = PAIRS.map(([c, g, r]) => ({ c, g, r, x: ev(c, g, { res: r }) }));
  const ratio = (x) => Math.round((x.low1 / x.fps) * 100);
  const cpuRows = lows.filter((l) => l.x.limiter === "cpu");
  const gpuRows = lows.filter((l) => l.x.limiter === "gpu");
  expect(cpuRows.length >= 2 && gpuRows.length >= 2, "1% low table has both CPU- and GPU-bound builds");
  expect(Math.max(...cpuRows.map((l) => ratio(l.x))) < Math.min(...gpuRows.map((l) => ratio(l.x))), "CPU-bound builds have worse 1% lows");
  expect(lows[0].x.limiter === "cpu" && lows[5].x.limiter === "gpu" && lows[0].x.fps > lows[5].x.fps && lows[0].x.low1 < lows[5].x.low1, "first row: higher average but worse lows than last row");
  const fpsSpan = lows.map((l) => l.x.fps);
  expect(Math.max(...fpsSpan) / Math.min(...fpsSpan) < 1.3, "1% low table builds have similar averages");

  // Same settings changes on a CPU-bound and a GPU-bound build.
  const CB = ["ryzen-5-3600", "rtx-5070-ti", "1080p"];
  const GB = ["i5-12400f", "rtx-5060-ti-16gb", "1440p"];
  const STEPS = [
    ["High (baseline)", {}],
    ["Ultra", { quality: "ultra" }],
    ["Medium", { quality: "medium" }],
    ["Low", { quality: "low" }],
    ["DLSS/FSR Quality", { upscale: "quality" }],
  ];
  const settings = STEPS.map(([label, o]) => ({ label, cb: ev(CB[0], CB[1], { res: CB[2], ...o }), gb: ev(GB[0], GB[1], { res: GB[2], ...o }) }));
  const [cb0, gb0] = [settings[0].cb, settings[0].gb];
  expect(cb0.limiter === "cpu" && cb0.pct >= 35 && gb0.limiter === "gpu", "settings table pairs a CPU-bound and a GPU-bound build");
  const cbLow = settings[3].cb, gbLow = settings[3].gb, cbUp = settings[4].cb, gbUp = settings[4].gb;
  expect(cbLow.fps / cb0.fps < 1.1 && gbLow.fps / gb0.fps > 1.4, "Low settings barely help when CPU-bound but help a lot when GPU-bound");
  expect(Math.abs(cbUp.fps - cb0.fps) < 2, "upscaling adds nothing when CPU-bound");
  const plus = (x, base) => { const d = Math.round((x.fps / base.fps - 1) * 100); return d === 0 ? "±0%" : d > 0 ? `+${d}%` : `−${-d}%`; };

  const lowsTable = table(
    ["Build", ["Avg FPS", true], ["1% low", true], ["Low ÷ avg", true], "Limited by"],
    lows.map((l) => [
      td(`${build(l.c, l.g)}<br><small>${res(l.r)}, High</small>`),
      td(fmt(l.x.fps), true), td(fmt(l.x.low1), true), td(`${ratio(l.x)}%`, true), td(limitCell(l.x)),
    ]),
  );
  const settingsTable = table(
    ["Setting", [`${name(CB[0])} + ${name(CB[1])}<br><small>${res(CB[2])} · CPU-bound</small>`, true], [`${name(GB[0])} + ${name(GB[1])}<br><small>${res(GB[2])} · GPU-bound</small>`, true]],
    settings.map((s, i) => [
      td(s.label),
      td(`${fmt(s.cb.fps)}${i ? ` <small>${plus(s.cb, cb0)}</small>` : ""}`, true),
      td(`${fmt(s.gb.fps)}${i ? ` <small>${plus(s.gb, gb0)}</small>` : ""}`, true),
    ]),
  );

  const es = ev("ryzen-5-5600", "rx-9070-xt", { res: "1080p", workload: "esports" });
  expect(es.limiter === "cpu" && es.fps > 240, "5600 + 9070 XT is CPU-bound but above 240 FPS in esports");

  return {
    slug: "cpu-vs-gpu-bottleneck",
    title: "CPU Bottleneck vs GPU Bottleneck: Which Is Worse? (2026)",
    description: "A CPU bottleneck is worse for gaming than a GPU bottleneck: worse 1% lows, stutter, and settings can't fix it. See the numbers, the exceptions, and which part to upgrade first.",
    h1: "CPU bottleneck vs GPU bottleneck: which is worse?",
    crumb: "CPU vs GPU bottleneck",
    card: "Why a CPU bottleneck feels worse at the same average FPS, when a GPU bottleneck is the real problem, and which part to upgrade first.",
    lead: "Every gaming PC is limited by one part or the other, so the useful question isn't whether you have a bottleneck but which kind. Short version: a CPU bottleneck is usually worse, because it hurts smoothness and you can't tune it away. Here's why, with numbers, and the cases where it doesn't matter.",
    sections: [
      {
        id: "short-answer", toc: "The short answer", h2: "The short answer",
        html: `
          <p><strong>A CPU bottleneck is worse for gaming.</strong> At the same average frame rate, a CPU-bound game has lower 1% lows and more stutter, and lowering graphics settings or turning on upscaling does almost nothing to help. You're stuck with it until you change hardware or the game.</p>
          <p><strong>A GPU bottleneck is the normal, healthy state.</strong> It means the graphics card, usually the most expensive part in the build, is being used fully. Frame delivery is even, and you have a dozen settings that trade image quality for frame rate.</p>
          <p>There are exceptions. A GPU bottleneck is a real problem when your frame rate is too low for your monitor and settings are already turned down. A CPU bottleneck stops mattering when you're already above your refresh rate. Both are covered below.</p>`,
      },
      {
        id: "what-happens", toc: "What each one is", h2: "What actually happens in each case",
        html: `
          <p>Each frame passes through two stages. The CPU runs the game simulation (input, physics, AI, animation, and the draw calls that tell the GPU what to render). Then the GPU turns those instructions into pixels. They work in parallel on different frames, so your frame rate is set by whichever stage takes longer.</p>
          <p><strong>When the GPU is slower</strong>, the CPU finishes its frame early and queues it up. There's always work waiting for the graphics card, so it runs at 95–99% usage and frames come out at a steady pace. The workload per frame is also fairly consistent: the same resolution, the same shaders, more or less the same pixel count every frame.</p>
          <p><strong>When the CPU is slower</strong>, the GPU finishes early and waits. Its usage drops, and the frame rate now depends on how much the simulation has to do on each frame. That varies a lot: an explosion, a crowd turning a corner or a new area streaming in can double the CPU's work for a handful of frames. Each spike becomes a long frame, which you feel as a hitch.</p>
          <p>That difference in consistency is the whole story. A GPU-bound game slows down smoothly. A CPU-bound game slows down in jolts.</p>`,
      },
      {
        id: "lows", toc: "Why CPU limits feel worse", h2: "Why a CPU bottleneck feels worse: 1% lows",
        html: `
          <p>The <strong>1% low</strong> is the frame rate of the slowest 1% of frames. It's the closest single number to how smooth a game <em>feels</em>, because your eyes notice the hitches, not the average. The table below compares builds with similar average frame rates in AAA games. Some are limited by the CPU, some by the GPU.</p>
          ${lowsTable}
          <p>The CPU-bound builds keep only ${Math.min(...cpuRows.map((l) => ratio(l.x)))}–${Math.max(...cpuRows.map((l) => ratio(l.x)))}% of their average in the 1% lows, while the GPU-bound builds keep ${Math.min(...gpuRows.map((l) => ratio(l.x)))}–${Math.max(...gpuRows.map((l) => ratio(l.x)))}%. Look at the first and last rows: the ${name(lows[0].c)} build averages more frames than the ${name(lows[5].c)} build (${fmt(lows[0].x.fps)} vs ${fmt(lows[5].x.fps)} FPS), yet its worst moments drop to about ${fmt(lows[0].x.low1)} FPS while the GPU-bound build holds ${fmt(lows[5].x.low1)}. Higher average, rougher experience. Large-cache X3D processors such as the ${name("ryzen-7-7800x3d")} hold their lows best of all, which is a big part of why they're the default recommendation for gaming.</p>
          <p>The numbers come from the same model as the ${link.calculator("bottleneck calculator")}, which estimates 1% lows from whichever part is the limit. Real games vary, but the pattern is consistent in independent benchmarks: CPU-limited scenes are where the stutter lives.</p>`,
      },
      {
        id: "settings", toc: "Settings can't fix CPU limits", h2: "Why settings fix one and not the other",
        html: `
          <p>Almost every graphics setting changes how much work the <em>GPU</em> does. Resolution, shadows, anti-aliasing, texture filtering and upscaling all lighten the graphics card's load. Very few settings reduce the CPU's work per frame. Here's the same set of changes applied to a CPU-bound build and a GPU-bound one:</p>
          ${settingsTable}
          <p>Dropping from High to Low gives the GPU-bound ${name(GB[0])} build ${plus(gbLow, gb0).slice(1)} more frames. The CPU-bound ${name(CB[0])} build gets ${plus(cbLow, cb0).slice(1)}, and turning on DLSS or FSR changes nothing at all, because the GPU was already waiting. The flip side is useful too: when you're CPU-bound, you can raise graphics quality or resolution almost for free. Going to Ultra costs that build only ${plus(settings[1].cb, cb0).replace("−", "")} of its frame rate.</p>
          <p>A handful of settings do lean on the CPU: crowd and traffic density, view distance and level of detail, physics quality, and in some engines shadow quality (more objects to draw). Ray tracing also adds CPU work to build its acceleration structures. Those are the ones to turn down first when you're CPU-limited, as covered in our guide on ${guide("how-to-fix-cpu-bottleneck", "how to fix a CPU bottleneck")}.</p>`,
      },
      {
        id: "when-gpu-worse", toc: "When a GPU bottleneck is the problem", h2: "When a GPU bottleneck is the real problem",
        html: `
          <p>Being GPU-bound is healthy only if the frame rate is good enough. It becomes the problem when:</p>
          <ul>
            <li><strong>FPS is below what you need</strong> even at Medium settings with upscaling on. A ${build("ryzen-5-5600", "rtx-4060")} build is GPU-bound in AAA games at 1440p at about ${fmt(ev("ryzen-5-5600", "rtx-4060", { res: "1440p" }).fps)} FPS. That's a perfectly healthy bottleneck that still needs settings turned down for a smooth experience.</li>
            <li><strong>You're out of VRAM.</strong> When textures don't fit in the card's memory, the GPU stalls while data crosses PCIe, and the result looks like a CPU bottleneck: low GPU usage and stutter. Eight-gigabyte cards hit this at 1440p in many 2025–2026 releases. Lowering texture quality is the fix.</li>
            <li><strong>You want ray tracing or 4K</strong> and the card doesn't have the muscle. No CPU upgrade will help there.</li>
          </ul>
          <p>In those cases the GPU is the right thing to upgrade, and the calculator's upgrade cards will show which models your CPU can keep fed without creating a new CPU bottleneck.</p>`,
      },
      {
        id: "when-cpu-fine", toc: "When a CPU bottleneck doesn't matter", h2: "When a CPU bottleneck doesn't matter",
        html: `
          <p>A CPU bottleneck is only a problem if it holds you below a frame rate you care about. If you play esports titles on a 144 Hz monitor, being CPU-bound at 300 FPS changes nothing you can see. A ${calc("ryzen-5-5600", "rx-9070-xt", { res: "1080p", workload: "esports" }, `${name("ryzen-5-5600")} with an ${name("rx-9070-xt")}`)} is CPU-limited in CS2-style games at 1080p, yet still averages about ${fmt(es.fps)} FPS, which is more than a 240 Hz panel can show.</p>
          <p>It also doesn't matter much when you cap the frame rate. Many people run a cap a few frames below their refresh rate to keep G-Sync or FreeSync active and cut input lag. If the CPU can hold that cap in the busiest scenes, it doesn't matter that it couldn't go higher.</p>
          <h3>The latency twist</h3>
          <p>There's one way a GPU bottleneck is worse: input latency. When the GPU is pegged at 99%, finished CPU frames wait in a render queue, which adds a few milliseconds between your mouse movement and the screen. Competitive players fix that with NVIDIA Reflex or AMD Anti-Lag 2, or with a frame cap just below what the GPU can sustain. A CPU-bound game has no queue, so its latency is naturally lower, even though its frame pacing is worse.</p>`,
      },
      {
        id: "upgrade-first", toc: "Which to upgrade first", h2: "Which part should you upgrade first?",
        html: `
          <p>Work out which part limits you in the games you actually play, at the resolution you actually use, then follow these rules of thumb:</p>
          <ol>
            <li><strong>CPU-bound by 20% or more and below your target FPS:</strong> upgrade the CPU first. A faster graphics card would mostly sit idle. Check for a drop-in upgrade on your current socket before buying a new platform.</li>
            <li><strong>GPU-bound and below your target FPS:</strong> upgrade the GPU, but make sure the new card won't flip you into a CPU bottleneck. A card that's 60% faster helps little if your CPU tops out 20% above your current frame rate.</li>
            <li><strong>Slightly GPU-bound and happy with your FPS:</strong> don't upgrade anything. That's a well-balanced PC.</li>
          </ol>
          <p>The ${link.calculator("calculator")} does this comparison for you and suggests the smallest upgrade that balances the build. If you're about to change resolution, read ${guide("does-resolution-affect-bottleneck", "how resolution changes the bottleneck")} first, because a new monitor can move the bottleneck from one part to the other. To measure what your PC is doing right now, see ${guide("how-to-check-for-bottleneck", "how to check for a bottleneck")}.</p>`,
      },
    ],
    faq: [
      ["Is it better to be CPU or GPU bottlenecked?", "GPU bottlenecked. A GPU-bound game has smoother frame times and better 1% lows, and you can raise FPS with settings or upscaling. A CPU-bound game stutters more in busy scenes, and lowering settings barely helps."],
      ["Does a CPU bottleneck cause stutter?", "It often does. A CPU-bound game's frame rate depends on how much simulation work each frame needs, which spikes during explosions, crowds and streaming. Those spikes show up as low 1% lows and visible hitches, even when the average FPS looks fine."],
      ["Is a GPU bottleneck bad?", "Not by itself. A GPU running at 95–99% means you're getting the performance you paid for. It's only a problem if your FPS is too low for your monitor even after lowering settings or enabling DLSS or FSR, or if the card is running out of VRAM."],
      [`Does DLSS help a CPU bottleneck?`, `DLSS and FSR upscaling don't. They render fewer pixels, which lightens the GPU's load, so a CPU-bound game gains nothing and becomes even more CPU-bound. Frame generation is different: it adds generated frames without CPU work, which raises perceived smoothness, with slightly higher input latency.`],
      ["Can a CPU bottleneck damage my GPU?", "No. A bottleneck is a performance mismatch, not a fault. An underused GPU just runs cooler and quieter. Neither part is stressed beyond its design."],
      ["How much bottleneck is acceptable?", `Under 10% is excellent and 10–20% is fine. A CPU bottleneck between 20% and 35% starts to show in 1% lows, and above 35% a large part of the graphics card is wasted. A GPU bottleneck of any size is fine as long as your FPS meets your target.`],
    ],
    related: ["balanced-gaming-pc-build", "how-to-check-for-bottleneck", "how-to-fix-cpu-bottleneck"],
  };
};
