// Guide: How much RAM do you need for gaming (8 vs 16 vs 32 vs 64 GB)
module.exports = function (h) {
  const { ev, Macs, fmt, name, verdict, expect, calc, build, guide, link, mac, table, td, limitTag } = h;

  const RAMS = [8, 16, 32, 64];
  const loss = (x, base) => Math.round((1 - x / base) * 100);

  // ---- Four builds: two GPU-bound, two CPU-bound, at the resolution they're usually played at
  const BUILDS = [
    { c: "ryzen-5-5600", g: "rtx-5060", res: "1080p", tag: "Budget, 1080p" },
    { c: "ryzen-5-7600", g: "rtx-5070", res: "1440p", tag: "Mid-range, 1440p" },
    { c: "ryzen-5-7600", g: "rtx-5070-ti", res: "1080p", tag: "Fast GPU, 1080p" },
    { c: "ryzen-7-7800x3d", g: "rtx-5080", res: "1080p", tag: "High end, 1080p" },
  ];
  const R = BUILDS.map((b) => Object.fromEntries(RAMS.map((ram) => [ram, ev(b.c, b.g, { res: b.res, ram })])));
  const cell = (b, ram, o = {}) => {
    const x = ev(b.c, b.g, { res: b.res, ram, ...o });
    return `<td class="r">${calc(b.c, b.g, { res: b.res, ram, ...o }, fmt(x.fps))} / ${fmt(x.low1)}<br>${limitTag(x)}</td>`;
  };
  const ramTable = table(
    ["RAM", ...BUILDS.map((b) => [`${build(b.c, b.g)}<br><small>${b.tag}</small>`, true])],
    RAMS.map((ram) => [td(`<strong>${ram} GB</strong>`), ...BUILDS.map((b) => cell(b, ram))]),
  );

  // Facts the copy relies on
  const [A, B, C, D] = R;
  expect(R.every((r) => Math.round(r[64].fps) === Math.round(r[32].fps) && Math.round(r[64].low1) === Math.round(r[32].low1)), "64 GB gives the same FPS as 32 GB in every build");
  expect(A[32].limiter === "gpu" && B[32].limiter === "gpu", "builds A and B are GPU-bound at 32 GB");
  expect(C[32].limiter === "cpu" && C[32].pct >= 15 && D[32].limiter === "cpu" && D[32].pct >= 10, "builds C and D are CPU-bound at 32 GB");
  const l16 = R.map((r) => loss(r[16].fps, r[32].fps));
  expect(l16[0] <= 1 && l16[1] <= 1, "16 GB costs GPU-bound builds about 1% or less");
  expect(l16[2] >= 3 && l16[2] <= 6 && l16[3] >= 3 && l16[3] <= 6, "16 GB costs CPU-bound builds 3–6%");
  const a8 = R.map((r) => loss(r[8].fps, r[32].fps));
  const lo8 = R.map((r) => loss(r[8].low1, r[32].low1));
  expect(R.every((r, i) => lo8[i] > a8[i] && lo8[i] >= 15), "8 GB hurts 1% lows more than averages, by 15% or more");
  expect(a8[2] >= 15 && a8[3] >= 15 && a8[1] <= 5, "8 GB: big average loss when CPU-bound, small when GPU-bound");
  expect(A[8].limiter === "cpu" && A[16].limiter === "gpu", "8 GB turns the budget build CPU-limited");
  const lo8Min = Math.min(...lo8), lo8Max = Math.max(...lo8);
  const range = (a, b) => (a === b ? `${a}` : `${Math.min(a, b)}–${Math.max(a, b)}`);

  // ---- One build across game types
  const W = { c: "ryzen-5-7600", g: "rtx-5070" };
  const TYPES = [
    ["AAA, 1440p High", { res: "1440p" }],
    ["Ray tracing, 1440p", { res: "1440p", workload: "raytracing" }],
    ["Esports, 1080p", { res: "1080p", workload: "esports" }],
    ["Sims and strategy, 1440p", { res: "1440p", workload: "cpuheavy" }],
  ];
  const wcell = (o, ram) => {
    const x = ev(W.c, W.g, { ...o, ram });
    return `<td class="r">${calc(W.c, W.g, { ...o, ram }, fmt(x.fps))} / ${fmt(x.low1)}<br>${limitTag(x)}</td>`;
  };
  const typeTable = table(
    ["Game type", ["8 GB", true], ["16 GB", true], ["32 GB", true]],
    TYPES.map(([label, o]) => [td(`<strong>${label}</strong>`), ...[8, 16, 32].map((ram) => wcell(o, ram))]),
  );
  const T = Object.fromEntries(["aaa", "rt", "es", "sim"].map((k, i) => [k, Object.fromEntries([8, 16, 32].map((ram) => [ram, ev(W.c, W.g, { ...TYPES[i][1], ram })]))]));
  expect(T.sim[32].limiter === "cpu" && T.sim[32].pct >= 30, "sims are heavily CPU-bound on this build");
  expect(T.rt[32].limiter === "gpu" && loss(T.rt[16].fps, T.rt[32].fps) === 0, "ray tracing: 16 GB costs nothing");
  const sim16 = loss(T.sim[16].fps, T.sim[32].fps), es16 = loss(T.es[16].fps, T.es[32].fps);
  expect(sim16 >= 3 && sim16 > loss(T.aaa[16].fps, T.aaa[32].fps), "sims lose the most at 16 GB");
  expect(T.es[32].limiter === "cpu" && es16 >= 2 && Math.abs(es16 - sim16) <= 1, "esports at 1080p is CPU-bound and loses about as much as sims at 16 GB");
  expect(loss(T.es[8].low1, T.es[32].low1) >= 20, "8 GB hurts esports 1% lows");
  expect(loss(T.sim[8].fps, T.sim[32].fps) >= 15, "8 GB costs sims a lot");

  // ---- Integrated graphics
  const apu = [16, 32].map((ram) => ev("ryzen-7-8700g", "780m", { res: "1080p", quality: "low", ram }));
  expect(apu.every((x) => x.limiter === "gpu") && Math.round(apu[0].fps) === Math.round(apu[1].fps), "APU: GPU-bound, capacity doesn't change FPS in the model");

  // ---- Mac unified memory
  const M = "macbook-air-13-m4-10-core-gpu";
  const mm = Macs.byId[M];
  const macR = [16, 24].map((ram) => Macs.evaluate(mm, { res: "1440p", quality: "ultra", upscale: "off", ram, game: "native-aaa" }));
  expect(macR[0].vram < macR[0].vramNeed && macR[1].vram >= macR[1].vramNeed && macR[1].fps > macR[0].fps, "M4 Air: 16 GB runs short of graphics memory at 1440p Ultra, 24 GB doesn't");

  return {
    slug: "how-much-ram-for-gaming",
    title: "How Much RAM Do You Need for Gaming? 16 vs 32 vs 64 GB (2026)",
    description: "Is 16 GB of RAM still enough for gaming in 2026, or do you need 32 or 64 GB? FPS and 1% lows for 8–64 GB in CPU- and GPU-bound builds, plus who needs more.",
    h1: "How much RAM do you need for gaming? 16 vs 32 vs 64 GB in 2026",
    crumb: "How much RAM for gaming",
    card: "FPS and 1% lows with 8, 16, 32 and 64 GB in four builds, why the answer depends on whether you're CPU-bound, and who actually needs 64 GB.",
    lead: `For a gaming PC in 2026, 32 GB is the right amount, 16 GB still works, and 64 GB only helps if you do more than play. The exact cost of running short depends on your build: it hits CPU-bound systems and 1% lows much harder than averages. Here's what each capacity is worth, calculated with the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "answer", toc: "The short answer", h2: "The short answer",
        html: `
          <div class="callout">
            <p><strong>8 GB: not enough for modern games.</strong> In our model it cuts 1% lows by ${lo8Min}–${lo8Max}% in every build, because Windows starts swapping game data to the SSD.</p>
            <p><strong>16 GB: the minimum.</strong> Fine for a budget or mid-range PC that's limited by its graphics card. It costs a CPU-bound build a few percent, and leaves little room for a browser and Discord running alongside the game.</p>
            <p><strong>32 GB: the right choice for a new build.</strong> Enough for every current game plus background apps, and the point where our model stops finding any gain.</p>
            <p><strong>64 GB: no gaming benefit.</strong> Worth it for heavy modding, large simulator setups, video editing, 3D work or running virtual machines, not for frame rate.</p>
          </div>
          <p>Whatever the capacity, buy it as two matching sticks so the memory runs in dual channel, and turn on XMP or EXPO in the BIOS. Speed and channels are a separate question, covered in our guide to ${guide("does-ram-speed-matter-for-gaming", "whether RAM speed matters for gaming")}.</p>`,
      },
      {
        id: "by-build", toc: "8 to 64 GB in four builds", h2: "8, 16, 32 and 64 GB in four builds",
        html: `
          <p>Average FPS / 1% lows in AAA games at High settings, with the bottleneck underneath. The first two builds are limited by the graphics card, the last two by the processor. Click a number to open that build with that much RAM in the calculator.</p>
          ${ramTable}
          <p>Three things stand out.</p>
          <ul>
            <li><strong>32 GB and 64 GB are identical.</strong> In every build, doubling from 32 to 64 GB changes nothing, because games at normal settings don't come close to filling 32 GB.</li>
            <li><strong>16 GB is close to free when the GPU is the limit.</strong> The ${build("ryzen-5-5600", "rtx-5060", "Ryzen 5 5600 + RTX 5060")} and the ${build("ryzen-5-7600", "rtx-5070", "Ryzen 5 7600 + RTX 5070")} lose ${l16[0]}% and ${l16[1]}% at 16 GB. The CPU-bound builds lose ${l16[2]}% and ${l16[3]}%, because anything that slows the processor shows up directly in the frame rate when the processor is the limit.</li>
            <li><strong>8 GB is a stutter problem first.</strong> The averages drop by ${Math.min(...a8)}–${Math.max(...a8)}%, but the 1% lows drop by ${lo8Min}–${lo8Max}%. On the ${name("rtx-5070")} build at 1440p, the average only falls from ${fmt(B[32].fps)} to ${fmt(B[8].fps)} FPS while the 1% lows fall from ${fmt(B[32].low1)} to ${fmt(B[8].low1)}. You notice that as hitches when you turn a corner or enter a new area. On the budget build, 8 GB also flips the limit from the graphics card to the processor, while 16 GB leaves it GPU-limited.</li>
          </ul>
          <p>If you're not sure whether your own PC is CPU- or GPU-bound, our guide on ${guide("cpu-vs-gpu-bottleneck", "CPU vs GPU bottlenecks")} explains the difference, and ${guide("how-to-check-for-bottleneck", "how to check for a bottleneck")} shows how to measure it.</p>`,
      },
      {
        id: "game-types", toc: "It depends on the game", h2: "It depends on what you play",
        html: `
          <p>The same ${build(W.c, W.g, "Ryzen 5 7600 + RTX 5070")} across four kinds of games. Average FPS / 1% lows:</p>
          ${typeTable}
          <p>Ray tracing leans so hard on the graphics card that 16 GB costs nothing. Simulators and strategy games are the opposite: the processor is the limit even at 1440p (${verdict(T.sim[32])}), so 16 GB costs ${sim16}% and 8 GB costs ${loss(T.sim[8].fps, T.sim[32].fps)}%. Competitive shooters at 1080p are also CPU-bound at these frame rates, so 16 GB costs them ${es16}% too, and 8 GB drags their 1% lows from ${fmt(T.es[32].low1)} down to ${fmt(T.es[8].low1)} FPS.</p>
          <p>The model gives you the average case. Real games vary more. Big open-world games, city builders and flight simulators can use well over 16 GB on their own, and a few of them are noticeably smoother with 32 GB. Small competitive games run happily in far less.</p>`,
      },
      {
        id: "background", toc: "Background apps", h2: "Background apps count too",
        html: `
          <p>Games don't run alone. Windows 11 itself keeps several gigabytes in use, and most gaming PCs also run some of these while you play:</p>
          <ul>
            <li>a web browser with a few tabs open, often the biggest consumer after the game,</li>
            <li>Discord, especially with screen sharing or video,</li>
            <li>game launchers (Steam, Epic, EA, Ubisoft, Battle.net), each with its own background process,</li>
            <li>OBS or another recorder if you stream or capture clips,</li>
            <li>RGB, motherboard and peripheral utilities.</li>
          </ul>
          <p>Each one is small, but together they're the reason 16 GB feels tighter than it looks on paper. When the total passes your installed memory, Windows moves the least-used data to the page file on your SSD, and the game hitches whenever it needs that data back. That's the 1% low drop in the tables above.</p>
          <p>Two ways to check where you stand: open Task Manager (Ctrl + Shift + Esc) while your heaviest game is running and look at Memory on the Performance tab. If "In use" is regularly within a gigabyte or two of your total, you're out of headroom and 32 GB will help. If you have several gigabytes spare, more memory won't change anything. Closing the browser before a long session is the free alternative.</p>`,
      },
      {
        id: "64gb", toc: "Who needs 64 GB?", h2: "Who actually needs 64 GB?",
        html: `
          <p>Not gamers, as a rule. In our model 64 GB gives exactly the same results as 32 GB in every build and game type. You'd buy 64 GB for what you do around the games:</p>
          <ul>
            <li><strong>Heavily modded games.</strong> Large mod lists for Skyrim, Fallout or Minecraft, and high-resolution texture packs, can push memory use far past what the base game needs.</li>
            <li><strong>Simulators with big add-on libraries.</strong> Flight simulators with detailed scenery and city builders with thousands of custom assets are the games most likely to need more than 32 GB.</li>
            <li><strong>Creators.</strong> 4K video editing, 3D rendering, large photo projects and music production with big sample libraries all scale with memory.</li>
            <li><strong>Streaming and recording while you edit</strong>, running virtual machines, or running AI models locally.</li>
          </ul>
          <p>If none of those apply, spend the difference on the graphics card or the CPU. If you think you might want 64 GB later, buy 2 × 32 GB rather than 4 × 16 GB, because four sticks are harder to run at full speed, especially on DDR5.</p>`,
      },
      {
        id: "buying", toc: "Buying tips and prices", h2: "Two sticks, kit sizes and prices",
        html: `
          <h3>Always two sticks</h3>
          <p>Desktop platforms have two memory channels, and one stick only uses one of them. A single 32 GB stick has the capacity but roughly half the bandwidth of 2 × 16 GB, which costs real performance in CPU-bound games. Buy a matched two-stick kit and put it in the slots your motherboard manual recommends, usually the second and fourth from the CPU. Mixing kits from different packs often means the board falls back to a slower speed.</p>
          <h3>Sensible kits in 2026</h3>
          <ul>
            <li><strong>2 × 8 GB (16 GB):</strong> budget builds only, and only if the price gap to 32 GB is large.</li>
            <li><strong>2 × 16 GB (32 GB):</strong> the default for gaming.</li>
            <li><strong>2 × 24 GB (48 GB):</strong> a DDR5 option between the two, useful for modders and creators.</li>
            <li><strong>2 × 32 GB (64 GB):</strong> for the workloads above.</li>
          </ul>
          <h3>Prices</h3>
          <p>Memory prices rose sharply from late 2025, so RAM is a bigger share of a build than it used to be, and the gap between 16 and 32 GB is wider than it was a year earlier. Check current prices before you decide. If 32 GB stretches your budget, a 16 GB dual-channel kit is a reasonable stopgap on a GPU-bound build, and you can add a matching kit later or replace it when prices settle. On a CPU-bound or high-refresh build, 32 GB is worth paying for.</p>
          <h3>Integrated graphics and APUs</h3>
          <p>Chips like the ${name("ryzen-7-8700g")} have no video memory of their own. They reserve a slice of system RAM for graphics, set in the BIOS, and Windows can lend the integrated GPU more when a game needs it. That memory comes out of what the game and Windows can use, so 16 GB on an APU system behaves like noticeably less. Our model treats integrated graphics as having no fixed VRAM budget, and since an ${calc("ryzen-7-8700g", "780m", { res: "1080p", quality: "low" }, "8700G with Radeon 780M")} is so heavily GPU-bound (about ${fmt(apu[1].fps)} FPS at 1080p Low in AAA games), capacity doesn't change its frame rate there. In practice, 32 GB in dual channel is the safe choice for an APU build, and fast memory matters more than usual.</p>`,
      },
      {
        id: "mac", toc: "Macs and unified memory", h2: "Macs and unified memory",
        html: `
          <p>On Apple Silicon the CPU and GPU share one pool of unified memory, so RAM is also your video memory. macOS lets the GPU use roughly two-thirds of it by default: in our ${link.mac("Mac gaming calculator")} a 16 GB Mac gets about ${Macs.vramFor(16)} GB for graphics, 24 GB about ${Macs.vramFor(24)} GB and 32 GB about ${Macs.vramFor(32)} GB.</p>
          <p>That makes capacity matter more on a Mac than on a PC with a graphics card. On a ${mac(M)}, 16 GB leaves it about ${fmt(macR[0].vramNeed - macR[0].vram)} GB short of graphics memory at 1440p Ultra, and 24 GB clears it (about ${fmt(macR[0].fps)} vs ${fmt(macR[1].fps)} FPS in native AAA games; the small GPU is the main limit either way). You can't upgrade a Mac's memory later, so if you plan to game on one, 24 GB is the safer configuration. Our guide to ${guide("mac-vs-gaming-pc", "Mac vs gaming PC")} covers the rest.</p>`,
      },
    ],
    faq: [
      ["Is 16 GB of RAM enough for gaming in 2026?", `Yes, as a minimum. On a PC limited by its graphics card, 16 GB costs about 1% or less compared with 32 GB in our model. On a CPU-bound build it costs ${range(l16[2], l16[3])}%, and it leaves little room for a browser and Discord in the background. For a new build, 32 GB is the better choice.`],
      ["Is 32 GB of RAM worth it for gaming?", "For a new gaming PC in 2026, yes. It's enough for every current game plus background apps, it avoids the stutter you get when memory runs out, and it helps most in simulators, strategy games and high-refresh gaming, where the processor is the limit."],
      ["Does 64 GB of RAM improve gaming performance?", "No. In our model 64 GB gives exactly the same FPS and 1% lows as 32 GB in every build and game type. Buy 64 GB for heavy modding, large simulator setups, video editing, 3D work or virtual machines."],
      ["Is 8 GB of RAM enough for gaming?", `Not for modern games. In our model, 8 GB cuts 1% lows by ${lo8Min}–${lo8Max}% compared with 32 GB, because Windows has to swap game data to the SSD, and it costs CPU-bound builds ${Math.min(a8[2], a8[3])}% or more of their average frame rate. Upgrade to 16 GB at the very least.`],
      ["Is one 32 GB stick better than two 16 GB sticks?", "No. Two 16 GB sticks run in dual channel and give roughly twice the memory bandwidth of a single stick, which matters in CPU-bound games. Always buy a matched two-stick kit."],
      ["How much RAM does a Mac need for gaming?", `Apple Silicon Macs share memory between the CPU and GPU, and the GPU gets roughly two-thirds of it. A 16 GB Mac has about ${Macs.vramFor(16)} GB for graphics and a 24 GB Mac about ${Macs.vramFor(24)} GB. Since Mac memory can't be upgraded, 24 GB is the safer choice for gaming.`],
    ],
    related: ["does-ram-speed-matter-for-gaming", "is-8gb-vram-enough", "how-to-fix-cpu-bottleneck"],
  };
};
