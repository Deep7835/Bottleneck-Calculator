// Guide: How to plan a balanced gaming PC build
module.exports = function (h) {
  const { ev, cpu, gpu, pct, gain, fmt, name, verdict, expect, calc, build, guide, link, table, td, limitTag, Engine } = h;

  const at = (c, g, r, o = {}) => ev(c, g, { res: r, ...o });
  const cell = (c, g, r, o = {}) => {
    const x = at(c, g, r, o);
    return `<td class="r">${calc(c, g, { res: r, ...o }, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };

  // ---- Tier table: target resolution + refresh, with a few sensible pairings each
  const TIERS = [
    { res: "1080p", hz: 144, label: "1080p, 144 Hz", builds: [
      ["Budget", "ryzen-5-5600", "rtx-5060"],
      ["Mainstream", "i5-12400f", "rx-9060-xt-16gb"],
      ["Upper", "ryzen-5-7600", "rtx-5060-ti-16gb"],
    ] },
    { res: "1440p", hz: 165, label: "1440p, 165 Hz", builds: [
      ["Value", "ryzen-5-7600", "rtx-5070"],
      ["AM4 upgrade", "ryzen-7-5700x3d", "rx-9070-xt"],
      ["High end", "ryzen-7-7800x3d", "rtx-5070-ti"],
    ] },
    { res: "4k", hz: 120, label: "4K, 120 Hz", builds: [
      ["Entry", "ryzen-5-7600", "rtx-5070-ti"],
      ["Sweet spot", "ryzen-7-7800x3d", "rtx-5080"],
      ["No compromise", "ryzen-7-9800x3d", "rtx-5090"],
    ] },
  ];
  const tierRows = [];
  for (const t of TIERS) {
    for (const [tag, c, g] of t.builds) {
      const o = { hz: t.hz };
      const es = at(c, g, t.res, { ...o, workload: "esports" });
      expect(es.fps >= t.hz, `${c} + ${g} clears ${t.hz} Hz in esports at ${t.res}`);
      const nat = at(c, g, t.res, o), up = at(c, g, t.res, { ...o, upscale: "quality" });
      expect(nat.limiter === "gpu" || nat.pct < 10, `${c} + ${g} is not meaningfully CPU-bound at ${t.res} native`);
      expect(up.limiter === "gpu" || up.pct < 25, `${c} + ${g} is at most moderately CPU-bound with upscaling at ${t.res}`);
      tierRows.push([
        td(`<strong>${t.label}</strong><br><small>${tag}</small>`),
        td(build(c, g)),
        cell(c, g, t.res, o), cell(c, g, t.res, { ...o, upscale: "quality" }),
        td(fmt(es.fps), true),
      ]);
    }
  }
  const tierTable = table(
    ["Target", "CPU + GPU", ["AAA native", true], ["AAA, DLSS/FSR Quality", true], ["Esports", true]],
    tierRows,
  );
  const T = (i, j, o = {}) => { const t = TIERS[i]; const [, c, g] = t.builds[j]; return at(c, g, t.res, o); };
  const reach = TIERS.flatMap((t, i) => t.builds.map((b, j) => [b[2], T(i, j).fps >= t.hz]));
  expect(reach.every(([g, hit]) => hit === (g === "rtx-5090")), "only the 5090 reaches its tier's refresh rate in AAA at native");
  expect(T(1, 0, { upscale: "quality" }).verdict.key === "excellent" && T(1, 2, { upscale: "quality" }).verdict.key === "excellent", "1440p value and high end are balanced with DLSS");
  expect(T(1, 2, { upscale: "quality" }).fps >= 144, "7800X3D + 5070 Ti 1440p DLSS near 165");
  expect(T(2, 2, { upscale: "quality" }).fps >= 120 && Math.round(T(2, 1, { upscale: "quality" }).fps) < 120 && T(2, 1, { upscale: "quality" }).fps >= 110, "4K: only the 5090 clears 120 with DLSS, 5080 just under");
  expect(T(0, 0).fps >= 85 && T(0, 0).fps < 100, "1080p budget build ~90 FPS");

  // ---- Tier matrix at 1440p
  const MCPUS = ["i3-12100f", "ryzen-5-5600", "ryzen-5-7600", "ryzen-7-7800x3d", "ryzen-7-9800x3d"];
  const MGPUS = ["rtx-5060", "rtx-5060-ti-16gb", "rtx-5070", "rtx-5070-ti", "rtx-5080", "rtx-5090"];
  const matrix = table(
    ["CPU", ...MGPUS.map((g) => [name(g), true])],
    MCPUS.map((c) => [td(`<strong>${name(c)}</strong>`), ...MGPUS.map((g) => cell(c, g, "1440p"))]),
  );
  const ok = (x) => x.verdict.key === "excellent";
  expect(MCPUS.every((c) => at(c, "rtx-5080", "4k").limiter === "gpu"), "at 4K every CPU in the matrix keeps up with a 5080");
  expect(ok(at("ryzen-5-5600", "rtx-5070", "1440p")) && ok(at("i3-12100f", "rtx-5070", "1440p")), "5600/12100F balanced with 5070 at 1440p");
  expect(ok(at("ryzen-5-7600", "rtx-5070-ti", "1440p")) && ok(at("ryzen-5-7600", "rtx-5080", "1440p")), "7600 balanced with 5070 Ti and 5080 at 1440p");
  expect(ok(at("ryzen-7-9800x3d", "rtx-5090", "1440p")), "9800X3D balanced with 5090 at 1440p");
  const m5090 = at("ryzen-7-7800x3d", "rtx-5090", "1440p"), m5600 = at("ryzen-5-5600", "rtx-5080", "1440p");
  expect(m5090.limiter === "cpu" && m5090.verdict.key === "good", "7800X3D + 5090 minor at 1440p");
  expect(m5600.limiter === "cpu" && m5600.pct >= 20, "5600 + 5080 clearly CPU-bound at 1440p");
  const shift = [at("ryzen-5-7600", "rtx-5070", "1080p"), at("ryzen-7-7800x3d", "rtx-5070-ti", "1080p"), at("ryzen-7-9800x3d", "rtx-5080", "1080p")];
  expect(shift.every(ok), "at 1080p the balanced pairs shift one GPU step down");
  const s1080 = [at("ryzen-5-7600", "rtx-5080", "1080p"), at("ryzen-5-5600", "rtx-5070", "1080p")];
  expect(s1080.every((x) => x.limiter === "cpu" && x.pct >= 20), "7600+5080 and 5600+5070 CPU-bound at 1080p");

  // ---- Budget split examples
  const split = {
    gpuFirst: at("ryzen-5-7600", "rtx-5070-ti", "1440p"),
    cpuFirst: at("ryzen-7-7800x3d", "rtx-5070", "1440p"),
    gpuFirstEs: at("ryzen-5-7600", "rtx-5070-ti", "1080p", { workload: "esports" }),
    cpuFirstEs: at("ryzen-7-7800x3d", "rtx-5070", "1080p", { workload: "esports" }),
    gpuFirstSim: at("ryzen-5-7600", "rtx-5070-ti", "1440p", { workload: "cpuheavy" }),
    cpuFirstSim: at("ryzen-7-7800x3d", "rtx-5070", "1440p", { workload: "cpuheavy" }),
  };
  expect(split.gpuFirst.fps > split.cpuFirst.fps * 1.1, "at 1440p AAA, the bigger GPU wins");
  expect(split.cpuFirstEs.fps > split.gpuFirstEs.fps * 1.1 && split.cpuFirstSim.fps > split.gpuFirstSim.fps * 1.1, "in esports and sims, the faster CPU wins");
  const splitGain = gain(split.gpuFirst.fps, split.cpuFirst.fps);
  const splitEs = gain(split.cpuFirstEs.fps, split.gpuFirstEs.fps);
  const splitSim = gain(split.cpuFirstSim.fps, split.gpuFirstSim.fps);

  // ---- Mistakes
  const flag = [at("ryzen-7-9800x3d", "rtx-5060", "1080p"), at("ryzen-5-7600", "rtx-5060", "1080p"), at("i3-12100f", "rtx-5060", "1080p")];
  expect(Math.round(flag[0].fps) === Math.round(flag[1].fps) && flag[0].fps - flag[2].fps < 8, "9800X3D adds nothing to a 5060");
  const oldBig = at("ryzen-5-3600", "rtx-5080", "1440p"), newMid = at("ryzen-5-7600", "rtx-5070", "1440p");
  expect(oldBig.limiter === "cpu" && oldBig.pct >= 35 && newMid.fps > oldBig.fps * 1.1, "3600 + 5080 loses to 7600 + 5070 at 1440p");
  const wrongRes = [at("ryzen-5-7600", "rtx-5090", "1440p"), at("ryzen-5-7600", "rtx-5090", "4k")];
  expect(wrongRes[0].limiter === "cpu" && wrongRes[0].pct >= 30 && ok(wrongRes[1]), "7600 + 5090: CPU-bound at 1440p, balanced at 4K");
  const vram8 = at("ryzen-5-7600", "rtx-5060", "1440p");
  expect(vram8.vramNeed > gpu("rtx-5060").vram, "1440p High needs more than 8 GB");
  const ram = [at("ryzen-5-7600", "rtx-5070", "1440p"), at("ryzen-5-7600", "rtx-5070", "1440p", { ram: 8 })];
  expect(ram[1].low1 < ram[0].low1 * 0.9, "8 GB hurts 1% lows");

  return {
    slug: "balanced-gaming-pc-build",
    title: "How to Plan a Balanced Gaming PC Build (2026): CPU and GPU Pairings",
    description: "Plan a balanced gaming PC build: match CPU and GPU to your resolution and refresh rate, split the budget, and avoid common mistakes. Tier table with FPS and bottleneck.",
    h1: "How to plan a balanced gaming PC build",
    crumb: "Balanced PC build",
    card: "Match the CPU and GPU to your monitor, split the budget sensibly, and avoid the pairing mistakes that waste money. Includes a tier table for 1080p, 1440p and 4K.",
    lead: `A good PC build isn't the one with the most expensive parts. It's the one where the processor and graphics card are matched to each other and to the monitor, so nothing you paid for sits idle. This guide shows how to plan that balance, with CPU and GPU pairings for 1080p, 1440p and 4K calculated with the same model as our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "order", toc: "The planning order", h2: "Plan in this order",
        html: `
          <p>For a gaming PC, plan from the screen backwards:</p>
          <ol class="steps">
            <li><strong>Choose the monitor's resolution and refresh rate.</strong> This sets how hard the graphics card has to work and how many frames per second you're aiming for.</li>
            <li><strong>Choose the graphics card for that resolution.</strong> It sets the frame rate in most games, so it gets the biggest share of the money.</li>
            <li><strong>Choose the cheapest CPU that keeps that card busy.</strong> At your resolution, the processor should be able to prepare at least as many frames as the card can draw. Check the pair in the ${link.calculator("calculator")}: GPU-limited, or under 10% CPU-limited, is the goal.</li>
            <li><strong>Adjust for the games you play.</strong> Competitive shooters at high refresh rates, simulators, strategy games and MMOs need more CPU. Cinematic single-player games need more GPU.</li>
            <li><strong>Fill in memory, storage and power.</strong> These rarely set the frame rate, but getting them wrong causes stutter, long loads or crashes.</li>
          </ol>
          <p>The reason this order works is simple. The CPU sets a frame-rate ceiling that stays the same at any resolution, while the graphics card's ceiling drops as the resolution rises. So the higher your resolution, the less CPU you need for a given card. Our guide to ${guide("does-resolution-affect-bottleneck", "how resolution affects bottlenecks")} shows the effect in detail, and ${guide("cpu-vs-gpu-bottleneck", "CPU vs GPU bottleneck")} explains what each part actually does.</p>`,
      },
      {
        id: "tiers", toc: "Build tiers", h2: "Balanced CPU and GPU pairings by target",
        html: `
          <p>Three common targets with three pairings each. Figures are average FPS in AAA games at High settings, natively and with DLSS or FSR Quality, with the bottleneck underneath. The last column is CS2-style esports at the same resolution.</p>
          ${tierTable}
          <p>Every pairing is GPU-limited or within a 10% CPU bottleneck at native resolution, which is what balanced means in practice. Three things stand out:</p>
          <ul>
            <li><strong>The refresh rate is a ceiling, not a requirement.</strong> Apart from the RTX 5090 at 4K, none of these builds reaches its monitor's refresh rate in demanding AAA games at native resolution, and that's normal. With variable refresh (G-Sync or FreeSync), 90 to 120 FPS feels smooth on a high-refresh monitor. The extra refresh rate pays off in competitive games, where every build here runs well above its target.</li>
            <li><strong>Upscaling shifts the balance toward the CPU.</strong> DLSS and FSR make the graphics card faster, so the processor has to keep up with a higher frame rate. At 1440p the ${build("ryzen-5-7600", "rtx-5070", "Ryzen 5 7600 + RTX 5070")} goes from GPU-limited to ${verdict(T(1, 0, { upscale: "quality" }))} at about ${fmt(T(1, 0, { upscale: "quality" }).fps)} FPS with DLSS Quality, and the ${build("ryzen-7-7800x3d", "rtx-5070-ti", "Ryzen 7 7800X3D + RTX 5070 Ti")} reaches about ${fmt(T(1, 2, { upscale: "quality" }).fps)} FPS. If you'll always use upscaling, plan the CPU one step higher.</li>
            <li><strong>At 4K, the GPU is everything.</strong> The ${name("rtx-5080")} reaches about ${fmt(T(2, 1, { upscale: "quality" }).fps)} FPS at 4K with DLSS Quality. Only the ${name("rtx-5090")} clears 120 FPS, at about ${fmt(T(2, 2, { upscale: "quality" }).fps)}.</li>
          </ul>
          <p>For deeper dives on specific tiers, see the ${guide("best-cpu-for-rtx-5060", "best CPU for the RTX 5060 and 4060")}, the ${guide("best-cpu-for-rtx-5070", "best CPU for the RTX 5070 and 5070 Ti")}, and our verdict on the ${guide("ryzen-7-7800x3d-rtx-5070-ti", "Ryzen 7 7800X3D with the RTX 5070 Ti")}.</p>`,
      },
      {
        id: "matching", toc: "Matching CPU and GPU tiers", h2: "Matching CPU and GPU tiers at 1440p",
        html: `
          <p>Five processors against six graphics cards at 1440p, AAA games at High. A CPU-limited result means the card is partly idle; a GPU-limited one means the processor has spare capacity, which is fine.</p>
          ${matrix}
          <p>At 1440p the balanced pairs run roughly diagonally. A ${name("ryzen-5-5600")} or even a ${name("i3-12100f")} keeps up with an ${name("rtx-5070")} in AAA games, a ${name("ryzen-5-7600")} matches an ${name("rtx-5070-ti")} or ${name("rtx-5080")}, and only the ${name("ryzen-7-9800x3d")} is balanced with an ${name("rtx-5090")} (the ${name("ryzen-7-7800x3d")} is ${verdict(m5090)}, a minor bottleneck). Go above the diagonal and you lose performance: a ${name("ryzen-5-5600")} with an ${name("rtx-5080")} is ${verdict(m5600)}. Go below it and you've spent more on the processor than the card can use.</p>
          <p>At 1080p, everything shifts one card down. The balanced pairs become the ${name("ryzen-5-7600")} with an ${name("rtx-5070")}, the ${name("ryzen-7-7800x3d")} with an ${name("rtx-5070-ti")} and the ${name("ryzen-7-9800x3d")} with an ${name("rtx-5080")}. The ${name("ryzen-5-7600")} with an ${name("rtx-5080")} would be ${verdict(s1080[0])} at 1080p. At 4K, the shift goes the other way and almost any modern six-core keeps up with anything short of a 5090.</p>`,
      },
      {
        id: "budget", toc: "Splitting the budget", h2: "How to split the budget",
        html: `
          <p>Rules of thumb, not laws; a good sale can change the maths.</p>
          <ul>
            <li><strong>Graphics card: 35 to 50% of the total</strong>, rising with resolution. For a 4K build it can be more than half.</li>
            <li><strong>CPU: 15 to 20%.</strong> For 1440p and 4K gaming, the graphics card should usually cost two to three times as much as the processor.</li>
            <li><strong>Motherboard, memory, storage, power supply and case: the rest.</strong> Count the platform, not just the CPU. AM4 and DDR4 Intel boards with DDR4 memory cost less than AM5 or DDR5, and that saving can move you up a graphics tier.</li>
          </ul>
          <p>Here's why the GPU gets the bigger share. At 1440p, a ${build("ryzen-5-7600", "rtx-5070-ti", "Ryzen 5 7600 + RTX 5070 Ti")} averages about ${fmt(split.gpuFirst.fps)} FPS in AAA games, while a ${build("ryzen-7-7800x3d", "rtx-5070", "Ryzen 7 7800X3D + RTX 5070")}, which typically costs about the same, manages ${fmt(split.cpuFirst.fps)}. The bigger card wins by ${splitGain}%.</p>
          <p>The exception is games that lean on the processor. In esports at 1080p the 7800X3D build is ${splitEs}% faster (${fmt(split.cpuFirstEs.fps)} vs ${fmt(split.gpuFirstEs.fps)} FPS), and in simulators and strategy games at 1440p it's ${splitSim}% faster. If those are your main games, shift money toward the CPU, and ideally toward an X3D chip.</p>`,
      },
      {
        id: "other-parts", toc: "RAM, storage and PSU", h2: "RAM, storage and power supply basics",
        html: `
          <h3>Memory</h3>
          <p>32 GB in two sticks is the right amount for a new gaming PC in 2026, and 16 GB is the minimum. Two sticks matter: a single stick runs in single-channel mode and can cost a lot of CPU performance. On AM5, DDR5-6000 CL30 is the usual sweet spot. On AM4 and DDR4 Intel boards, DDR4-3200 or 3600 is fine. Turn on EXPO or XMP in the BIOS, or the memory runs at a slow default speed. Too little memory shows up as stutter rather than lower averages: in our model, cutting a ${name("ryzen-5-7600")} and ${name("rtx-5070")} build from 32 GB to 8 GB drops the 1% lows at 1440p from ${fmt(ram[0].low1)} to ${fmt(ram[1].low1)} FPS.</p>
          <h3>Storage</h3>
          <p>Use an NVMe SSD for Windows and games. 1 TB is the practical minimum, since many big releases take 100 GB or more, and 2 TB is comfortable. A good PCIe 4.0 drive is plenty for gaming; PCIe 5.0 drives cost more and load games barely any faster. Hard drives are fine for media and backups, not for games.</p>
          <h3>Power supply</h3>
          <p>Size the power supply for the graphics card, since it's the biggest consumer. NVIDIA's recommended system power is 550 W for the RTX 5060, 650 W for the RTX 5070, 750 W for the RTX 5070 Ti, 850 W for the RTX 5080 and 1000 W for the RTX 5090, and AMD publishes similar figures for its cards. Buy from a reputable brand, prefer an ATX 3.1 unit with a native 12V-2x6 cable for high-end NVIDIA cards, and add some headroom if you might upgrade later.</p>
          <h3>Motherboard, cooling and case</h3>
          <p>A mid-range B-series board (B650, B850, B760 or B550) is enough for gaming. Pricier boards add connectivity, not frame rate. Check that the BIOS supports your CPU. Make sure the case has decent front airflow, and that the CPU cooler suits the chip: boxed coolers are fine for 65 W six-cores, but X3D chips and K-series Intel parts need an aftermarket cooler.</p>`,
      },
      {
        id: "mistakes", toc: "Common mistakes", h2: "Common pairing mistakes",
        html: `
          <p><strong>A flagship CPU with a budget graphics card.</strong> A ${name("ryzen-7-9800x3d")} with an ${name("rtx-5060")} gets about ${fmt(flag[0].fps)} FPS at 1080p in AAA games, exactly what a ${name("ryzen-5-7600")} gets and only ${Math.round(flag[0].fps - flag[2].fps)} FPS more than a ${name("i3-12100f")}. The card is the limit, and the extra CPU money would have bought a much faster card.</p>
          <p><strong>A big graphics card on an old CPU.</strong> Dropping an ${name("rtx-5080")} into a PC with a ${name("ryzen-5-3600")} leaves it ${verdict(oldBig)} at 1440p, about ${fmt(oldBig.fps)} FPS. A ${build("ryzen-5-7600", "rtx-5070", "Ryzen 5 7600 + RTX 5070")} gets about ${fmt(newMid.fps)} FPS for similar money. If your CPU is a few generations old, budget for both parts, or upgrade the CPU first. Our guide to ${guide("how-to-fix-cpu-bottleneck", "fixing a CPU bottleneck")} covers the cheaper options.</p>
          <p><strong>Judging balance at the wrong resolution.</strong> A ${name("ryzen-5-7600")} with an ${name("rtx-5090")} looks like a mistake at 1440p, where it's ${verdict(wrongRes[0])}. At 4K the same pair is ${verdict(wrongRes[1])}. Always check a build at the resolution you'll actually play.</p>
          <p><strong>An 8 GB card for a 1440p monitor.</strong> At 1440p High, modern games want about ${vram8.vramNeed} GB of video memory. Cards like the ${name("rtx-5060")} cope with upscaling and lower textures, but for 1440p a 12 or 16 GB card is the safer buy.</p>
          <p><strong>Spending on "future-proofing" the CPU.</strong> Most people replace the graphics card more often than the processor, so it pays to choose a platform with an upgrade path (AM5 today) rather than the fastest CPU you can afford. A mid-range chip on a modern socket can be swapped for an X3D part later.</p>
          <p><strong>Skimping where it doesn't show.</strong> One stick of RAM, EXPO or XMP left off, a no-name power supply or a case with no airflow all cost performance or reliability.</p>
          <p>Before you buy, put the exact pair into the ${link.calculator("bottleneck calculator")} at your resolution, or browse ${link.builds("popular CPU + GPU builds")} with the results already worked out. For FPS in a particular game, use the ${link.fps("FPS calculator")}.</p>`,
      },
    ],
    faq: [
      ["What is a balanced CPU and GPU combo for 1440p?", `A Ryzen 5 7600 with an RTX 5070 or 5070 Ti, or a Ryzen 7 7800X3D with an RTX 5070 Ti or 5080. The 7800X3D and 5070 Ti average about ${fmt(T(1, 2).fps)} FPS at 1440p High in AAA games and about ${fmt(T(1, 2, { upscale: "quality" }).fps)} with DLSS Quality.`],
      ["How much of a PC build budget should go to the graphics card?", "For a gaming PC, roughly 35 to 50% of the total, with more at higher resolutions. The CPU usually takes 15 to 20%. For 1440p and 4K, the graphics card should cost about two to three times as much as the processor."],
      ["Is a bottleneck always bad?", "No. One part always limits the frame rate. In a gaming PC you want it to be the graphics card, so a GPU-limited result is the healthy state. A CPU bottleneck under about 10% is also fine. It becomes a problem when the processor holds a much faster card back by 20% or more."],
      ["Should I buy a better CPU or a better GPU?", `For AAA games at 1440p or 4K, the better GPU. At 1440p a Ryzen 5 7600 with an RTX 5070 Ti is about ${splitGain}% faster than a Ryzen 7 7800X3D with an RTX 5070. For esports at 1080p or for simulators and strategy games, the faster CPU usually wins.`],
      ["Do I need 32 GB of RAM for a gaming PC?", "16 GB still works, but 32 GB in two sticks is the better choice for a new build in 2026. Newer games, plus a browser, Discord and launchers in the background, can push past 16 GB, and the result is stutter rather than a lower average frame rate."],
      ["What power supply do I need for a gaming PC?", "Size it for the graphics card. NVIDIA recommends 550 W for an RTX 5060, 650 W for an RTX 5070, 750 W for an RTX 5070 Ti, 850 W for an RTX 5080 and 1000 W for an RTX 5090. Choose a reputable brand and leave headroom for upgrades."],
    ],
    related: ["best-cpu-for-rtx-5060", "ryzen-7-7800x3d-rtx-5070-ti", "does-resolution-affect-bottleneck"],
  };
};
