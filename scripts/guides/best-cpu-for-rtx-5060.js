// Guide: Best CPU for RTX 5060 and RTX 4060 (budget pairing guide)
module.exports = function (h) {
  const { ev, cpu, gpu, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitTag } = h;

  const CPUS = ["i3-12100f", "ryzen-5-3600", "ryzen-5-5600", "i5-12400f", "i5-13400f", "i5-14400f", "ryzen-7-5700x3d", "ryzen-5-7600"];
  const CURRENT = CPUS.filter((c) => c !== "ryzen-5-3600");
  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...o });
  const cell = (c, g, r, o = {}) => {
    const x = at(c, g, r, o);
    return `<td class="r">${calc(c, g, { res: r, ...o }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };

  // ---- Main table: AAA at High
  const mainTable = table(
    ["CPU", ["CPU limit", true], ["RTX 5060 1080p", true], ["RTX 5060 1440p", true], ["RTX 4060 1080p", true]],
    CPUS.map((c) => [
      td(build(c, "rtx-5060", `<strong>${name(c)}</strong>`)),
      td(fmt(at(c, "rtx-5060", "1080p").cpuFps), true),
      cell(c, "rtx-5060", "1080p"), cell(c, "rtx-5060", "1440p"), cell(c, "rtx-4060", "1080p"),
    ]),
  );
  // ---- Game types with the RTX 5060
  const typeTable = table(
    ["CPU", ["Esports 1080p", true], ["CPU-heavy 1080p", true], ["CPU-heavy 1440p", true], ["AAA 1080p, DLSS Quality", true]],
    CPUS.map((c) => [
      td(`<strong>${name(c)}</strong>`),
      cell(c, "rtx-5060", "1080p", { workload: "esports" }),
      cell(c, "rtx-5060", "1080p", { workload: "cpuheavy" }),
      cell(c, "rtx-5060", "1440p", { workload: "cpuheavy" }),
      cell(c, "rtx-5060", "1080p", { upscale: "quality" }),
    ]),
  );

  // ---- Facts the copy relies on
  const f = (c, g = "rtx-5060", r = "1080p", o = {}) => at(c, g, r, o);
  const gpuCap = f("ryzen-5-7600").gpuFps, gpuCap4060 = f("ryzen-5-7600", "rtx-4060").gpuFps;
  const i3 = f("i3-12100f"), r56 = f("ryzen-5-5600"), r76 = f("ryzen-5-7600"), r36 = f("ryzen-5-3600"), i124 = f("i5-12400f");
  expect(i3.limiter === "gpu" && i3.pct < 20, "12100F is balanced with a 5060 at 1080p");
  expect(r56.limiter === "gpu" && r56.pct < 20, "5600 is GPU-bound with a 5060 at 1080p");
  expect(CURRENT.every((c) => f(c).limiter === "gpu"), "every current CPU is GPU-bound with a 5060 at 1080p");
  expect(CURRENT.every((c) => f(c, "rtx-4060").limiter === "gpu"), "every current CPU is GPU-bound with a 4060 at 1080p");
  expect(r36.limiter === "cpu" && r36.verdict.key === "good", "3600 is a minor CPU bottleneck for a 5060");
  expect(f("ryzen-5-3600", "rtx-4060").verdict.key === "excellent", "3600 is balanced with a 4060");
  const spread = Math.round(r76.fps - i3.fps), spread56 = Math.round(r76.fps - r56.fps);
  expect(spread <= 6, "12100F to 7600 spread is a handful of FPS");
  const over = f("ryzen-7-7800x3d");
  expect(Math.abs(over.fps - r76.fps) < 1.5, "7800X3D = 7600 with a 5060 at 1080p");
  const gpuGap = gain(gpu("rtx-5060").g, gpu("rtx-4060").g);
  const p1440 = f("ryzen-5-5600", "rtx-5060", "1440p");
  expect(p1440.vramNeed > gpu("rtx-5060").vram && p1440.limiter === "gpu", "1440p High needs more than 8 GB");
  const p1440d = [f("ryzen-5-5600", "rtx-5060", "1440p", { upscale: "quality" }), f("i3-12100f", "rtx-5060", "1440p", { upscale: "quality" })];
  expect(p1440d.every((x) => x.limiter === "gpu" && x.fps >= 80), "1440p DLSS Quality is GPU-bound and 80+");
  // Medium / DLSS at 1080p
  const med = [f("i3-12100f", "rtx-5060", "1080p", { quality: "medium" }), f("ryzen-5-5600", "rtx-5060", "1080p", { quality: "medium" })];
  const dl = Object.fromEntries(["i3-12100f", "ryzen-5-5600", "i5-12400f", "ryzen-5-7600"].map((c) => [c, f(c, "rtx-5060", "1080p", { upscale: "quality" })]));
  expect(med.every((x) => x.limiter === "cpu" && x.pct < 20), "at Medium the 12100F and 5600 become minor CPU bottlenecks");
  expect(dl["i3-12100f"].limiter === "cpu" && dl["i3-12100f"].pct >= 20 && dl["i5-12400f"].verdict.key === "excellent" && dl["ryzen-5-7600"].verdict.key === "excellent", "DLSS 1080p: 12100F CPU-bound, 12400F and 7600 balanced");
  // Esports and CPU-heavy
  const es = Object.fromEntries(CPUS.map((c) => [c, f(c, "rtx-5060", "1080p", { workload: "esports" })]));
  expect(CURRENT.every((c) => es[c].fps >= 240) && es["ryzen-5-3600"].fps < 240, "esports: all current CPUs clear 240, 3600 doesn't");
  expect(CURRENT.every((c) => es[c].fps < 360), "nothing reaches 360 with a 5060");
  const hv = Object.fromEntries(CPUS.map((c) => [c, f(c, "rtx-5060", "1080p", { workload: "cpuheavy" })]));
  const hvGain = gain(hv["ryzen-5-7600"].fps, hv["i3-12100f"].fps);
  expect(CPUS.every((c) => hv[c].limiter === "cpu") && hvGain >= 25, "CPU-heavy at 1080p: all CPU-bound, 7600 much faster than 12100F");
  const hv1440 = ["i5-13400f", "i5-14400f", "ryzen-7-5700x3d", "ryzen-5-7600"].map((c) => f(c, "rtx-5060", "1440p", { workload: "cpuheavy" }));
  expect(hv1440.every((x) => x.verdict.key === "excellent"), "CPU-heavy 1440p: 13400F and up balanced");
  expect(f("i3-12100f", "rtx-5060", "1440p", { workload: "cpuheavy" }).pct >= 20, "12100F still CPU-bound in sims at 1440p");
  // VRAM and ray tracing
  const ultra = [f("ryzen-5-5600", "rtx-5060", "1080p", { quality: "ultra" }), f("ryzen-5-5600", "rtx-4060", "1080p", { quality: "ultra" }), f("ryzen-5-5600", "rtx-5060-ti-16gb", "1080p", { quality: "ultra" })];
  expect(ultra[0].vramNeed > 8 && ultra[2].fps > ultra[0].fps * 1.15, "1080p Ultra overflows 8 GB");
  const rt = [f("ryzen-5-5600", "rtx-5060", "1080p", { workload: "raytracing" }), f("ryzen-5-5600", "rtx-5060", "1080p", { workload: "raytracing", upscale: "quality" })];
  expect(rt[0].fps < 60 && rt[1].fps >= 60, "RT 1080p: under 60 native, over 60 with DLSS");
  // Cheaper CPU, better GPU
  const swap = [f("ryzen-5-7600"), f("ryzen-5-5600", "rtx-5060-ti-16gb"), f("i5-12400f", "rtx-5060-ti-16gb"), f("i3-12100f", "rx-9060-xt-16gb")];
  expect(swap[1].fps > swap[0].fps && swap[2].fps > swap[0].fps && swap[1].verdict.key === "excellent", "a cheaper CPU plus a 5060 Ti beats a 7600 plus a 5060");
  const stream = ["i3-12100f", "ryzen-5-5600", "i5-14400f"].map((c) => f(c, "rtx-5060", "1080p", { streaming: true }));
  expect(stream[0].limiter === "cpu" && stream[0].pct >= 20 && stream[2].limiter === "gpu", "x264 streaming: 12100F CPU-bound, 14400F fine");
  const later = ["i3-12100f", "ryzen-5-5600", "ryzen-5-7600"].map((c) => [f(c, "rtx-5070", "1080p"), f(c, "rtx-5070", "1440p")]);
  expect(later[0][0].pct >= 25 && later[1][0].pct >= 25 && later[2][0].verdict.key === "excellent", "5070 at 1080p: 12100F/5600 CPU-bound, 7600 balanced");
  expect(later.every(([, x]) => x.limiter === "gpu" || x.pct < 10), "5070 at 1440p: none of the three holds it back");
  expect(i3.cpuFps > gpuCap && r56.cpuFps > gpuCap && r76.cpuFps > gpuCap && i3.cpuFps < gpuCap * 1.15, "12100F, 5600 and 7600 clear the 5060 bar, the 12100F only just");
  // Older CPUs and RAM
  const OLD = ["i7-8700k", "i5-10400f", "i5-9400f", "ryzen-5-2600", "ryzen-5-1600"];
  const old = Object.fromEntries(OLD.map((c) => [c, f(c)]));
  expect(old["i7-8700k"].verdict.key === "excellent" && old["i5-10400f"].verdict.key === "excellent", "8700K and 10400F are fine");
  expect(old["i5-9400f"].verdict.key === "good" && old["ryzen-5-2600"].verdict.key === "moderate" && old["ryzen-5-1600"].verdict.key === "severe", "9400F minor, 2600 moderate, 1600 severe");
  const ram = [f("ryzen-5-5600", "rtx-5060", "1080p", { ram: 16 }), f("ryzen-5-5600", "rtx-5060", "1080p", { ram: 8 })];
  expect(ram[0].limiter === "gpu" && ram[0].pct < 20 && ram[1].limiter === "cpu", "16 GB fine, 8 GB makes the 5600 the limit");

  return {
    slug: "best-cpu-for-rtx-5060",
    title: "Best CPU for RTX 5060 and RTX 4060 (2026): Budget Pairing Guide",
    description: "Which CPU should you pair with an RTX 5060 or RTX 4060? FPS and bottleneck for the i3-12100F, Ryzen 5 5600, i5-12400F, 13400F, 14400F, 5700X3D and Ryzen 5 7600.",
    h1: "Best CPU for the RTX 5060 and RTX 4060",
    crumb: "Best CPU for RTX 5060",
    card: "What counts as enough CPU for a budget graphics card at 1080p, FPS for eight processors, and when the cheaper chip is the smarter buy.",
    lead: `The RTX 5060 and RTX 4060 are 1080p cards, and they need far less processor than most build guides suggest. Spend too much on the CPU and you've taken money away from the part that actually sets your frame rate. Here's how the popular budget and mainstream chips pair with each card, calculated with the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "picks", toc: "Quick picks", h2: "Quick picks",
        html: `
          <div class="callout">
            <p><strong>Best value: Ryzen 5 5600 or Core i5-12400F.</strong> Both keep an RTX 5060 GPU-limited at 1080p, within ${spread56} FPS of a Ryzen 5 7600 in AAA games, on cheap DDR4 platforms.</p>
            <p><strong>Cheapest that works: Core i3-12100F.</strong> ${verdict(i3).replace(/^b/, "B")} with the RTX 5060 at 1080p High. It runs out of steam in simulators, strategy games and when streaming, so treat it as a tight-budget pick.</p>
            <p><strong>For esports and CPU-heavy games: Core i5-13400F or 14400F.</strong> A little faster than the 12400F in simulators and MMOs, and balanced with the card in those games at 1440p.</p>
            <p><strong>For an upgrade path: Ryzen 5 7600.</strong> No faster with these cards today, but AM5 and the 7600 are ready for an RTX 5070-class card later.</p>
            <p><strong>Already on AM4?</strong> A Ryzen 5 5600, or a Ryzen 7 5700X3D if you play CPU-heavy games, is a drop-in upgrade for a Ryzen 1000, 2000 or 3000 chip.</p>
          </div>`,
      },
      {
        id: "enough", toc: "What counts as enough", h2: "What \"enough CPU\" means at 1080p",
        html: `
          <p>Every frame needs work from both parts. The processor prepares it (game logic, physics, draw calls) and the graphics card renders it. A CPU is "enough" when it can prepare frames faster than the card can draw them, because then the card sets the pace and you're getting everything you paid for.</p>
          <p>In AAA games at 1080p High, an RTX 5060 can render about ${fmt(gpuCap)} FPS and an RTX 4060 about ${fmt(gpuCap4060)}. The 5060 is roughly ${gpuGap}% faster. So the bar for a CPU is about ${fmt(gpuCap)} FPS for the 5060 and ${fmt(gpuCap4060)} for the 4060. A Core i3-12100F can prepare about ${fmt(i3.cpuFps)} FPS in the same games, a Ryzen 5 5600 about ${fmt(r56.cpuFps)} and a Ryzen 5 7600 about ${fmt(r76.cpuFps)}. All three clear the bar, which is why they all land within a few frames of each other.</p>
          <p>Two things raise the bar. Lower settings and upscaling make the card faster, so the processor has to keep up with a higher frame rate. And some games, such as simulators, strategy titles and MMOs, simply need far more CPU per frame. Both are covered below.</p>`,
      },
      {
        id: "fps", toc: "FPS with each CPU", h2: "FPS and bottleneck with each CPU",
        html: `
          <p>Average FPS in AAA games at High settings, native resolution, 32 GB of RAM. The CPU limit is how many frames the processor can prepare per second. Click a number to open that build in the calculator, or a CPU name for its build page.</p>
          ${mainTable}
          <p>With the RTX 5060 at 1080p, every current CPU here is GPU-limited. The spread from the ${name("i3-12100f")} (${fmt(i3.fps)} FPS) to the ${name("ryzen-5-7600")} (${fmt(r76.fps)} FPS) is just ${spread} FPS, and a ${name("ryzen-7-7800x3d")} would add nothing on top: it lands within a frame of the 7600, at ${fmt(over.fps)} FPS. The RTX 4060 is even less demanding, and every chip in the list, including the older ${name("ryzen-5-3600")}, keeps it fully busy.</p>
          <p>The 3600 is the one processor that holds the 5060 back, and only slightly: it's ${verdict(r36)} at about ${fmt(r36.fps)} FPS. That's a minor bottleneck, not a reason to replace the whole platform, though a cheap Ryzen 5 5600 drop-in fixes it.</p>`,
      },
      {
        id: "game-types", toc: "Esports, sims and DLSS", h2: "Esports, CPU-heavy games and DLSS",
        html: `
          <p>The same CPUs with the RTX 5060 in the situations where the processor matters more:</p>
          ${typeTable}
          <h3>Esports</h3>
          <p>Competitive games at 1080p push the frame rate into the hundreds, and the card tops out around ${fmt(f("ryzen-5-7600", "rtx-5060", "1080p", { workload: "esports" }).gpuFps)} FPS. Every current CPU here clears 240 FPS in CS2-style games, from about ${fmt(es["i3-12100f"].fps)} on the 12100F to ${fmt(es["ryzen-5-7600"].fps)} on the 7600. The older 3600 manages about ${fmt(es["ryzen-5-3600"].fps)}. None of these builds will drive a 360 Hz monitor, and that's down to the graphics card, not the processor.</p>
          <h3>Simulators, strategy and MMOs</h3>
          <p>This is where the CPU you pick shows. At 1080p every chip is the limit, and the ${name("ryzen-5-7600")} runs about ${hvGain}% faster than the ${name("i3-12100f")} (${fmt(hv["ryzen-5-7600"].fps)} vs ${fmt(hv["i3-12100f"].fps)} FPS). The ${name("i5-13400f")}, ${name("i5-14400f")}, ${name("ryzen-7-5700x3d")} and 7600 are all balanced with the card at 1440p in these games, while the 12100F stays CPU-bound. If you mostly play Microsoft Flight Simulator, Cities: Skylines II or a busy MMO, buy one of those four.</p>
          <h3>Medium settings and DLSS</h3>
          <p>To get closer to 144 Hz in AAA games, most people lower settings or turn on DLSS, and that raises the bar for the CPU. With DLSS Quality at 1080p, the ${name("i3-12100f")} becomes ${verdict(dl["i3-12100f"])} at about ${fmt(dl["i3-12100f"].fps)} FPS and the ${name("ryzen-5-5600")} ${verdict(dl["ryzen-5-5600"])}, while the ${name("i5-12400f")} (${fmt(dl["i5-12400f"].fps)} FPS) and ${name("ryzen-5-7600")} (${fmt(dl["ryzen-5-7600"].fps)} FPS) stay balanced. Dropping to Medium has a similar effect. So if you chase high frame rates rather than image quality, a 12400F or better is worth the small step up.</p>`,
      },
      {
        id: "vram", toc: "8 GB of VRAM and 1440p", h2: "8 GB of VRAM, 1440p and ray tracing",
        html: `
          <p>Both cards have 8 GB of video memory, and that matters more than the CPU for how they age. At 1080p High, modern games fit in about ${Math.round(r56.vramNeed)} GB. At 1080p Ultra they want around ${Math.round(ultra[0].vramNeed)} GB, and the overflow costs real performance: with a Ryzen 5 5600 the RTX 5060 drops to about ${fmt(ultra[0].fps)} FPS at Ultra and the 4060 to ${fmt(ultra[1].fps)}, while an ${name("rtx-5060-ti-16gb")} with 16 GB holds ${fmt(ultra[2].fps)}. The fix is easy: set textures to High instead of Ultra. The rest of the Ultra settings are usually fine.</p>
          <p><strong>1440p</strong> is possible but not native. At 1440p High the RTX 5060 averages about ${fmt(p1440.fps)} FPS and needs about ${p1440.vramNeed} GB, slightly more than it has. With DLSS Quality it reaches about ${fmt(p1440d[0].fps)} FPS with a 5600 and ${fmt(p1440d[1].fps)} with a 12100F, both GPU-limited. If 1440p is your main resolution, a 16 GB card like the ${name("rtx-5060-ti-16gb")} or ${name("rx-9060-xt-16gb")} is the better buy.</p>
          <p><strong>Ray tracing</strong> runs at about ${fmt(rt[0].fps)} FPS at 1080p natively on the 5060 and ${fmt(rt[1].fps)} with DLSS Quality. It's usable with upscaling, and the CPU barely matters for it, since the graphics card does the heavy lifting.</p>`,
      },
      {
        id: "cheaper-cpu", toc: "When cheaper is smarter", h2: "When a cheaper CPU is the smarter buy",
        html: `
          <p>On a fixed budget, money moved from the processor to the graphics card usually buys more frames. In AAA games at 1080p a ${build("ryzen-5-7600", "rtx-5060", "Ryzen 5 7600 + RTX 5060")} gets about ${fmt(swap[0].fps)} FPS. A ${build("ryzen-5-5600", "rtx-5060-ti-16gb", "Ryzen 5 5600 + RTX 5060 Ti 16GB")} gets ${fmt(swap[1].fps)} and is ${verdict(swap[1])}, and a ${build("i5-12400f", "rtx-5060-ti-16gb", "Core i5-12400F + RTX 5060 Ti 16GB")} gets ${fmt(swap[2].fps)}, with twice the VRAM in both cases. AM4 and DDR4 Intel boards and memory cost less than AM5 with DDR5, and that saving is often what pays for the better card.</p>
          <p>The faster CPU is the smarter buy when:</p>
          <ul>
            <li><strong>You play CPU-heavy games.</strong> Simulators and strategy games gain ${hvGain}% from a 7600 over a 12100F, more than any budget GPU upgrade would add.</li>
            <li><strong>You stream with the x264 encoder.</strong> Our model puts the 12100F at ${verdict(stream[0])} while encoding, against ${verdict(stream[2])} for the 14400F. Using NVENC, the card's hardware encoder, avoids most of that cost on any CPU.</li>
            <li><strong>You'll upgrade the graphics card soon.</strong> With an RTX 5070 at 1080p, the 12100F would be ${verdict(later[0][0])} and the 5600 ${verdict(later[1][0])}, while the 7600 stays ${verdict(later[2][0])}. At 1440p none of the three holds a 5070 back, so this only matters if you stay at 1080p.</li>
          </ul>
          <p>For bigger cards, our ${guide("best-cpu-for-rtx-5070", "best CPU for the RTX 5070 and 5070 Ti")} guide covers the next tier up.</p>`,
      },
      {
        id: "older", toc: "Older CPUs", h2: "Pairing with an older CPU",
        html: `
          <p>An RTX 5060 is a popular upgrade for an older PC. How it pairs at 1080p High in AAA games:</p>
          <ul>
            ${OLD.map((c) => `<li><strong>${calc(c, "rtx-5060", { res: "1080p" }, name(c))}</strong>: ${verdict(old[c])}, about ${fmt(old[c].fps)} FPS.</li>`).join("\n            ")}
          </ul>
          <p>Six-core Intel chips from the 8th generation onward are close to fine. First- and second-generation Ryzen are where the card is clearly held back. The good news for AM4 owners is that most B450 and X470 boards, and many older ones, accept a Ryzen 5 5600 or 5700X3D after a BIOS update. Our ${guide("best-am4-cpu", "best AM4 CPU guide")} covers the checks. If you're not sure whether your current PC is CPU-bound, our guide on ${guide("how-to-check-for-bottleneck", "how to check for a bottleneck")} walks you through it with free tools.</p>`,
      },
      {
        id: "platform", toc: "RAM, PSU and PCIe", h2: "RAM, power supply and PCIe",
        html: `
          <p><strong>Memory.</strong> 16 GB in two sticks is the minimum for gaming in 2026, and 32 GB is a cheap way to stop worrying. In our model 16 GB keeps a Ryzen 5 5600 and RTX 5060 ${verdict(ram[0])}, but 8 GB makes the CPU the limit and drops the 1% lows from ${fmt(r56.low1)} to ${fmt(ram[1].low1)} FPS, which you'll feel as stutter. DDR4-3200 or 3600 is fine for the 5600, 5700X3D and DDR4 Intel boards. For the 7600, DDR5-6000 is the sweet spot.</p>
          <p><strong>Power supply.</strong> NVIDIA recommends a 550 W supply for a system with either card. The RTX 4060 is rated at 115 W and the 5060 at 145 W, and both use a single 8-pin connector, so a good 550 to 650 W unit leaves room for a bigger card later.</p>
          <p><strong>PCIe x8.</strong> Both cards use eight PCIe lanes instead of sixteen. On a PCIe 4.0 or 5.0 board that makes no difference. On a PCIe 3.0 board, such as B450, A520 or a 10th-gen Intel board, the link has half the bandwidth. The loss is small while the game fits in VRAM, but it grows when the 8 GB overflows, which is one more reason to keep textures at High. The Ryzen 5 5500, 5600G and 5700G also limit the slot to PCIe 3.0, so skip them for these cards.</p>
          <p><strong>Cooling.</strong> The 12100F, 12400F, 13400F, 14400F, Ryzen 5 5600 and Ryzen 5 7600 all ship with a cooler that's adequate for gaming. The 5700X3D doesn't include one.</p>`,
      },
    ],
    faq: [
      ["Will an i3-12100F bottleneck an RTX 5060?", `Not at 1080p High in AAA games: the two are balanced at about ${fmt(i3.fps)} FPS. The 12100F becomes the limit with DLSS or Medium settings (${pct(dl["i3-12100f"])}% CPU-limited with DLSS Quality) and in CPU-heavy games like simulators.`],
      ["Is the Ryzen 5 5600 good for an RTX 5060?", `Yes. It's GPU-limited at about ${fmt(r56.fps)} FPS at 1080p High, within ${spread56} FPS of a Ryzen 5 7600. It also suits 1440p with DLSS Quality at about ${fmt(p1440d[0].fps)} FPS.`],
      ["Will a Ryzen 5 3600 bottleneck an RTX 4060 or 5060?", `Not the RTX 4060, which is balanced with it at 1080p. With the RTX 5060 the 3600 is ${verdict(r36)}, a minor bottleneck at about ${fmt(r36.fps)} FPS. A Ryzen 5 5600 drop-in removes it.`],
      ["Is the Ryzen 7 7800X3D overkill for an RTX 5060?", `In most games, yes. It gets the same ${fmt(over.fps)} FPS as a Ryzen 5 7600 at 1080p High because the card is the limit. It only pulls ahead in CPU-heavy games, where it reaches about ${fmt(f("ryzen-7-7800x3d", "rtx-5060", "1080p", { workload: "cpuheavy" }).fps)} FPS against ${fmt(hv["ryzen-5-7600"].fps)}.`],
      ["Can the RTX 5060 run games at 1440p?", `With upscaling, yes. Natively at 1440p High it averages about ${fmt(p1440.fps)} FPS and runs slightly short of VRAM. With DLSS Quality it reaches about ${fmt(p1440d[0].fps)} FPS with a Ryzen 5 5600.`],
      ["Does the RTX 5060 need a better CPU than the RTX 4060?", `Slightly. The 5060 is about ${gpuGap}% faster, so it needs a CPU that can prepare about ${fmt(gpuCap)} FPS in AAA games instead of ${fmt(gpuCap4060)}. Any current six-core, or even a Core i3-12100F, clears that at 1080p High.`],
    ],
    related: ["balanced-gaming-pc-build", "best-am4-cpu", "best-cpu-for-rtx-5070"],
  };
};
