// Guide: What is a good FPS for gaming? (30/60/144/240, frame time, 1% lows)
module.exports = function (h) {
  const { Games, BASE, cpu, gpu, res, fmt, name, expect, guide, link, table, td, limitTag } = h;

  // Per-game estimate (games.js) and a link that opens it in the FPS calculator.
  const gm = (c, g, game, o = {}) => Games.evaluate(cpu(c), gpu(g), game, { ...BASE, ...o });
  const fpsHref = (c, g, game, o = {}) => {
    const q = [`cpu=${c}`, `gpu=${g}`, `game=${game}`];
    if (o.res) q.push(`res=${o.res}`);
    if (o.quality) q.push(`q=${o.quality}`);
    return `../../fps-calculator/?${q.join("&amp;")}`;
  };
  const fpsLink = (c, g, game, o, text) => `<a href="${fpsHref(c, g, game, o)}">${text}</a>`;
  const ms = (fps) => (1000 / fps).toFixed(1);
  const gname = (id) => Games.byId[id].name;

  // Frame-time table: what each target costs per frame and what you save by going one step up.
  const TARGETS = [
    [30, "Console “quality” modes, slow strategy and turn-based games. Playable, but motion looks choppy on a PC monitor."],
    [45, "The low end of most VRR ranges. Fine for a demanding single-player game if frame pacing is even."],
    [60, "The baseline for smooth PC gaming. Right for most single-player and story games."],
    [90, "Noticeably smoother than 60 in fast games. A common minimum for VR headsets."],
    [120, "High-refresh single-player and casual multiplayer. Where most people stop noticing big gains."],
    [144, "The classic high-refresh target. Good for shooters and anything you play competitively for fun."],
    [165, "The most common refresh rate on current 1440p gaming monitors."],
    [240, "Competitive esports on a 240 Hz monitor."],
    [360, "Top-level esports only. Needs a very fast CPU and light settings."],
  ];
  const ft = TARGETS.map(([f]) => 1000 / f);
  const save = (i) => (ft[i - 1] - ft[i]).toFixed(1);
  const i30 = 0, i60 = 2, i144 = 5, i240 = 7, i360 = 8;
  expect(ft[i30] - ft[i60] > 5 * (ft[i144] - ft[i240]), "30 to 60 saves far more frame time than 144 to 240");
  const ftTable = table(
    [["Target FPS", true], ["Frame time", true], ["Saved vs previous", true], "Good for"],
    TARGETS.map(([f, use], i) => [td(fmt(f), true), td(`${ms(f)} ms`, true), td(i ? `${save(i)} ms` : "–", true), td(use)]),
  );

  // Real builds in real games: esports at 1080p Low, AAA at 1440p High (and Cyberpunk at 1080p High).
  const BUILDS = [
    ["i5-12400f", "rtx-4060"],
    ["ryzen-5-5600", "rtx-5060"],
    ["ryzen-5-7600", "rtx-5070"],
    ["ryzen-7-7800x3d", "rtx-5070-ti"],
    ["ryzen-7-9800x3d", "rtx-5090"],
  ];
  const COLS = [
    ["cs2", { res: "1080p", quality: "low" }, "CS2<br><small>1080p Low</small>"],
    ["valorant", { res: "1080p", quality: "low" }, "Valorant<br><small>1080p Low</small>"],
    ["fortnite", { res: "1440p", quality: "high" }, "Fortnite<br><small>1440p High</small>"],
    ["cyberpunk", { res: "1080p", quality: "high" }, "Cyberpunk<br><small>1080p High</small>"],
    ["cyberpunk", { res: "1440p", quality: "high" }, "Cyberpunk<br><small>1440p High</small>"],
  ];
  const grid = BUILDS.map(([c, g]) => ({ c, g, r: COLS.map(([game, o]) => gm(c, g, game, o)) }));
  const col = (i) => grid.map((b) => b.r[i]);
  const [cs, val, fn, cp1080, cp1440] = [0, 1, 2, 3, 4].map(col);
  expect(cs.every((x) => x.fps >= 240) && val.every((x) => x.fps >= 240), "every build clears 240 FPS in CS2 and Valorant at 1080p Low");
  expect(cs.every((x) => x.limiter === "cpu") && val.every((x) => x.limiter === "cpu"), "esports at 1080p Low is CPU-limited on every build");
  const cs360 = grid.filter((b) => b.r[0].fps >= 360);
  expect(cs360.length === 4 && grid.length === 5, "four of five builds clear 360 FPS in CS2");
  const cs360miss = grid.find((b) => b.r[0].fps < 360);
  expect(cp1440[0].fps < 60 && cp1440[1].fps < 60 && cp1080[0].fps >= 60 && cp1080[1].fps >= 60, "budget builds: 60+ in Cyberpunk at 1080p, under 60 at 1440p");
  expect(cp1440[2].fps >= 60 && cp1440[3].fps >= 60 && cp1440[3].fps < 144, "mid builds: 60+ but under 144 in Cyberpunk at 1440p");
  expect(cp1440[4].fps >= 144 && cp1440.filter((x) => x.fps >= 144).length === 1, "only the 5090 build clears 144 in Cyberpunk at 1440p");
  expect(fn[0].fps < 144 && fn[1].fps < 144 && fn.slice(2).every((x) => x.fps >= 144), "Fortnite at 1440p High: 144+ from the 7600 + 5070 up");
  const gameTable = table(
    ["Build", ...COLS.map(([, , label]) => [label, true])],
    grid.map((b) => [
      td(`<strong>${name(b.c)}</strong><br><small>${name(b.g)}</small>`),
      ...b.r.map((x, i) => `<td class="r">${fpsLink(b.c, b.g, COLS[i][0], COLS[i][1], fmt(x.fps))}<br>${limitTag(x)}</td>`),
    ]),
  );

  // 1% lows: a CPU-bound build with the higher average but the worse lows, in the same game.
  const LA = ["ryzen-5-3600", "rtx-5070"], LB = ["i5-12400f", "rtx-4060"];
  const LO = { res: "1080p", quality: "high" };
  const la = gm(...LA, "cyberpunk", LO), lb = gm(...LB, "cyberpunk", LO);
  expect(la.limiter === "cpu" && lb.limiter === "gpu", "lows example: one CPU-bound, one GPU-bound");
  expect(la.fps > lb.fps && la.low1 < lb.low1 && la.low1 < 60 && lb.low1 < 60, "CPU-bound build: higher average, lower 1% low");
  const ratio = (x) => Math.round((x.low1 / x.fps) * 100);
  const lowTable = table(
    ["Build", ["Avg FPS", true], ["1% low", true], ["1% low frame time", true], "Limited by"],
    [[LA, la], [LB, lb]].map(([[c, g], x]) => [
      td(fpsLink(c, g, "cyberpunk", LO, `${name(c)} + ${name(g)}`)),
      td(fmt(x.fps), true), td(fmt(x.low1), true), td(`${ms(x.low1)} ms`, true), td(limitTag(x)),
    ]),
  );

  // Esports headroom over a 240 Hz monitor.
  const top = grid[3];
  const topCs = top.r[0];
  expect(topCs.fps > 240 * 2, "7800X3D + 5070 Ti runs CS2 at over twice 240 FPS");
  const hz = BASE.hz;

  return {
    slug: "what-is-a-good-fps",
    title: "What Is a Good FPS for Gaming? 30 vs 60 vs 144 vs 240 (2026)",
    description: "What frame rate you actually need: 30, 60, 144 and 240 FPS explained with frame times, refresh rate and VRR, why 1% lows matter, and what real builds reach.",
    h1: "What is a good FPS for gaming? 30, 60, 144 and 240 explained",
    crumb: "What is a good FPS",
    card: "Frame times for every common target, what 60, 144 and 240 FPS are each good for, refresh rate and VRR, and why 1% lows matter more than averages.",
    lead: "There's no single good frame rate. It depends on the game you play, the monitor in front of you and how consistent the frames are. This guide turns FPS into frame times so you can see what each step is worth, then shows which targets real builds reach in esports and AAA games.",
    sections: [
      {
        id: "short-answer", toc: "The short answer", h2: "The short answer",
        html: `
          <p><strong>60 FPS is the baseline for smooth PC gaming</strong>, and it's plenty for most single-player and story games. <strong>120–144 FPS</strong> is the sweet spot for shooters and fast action games on a high-refresh monitor. <strong>240 FPS and above</strong> only pays off in competitive esports, and only if your monitor runs at 240 Hz or faster.</p>
          <p>Two rules matter more than the number itself. First, your frame rate is only as useful as your monitor's refresh rate lets it be. Second, a steady frame rate beats a high average: a game that holds 90 FPS feels better than one that averages 120 and keeps dropping to 50. That's what the <strong>1% low</strong> measures, and it's the number to watch.</p>`,
      },
      {
        id: "frame-time", toc: "FPS and frame time", h2: "FPS is really frame time",
        html: `
          <p>Frame rate is easier to say, but your eyes and hands feel <strong>frame time</strong>: how many milliseconds each frame stays on screen. It's simply 1,000 divided by the frame rate. Seen that way, the value of each upgrade becomes clear:</p>
          ${ftTable}
          <p>Going from ${fmt(TARGETS[i30][0])} to ${fmt(TARGETS[i60][0])} FPS cuts ${(ft[i30] - ft[i60]).toFixed(1)} ms off every frame. Going from ${fmt(TARGETS[i144][0])} to ${fmt(TARGETS[i240][0])} FPS saves only ${(ft[i144] - ft[i240]).toFixed(1)} ms, and ${fmt(TARGETS[i240][0])} to ${fmt(TARGETS[i360][0])} just ${(ft[i240] - ft[i360]).toFixed(1)} ms. Each step up is harder to reach and worth less than the one before it. That's why the jump from 60 to 144 Hz is obvious to almost everyone, while 240 to 360 Hz is something mainly competitive players notice.</p>
          <p>Frame time also feeds into input latency. A frame has to be prepared, rendered and displayed before your mouse movement shows up, so a shorter frame time means a more responsive game, not only a smoother-looking one.</p>`,
      },
      {
        id: "targets", toc: "Which target for which game", h2: "Which target suits which kind of game",
        html: `
          <h3>30 FPS: cinematic, not comfortable</h3>
          <p>Many console games offer a 30 FPS quality mode, and it works on a TV from the sofa with a controller. On a PC monitor up close, with a mouse, it feels sluggish. Treat 30 as a floor for slow games, not a target.</p>
          <h3>60 FPS: the single-player standard</h3>
          <p>Open-world RPGs, adventure games, racing games played with a pad and most simulators feel smooth at a steady 60. If your 1% lows stay above about 50 and you have a variable refresh rate monitor, you won't notice much wrong. This is where it makes sense to spend spare GPU power on higher settings rather than more frames.</p>
          <h3>120–165 FPS: fast games on a high-refresh monitor</h3>
          <p>Shooters, action games and anything with fast camera movement benefit visibly from 120 FPS or more. Aiming tracks your hand more closely and motion is easier to follow. Many 1440p gaming monitors sold now run at 144–180 Hz, so this is the realistic goal for a mid-range or high-end PC.</p>
          <h3>240 FPS and above: competitive esports</h3>
          <p>In CS2, Valorant, Overwatch 2 or Fortnite played competitively, higher frame rates cut latency and make targets easier to track during fast flicks. Here players lower settings on purpose. Above 240 FPS the gains are small and the CPU, not the graphics card, does most of the work.</p>`,
      },
      {
        id: "refresh", toc: "Refresh rate vs FPS", h2: "Refresh rate vs FPS, and what VRR does",
        html: `
          <p>Your monitor's refresh rate (Hz) is how many times per second it can draw a new image. Your frame rate (FPS) is how many images the PC produces. You only <em>see</em> as many frames as the monitor shows, so a ${fmt(hz)} Hz screen can't display ${fmt(hz * 2)} FPS. Frames above the refresh rate still help a little, because the newest frame shown is fresher and latency drops slightly, but they also cause <strong>tearing</strong>, where parts of two frames appear on screen at once.</p>
          <p>For example, the ${name(top.c)} with an ${name(top.g)} runs CS2 at about ${fmt(topCs.fps)} FPS at 1080p Low in our model, more than twice what a 240 Hz monitor can show. Competitive players often leave it uncapped for the lowest latency. Everyone else is better off capping and using the headroom for steadier frame times.</p>
          <h3>Variable refresh rate (G-Sync and FreeSync)</h3>
          <p>A VRR monitor changes its refresh rate on the fly to match the frame rate. That removes tearing without the delay of traditional V-Sync, and it makes uneven frame rates such as 70–90 FPS look much smoother than they would on a fixed 60 Hz or 144 Hz screen. NVIDIA calls it G-Sync (G-Sync Compatible on most FreeSync monitors), AMD calls it FreeSync, and Intel Arc cards support it too.</p>
          <ul>
            <li><strong>Stay inside the VRR range.</strong> Most monitors cover roughly 48 Hz up to their maximum. Below that, a feature called low framerate compensation repeats frames, which works but feels less smooth.</li>
            <li><strong>Cap a few FPS below the maximum.</strong> On a ${fmt(hz)} Hz monitor, a limit of about ${fmt(hz - 4)}–${fmt(hz - 3)} FPS keeps you inside the range so tearing and V-Sync delay never kick in.</li>
            <li><strong>Check the monitor's setting.</strong> Many monitors ship with VRR or their highest refresh rate turned off. Turn it on in the monitor's menu and pick the right refresh rate in Windows display settings.</li>
          </ul>`,
      },
      {
        id: "lows", toc: "Why 1% lows matter", h2: "Why 1% lows matter more than the average",
        html: `
          <p>The <strong>1% low</strong> is the frame rate of the slowest 1% of frames. The average tells you how fast a game runs most of the time. The 1% low tells you how bad the worst moments are, and those moments are what you notice as stutter. Two builds can post the same average and feel completely different.</p>
          <p>Here are two PCs in ${gname("cyberpunk")} at ${res(LO.res)} High, as estimated by our ${link.fps("FPS calculator")}:</p>
          ${lowTable}
          <p>The ${name(LA[0])} build has the higher average (${fmt(la.fps)} vs ${fmt(lb.fps)} FPS), yet its worst frames take ${ms(la.low1)} ms against ${ms(lb.low1)} ms for the ${name(LB[1])} build. It's held back by its processor, and CPU-limited scenes are where frame times spike. It keeps only ${ratio(la)}% of its average in the 1% lows, while the GPU-limited build keeps ${ratio(lb)}%. Our guide to ${guide("cpu-vs-gpu-bottleneck", "CPU vs GPU bottlenecks")} goes deeper into why.</p>
          <div class="callout"><p><strong>A practical rule:</strong> pick the target your 1% lows can hold, not the one your average reaches. If you want a game to feel like 60 FPS, aim for an average of roughly ${fmt(60 / (lb.low1 / lb.fps))}–${fmt(60 / (la.low1 / la.fps))} FPS, depending on how well your build holds its lows, so the worst moments stay near 60. With a VRR monitor you can be a bit more relaxed, as long as the lows stay inside its range.</p></div>`,
      },
      {
        id: "real-builds", toc: "What real builds reach", h2: "Which builds hit 60, 144 and 240 FPS",
        html: `
          <p>Targets mean little without knowing what hardware reaches them. This table shows estimated averages for five common builds, from budget to high end, in two esports games at competitive settings and two demanding games at High. Click any number to open that game in the FPS calculator.</p>
          ${gameTable}
          <p>A few patterns stand out:</p>
          <ul>
            <li><strong>Esports is easy, and CPU-bound.</strong> Every build clears 240 FPS in ${gname("cs2")} and ${gname("valorant")} at 1080p Low, and every one is limited by its processor there. Four of the five also clear 360 FPS in ${gname("cs2")}; the ${name(cs360miss.c)} build lands at ${fmt(cs360miss.r[0].fps)}. At these frame rates the processor decides the result, so if you want 360 Hz, buy the CPU first.</li>
            <li><strong>AAA at 1440p separates the tiers.</strong> In ${gname("cyberpunk")} at 1440p High, the two budget builds fall below 60 FPS (${fmt(cp1440[0].fps)} and ${fmt(cp1440[1].fps)}). Dropping to 1080p brings them to ${fmt(cp1080[0].fps)} and ${fmt(cp1080[1].fps)}. The mid-range builds manage 60 comfortably but not 144, and only the ${name(grid[4].g)} build clears 144.</li>
            <li><strong>${gname("fortnite")} sits in between.</strong> At 1440p High, the ${name(grid[2].g)} build and everything above it clear 144 FPS, while the budget cards land at ${fmt(fn[0].fps)} and ${fmt(fn[1].fps)}.</li>
          </ul>
          <p>Upscaling changes the AAA columns a lot on GPU-bound builds. The ${guide("dlss-vs-fsr-vs-xess", "DLSS vs FSR vs XeSS guide")} shows by how much, and why it does nothing for the CPU-bound esports results.</p>`,
      },
      {
        id: "choose", toc: "Pick your target", h2: "How to pick your own target",
        html: `
          <ol class="steps">
            <li><strong>Start from your monitor.</strong> A 60 Hz screen makes 60 FPS the target, full stop. On 144–180 Hz, aim for 100+ in fast games. On 240 Hz or more, aim for the refresh rate only in the games where it matters.</li>
            <li><strong>Adjust for the game.</strong> Single-player games: a steady 60 or more, then spend the rest on settings. Competitive shooters: as high as your monitor allows, with settings lowered.</li>
            <li><strong>Check the lows, not the average.</strong> Turn on a performance overlay with a 1% low reading. Our ${guide("how-to-check-for-bottleneck", "bottleneck check walkthrough")} shows how to set one up.</li>
            <li><strong>Cap the frame rate</strong> just below your refresh rate, or at a level your PC holds in busy scenes. You'll get steadier frame times, less heat and less fan noise.</li>
            <li><strong>Close the gap if you're short.</strong> Our guide to ${guide("how-to-increase-fps", "increasing FPS")} lists the fixes in the order worth trying. To see what a different CPU or GPU would reach, try the ${link.fps("FPS calculator")} for a specific game or the ${link.calculator("bottleneck calculator")} for the overall balance.</li>
          </ol>`,
      },
    ],
    faq: [
      ["Is 60 FPS good for gaming?", "Yes. A steady 60 FPS is smooth for most single-player games and is the standard most PC games are designed around. For fast shooters on a high-refresh monitor, 120–144 FPS feels noticeably more responsive."],
      ["Is 30 FPS playable?", "It's playable in slow games and on a TV with a controller, but it feels choppy and sluggish on a PC monitor with a mouse. Treat 30 FPS as a minimum, not a target, and use lower settings or upscaling to reach 60 if you can."],
      ["Can you see the difference between 144 and 240 FPS?", `Many people can in fast games, but the gain is far smaller than going from 60 to 144. Each frame at 144 FPS takes ${ms(144)} ms and at 240 FPS takes ${ms(240)} ms, a difference of ${(1000 / 144 - 1000 / 240).toFixed(1)} ms. It matters most to competitive players, and only on a 240 Hz monitor.`],
      ["Does FPS above my monitor's refresh rate help?", "A little. Extra frames make the newest image on screen slightly fresher, which reduces input latency, but you don't see more motion and you may get tearing. Outside competitive games, capping a few FPS below the refresh rate with G-Sync or FreeSync on is the better choice."],
      ["What is a good 1% low FPS?", "Aim for 1% lows at or close to your target frame rate. For a game you want to feel like 60 FPS, the 1% low should stay near 60. Lows far below the average, for example 50 with a 120 average, show up as stutter even though the average looks high."],
      ["Do I need a 240 Hz monitor?", "Only if you play competitive esports seriously and your PC can reach around 240 FPS in those games. For single-player and casual multiplayer gaming, a 144–180 Hz monitor gives most of the benefit at a lower price and is easier to drive."],
    ],
    related: ["how-to-increase-fps", "cpu-vs-gpu-bottleneck", "dlss-vs-fsr-vs-xess"],
  };
};
