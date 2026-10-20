// Guide: How to check for a CPU or GPU bottleneck (MSI Afterburner / RTSS walkthrough)
module.exports = function (h) {
  const { ev, res, pct, fmt, name, expect, calc, build, guide, link, table, td, limitCell } = h;

  // Resolution test example: an older 6-core CPU with a fast mid-range card.
  const RT = ["ryzen-5-3600", "rtx-5070"];
  const rt = ["1080p", "1440p", "4k"].map((k) => [k, ev(...RT, { res: k })]);
  expect(rt[0][1].limiter === "cpu" && rt[0][1].pct >= 35, "3600 + 5070 is badly CPU-bound at 1080p");
  expect(rt[2][1].limiter === "gpu", "3600 + 5070 is GPU-bound at 4K");
  const drop = Math.round((1 - rt[1][1].fps / rt[0][1].fps) * 100);
  expect(drop <= 5, "3600 + 5070 loses almost no FPS going from 1080p to 1440p");

  // Expected overlay readings for common builds.
  const BUILDS = [
    ["ryzen-5-3600", "rtx-4070-super", "1080p"],
    ["i5-10400f", "rtx-5070", "1080p"],
    ["i5-12400f", "rtx-5070-ti", "1080p"],
    ["ryzen-5-5600", "rx-9070-xt", "1440p"],
    ["ryzen-5-5600", "rtx-4060", "1080p"],
    ["ryzen-7-7800x3d", "rtx-5070-ti", "1440p"],
  ];
  const usage = BUILDS.map(([c, g, r]) => ({ c, g, r, x: ev(c, g, { res: r }) }));
  const cpuBound = usage.filter((u) => u.x.limiter === "cpu" && u.x.pct >= 20);
  const gpuBound = usage.filter((u) => u.x.limiter === "gpu");
  expect(cpuBound.length >= 3 && gpuBound.length >= 2, "usage table mixes CPU- and GPU-bound builds");
  expect(gpuBound.every((u) => u.x.gpuLoad >= 95), "GPU-bound builds read 95%+ GPU usage");
  expect(cpuBound.every((u) => u.x.gpuLoad < 80), "CPU-bound builds read under 80% GPU usage");

  const es = ev(...RT, { res: "1080p", workload: "esports" });
  const sim = ev(...RT, { res: "4k", workload: "cpuheavy" });
  expect(sim.limiter === "cpu", "3600 + 5070 is CPU-bound in sims even at 4K");

  const usageTable = table(
    ["Build", ["GPU usage", true], ["Avg FPS", true], "Limited by"],
    usage.map((u) => [
      td(`${build(u.c, u.g)}<br><small>${res(u.r)}, High, AAA games</small>`),
      td(`${Math.round(u.x.gpuLoad)}%`, true),
      td(fmt(u.x.fps), true),
      td(limitCell(u.x)),
    ]),
  );

  const resTable = table(
    ["Resolution", ["Avg FPS", true], ["GPU usage", true], "Limited by"],
    rt.map(([k, x]) => [td(res(k)), td(fmt(x.fps), true), td(`${Math.round(x.gpuLoad)}%`, true), td(limitCell(x))]),
  );

  return {
    slug: "how-to-check-for-bottleneck",
    title: "How to Check for a CPU or GPU Bottleneck (MSI Afterburner Guide)",
    description: "Check whether your CPU or GPU is the bottleneck in under 10 minutes: set up the MSI Afterburner and RTSS overlay, read GPU usage and frame times, and confirm with the resolution test.",
    h1: "How to check for a CPU or GPU bottleneck",
    crumb: "Check for a bottleneck",
    card: "Set up MSI Afterburner and RTSS, read GPU usage and frame times, and confirm the result with a 30-second resolution test.",
    lead: "A calculator predicts a bottleneck. Your own PC can prove it. This walkthrough sets up the free MSI Afterburner and RivaTuner overlay, tells you exactly which numbers to watch, and gives you a resolution test that settles the question in about 30 seconds.",
    sections: [
      {
        id: "short-answer", toc: "The short answer", h2: "The short answer: watch GPU usage",
        html: `
          <p>Play a demanding game with an on-screen overlay showing <strong>GPU usage</strong> and <strong>frame rate</strong>, with any FPS cap or V-Sync turned off. If the GPU sits at 95–99%, the graphics card is the limit, which is normal and healthy. If GPU usage hangs well below 90% while your frame rate is lower than you want, something before the GPU is holding it back, and that's almost always the CPU.</p>
          <p>Then confirm it: drop the resolution or the render scale. If the frame rate barely moves, you're CPU-bound. If it jumps, you were GPU-bound all along. Everything else in this guide is detail on doing those two checks properly and not getting fooled by the exceptions.</p>`,
      },
      {
        id: "tools", toc: "Tools you need", h2: "What you need (all free)",
        html: `
          <p><strong>MSI Afterburner</strong> with <strong>RivaTuner Statistics Server (RTSS)</strong> is still the most flexible option. It works with NVIDIA, AMD and Intel graphics cards, not only MSI ones, and RTSS installs alongside it to draw the overlay in game. Download both from MSI's own site or Guru3D, not from a mirror.</p>
          <p>If you'd rather not install anything extra, you have decent alternatives:</p>
          <ul>
            <li><strong>NVIDIA App</strong>: press Alt+R in game for the statistics overlay with GPU and CPU usage, FPS and latency.</li>
            <li><strong>AMD Software: Adrenalin Edition</strong>: Performance › Metrics, then Ctrl+Shift+O toggles the overlay.</li>
            <li><strong>Intel PresentMon</strong>: open source and vendor-neutral. Its <em>GPU Busy</em> reading is the most direct bottleneck metric there is, covered below.</li>
            <li><strong>CapFrameX</strong>: built on PresentMon, best if you want to record runs and compare 1% lows before and after a change.</li>
          </ul>
          <p>Steam's built-in performance monitor (Settings › In Game) also shows FPS and usage, but with fewer options. Windows Task Manager on a second screen isn't a substitute. More on why in a moment.</p>`,
      },
      {
        id: "setup", toc: "Set up the overlay", h2: "Set up the MSI Afterburner and RTSS overlay",
        html: `
          <ol class="steps">
            <li><strong>Install both programs.</strong> The Afterburner installer offers RTSS as an option. Leave it ticked. RTSS has to be running in the background for the overlay to appear.</li>
            <li><strong>Open Afterburner's settings</strong> (the gear icon) and go to the <strong>Monitoring</strong> tab. You'll see a long list of sensors under “Active hardware monitoring graphs”.</li>
            <li><strong>Enable the sensors that matter.</strong> Tick each of these, then tick <em>Show in On-Screen Display</em> below the list for each one: GPU usage, GPU memory usage, CPU usage, the per-thread items CPU1 usage through CPUn usage, RAM usage, Framerate and Frametime. Newer versions also list a 1% low framerate item; add it if you see it.</li>
            <li><strong>Show frame time as a graph.</strong> Select Frametime and switch its OSD display from “text” to “graph”. A flat line is smooth gameplay. Spikes are stutter you can feel, even when the average FPS looks fine.</li>
            <li><strong>Set an overlay hotkey</strong> on the On-Screen Display tab so you can hide it without alt-tabbing.</li>
            <li><strong>Check RTSS.</strong> Open it from the system tray and make sure “Show On-Screen Display” is on and the <em>Framerate limit</em> is 0. A leftover limit here is the most common reason people misread their results.</li>
            <li><strong>Launch a game.</strong> If the overlay doesn't show, raise RTSS's “Application detection level” to Medium. A few anti-cheat systems block overlays, so use the vendor overlay for those games.</li>
          </ol>
          <p>Per-thread CPU usage is the reading most people skip, and it's the one that explains the “my CPU is only at 40%, so it can't be the bottleneck” confusion. Games rarely load every thread evenly. One main thread often does the heavy lifting, and when it's pinned near 100% the CPU is the limit, whatever the total says.</p>`,
      },
      {
        id: "test", toc: "Run a fair test", h2: "Run a fair test",
        html: `
          <p>A bottleneck test only means something if nothing artificial is limiting the frame rate. Before you play:</p>
          <ul>
            <li><strong>Turn off every FPS cap:</strong> V-Sync in the game, the in-game frame limiter, the RTSS limit, NVIDIA's Max Frame Rate and AMD's Frame Rate Target Control or Radeon Chill. G-Sync and FreeSync can stay on; they don't cap anything by themselves.</li>
            <li><strong>Pick the heaviest repeatable scene</strong> you can find: a dense city, a big battle, a busy multiplayer map. Menus and empty corridors tell you nothing.</li>
            <li><strong>Play for three to five minutes.</strong> The first minute often includes shader compilation stutter that has nothing to do with your hardware balance.</li>
            <li><strong>Watch the trend, not single spikes.</strong> A GPU that dips to 85% for a second during a loading transition isn't a bottleneck. One that averages 70% through a whole firefight is.</li>
          </ul>
          <p>Test more than one game if you can. A bottleneck is a property of your CPU, your GPU <em>and</em> the game. Esports titles, simulators and open-world RPGs load the CPU very differently. The same ${name(RT[0])} and ${name(RT[1])} that manage about ${fmt(es.fps)} FPS in CS2-style esports games at 1080p are still CPU-limited in a city builder or flight sim at 4K (${pct(sim)}% CPU bottleneck), where they average about ${fmt(sim.fps)} FPS.</p>`,
      },
      {
        id: "read", toc: "Read the numbers", h2: "How to read the numbers",
        html: `
          <p>Here's how the overlay readings translate into a verdict:</p>
          ${table(["What you see", "What it means"], [
            [td("<strong>GPU usage 95–99%</strong>, steady frame times"), td("GPU-bound. The card is working flat out, which is what you paid for. To get more FPS, lower settings, enable upscaling or buy a faster GPU.")],
            [td("<strong>GPU usage 80–95%</strong>, moving around"), td("Mixed. The game shifts between CPU- and GPU-limited scenes. Usually fine. Check the 1% lows.")],
            [td("<strong>GPU usage under 80%</strong>, FPS below your target"), td("CPU-bound, or something else is limiting the frame rate (see the false alarms below).")],
            [td("<strong>One or two CPU threads at 90–100%</strong>"), td("The game's main thread is maxed. Classic CPU bottleneck, even if total CPU usage looks low.")],
            [td("<strong>Spiky frame-time graph</strong> with low GPU usage"), td("CPU or memory stalls. Expect poor 1% lows and stutter in busy scenes.")],
          ])}
          <p>To give you a reference point, this is the GPU usage our model predicts for some common builds in a demanding AAA game at High settings. If your overlay shows something wildly different for the same parts, look for a cap, a thermal problem or a configuration issue before blaming the hardware.</p>
          ${usageTable}
          <p>Notice the split. The GPU-bound builds sit at 95% or more, while the CPU-bound ones hover between about ${Math.round(Math.min(...cpuBound.map((u) => u.x.gpuLoad)))}% and ${Math.round(Math.max(...cpuBound.map((u) => u.x.gpuLoad)))}%. That gap is the clearest sign you'll get. You can load any of these into the ${link.calculator("bottleneck calculator")} and change the resolution or game type to see how the prediction moves.</p>
          <h3>The PresentMon “GPU Busy” shortcut</h3>
          <p>Intel's PresentMon reports how many milliseconds the GPU was actually busy per frame next to the total frame time. If a frame takes 12 ms but the GPU was busy for only 7 ms, it spent 5 ms waiting on the CPU. When GPU Busy is close to the frame time, you're GPU-bound. When there's a large, persistent gap, you're CPU-bound. It's the same logic as GPU usage, just measured per frame and harder to fool.</p>`,
      },
      {
        id: "resolution-test", toc: "Confirm with the resolution test", h2: "Confirm it with the resolution test",
        html: `
          <p>GPU usage points you in the right direction. This test proves it, and it takes about 30 seconds:</p>
          <ol>
            <li>Note your average FPS in a busy scene at your normal resolution.</li>
            <li>Drop the resolution one step, or set the render scale to 50–70% if the game has one. Keep every other setting the same.</li>
            <li>Stand in the same spot and compare.</li>
          </ol>
          <p>Lower resolution takes work away from the GPU but leaves the CPU's work per frame the same. If FPS rises a lot, the GPU was the limit. If FPS barely changes, the CPU was. Here's what that looks like for a ${calc(...RT, { res: "1080p" })} in AAA games:</p>
          ${resTable}
          <p>Going from 1080p to 1440p costs this build only ${drop}% of its frame rate, because the ${name(RT[0])} is capping it at around ${fmt(rt[0][1].cpuFps)} FPS either way. At 4K the graphics card finally becomes the limit. If you see the same pattern on your PC, where FPS stays flat as you lower the resolution, you've confirmed a CPU bottleneck. Our guide on ${guide("does-resolution-affect-bottleneck", "how resolution affects bottlenecks")} explains the effect in more detail.</p>`,
      },
      {
        id: "false-alarms", toc: "False alarms", h2: "When low GPU usage isn't a CPU bottleneck",
        html: `
          <p>Low GPU usage means the GPU is waiting for <em>something</em>. Usually that's the CPU, but rule these out first:</p>
          <ul>
            <li><strong>A frame cap you forgot about.</strong> A game capped at 60 or 144 FPS will show low GPU usage on a fast card. That's the cap working, not a bottleneck.</li>
            <li><strong>The game's own engine limit.</strong> Some games cap physics or simulation speed, and a few older titles barely use more than one CPU thread no matter what you own.</li>
            <li><strong>Running out of VRAM.</strong> When the card's memory fills up, textures spill into system RAM over PCIe and the GPU stalls. You'll see GPU memory usage at the maximum, heavy stutter and dipping GPU usage. Lowering texture quality fixes it. That's a VRAM limit, not a CPU one.</li>
            <li><strong>The monitor cable is in the motherboard.</strong> On a desktop with a graphics card, plug the display into the card itself.</li>
            <li><strong>Laptops on the wrong GPU.</strong> Check that the game runs on the dedicated GPU. A laptop with a MUX switch set to hybrid mode also loses some performance.</li>
            <li><strong>Thermal or power throttling.</strong> A CPU at 95–100 °C clocks down and becomes a bottleneck it shouldn't be. Add CPU temperature and clock speed to the overlay if you suspect this.</li>
            <li><strong>Shader compilation and asset streaming.</strong> Stutter during the first few minutes or when entering new areas is often the game building shaders. It settles on its own.</li>
          </ul>
          <p>If none of these apply and GPU usage is still low with FPS under your target, it's the CPU (or the RAM feeding it). Our guide on ${guide("how-to-fix-cpu-bottleneck", "how to fix a CPU bottleneck")} goes through the fixes in order, starting with the free ones.</p>`,
      },
      {
        id: "task-manager", toc: "Why not Task Manager", h2: "Why Task Manager gets this wrong",
        html: `
          <p>Task Manager's headline CPU figure is an average across every thread. A game that maxes out two threads on a 16-thread processor reads as roughly 12–25% CPU usage, which looks like plenty of headroom while the game is completely CPU-bound. Switching the CPU graph to “logical processors” helps a little, but Windows moves threads between cores many times a second, so even that view smooths out the peaks.</p>
          <p>Its GPU percentage has a similar problem: by default it shows the 3D engine only and updates slowly. An in-game overlay sampling every second or faster, with per-thread CPU usage, is far more reliable.</p>`,
      },
      {
        id: "calculator", toc: "Compare with the calculator", h2: "Compare your results with the calculator",
        html: `
          <p>Once you've measured, put the same parts and settings into the ${link.calculator("bottleneck calculator")}. If your results roughly match the prediction, your PC is behaving normally and the bottleneck is simply the balance of your parts. If your real FPS is far below the estimate, especially with low GPU <em>and</em> low per-thread CPU usage, something is misconfigured: RAM running at default speed, a single memory stick, a power-saving plan or a cooling problem.</p>
          <p>For a specific game rather than an average, the ${link.fps("FPS calculator")} adjusts the estimate for each title's engine. And if your build is a common one, it probably has its own page in our ${link.builds("popular builds")} list with results at every resolution.</p>`,
      },
    ],
    faq: [
      ["Is 100% GPU usage bad?", "No. 95–100% GPU usage while gaming means the graphics card is fully used, which is the ideal state. It isn't harmful as long as temperatures are within spec. If you want lower power draw or less fan noise, cap the frame rate slightly below your monitor's refresh rate."],
      ["What CPU usage means a CPU bottleneck?", "Total CPU usage is a poor guide. Look at per-thread usage instead. If one or two threads sit at 90–100% while GPU usage is clearly below 90% and FPS is under your target, the CPU is the bottleneck, even if total CPU usage reads 30–50%."],
      ["Can I check for a bottleneck without installing software?", "Yes. The NVIDIA App overlay (Alt+R), AMD Adrenalin's metrics overlay (Ctrl+Shift+O) and Steam's performance monitor all show GPU usage and FPS. Combine one of them with the resolution test: if lowering the resolution doesn't raise FPS, you're CPU-bound."],
      ["Does MSI Afterburner work with AMD and Intel graphics cards?", "Yes. Despite the name, MSI Afterburner monitors NVIDIA, AMD and Intel Arc cards from any brand. RivaTuner Statistics Server, which draws the overlay, is vendor-neutral too."],
      ["Why are both my CPU and GPU usage low?", "Usually a frame cap is active (V-Sync, an in-game limiter, RTSS or the driver), or the game is limited by a single maxed-out thread that total CPU usage hides. Turn off all caps and check per-thread CPU usage. VRAM overflow and thermal throttling can also cause it."],
      ["Is the bottleneck percentage the same as the gap in GPU usage?", "They're closely related. In our model the bottleneck percentage is how far apart the CPU and GPU frame-rate limits are. A GPU sitting at about 60% usage in a CPU-bound game roughly matches a 40% CPU bottleneck, since the card is idle for the rest of each frame."],
    ],
    related: ["how-to-fix-cpu-bottleneck", "cpu-vs-gpu-bottleneck", "does-resolution-affect-bottleneck"],
  };
};
