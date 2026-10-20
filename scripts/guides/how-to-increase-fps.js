// Guide: How to increase FPS (settings and fixes that actually work)
module.exports = function (h) {
  const { Games, BASE, ev, cpu, gpu, res, pct, gain, fmt, name, expect, calc, guide, link, table, td, limitTag } = h;

  const gm = (c, g, game, o = {}) => Games.evaluate(cpu(c), gpu(g), game, { ...BASE, ...o });
  const delta = (to, from) => { const d = gain(to.fps, from.fps); return d === 0 ? "±0%" : d > 0 ? `+${d}%` : `−${-d}%`; };
  const gname = (id) => Games.byId[id].name;

  // Two builds at 1440p High: one limited by its graphics card, one by its processor.
  const R = "1440p";
  const GB = ["ryzen-5-7600", "rtx-5060"];
  const CB = ["i5-10400f", "rtx-5070-ti"];
  const gb = ev(...GB, { res: R });
  const cb = ev(...CB, { res: R });
  expect(gb.limiter === "gpu" && gb.pct >= 40 && gb.fps < 60, "7600 + 5060 is clearly GPU-bound and under 60 at 1440p High");
  expect(cb.limiter === "cpu" && cb.pct >= 20, "10400F + 5070 Ti is CPU-bound at 1440p High");

  const CHANGES = [
    ["Starting point: 1440p, High preset", {}],
    ["High → Medium preset", { quality: "medium" }],
    ["High → Low preset", { quality: "low" }],
    ["Drop to 1080p", { res: "1080p" }],
    ["Upscaling: Quality", { upscale: "quality" }],
    ["Upscaling: Balanced", { upscale: "balanced" }],
    ["Upscaling: Performance", { upscale: "performance" }],
    ["Low preset + Performance upscaling", { quality: "low", upscale: "performance" }],
  ];
  const rows = CHANGES.map(([label, o]) => {
    const oo = { res: R, ...o };
    return { label, oo, g: ev(...GB, oo), c: ev(...CB, oo) };
  });
  const k = Object.fromEntries(["base", "med", "low", "r1080", "upQ", "upB", "upP", "stack"].map((key, i) => [key, rows[i]]));
  expect(gain(k.low.g.fps, gb.fps) >= 75 && gain(k.upP.g.fps, gb.fps) >= 75, "Low preset or Performance upscaling nearly doubles the GPU-bound build");
  expect(gain(k.upQ.g.fps, gb.fps) >= 35 && gain(k.med.g.fps, gb.fps) >= 35, "Medium or Quality upscaling is worth 35%+ when GPU-bound");
  expect(k.med.g.fps >= 60 && k.upQ.g.fps >= 60, "one step gets the GPU-bound build over 60");
  expect(rows.slice(1).every((r) => Math.abs(gain(r.c.fps, cb.fps)) <= 8), "no setting moves the CPU-bound build more than 8%");
  expect([k.upQ, k.upB, k.upP].every((r) => Math.abs(gain(r.c.fps, cb.fps)) <= 2), "upscaling adds nothing when CPU-bound");
  expect(k.stack.g.limiter === "cpu", "stacking Low + Performance turns the GPU-bound build CPU-bound");
  const maxCpuGain = Math.max(...rows.slice(1).map((r) => gain(r.c.fps, cb.fps)));
  const fixTable = table(
    ["Change", [`${name(GB[1])} build`, true], [`${name(CB[1])} build`, true]],
    rows.map((r, i) => [
      td(r.label),
      `<td class="r">${calc(...GB, r.oo, fmt(r.g.fps))}${i ? ` <small>${delta(r.g, gb)}</small>` : ""}<br>${limitTag(r.g)}</td>`,
      `<td class="r">${calc(...CB, r.oo, fmt(r.c.fps))}${i ? ` <small>${delta(r.c, cb)}</small>` : ""}<br>${limitTag(r.c)}</td>`,
    ]),
  );

  // The same two levers, game by game.
  const GAMES = ["cs2", "fortnite", "cyberpunk", "warzone", "marvel-rivals", "bg3"];
  const per = GAMES.map((id) => {
    const o = { res: R };
    const x = {
      g: gm(...GB, id, o), gLow: gm(...GB, id, { ...o, quality: "low" }), gUp: gm(...GB, id, { ...o, upscale: "quality" }),
      c: gm(...CB, id, o), cLow: gm(...CB, id, { ...o, quality: "low" }), cUp: gm(...CB, id, { ...o, upscale: "quality" }),
    };
    return { id, ...x };
  });
  expect(per.every((p) => gain(p.gLow.fps, p.g.fps) >= 35), "Low preset is worth 35%+ in every game on the GPU-bound build");
  expect(per.every((p) => gain(p.cLow.fps, p.c.fps) <= 8 && Math.abs(gain(p.cUp.fps, p.c.fps)) <= 2), "settings barely help the CPU-bound build in any game");
  const upGains = per.map((p) => gain(p.gUp.fps, p.g.fps));
  const bg3 = per.find((p) => p.id === "bg3");
  expect(gain(bg3.gUp.fps, bg3.g.fps) === Math.min(...upGains) && bg3.gUp.limiter === "cpu", "BG3 gains least from upscaling because it hits the CPU limit");
  const gameTable = table(
    ["Game", [`${name(GB[1])}: Low`, true], [`${name(GB[1])}: upscaling`, true], [`${name(CB[1])}: Low`, true], [`${name(CB[1])}: upscaling`, true]],
    per.map((p) => [
      td(`<strong>${gname(p.id)}</strong><br><small>${fmt(p.g.fps)} and ${fmt(p.c.fps)} FPS at High</small>`),
      td(delta(p.gLow, p.g), true), td(delta(p.gUp, p.g), true), td(delta(p.cLow, p.c), true), td(delta(p.cUp, p.c), true),
    ]),
  );

  // RAM: single most common free fix on prebuilts, shown on the CPU-bound build.
  const c8 = ev(...CB, { res: R, ram: 8 });
  expect(c8.fps < cb.fps * 0.85, "8 GB costs the CPU-bound build 15%+");

  return {
    slug: "how-to-increase-fps",
    title: "How to Increase FPS: Settings and Fixes That Actually Work (2026)",
    description: "Raise your FPS in the right order: quick Windows and driver checks, the settings worth changing, upscaling, and why the same fix helps one PC and does nothing for another.",
    h1: "How to increase FPS: the settings and fixes that actually work",
    crumb: "Increase FPS",
    card: "Which settings raise FPS and by how much, why they help GPU-bound PCs but not CPU-bound ones, the Windows basics that matter and the tweaks that don't.",
    lead: "Most “boost your FPS” advice treats every PC the same. It isn't. A fix that doubles the frame rate on one machine does nothing on another, depending on which part is the limit. This guide shows how much each setting is worth on both kinds of PC, the setup mistakes worth checking first, and the tweaks you can skip.",
    sections: [
      {
        id: "short-answer", toc: "The short answer", h2: "The short answer",
        html: `
          <p>First rule out setup problems: the monitor plugged into the graphics card, the right refresh rate selected in Windows, memory running at its rated speed, current drivers and, on a laptop, the charger connected. Then find out what limits your frame rate. If it's the <strong>graphics card</strong>, lower the quality preset one step or turn on upscaling, and you can expect a large gain. If it's the <strong>processor</strong>, graphics settings barely help, and you need the CPU-side fixes instead.</p>
          <p>Skip registry hacks, “FPS booster” apps and Windows debloat scripts. On a healthy PC they do little or nothing, and some cause problems.</p>`,
      },
      {
        id: "limiter", toc: "Find your limit first", h2: "Find out what limits your FPS first",
        html: `
          <p>Every frame needs work from both the processor and the graphics card, and your frame rate is set by whichever is slower. Turn on an overlay with GPU usage (the NVIDIA App with Alt+R, AMD Adrenalin with Ctrl+Shift+O, or MSI Afterburner) and play a busy scene with any frame cap turned off.</p>
          <ul>
            <li><strong>GPU usage at 95–99%:</strong> you're GPU-bound. Graphics settings and upscaling will raise FPS.</li>
            <li><strong>GPU usage well under 90%</strong> while FPS is below your target: you're probably CPU-bound. Settings won't do much; see our guide on ${guide("how-to-fix-cpu-bottleneck", "fixing a CPU bottleneck")}.</li>
          </ul>
          <p>Our ${guide("how-to-check-for-bottleneck", "bottleneck check walkthrough")} covers the overlay setup and the false alarms. To keep this guide concrete, it uses two example PCs at ${res(R)} High. The ${calc(...GB, { res: R }, `${name(GB[0])} with an ${name(GB[1])}`)} is ${pct(gb)}% GPU-limited at about ${fmt(gb.fps)} FPS. The ${calc(...CB, { res: R }, `${name(CB[0])} with an ${name(CB[1])}`)} is ${pct(cb)}% CPU-limited at about ${fmt(cb.fps)} FPS.</p>`,
      },
      {
        id: "settings", toc: "Settings that work", h2: "Graphics settings: what each one is worth",
        html: `
          <p>Here's what the main levers do to both example PCs in AAA games, as estimated by the same model as our ${link.calculator("bottleneck calculator")}. Upscaling means DLSS, FSR or XeSS Super Resolution at the named preset.</p>
          ${fixTable}
          <p>On the GPU-bound ${name(GB[1])} build, one step does a lot: Medium or Quality upscaling takes it from ${fmt(gb.fps)} FPS to ${fmt(k.med.g.fps)} or ${fmt(k.upQ.g.fps)}, past 60. The Low preset (${delta(k.low.g, gb)}) and Performance upscaling (${delta(k.upP.g, gb)}) nearly double it. Stack both and it reaches ${fmt(k.stack.g.fps)} FPS, at which point the ${name(GB[0])} becomes the limit, so further cuts would stop paying off.</p>
          <p>On the CPU-bound ${name(CB[1])} build, nothing in the table moves the frame rate by more than ${maxCpuGain}%, and upscaling adds nothing at all. The processor is already preparing frames as fast as it can, and lighter graphics only give an idle graphics card more idle time. For this kind of PC, keep the settings high and look at the CPU fixes instead.</p>
          <h3>Which individual settings to lower first</h3>
          <p>If you'd rather not drop the whole preset, these settings cost the most GPU time in most modern games:</p>
          <ul>
            <li><strong>Ray tracing</strong> (reflections, shadows, global illumination, path tracing). Often the single biggest cost, and it loads the CPU too.</li>
            <li><strong>Volumetric fog, clouds and lighting</strong>, which are expensive and often hard to tell apart at Medium.</li>
            <li><strong>Shadow quality</strong> and <strong>screen-space reflections</strong>.</li>
            <li><strong>Ambient occlusion</strong> modes above the basic one.</li>
            <li><strong>Render resolution or resolution scale</strong>. Upscaling is usually a better way to do this than lowering the monitor's resolution, which blurs the whole image.</li>
          </ul>
          <p><strong>Texture quality</strong> is the exception. It costs almost no GPU time but uses video memory. Keep it high unless the card runs out of VRAM, which shows up as heavy stutter. Our guide on whether ${guide("is-8gb-vram-enough", "8 GB of VRAM is enough")} covers that case.</p>`,
      },
      {
        id: "per-game", toc: "Game by game", h2: "The same fixes, game by game",
        html: `
          <p>The pattern holds across individual games, though the size of the gain varies with how each engine loads the processor and graphics card. This table shows the gain from switching from High to Low, or from turning on Quality upscaling, for both example PCs at ${res(R)}. The small figures are each build's average at High, ${name(GB[1])} build first. The ${link.fps("FPS calculator")} has the full numbers for each title.</p>
          ${gameTable}
          <p>On the ${name(GB[1])} build the Low preset is worth at least ${Math.min(...per.map((p) => gain(p.gLow.fps, p.g.fps)))}% in every game listed. ${gname("bg3")} gains the least from upscaling (${delta(bg3.gUp, bg3.g)}) because it's a CPU-heavy game, so the ${name(GB[0])} becomes the limit soon after the graphics load drops. On the ${name(CB[1])} build, no game gains more than ${Math.max(...per.map((p) => gain(p.cLow.fps, p.c.fps)))}% from Low, and upscaling changes nothing.</p>
          <p>If you play competitive games and need more frames on a CPU-bound PC, look for settings that load the processor in that specific game, such as view distance or crowd and physics detail. Our ${guide("what-is-a-good-fps", "guide to good frame rates")} helps you decide how many frames you actually need.</p>`,
      },
      {
        id: "basics", toc: "Windows and driver basics", h2: "Windows, driver and hardware basics that matter",
        html: `
          <p>These checks are quick and free, and each one is a common cause of lower frame rates than a PC should manage:</p>
          <ul>
            <li><strong>Plug the monitor into the graphics card,</strong> not the motherboard. On a desktop with a dedicated card, a cable in the motherboard's video port can leave the game running on integrated graphics or routing frames through it.</li>
            <li><strong>Set the right refresh rate.</strong> Windows often defaults to 60 Hz on a new monitor. Check Settings › System › Display › Advanced display, pick the highest rate, and use a cable that supports it (DisplayPort, or a recent HDMI cable).</li>
            <li><strong>Turn on XMP (Intel) or EXPO (AMD)</strong> in the BIOS and run two memory sticks in dual channel. Without the profile, memory runs at a slow default speed. Having too little RAM hurts too: our CPU-bound example drops from ${fmt(cb.fps)} to ${fmt(c8.fps)} FPS with only 8 GB.</li>
            <li><strong>Update the graphics driver</strong> from NVIDIA, AMD or Intel, especially for a newly released game. New drivers often include fixes and optimizations for recent titles.</li>
            <li><strong>Leave Game Mode on</strong> (Settings › Gaming) and use the Balanced or a performance power plan. Power-saving plans hold clock speeds down.</li>
            <li><strong>Close heavy background apps,</strong> such as a browser playing video, launchers downloading updates or a second game client. Check Task Manager while playing.</li>
            <li><strong>Laptops:</strong> plug in the charger, select the manufacturer's performance mode, and make sure the game runs on the dedicated GPU. If the laptop has a MUX switch or a “dGPU only” mode, use it. See our ${guide("gaming-laptop-bottleneck", "gaming laptop guide")} for more.</li>
            <li><strong>Check temperatures and dust.</strong> A clogged cooler or filter makes the CPU and GPU lower their clocks under load.</li>
          </ul>`,
      },
      {
        id: "myths", toc: "What doesn't work", h2: "What doesn't work",
        html: `
          <p>A lot of popular advice promises big gains and delivers none on a healthy, up-to-date PC:</p>
          <ul>
            <li><strong>Registry hacks and “performance tweak” packs.</strong> Most change settings Windows already handles well. Some disable security features or break updates.</li>
            <li><strong>“FPS booster”, “game booster” and RAM cleaner apps.</strong> Windows already manages memory and process priority. These tools add background load of their own.</li>
            <li><strong>Debloat scripts that strip Windows services.</strong> The gain is a few frames at best, and they can break the Microsoft Store, Xbox app or Game Pass games.</li>
            <li><strong>Setting a game's priority to High in Task Manager.</strong> It rarely changes anything and doesn't survive a restart.</li>
            <li><strong>Lowering texture quality on a card with plenty of VRAM.</strong> It makes the game look worse for no extra frames.</li>
            <li><strong>Lowering graphics settings on a CPU-bound PC.</strong> As the tables show, the frame rate barely moves.</li>
          </ul>
          <p>Frame generation is a special case. It raises the number on the FPS counter by inserting extra frames, which does make motion look smoother, but it doesn't make the game respond faster. Our ${guide("dlss-vs-fsr-vs-xess", "DLSS vs FSR vs XeSS guide")} explains when it's worth using.</p>`,
      },
      {
        id: "checklist", toc: "Checklist in priority order", h2: "Checklist: what to try, in order",
        html: `
          <ol class="steps">
            <li><strong>Check the setup:</strong> monitor in the graphics card, correct refresh rate, VRR on, charger connected on a laptop.</li>
            <li><strong>Check the memory:</strong> XMP or EXPO enabled, two sticks in dual channel, 16 GB at the very least.</li>
            <li><strong>Update the graphics driver,</strong> leave Game Mode on, and close heavy background apps.</li>
            <li><strong>Find the limit</strong> with an overlay: GPU usage near 99% means GPU-bound, well below 90% means CPU-bound.</li>
            <li><strong>If GPU-bound:</strong> turn on upscaling at Quality, then lower the preset one step or cut ray tracing, volumetrics and shadows. Go to Balanced or Performance upscaling if you need more.</li>
            <li><strong>If CPU-bound:</strong> keep graphics settings high, lower CPU-heavy options, cap the frame rate for steady frame times, and work through the ${guide("how-to-fix-cpu-bottleneck", "CPU bottleneck fixes")}.</li>
            <li><strong>Consider frame generation</strong> for single-player games once you reach about 60 FPS without it.</li>
            <li><strong>Upgrade the part that limits you.</strong> The ${link.calculator("bottleneck calculator")} shows which one it is and suggests the smallest upgrade that balances your build. The ${link.builds("popular builds")} list shows how common pairings perform.</li>
          </ol>`,
      },
    ],
    faq: [
      ["What is the fastest way to increase FPS?", `If your graphics card is the limit, turn on DLSS, FSR or XeSS upscaling at the Quality preset, or lower the graphics preset one step. In our model either step is worth about ${Math.min(gain(k.upQ.g.fps, gb.fps), gain(k.med.g.fps, gb.fps))}–${Math.max(gain(k.upQ.g.fps, gb.fps), gain(k.med.g.fps, gb.fps))}% on a GPU-bound PC. If your processor is the limit, graphics settings barely help and you need CPU-side fixes such as enabling XMP and closing background apps.`],
      ["Why does lowering my graphics settings not increase FPS?", "Your PC is probably CPU-bound. Graphics settings mostly change the graphics card's workload, so when the processor is already the limit, lighter settings only give the GPU more idle time. Check GPU usage: if it's well below 90%, look at CPU fixes or a CPU upgrade instead."],
      ["Does updating drivers increase FPS?", "Sometimes. New graphics drivers often include optimizations and fixes for recently released games, so updating is worth it when you play a new title or see problems. In older games the difference is usually small."],
      ["Do FPS booster apps work?", "Generally no. Windows already manages memory and process priority, and most booster apps simply close background programs, which you can do yourself. Some add background load of their own. Registry tweaks and debloat scripts carry similar risks for little or no gain on an up-to-date PC."],
      ["Does Windows Game Mode increase FPS?", "Game Mode mainly keeps background tasks such as Windows Update from interrupting a game, which helps frame-time consistency more than average FPS. It's on by default in Windows 11 and is worth leaving on."],
      ["Does lowering resolution increase FPS?", "Only if your graphics card is the limit. On a GPU-bound PC, dropping from 1440p to 1080p is a large gain, though upscaling usually looks better for a similar boost. On a CPU-bound PC, a lower resolution barely changes the frame rate."],
    ],
    related: ["how-to-fix-cpu-bottleneck", "dlss-vs-fsr-vs-xess", "what-is-a-good-fps"],
  };
};
