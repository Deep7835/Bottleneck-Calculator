/*
 * Per-game profiles for the FPS calculator.
 *
 * Each game is one of the workload types in engine.js ("base") with multipliers
 * on top: "cpu" and "gpu" scale that type's CPU and GPU frame-rate factors,
 * "vram" adds GB to its video-memory need. Calibrated against averaged results
 * for an RTX 4060 at 1080p High (GPU side) and a Ryzen 7 9800X3D at 1080p Low
 * (CPU side). "cap" is a frame-rate limit built into the game.
 *
 * Format: [id, name, base, cpu, gpu, vram, cap, note]
 */
(function () {
  const G = [
    ["cs2", "Counter-Strike 2", "esports", 1.15, 1.0, 0, 0,
      "Source 2 is heavier on the GPU than CS:GO was. Competitive players use Low or Medium for the highest frame rates."],
    ["valorant", "Valorant", "esports", 1.6, 1.7, 0, 0,
      "Very light on the GPU. Above about 400 FPS the CPU and RAM speed decide your frame rate."],
    ["fortnite", "Fortnite", "general", 1.2, 1.55, 0, 0,
      "DirectX 12, High preset without Lumen or Nanite. Performance mode runs much faster on any GPU."],
    ["cyberpunk", "Cyberpunk 2077", "general", 0.95, 1.0, 0.5, 0,
      "Raster only. Ray tracing cuts these numbers roughly in half; pick the Ray tracing game type for RT Overdrive."],
    ["elden-ring", "Elden Ring", "general", 0.9, 1.15, 0, 60,
      "Locked to 60 FPS by the game. A higher figure here only means more headroom for stable frame times."],
    ["gta-5", "GTA V", "general", 1.1, 1.8, -1.5, 0,
      "GTA V Enhanced without ray tracing. Busy city areas and long draw distance load the CPU most."],
    ["warzone", "Call of Duty: Warzone", "general", 0.95, 1.25, 1.5, 0,
      "Uses a lot of VRAM. 8 GB cards need lower texture settings to avoid stutter."],
    ["apex", "Apex Legends", "esports", 0.65, 0.7, 0, 300,
      "Capped at 300 FPS by the engine. Big fights with many effects are the most demanding moments."],
    ["marvel-rivals", "Marvel Rivals", "general", 1.0, 1.0, 1, 0,
      "Unreal Engine 5 with Lumen lighting. Low settings or upscaling help a lot on mid-range cards."],
    ["bg3", "Baldur's Gate 3", "cpuheavy", 1.3, 1.0, 0, 0,
      "Act 3 (the city of Baldur's Gate) runs about 25% slower than these averages and is CPU-limited on most PCs."],
    ["msfs-2024", "Microsoft Flight Simulator 2024", "cpuheavy", 0.95, 0.55, 2, 0,
      "Dense airports and photogrammetry cities load the CPU and VRAM most. Frame generation helps a lot here."],
    ["minecraft", "Minecraft (Java)", "esports", 0.8, 2.6, 0, 0,
      "Vanilla Java at 12 chunks. Sodium can roughly double these numbers; shader packs make it GPU-heavy."],
  ];

  const list = G.map(([id, name, base, cpu, gpu, vram, cap, note]) => ({ id, name, base, cpu, gpu, vram, cap, note }));
  const byId = Object.fromEntries(list.map((g) => [g.id, g]));

  // gameId is a game from the table above or a plain workload type ("general", "esports", ...).
  function evaluate(cpu, gpu, gameId, o) {
    const g = byId[gameId];
    const r = window.Engine.evaluate(cpu, gpu, g ? { ...o, workload: g.base, game: g } : { ...o, workload: gameId });
    r.uncapped = r.fps;
    r.capped = !!(g && g.cap && r.fps > g.cap);
    if (r.capped) {
      r.fps = g.cap;
      r.low1 = Math.min(r.low1, g.cap * 0.95);
    }
    return r;
  }

  // Game types read as "≈120 FPS in AAA games".
  const TYPE_NAMES = { general: "AAA games", esports: "esports games", cpuheavy: "CPU-heavy games", raytracing: "ray-traced games" };
  const name = (id) => byId[id] ? byId[id].name : TYPE_NAMES[id] || window.Engine.WORKLOAD[id].label;
  const valid = (id) => !!(byId[id] || window.Engine.WORKLOAD[id]);

  window.Games = { list, byId, evaluate, name, valid };
})();
