// Guide: How to fix a CPU bottleneck (settings, RAM/XMP, upgrades)
module.exports = function (h) {
  const { ev, cpu, res, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitCell } = h;

  // One badly CPU-bound build, and what each change does to it.
  const B = ["ryzen-5-3600", "rtx-5070-ti"];
  const R = "1080p";
  const base = ev(...B, { res: R });
  expect(base.limiter === "cpu" && base.pct >= 40, "3600 + 5070 Ti is badly CPU-bound at 1080p");
  const FIXES = [
    ["Starting point: High, 1080p, 32 GB", B, {}],
    ["Raise quality to Ultra", B, { quality: "ultra" }],
    ["Play at 1440p instead", B, { res: "1440p" }],
    ["Turn on DLSS/FSR Quality", B, { upscale: "quality" }],
    ["Only 16 GB of RAM", B, { ram: 16 }],
    ["Only 8 GB of RAM", B, { ram: 8 }],
    ["Streaming with x264 (CPU encoding)", B, { streaming: true }],
    [`Swap in a ${name("ryzen-5-5600")} (same socket)`, ["ryzen-5-5600", B[1]], {}],
    [`Swap in a ${name("ryzen-7-5700x3d")} (same socket)`, ["ryzen-7-5700x3d", B[1]], {}],
    [`New platform: ${name("ryzen-7-7800x3d")}`, ["ryzen-7-7800x3d", B[1]], {}],
  ];
  const fx = FIXES.map(([label, [c, g], o]) => ({ label, c, g, o: { res: R, ...o }, x: ev(c, g, { res: R, ...o }) }));
  const f = Object.fromEntries(["base", "ultra", "q1440", "dlss", "r16", "r8", "x264", "r5600", "x3d", "am5"].map((k, i) => [k, fx[i].x]));
  const delta = (x) => { const d = gain(x.fps, base.fps); return d === 0 ? "±0%" : d > 0 ? `+${d}%` : `−${-d}%`; };
  // "costs only 4% of its frame rate" / "costs almost nothing"
  const costs = (x, verb = "costs") => { const d = Math.round((1 - x.fps / base.fps) * 100); return d <= 0 ? `${verb} almost nothing` : `${verb} only ${d}% of its frame rate`; };
  expect(Math.abs(f.dlss.fps - base.fps) < 2, "upscaling does nothing when CPU-bound");
  expect(f.ultra.fps / base.fps > 0.93 && f.q1440.fps / base.fps > 0.97, "Ultra and 1440p are almost free");
  expect(f.r8.fps < base.fps * 0.85 && f.x264.fps < base.fps * 0.85, "8 GB and x264 streaming cost a lot");
  expect(f.am5.verdict.key === "excellent", "7800X3D balances the 5070 Ti at 1080p");
  const fixTable = table(
    ["Change", ["Avg FPS", true], ["1% low", true], "Bottleneck"],
    fx.map((r, i) => [td(i ? calc(r.c, r.g, r.o, r.label) : r.label), td(`${fmt(r.x.fps)}${i ? ` <small>${delta(r.x)}</small>` : ""}`, true), td(fmt(r.x.low1), true), td(limitCell(r.x))]),
  );

  // Drop-in CPU upgrades on the same socket, with an RTX 5070 at 1080p.
  const SWAPS = [
    ["ryzen-5-2600", "ryzen-7-5700x3d"],
    ["ryzen-5-3600", "ryzen-7-5700x3d"],
    ["i5-10400f", "i7-11700k"],
    ["i3-12100f", "i5-14600k"],
    ["i5-12400f", "i5-14600k"],
    ["ryzen-5-7600", "ryzen-7-9800x3d"],
  ];
  const G = "rtx-5070";
  const swaps = SWAPS.map(([a, b]) => {
    expect(cpu(a).socket === cpu(b).socket, `${a} and ${b} share a socket`);
    return { a, b, ra: ev(a, G, { res: R }), rb: ev(b, G, { res: R }) };
  });
  const swapTable = table(
    ["Socket", "Current → upgrade", ["FPS before", true], ["FPS after", true], ["Gain", true]],
    swaps.map((s) => [
      td(cpu(s.a).socket),
      td(`${name(s.a)} → ${build(s.b, G, name(s.b))}<br><small>${verdict(s.ra)} → ${verdict(s.rb)}</small>`),
      td(fmt(s.ra.fps), true), td(fmt(s.rb.fps), true), td(`+${gain(s.rb.fps, s.ra.fps)}%`, true),
    ]),
  );
  const am5 = swaps[5];
  expect(am5.ra.verdict.key === "excellent" && gain(am5.rb.fps, am5.ra.fps) < 20, "7600 → 9800X3D is a small gain with a 5070 (already balanced)");
  const best = swaps.slice(0, 2);
  expect(best.every((s) => gain(s.rb.fps, s.ra.fps) >= 40), "AM4 X3D swaps are the biggest gains");

  return {
    slug: "how-to-fix-cpu-bottleneck",
    title: "How to Fix a CPU Bottleneck: Settings, RAM and Upgrades That Work",
    description: "Fix a CPU bottleneck step by step: free game settings, XMP/EXPO and dual-channel RAM, Windows and cooling checks, then the drop-in CPU upgrade that helps most. With FPS numbers.",
    h1: "How to fix a CPU bottleneck",
    crumb: "Fix a CPU bottleneck",
    card: "Free settings changes first, then RAM, XMP and Windows fixes, then the drop-in CPU upgrade that gives the most FPS per dollar.",
    lead: "If your graphics card is waiting on your processor, you can't buy your way out with a faster GPU. The good news is that several fixes cost nothing, a couple cost very little, and when you do need a new CPU the best upgrade often fits your current motherboard. Here they are in the order worth trying.",
    sections: [
      {
        id: "confirm", toc: "Confirm it first", h2: "First, make sure it really is the CPU",
        html: `
          <p>Before changing anything, confirm the diagnosis. Run a performance overlay with GPU usage and per-thread CPU usage, turn off every frame cap, and play the heaviest part of your game. If GPU usage stays well below 90% while your frame rate is under your target, and lowering the resolution doesn't raise FPS, the CPU is the limit. Our step-by-step guide to ${guide("how-to-check-for-bottleneck", "checking for a bottleneck")} covers the setup and the false alarms, such as forgotten frame caps and full VRAM, that look like a CPU problem but aren't.</p>
          <p>It also helps to know how big the problem is. Put your parts into the ${link.calculator("bottleneck calculator")}. A CPU bottleneck under 20% is minor and often not worth spending money on. Above 35% you're leaving a big slice of your graphics card unused, and an upgrade will be obvious.</p>`,
      },
      {
        id: "worth", toc: "What each fix is worth", h2: "What each fix is worth: an example",
        html: `
          <p>To make this concrete, here's a common mismatch: a ${calc(...B, { res: R }, `${name(B[0])} paired with an ${name(B[1])}`)} at 1080p. It's ${pct(base)}% CPU-limited, averaging about ${fmt(base.fps)} FPS when the card alone could manage around ${fmt(base.gpuFps)}. This is what each change does to it in AAA games:</p>
          ${fixTable}
          <p>Three things stand out. Graphics settings barely move the frame rate, in either direction. Too little RAM or CPU-based streaming makes things much worse. And the big wins are all CPU swaps, with the drop-in ${name("ryzen-7-5700x3d")} adding ${delta(f.x3d).slice(1)} on the same motherboard. The sections below go through each lever.</p>`,
      },
      {
        id: "settings", toc: "Free fixes in game settings", h2: "Free fixes in your game settings",
        html: `
          <h3>Use your idle GPU: raise resolution or quality</h3>
          <p>When you're CPU-bound, the graphics card has spare capacity. Spend it. Moving this example build to 1440p ${costs(f.q1440)}, and maxing out the quality preset ${costs(f.ultra)}, for a visibly better image. If you have a 1440p or 4K monitor running at 1080p for “more FPS”, switch back to native. Running DLAA or native-resolution anti-aliasing instead of upscaling is the same idea.</p>
          <h3>Lower the settings that load the CPU</h3>
          <p>Most settings only affect the GPU, but a few cost CPU time on every frame. Turn these down first:</p>
          <ul>
            <li>Crowd, traffic and NPC density</li>
            <li>View distance, object detail and level-of-detail range</li>
            <li>Physics, destruction and simulation quality</li>
            <li>Ray tracing, which adds CPU work to build its scene structures, not just GPU work</li>
            <li>In some engines, shadow quality or shadow distance, since every shadow-casting object is another draw call</li>
          </ul>
          <h3>Cap your frame rate</h3>
          <p>A CPU bottleneck feels worst when the frame rate keeps swinging. Capping FPS a little below what your CPU sustains in busy scenes, through the game, RTSS or your graphics driver, trades a few peak frames for much steadier frame times. With G-Sync or FreeSync, cap 3–4 FPS below your refresh rate.</p>
          <h3>Try frame generation, carefully</h3>
          <p>DLSS Frame Generation and FSR Frame Generation insert extra frames without any CPU work, so they can make a CPU-bound game look much smoother. They don't improve responsiveness, and they work best from a base of around 60 FPS. Pair them with NVIDIA Reflex or AMD Anti-Lag to keep input latency in check. They're great for single-player games and best avoided in competitive shooters.</p>
          <p>What doesn't work: <strong>upscaling</strong>. DLSS, FSR or XeSS Super Resolution render fewer pixels to lighten the GPU, which a CPU-bound game doesn't need. In the table above it doesn't add a single frame. Our ${guide("cpu-vs-gpu-bottleneck", "CPU vs GPU bottleneck guide")} explains why settings help one kind and not the other.</p>`,
      },
      {
        id: "ram", toc: "RAM, XMP and dual channel", h2: "Fix your RAM: XMP/EXPO, dual channel and capacity",
        html: `
          <p>The CPU waits on memory constantly, so badly configured RAM makes a CPU bottleneck worse. These checks take ten minutes and are free:</p>
          <ol class="steps">
            <li><strong>Enable XMP (Intel) or EXPO (AMD) in the BIOS.</strong> Without it, DDR4 runs at 2133–2666 MT/s and DDR5 at 4800–5600 MT/s, whatever the box says. Check the speed in Task Manager › Performance › Memory. If it shows the slow default, turn the profile on. In CPU-bound games this is often worth 10–20%.</li>
            <li><strong>Run two sticks in dual channel.</strong> A single stick halves memory bandwidth. With two sticks, use the slots your motherboard manual marks for dual channel, usually the second and fourth from the CPU.</li>
            <li><strong>Have enough of it.</strong> In our example, dropping from 32 GB to 16 GB ${costs(f.r16)}, but 8 GB costs ${delta(f.r8).slice(1)} and drags the 1% lows down to ${fmt(f.r8.low1)} FPS, because Windows starts paging to the SSD. In 2026, 16 GB is the minimum and 32 GB is the comfortable choice for gaming.</li>
          </ol>
          <p>If XMP makes the system unstable, update the BIOS first, then try the next speed down. A stable 3200 MT/s beats an unstable 3600.</p>`,
      },
      {
        id: "windows", toc: "Windows, drivers and cooling", h2: "Windows, drivers, background apps and cooling",
        html: `
          <ul>
            <li><strong>Close what you don't need.</strong> Browsers with video playing, launchers updating in the background, RGB and motherboard utilities and screen recorders all compete for the same CPU time as your game. Check Task Manager while gaming and close anything using more than a few percent.</li>
            <li><strong>Keep Game Mode on</strong> (Settings › Gaming) and use the Balanced or High performance power plan. On laptops, plug in and select the manufacturer's performance mode. Battery modes cap CPU power hard.</li>
            <li><strong>Update the BIOS and chipset drivers.</strong> AMD's chipset package includes the drivers that schedule games onto the right cores on dual-CCD chips such as the 7950X3D and 9950X3D. Intel 13th- and 14th-gen owners need the latest BIOS for the stability microcode anyway.</li>
            <li><strong>Check temperatures.</strong> A CPU that hits 95–100 °C under load lowers its clock speed to protect itself. Add CPU temperature and clock speed to your overlay. If it's throttling, clean the dust filters, check that the cooler is mounted properly, and replace old thermal paste or a tired stock cooler.</li>
          </ul>
          <p>One thing to avoid: “game booster” and “RAM cleaner” apps. Windows already manages memory and process priority well, and these tools tend to add background load of their own.</p>`,
      },
      {
        id: "streaming", toc: "If you stream", h2: "If you stream or record",
        html: `
          <p>Encoding video with x264 runs on the CPU and takes cores away from the game. In our example, streaming with CPU encoding drops the build from ${fmt(base.fps)} to ${fmt(f.x264.fps)} FPS (${delta(f.x264)}). Switch OBS or your recording tool to the graphics card's hardware encoder: <strong>NVENC</strong> on NVIDIA, <strong>AMF</strong> on AMD or <strong>Quick Sync</strong> on Intel. Modern hardware encoders look as good as x264 at streaming bitrates and cost the game only a few frames.</p>`,
      },
      {
        id: "upgrade", toc: "Upgrade the CPU", h2: "Upgrade the CPU, same socket first",
        html: `
          <p>If the free fixes aren't enough, the processor is the upgrade. Start with the fastest gaming chip your current motherboard supports. You skip buying a new board and RAM, and on older platforms the jump can be huge. Here's what a drop-in swap does with an ${name(G)} at 1080p:</p>
          ${swapTable}
          <p>The AM4 X3D swaps are the standouts: ${best.map((s) => `${name(s.a)} to ${name(s.b)} adds ${gain(s.rb.fps, s.ra.fps)}%`).join(", and ")}. Our ${guide("best-am4-cpu", "best AM4 CPU guide")} covers BIOS support and coolers. At the other end, a ${name("ryzen-5-7600")} with this card is already ${verdict(am5.ra)}, so even a ${name("ryzen-7-9800x3d")} only adds ${gain(am5.rb.fps, am5.ra.fps)}%. That's a reminder to check the size of your bottleneck before spending anything.</p>
          <p>Two rules when choosing the upgrade. First, for gaming, buy fewer, faster cores with more cache rather than more cores: an eight-core X3D chip beats a sixteen-core chip in almost every game. Second, if your socket has nothing fast enough, which is the case for LGA1151 and older or AM4 with an RTX 5080-class card, move to AM5 or a current Intel platform rather than buying a stopgap. The ${guide("best-cpu-for-rtx-5070", "best CPU for RTX 5070 guide")} compares current options, and the ${link.builds("popular builds")} list shows how each pairing performs.</p>`,
      },
    ],
    faq: [
      ["How do I fix a CPU bottleneck without upgrading?", "Raise resolution or graphics quality to use your idle GPU, lower CPU-heavy settings such as crowd density and view distance, enable XMP/EXPO with two RAM sticks in dual channel, close background apps, switch streaming to NVENC or AMF, and check that your CPU isn't overheating. Frame generation can also make a CPU-bound game look smoother."],
      ["Does increasing resolution fix a CPU bottleneck?", `It removes the bottleneck without adding FPS. The CPU's frame-rate ceiling doesn't change, but the GPU does more work per frame, so the two become balanced. In our example the build ${costs(f.q1440, "loses")} at 1440p and looks noticeably sharper.`],
      ["Does XMP help a CPU bottleneck?", "Yes. Without XMP or EXPO, memory runs at slow default speeds, and in CPU-bound games enabling the profile is often worth 10–20%. Make sure you're also using two sticks in dual channel."],
      ["Will overclocking my CPU fix a bottleneck?", "It helps a little, typically 5% or less on modern chips, which already boost close to their limit. Fixing RAM settings and cooling usually gives more. X3D chips can't be overclocked the usual way, but undervolting with Curve Optimizer can keep them at full boost for longer."],
      ["Does more RAM reduce CPU bottleneck?", `Only if you don't have enough. Going from 8 GB to 16 GB is a big improvement (8 GB costs this example build ${delta(f.r8).slice(1)}), and 32 GB is a small step up from 16 GB. Above 32 GB there's no gaming benefit.`],
      ["Should I upgrade my CPU or GPU first?", "If you're CPU-bound by 20% or more and below your target FPS, upgrade the CPU first. A faster GPU would mostly sit idle. If you're GPU-bound, upgrade the graphics card. The calculator's upgrade suggestions show the smallest change that balances your build."],
    ],
    related: ["how-to-check-for-bottleneck", "best-am4-cpu", "cpu-vs-gpu-bottleneck"],
  };
};
