/*
 * Apple Silicon Macs for the Mac gaming calculator.
 *
 * Chips use the same scales as hardware.js: CPU "cpu" vs Ryzen 7 9800X3D = 100
 * (CPU-limited gaming), GPU "gpu" per GPU-core configuration vs RTX 4090 = 100
 * (raster). Values are estimates from published Mac game benchmarks and
 * Apple's GPU core counts and clocks; Mac ports add their own overhead, applied
 * in evaluate() by how the game runs. "rt" = hardware ray tracing (M3 and later).
 *
 * Unified memory: macOS lets the GPU use roughly 65% of RAM (75% on 48 GB and
 * up), so that share acts as the VRAM budget.
 */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;

  // [id, name, cpu index, {gpuCores: gpu index}, rt, year, cpu label]
  const CHIPS = [
    ["m1", "M1", 45, { 7: 8, 8: 9 }, 0, 2020, "8-core CPU (4P + 4E)"],
    ["m1-pro", "M1 Pro", 48, { 14: 15, 16: 17 }, 0, 2021, "8–10-core CPU"],
    ["m1-max", "M1 Max", 48, { 24: 23, 32: 28 }, 0, 2021, "10-core CPU (8P + 2E)"],
    ["m1-ultra", "M1 Ultra", 49, { 48: 36, 64: 44 }, 0, 2022, "20-core CPU (16P + 4E)"],
    ["m2", "M2", 50, { 8: 10, 10: 12 }, 0, 2022, "8-core CPU (4P + 4E)"],
    ["m2-pro", "M2 Pro", 53, { 16: 19, 19: 22 }, 0, 2023, "10–12-core CPU"],
    ["m2-max", "M2 Max", 53, { 30: 30, 38: 36 }, 0, 2023, "12-core CPU (8P + 4E)"],
    ["m2-ultra", "M2 Ultra", 54, { 60: 47, 76: 57 }, 0, 2023, "24-core CPU (16P + 8E)"],
    ["m3", "M3", 56, { 8: 12, 10: 14 }, 0.6, 2023, "8-core CPU (4P + 4E)"],
    ["m3-pro", "M3 Pro", 57, { 14: 19, 18: 23 }, 0.6, 2023, "11–12-core CPU"],
    ["m3-max", "M3 Max", 59, { 30: 35, 40: 44 }, 0.6, 2023, "14–16-core CPU"],
    ["m3-ultra", "M3 Ultra", 60, { 60: 60, 80: 74 }, 0.6, 2025, "28–32-core CPU"],
    ["m4", "M4", 64, { 8: 13, 10: 15 }, 0.65, 2024, "10-core CPU (4P + 6E)"],
    ["m4-pro", "M4 Pro", 66, { 16: 24, 20: 28 }, 0.65, 2024, "12–14-core CPU"],
    ["m4-max", "M4 Max", 67, { 32: 43, 40: 52 }, 0.65, 2024, "14–16-core CPU"],
    ["m5", "M5", 70, { 10: 21 }, 0.75, 2025, "10-core CPU (4P + 6E)"],
  ];
  const chips = Object.fromEntries(CHIPS.map(([id, name, cpu, gpus, rt, year, cpuLabel]) => [id, { id, name, cpu, gpus, rt, year, cpuLabel }]));

  // Displays (native pixels) for models with a built-in screen.
  const D = { air13: [2560, 1600], air13n: [2560, 1664], air15: [2880, 1864], mbp13: [2560, 1600], mbp14: [3024, 1964], mbp16: [3456, 2234], imac: [4480, 2520] };

  // [product, family, display, fanless, year, chip, [gpu cores...], [RAM options GB]]
  const LINEUP = [
    ["MacBook Air 13″", "MacBook Air", "air13", true, 2020, "m1", [7, 8], [8, 16]],
    ["MacBook Air 13″", "MacBook Air", "air13n", true, 2022, "m2", [8, 10], [8, 16, 24]],
    ["MacBook Air 15″", "MacBook Air", "air15", true, 2023, "m2", [10], [8, 16, 24]],
    ["MacBook Air 13″", "MacBook Air", "air13n", true, 2024, "m3", [8, 10], [8, 16, 24]],
    ["MacBook Air 15″", "MacBook Air", "air15", true, 2024, "m3", [10], [8, 16, 24]],
    ["MacBook Air 13″", "MacBook Air", "air13n", true, 2025, "m4", [8, 10], [16, 24, 32]],
    ["MacBook Air 15″", "MacBook Air", "air15", true, 2025, "m4", [10], [16, 24, 32]],
    ["MacBook Pro 13″", "MacBook Pro", "mbp13", false, 2020, "m1", [8], [8, 16]],
    ["MacBook Pro 13″", "MacBook Pro", "mbp13", false, 2022, "m2", [10], [8, 16, 24]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2021, "m1-pro", [14, 16], [16, 32]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2021, "m1-max", [24, 32], [32, 64]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2023, "m2-pro", [16, 19], [16, 32]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2023, "m2-max", [30, 38], [32, 64, 96]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2023, "m3", [10], [8, 16, 24]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2023, "m3-pro", [14, 18], [18, 36]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2023, "m3-max", [30, 40], [36, 48, 64, 96, 128]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2024, "m4", [10], [16, 24, 32]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2024, "m4-pro", [16, 20], [24, 48]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2024, "m4-max", [32, 40], [36, 48, 64, 128]],
    ["MacBook Pro 14″", "MacBook Pro", "mbp14", false, 2025, "m5", [10], [16, 24, 32]],
    ["MacBook Pro 16″", "MacBook Pro", "mbp16", false, 2021, "m1-pro", [16], [16, 32]],
    ["MacBook Pro 16″", "MacBook Pro", "mbp16", false, 2021, "m1-max", [24, 32], [32, 64]],
    ["MacBook Pro 16″", "MacBook Pro", "mbp16", false, 2023, "m2-pro", [19], [16, 32]],
    ["MacBook Pro 16″", "MacBook Pro", "mbp16", false, 2023, "m2-max", [30, 38], [32, 64, 96]],
    ["MacBook Pro 16″", "MacBook Pro", "mbp16", false, 2023, "m3-pro", [18], [18, 36]],
    ["MacBook Pro 16″", "MacBook Pro", "mbp16", false, 2023, "m3-max", [30, 40], [36, 48, 64, 96, 128]],
    ["MacBook Pro 16″", "MacBook Pro", "mbp16", false, 2024, "m4-pro", [20], [24, 48]],
    ["MacBook Pro 16″", "MacBook Pro", "mbp16", false, 2024, "m4-max", [32, 40], [36, 48, 64, 128]],
    ["Mac mini", "Mac mini", null, false, 2020, "m1", [8], [8, 16]],
    ["Mac mini", "Mac mini", null, false, 2023, "m2", [10], [8, 16, 24]],
    ["Mac mini", "Mac mini", null, false, 2023, "m2-pro", [16, 19], [16, 32]],
    ["Mac mini", "Mac mini", null, false, 2024, "m4", [10], [16, 24, 32]],
    ["Mac mini", "Mac mini", null, false, 2024, "m4-pro", [16, 20], [24, 48, 64]],
    ["iMac 24″", "iMac", "imac", false, 2021, "m1", [7, 8], [8, 16]],
    ["iMac 24″", "iMac", "imac", false, 2023, "m3", [8, 10], [8, 16, 24]],
    ["iMac 24″", "iMac", "imac", false, 2024, "m4", [8, 10], [16, 24, 32]],
    ["Mac Studio", "Mac Studio", null, false, 2022, "m1-max", [24, 32], [32, 64]],
    ["Mac Studio", "Mac Studio", null, false, 2022, "m1-ultra", [48, 64], [64, 128]],
    ["Mac Studio", "Mac Studio", null, false, 2023, "m2-max", [30, 38], [32, 64, 96]],
    ["Mac Studio", "Mac Studio", null, false, 2023, "m2-ultra", [60, 76], [64, 128, 192]],
    ["Mac Studio", "Mac Studio", null, false, 2025, "m4-max", [32, 40], [36, 48, 64, 128]],
    ["Mac Studio", "Mac Studio", null, false, 2025, "m3-ultra", [60, 80], [96, 256, 512]],
    ["Mac Pro", "Mac Pro", null, false, 2023, "m2-ultra", [60, 76], [64, 128, 192]],
  ];

  const slug = (s) => s.toLowerCase().replace(/″/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const models = [];
  for (const [product, family, disp, fanless, year, chipId, cores, ram] of LINEUP) {
    const chip = chips[chipId];
    for (const gpuCores of cores) {
      const multi = cores.length > 1;
      const name = `${product} ${chip.name}${multi ? ` (${gpuCores}-core GPU)` : ""}`;
      models.push({
        id: slug(`${product} ${chip.name} ${multi ? `${gpuCores} core gpu` : ""}`),
        name, product, family, chip, gpuCores, year, fanless, ram,
        defaultRam: ram.includes(16) ? 16 : ram[0],
        display: disp ? { w: D[disp][0], h: D[disp][1], mp: (D[disp][0] * D[disp][1]) / 1e6 } : null,
        gpu: chip.gpus[gpuCores],
      });
    }
  }
  const byId = Object.fromEntries(models.map((m) => [m.id, m]));

  // How a game runs on macOS, and what that costs (CPU-side and GPU-side efficiency).
  const RUN = {
    native: { cpu: 0.9, gpu: 0.9, label: "Native Mac version" },
    translated: { cpu: 0.62, gpu: 0.66, label: "Windows version via CrossOver / Game Porting Toolkit" },
  };

  // [id, name, how it runs, base workload, cpu, gpu, vram, cap, note]
  // "blocked" = kernel anti-cheat or no Mac route; "cloud" = only via cloud gaming.
  const GAMES = [
    ["cyberpunk", "Cyberpunk 2077", "native", "general", 0.95, 1.0, 0.5, 0, "Native Mac version (2025) with MetalFX. Ray tracing needs an M3 or newer."],
    ["bg3", "Baldur's Gate 3", "native", "cpuheavy", 1.3, 1.0, 0, 0, "Native Apple Silicon port. Act 3 is CPU-heavy on every Mac."],
    ["re4", "Resident Evil 4", "native", "general", 1.0, 1.1, 1, 0, "Native Mac port with MetalFX upscaling."],
    ["ac-shadows", "Assassin's Creed Shadows", "native", "general", 0.8, 0.8, 1.5, 0, "Native Mac version. One of the most demanding Mac games."],
    ["death-stranding", "Death Stranding Director's Cut", "native", "general", 1.1, 1.2, 0, 0, "Native Apple Silicon port with MetalFX."],
    ["nms", "No Man's Sky", "native", "general", 1.0, 1.15, 0, 0, "Native Mac version with MetalFX."],
    ["lies-of-p", "Lies of P", "native", "general", 1.2, 1.3, 0, 0, "Native Mac version."],
    ["wow", "World of Warcraft", "native", "cpuheavy", 1.2, 1.6, 0, 0, "Native Apple Silicon client. Raids and cities load the CPU most."],
    ["lol", "League of Legends", "native", "esports", 1.4, 2.0, -2, 0, "Native Apple Silicon client."],
    ["minecraft", "Minecraft (Java)", "native", "esports", 0.8, 2.6, 0, 0, "Native Java on Apple Silicon. Sodium boosts it a lot."],
    ["cs2", "Counter-Strike 2", "translated", "esports", 1.15, 1.0, 0, 0, "No Mac version. Runs through CrossOver; official matchmaking works, but expect lower FPS than on a PC."],
    ["elden-ring", "Elden Ring", "translated", "general", 0.9, 1.15, 0, 60, "No Mac version. Runs through CrossOver offline; capped at 60 FPS by the game."],
    ["gta-5", "GTA V (story mode)", "translated", "general", 1.1, 1.8, -1.5, 0, "No Mac version. Story mode runs through CrossOver; GTA Online's anti-cheat blocks it."],
    ["valorant", "Valorant", "blocked", "esports", 1, 1, 0, 0, "Riot Vanguard anti-cheat doesn't run on macOS. Use a PC or cloud gaming."],
    ["fortnite", "Fortnite", "cloud", "general", 1, 1, 0, 0, "Not available on Mac. Play it free through GeForce NOW or Xbox Cloud Gaming in a browser."],
    ["warzone", "Call of Duty: Warzone", "blocked", "general", 1, 1, 0, 0, "Ricochet anti-cheat doesn't run on macOS. Cloud gaming is the option."],
  ];
  const games = GAMES.map(([id, name, run, base, cpu, gpu, vram, cap, note]) => ({ id, name, run, base, cpu, gpu, vram, cap, note }));
  const gameById = Object.fromEntries(games.map((g) => [g.id, g]));
  // Generic choices for anything not in the list.
  const GENERIC = {
    "native-aaa": { id: "native-aaa", name: "Any native Mac AAA game", run: "native", base: "general" },
    "native-esports": { id: "native-esports", name: "Native esports / light games", run: "native", base: "esports" },
    "translated-aaa": { id: "translated-aaa", name: "Windows AAA game via CrossOver", run: "translated", base: "general" },
  };
  const game = (id) => gameById[id] || GENERIC[id] || GENERIC["native-aaa"];

  // macOS gives the GPU about 65% of unified memory (75% from 48 GB up).
  const vramFor = (ram) => +(ram * (ram >= 48 ? 0.75 : 0.65)).toFixed(1);
  // The engine's RAM table has 8/16/32/64 GB steps.
  const ramStep = (ram) => (ram >= 64 ? 64 : ram >= 32 ? 32 : ram >= 16 ? 16 : 8);

  /*
   * o = { res: "1080p" | "1440p" | "4k" | "native", quality, upscale, ram, game }
   * Returns the engine result plus { playable, run, game, vram, pc } for the UI.
   */
  function evaluate(mac, o) {
    const E = root.Engine;
    const g = game(o.game);
    const out = { game: g, run: g.run, vram: vramFor(o.ram) };
    if (g.run === "blocked" || g.run === "cloud") return { ...out, playable: false };
    const run = RUN[g.run];
    const heat = mac.fanless ? { cpu: 0.95, gpu: 0.85 } : { cpu: 1, gpu: 1 };
    const cpu = { name: `Apple ${mac.chip.name}`, g: mac.chip.cpu * run.cpu * heat.cpu, threads: 12, type: "d" };
    const gpu = { name: `${mac.chip.name} ${mac.gpuCores}-core GPU`, g: mac.gpu * run.gpu * heat.gpu, vram: out.vram, rt: mac.chip.rt, type: "d" };
    const opts = {
      res: o.res === "native" ? "1440p" : o.res,
      mp: o.res === "native" && mac.display ? mac.display.mp : undefined,
      quality: o.quality, upscale: o.upscale, ram: ramStep(o.ram), hz: 120, streaming: false, storage: "nvme",
      workload: g.base, game: gameById[g.id] ? { cpu: g.cpu, gpu: g.gpu, vram: g.vram } : undefined,
    };
    const r = E.evaluate(cpu, gpu, opts);
    if (g.cap && r.fps > g.cap) { r.fps = g.cap; r.low1 = Math.min(r.low1, g.cap * 0.95); r.capped = true; }
    // 8 GB Macs swap to disk in modern games: stutter even when the average looks fine.
    if (o.ram <= 8 && g.base !== "esports") r.low1 *= 0.8;
    return { ...r, ...out, playable: true };
  }

  // Closest desktop PC parts to this Mac running native games (for "PC equivalent").
  function pcEquivalent(mac) {
    const HW = root.HW;
    if (!HW) return null;
    const gpuG = mac.gpu * RUN.native.gpu * (mac.fanless ? 0.85 : 1);
    const cpuG = mac.chip.cpu * RUN.native.cpu;
    const near = (list, v) => list.reduce((a, b) => (Math.abs(b.g - v) < Math.abs(a.g - v) ? b : a));
    const gpus = HW.gpus.filter((x) => x.type === "d" && x.year >= 2019);
    const cpus = HW.cpus.filter((x) => x.type === "d" && x.year >= 2017 && x.threads >= 12);
    return { gpu: near(gpus, gpuG), cpu: near(cpus, cpuG) };
  }


  // ---------- Copy shared by the generated pages and the live calculator ----------
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const ram16 = (m) => (m.ram.includes(16) ? 16 : m.ram.find((r) => r >= 16) || m.ram[m.ram.length - 1]);
  const current = models.filter((m) => m.year >= 2024);
  const label = (r) => (!r.playable ? "Not playable" : r.fps >= 60 ? "Smooth" : r.fps >= 40 ? "Playable" : r.fps >= 28 ? "Just playable" : "Too slow");
  const tone = (r) => (!r.playable ? "severe" : r.fps >= 60 ? "excellent" : r.fps >= 40 ? "good" : r.fps >= 28 ? "moderate" : "severe");

  function verdictLine(m, g, r, resLabel) {
    if (!r.playable) return g.note;
    const where = `${g.name}${g.run === "translated" ? " (through CrossOver)" : ""}`;
    const lim = r.limiter === "gpu"
      ? `The ${m.chip.name}'s ${m.gpuCores}-core GPU is the limit, so lower settings or MetalFX raise FPS directly.`
      : `The CPU side of the ${m.chip.name} is the limit here, so lowering graphics settings won't add much.`;
    return `${where} runs at about ${fmt(r.fps)} FPS on the ${m.name} at ${resLabel}, which is ${label(r).toLowerCase()}. ${lim}`;
  }

  function tips(m, g, r, o) {
    const t = [];
    if (!r.playable) {
      t.push(["warn", g.note]);
      t.push(["info", "Cloud gaming (GeForce NOW, Xbox Cloud Gaming) streams the game from a PC, so it runs on any Mac with a good connection."]);
      return t;
    }
    if (g.run === "translated") t.push(["warn", "This is a Windows game running through CrossOver or Apple's Game Porting Toolkit. Expect roughly 30–40% lower FPS than a native port would get, and check that the game's anti-cheat allows it."]);
    if (m.fanless) t.push(["info", "The MacBook Air has no fan. After 10–15 minutes of gaming it slows down to stay cool; these numbers already include that drop."]);
    if (o.ram <= 8) t.push(["warn", "8 GB of unified memory is shared by macOS, apps and graphics. Modern games swap to the SSD and stutter. 16 GB is the realistic minimum for gaming."]);
    if (o.res === "native" && m.display) t.push(["info", `The built-in display is ${m.display.w}×${m.display.h} (${m.display.mp.toFixed(1)} MP), more pixels than 1440p. For gaming, pick a scaled resolution or turn on MetalFX.`]);
    if (r.fps < 30) t.push(["warn", "Under 30 FPS: drop to Medium or Low, play at 1080p, and turn on MetalFX Performance if the game offers it."]);
    else if (r.fps < 60 && r.limiter === "gpu" && o.upscale === "off") t.push(["good", "Turn on MetalFX upscaling (Quality mode) for roughly 40% more FPS with little visible loss."]);
    if (r.limiter === "cpu" && r.pct >= 20) t.push(["info", "CPU-limited: this game leans on the processor (busy cities, big battles), so lower graphics settings barely help. That's typical for Baldur's Gate 3 and World of Warcraft on Mac."]);
    if (!m.display) t.push(["info", `The ${m.product} has no screen. Results assume an external monitor at the resolution you pick; a 120–144 Hz display makes higher frame rates visible.`]);
    t.push(["good", "Play in full screen so macOS Game Mode switches on: it gives the game top CPU and GPU priority and halves Bluetooth latency for controllers and AirPods."]);
    return t;
  }

  // Current Macs (2024+) reaching 60 FPS with these settings, slowest first, one per chip config.
  function sixtyList(gameId, res, quality = "high", upscale = "off") {
    const rows = current.map((m) => ({ m, r: evaluate(m, { res, quality, upscale, ram: ram16(m), game: gameId }) }))
      .filter((x) => x.r.playable && x.r.fps >= 60)
      .sort((a, b) => a.m.gpu - b.m.gpu);
    const seen = new Set();
    return rows.filter((x) => { const k = `${x.m.chip.id}-${x.m.gpuCores}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 4);
  }

  root.Macs = { tone, label, verdictLine, tips, sixtyList, ram16, chips, models, byId, games, gameById, GENERIC, game, RUN, vramFor, evaluate, pcEquivalent };
})();
