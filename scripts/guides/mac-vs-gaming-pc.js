// Guide: Mac vs gaming PC: what the same money buys for gaming
module.exports = function (h) {
  const { HW, Games, Macs, BASE, cpu, gpu, ev, fmt, name, gain, expect, calc, build, guide, link, mac, table, td } = h;

  // ---- Helpers: per-game FPS on a PC (Games.evaluate) and on a Mac (Macs.evaluate)
  const pc = (c, g, game, o = {}) => Games.evaluate(cpu(c), gpu(g), game, { ...BASE, ...o });
  const M = (id) => { const m = Macs.byId[id]; if (!m) throw new Error(`mac-vs-gaming-pc: unknown Mac ${id}`); return m; };
  const mc = (id, game, o = {}) => { const m = M(id); return Macs.evaluate(m, { quality: "high", upscale: "off", ram: Macs.ram16(m), game, ...o }); };
  const GAMES = [["cyberpunk", "1080p"], ["cyberpunk", "1440p"], ["cs2", "1080p"], ["bg3", "1440p"]];
  const f = (r) => fmt(r.fps);

  // Apple: approximate US starting prices at launch (base configs). PC: approximate US street prices,
  // October 2026, computed from the same price table as our budget and 1440p build guides.
  const P = require("./prices");
  const TIERS = [
    { label: "Entry", macId: "mac-mini-m4", macPrice: "from $599", pc: ["ryzen-5-5600", "arc-b580"], pcPrice: `about ${P.usd(P.budgetTotal("ryzen-5-5600", "arc-b580", "am4", "ddr4"))}`, ram: 16 },
    { label: "Mid-range", macId: "mac-mini-m4-pro-16-core-gpu", macPrice: "from $1,399", pc: ["ryzen-5-7600", "rtx-5070"], pcPrice: `about ${P.usd(P.midTotal("ryzen-5-7600", "rtx-5070"))}`, ram: 32 },
    { label: "Upper", macId: "mac-studio-m4-max-32-core-gpu", macPrice: "from $1,999", pc: ["ryzen-5-7600", "rx-9070-xt"], pcPrice: `about ${P.usd(P.midTotal("ryzen-5-7600", "rx-9070-xt"))}`, ram: 32 },
  ];
  expect(P.midTotal("ryzen-5-7600", "rx-9070-xt")[1] < 1999, "the 9070 XT PC costs less than the base M4 Max Mac Studio");
  expect(P.budgetTotal("ryzen-5-5600", "arc-b580", "am4", "ddr4")[0] > 599, "the budget PC costs a little more than the base Mac mini M4");
  for (const t of TIERS) {
    t.m = GAMES.map(([g, r]) => mc(t.macId, g, { res: r }));
    t.p = GAMES.map(([g, r]) => pc(t.pc[0], t.pc[1], g, { res: r, ram: t.ram }));
    expect(t.m.every((x) => x.playable) && t.p.every((x, i) => x.fps > t.m[i].fps * 1.3), `${t.label}: the PC is 30%+ faster in every game`);
  }
  const ratio = TIERS.map((t) => t.p[0].fps / t.m[0].fps);
  expect(ratio[0] >= 2 && ratio[1] >= 2 && ratio[2] >= 1.25, "PC 2x+ at entry and mid, 25%+ at upper");
  const tierTable = table(
    ["System", ["Approx. price", true], ["Cyberpunk 2077 1080p", true], ["Cyberpunk 2077 1440p", true], ["CS2 1080p", true], ["Baldur's Gate 3 1440p", true]],
    TIERS.flatMap((t) => [
      [td(`<strong>${t.label}</strong><br><small>${mac(t.macId)}</small>`), td(t.macPrice, true), ...t.m.map((x) => td(f(x), true))],
      [td(`<small>PC: ${build(t.pc[0], t.pc[1])}</small>`), td(t.pcPrice, true), ...t.p.map((x, i) => `<td class="r">${calc(t.pc[0], t.pc[1], { res: GAMES[i][1], ram: t.ram, workload: Games.byId[GAMES[i][0]].base }, f(x))}</td>`)],
    ]),
  );

  // ---- PC equivalents
  const EQ = ["macbook-air-13-m4-8-core-gpu", "mac-mini-m4", "macbook-pro-14-m5", "mac-mini-m4-pro-20-core-gpu", "mac-studio-m4-max-32-core-gpu", "mac-studio-m4-max-40-core-gpu"];
  const eq = Object.fromEntries(EQ.map((id) => [id, Macs.pcEquivalent(M(id))]));
  expect(eq["mac-studio-m4-max-32-core-gpu"].gpu.id === "rtx-5060", "M4 Max 32-core ≈ RTX 5060");
  expect(eq["mac-mini-m4-pro-20-core-gpu"].gpu.id === "rtx-3060-8gb", "M4 Pro 20-core ≈ RTX 3060 8GB");
  expect(eq["mac-studio-m4-max-40-core-gpu"].gpu.vram === 8, "M4 Max 40 ≈ an 8 GB card");
  expect(EQ.every((id) => gpu(eq[id].gpu.id).g < gpu("rtx-5070").g), "none of the listed Macs matches an RTX 5070");
  const ultraEq = Macs.pcEquivalent(M("mac-studio-m3-ultra-80-core-gpu"));
  expect(gpu(ultraEq.gpu.id).g >= gpu("rtx-5070").g && Macs.models.every((m) => m.gpu <= M("mac-studio-m3-ultra-80-core-gpu").gpu), "only the M3 Ultra 80-core reaches 5070 class");
  expect(Macs.models.filter((m) => m.chip.id === "m4" || m.chip.id === "m5").every((m) => m.ram[0] >= 16), "M4 and later base models start at 16 GB");

  // ---- Native vs translated
  const tr = ["mac-mini-m4-pro-20-core-gpu", "mac-studio-m4-max-40-core-gpu"].map((id) => [mc(id, "native-aaa", { res: "1080p" }), mc(id, "translated-aaa", { res: "1080p" })]);
  const trLoss = tr.map(([n, t]) => -gain(t.fps, n.fps));
  expect(trLoss.every((l) => l >= 20 && l <= 40), "translation costs 20-40%");
  const elden = mc("mac-studio-m4-max-40-core-gpu", "elden-ring", { res: "1080p" });
  expect(elden.capped && elden.fps === 60, "Elden Ring capped at 60 on M4 Max");
  const blocked = Macs.games.filter((g) => g.run === "blocked").map((g) => g.id), cloud = Macs.games.filter((g) => g.run === "cloud").map((g) => g.id);
  expect(blocked.includes("valorant") && blocked.includes("warzone") && cloud.includes("fortnite"), "Valorant/Warzone blocked, Fortnite cloud");
  expect(!mc("mac-studio-m4-max-40-core-gpu", "valorant", { res: "1080p" }).playable, "Valorant not playable");
  const native = Macs.games.filter((g) => g.run === "native").map((g) => g.name);
  const translated = Macs.games.filter((g) => g.run === "translated").map((g) => g.name);

  // ---- Unified memory
  const vr = [16, 24, 36, 48].map((r) => [r, Macs.vramFor(r)]);
  expect(Macs.vramFor(16) > 8 && Macs.vramFor(16) < 12 && Macs.vramFor(24) < 16 && Macs.vramFor(36) > 16, "16 GB Mac > 8 GB card; 36 GB Mac > 16 GB card");
  const eight = [mc("mac-mini-m4", "native-aaa", { res: "1080p" }), mc("mac-mini-m4", "native-aaa", { res: "1080p", ram: 8 })];
  expect(eight[1].low1 < eight[0].low1 * 0.85, "8 GB Macs stutter");

  // ---- Laptops
  const LAPTOPS = [
    ["Mac", "macbook-air-13-m4-8-core-gpu", "from $999"],
    ["Mac", "macbook-pro-14-m5", "from $1,599"],
    ["Mac", "macbook-pro-16-m4-max-40-core-gpu", "high end"],
    ["PC", ["ryzen-7-8845hs", "rtx-5060-laptop"], "mid-range"],
    ["PC", ["ultra-7-255hx", "rtx-5070-ti-laptop"], "upper mid-range"],
    ["PC", ["ultra-9-275hx", "rtx-5080-laptop"], "high end"],
  ];
  const LG = [["cyberpunk", "1080p"], ["cs2", "1080p"], ["bg3", "1440p"]];
  const lap = LAPTOPS.map(([kind, id, price]) => ({
    kind, id, price,
    r: LG.map(([g, res]) => kind === "Mac" ? mc(id, g, { res }) : pc(id[0], id[1], g, { res, ram: 16 })),
  }));
  const lapTable = table(
    ["Laptop", "Price tier", ["Cyberpunk 2077 1080p", true], ["CS2 1080p", true], ["Baldur's Gate 3 1440p", true]],
    lap.map((x) => [
      td(x.kind === "Mac" ? `<strong>${mac(x.id)}</strong>` : `<strong>${calc(x.id[0], x.id[1], { res: "1080p", ram: 16 }, name(x.id[1]))}</strong><br><small>${name(x.id[0])}</small>`),
      td(x.price), ...x.r.map((r) => td(f(r), true)),
    ]),
  );
  const [air, m5, max16, l60, l70ti, l80] = lap;
  expect(l60.r[0].fps > m5.r[0].fps * 1.5 && l60.r[0].fps > air.r[0].fps * 3, "RTX 5060 laptop beats MBP M5 by 50%+ and the Air by 3x");
  expect(Math.abs(max16.r[0].fps - l70ti.r[0].fps) < 8 && l80.r[0].fps > max16.r[0].fps * 1.15, "M4 Max 40 ≈ 5070 Ti laptop in native games; 5080 laptop ahead");
  expect(max16.r[1].fps < l70ti.r[1].fps * 0.75, "M4 Max loses clearly in translated CS2");
  expect(M("macbook-air-13-m4-8-core-gpu").fanless && !M("macbook-pro-14-m5").fanless, "Air fanless, MBP has fans");

  const [T0, T1, T2] = TIERS;
  return {
    slug: "mac-vs-gaming-pc",
    title: "Mac vs Gaming PC for Gaming (2026): What the Same Money Buys",
    description: "Mac vs gaming PC for gaming: FPS for Mac mini, MacBook and Mac Studio against PC builds at the same price, native vs CrossOver games, anti-cheat and laptops.",
    h1: "Mac vs gaming PC: what the same money buys for gaming",
    crumb: "Mac vs gaming PC",
    card: "Mac mini, MacBook and Mac Studio against PC builds and gaming laptops at similar prices: FPS, which games run, unified memory and who should buy which.",
    lead: `Apple Silicon Macs can play games, and the faster ones play them well. But for the same money a gaming PC is usually much faster, and it runs every Windows game. This guide puts numbers on that gap, using our ${link.mac("Mac gaming calculator")} for the Macs and the same model as our ${link.calculator("bottleneck calculator")} for the PCs, and explains which games a Mac can and can't run.`,
    sections: [
      {
        id: "short", toc: "The short answer", h2: "The short answer",
        html: `
          <div class="callout">
            <p><strong>For gaming alone, buy a PC.</strong> At every price tier below, the PC is faster in every game we compare, often two to three times faster, and it runs games a Mac can't.</p>
            <p><strong>If you need a Mac anyway, it can be your gaming machine too,</strong> as long as your games have native Mac versions or run well through translation, and you can live without games that use kernel anti-cheat.</p>
            <p><strong>For laptops, the gap is smaller but still there.</strong> A mid-range gaming laptop outruns every MacBook Air and base MacBook Pro in games. MacBooks win on battery life, noise and weight.</p>
          </div>`,
      },
      {
        id: "same-money", toc: "Same money, desktop", h2: "Same money: Mac desktops vs PC builds",
        html: `
          <p>Three price tiers, each with a Mac and a PC build. Mac prices are Apple's US starting prices at launch for the base configuration; check Apple's store for current pricing and newer models. PC prices are approximate US street prices, October 2026, from our ${guide("budget-gaming-pc-build", "budget build")} and ${guide("1440p-gaming-pc-build", "1440p build")} guides. Neither includes a monitor. Figures are average FPS at High settings without upscaling, with each Mac at its base memory.</p>
          ${tierTable}
          <ul>
            <li><strong>Entry.</strong> The ${mac(T0.macId, "Mac mini M4")} is the cheapest way into Apple Silicon, but in Cyberpunk 2077 at 1080p it runs at about ${f(T0.m[0])} FPS, against ${f(T0.p[0])} on a budget PC with an ${name("arc-b580")}. That's ${ratio[0].toFixed(1)} times faster for a little more money.</li>
            <li><strong>Mid-range.</strong> The ${mac(T1.macId, "Mac mini M4 Pro")} reaches ${f(T1.m[0])} FPS. A ${name("ryzen-5-7600")} and ${name("rtx-5070")} PC gets ${f(T1.p[0])}, about ${ratio[1].toFixed(1)} times as fast, and ${f(T1.p[1])} at 1440p, where the Mac manages ${f(T1.m[1])}.</li>
            <li><strong>Upper.</strong> The ${mac(T2.macId, "Mac Studio M4 Max")} is the first Mac in this list that plays demanding games well at 1080p, at about ${f(T2.m[0])} FPS. A PC with an ${name("rx-9070-xt")}, which typically costs less, gets ${f(T2.p[0])}, and ${f(T2.p[1])} at 1440p against ${f(T2.m[1])}.</li>
          </ul>
          <p>Counter-Strike 2 shows the second gap. It has no Mac version and runs through CrossOver, so even the Mac Studio gets ${f(T2.m[2])} FPS against ${f(T2.p[2])} on the PC. Baldur's Gate 3, a native port that leans on the processor, is the closest contest.</p>
          <p>Two more costs to count on the Mac side: Apple charges a lot to upgrade memory and storage at purchase, and neither can be added later. A PC's graphics card, memory and storage can all be upgraded in a few minutes.</p>`,
      },
      {
        id: "equivalent", toc: "PC equivalents", h2: "What PC is a Mac equal to?",
        html: `
          <p>For native Mac games, our model matches each Mac's graphics to the closest desktop card. These are rough equivalents for gaming only; Macs are far stronger than these cards suggest at video editing and other creative work.</p>
          <ul>
            ${EQ.map((id) => `<li><strong>${mac(id)}</strong>: about an ${name(eq[id].gpu.id)}.</li>`).join("\n            ")}
          </ul>
          <p>The fastest chip here, the M4 Max with a 40-core GPU, lands near an ${name(eq["mac-studio-m4-max-40-core-gpu"].gpu.id)}, a mid-range PC card. None of these reaches an ${name("rtx-5070")}; only the far pricier ${mac("mac-studio-m3-ultra-80-core-gpu", "Mac Studio M3 Ultra (80-core GPU)")} gets into that class, near an ${name(ultraEq.gpu.id)}. The processors are a different story: Apple's CPU cores are fast, and in CPU-heavy games like Baldur's Gate 3 the Macs hold up better than in graphics-heavy ones. For any model, the ${link.mac("Mac calculator")} shows FPS game by game.</p>`,
      },
      {
        id: "games", toc: "Which games run", h2: "Native, translated and blocked games",
        html: `
          <p>The game library matters more than raw speed. A Windows game reaches a Mac in one of three ways.</p>
          <h3>Native Mac versions</h3>
          <p>These run best. Our calculator covers ${native.join(", ").replace(/, ([^,]*)$/, " and $1")}, all with native Apple Silicon versions. Many native ports support MetalFX, Apple's upscaler, which works much like DLSS or FSR.</p>
          <h3>Translated: CrossOver and the Game Porting Toolkit</h3>
          <p>CrossOver, and Apple's Game Porting Toolkit that it builds on, translate Windows games and DirectX graphics so they run on macOS. Many work, but translation costs performance. In our model the same AAA game runs about ${trLoss[0]}% slower translated than native on the ${mac("mac-mini-m4-pro-20-core-gpu", "Mac mini M4 Pro")} (${f(tr[0][1])} vs ${f(tr[0][0])} FPS at 1080p) and ${trLoss[1]}% slower on the ${mac("mac-studio-m4-max-40-core-gpu", "M4 Max Mac Studio")}. Our list includes ${translated.join(", ").replace(/, ([^,]*)$/, " and $1")}. Elden Ring is locked to 60 FPS by the game, which the M4 Max reaches.</p>
          <h3>Blocked: kernel anti-cheat</h3>
          <p>Some of the most played games won't run on a Mac at all. Valorant's Vanguard and Call of Duty's Ricochet anti-cheat don't run on macOS, so Valorant and Warzone are out, and GTA Online blocks the translated version that runs GTA V's story mode. Fortnite has no macOS version. The workaround is cloud gaming: GeForce NOW and Xbox Cloud Gaming stream the game from a PC, so it runs on any Mac with a fast connection, with a little added input lag and a monthly fee for the better tiers.</p>
          <p>If your main game is a competitive shooter, check that it runs on macOS before anything else. That alone settles the question for many players.</p>`,
      },
      {
        id: "memory", toc: "Unified memory and VRAM", h2: "Unified memory as video memory",
        html: `
          <p>Macs don't have separate video memory. The CPU and GPU share one pool of unified memory, and macOS lets the GPU use about two-thirds of it (three-quarters from 48 GB up). In our model that works out to:</p>
          <ul>
            ${vr.map(([r, v]) => `<li><strong>${r} GB Mac</strong>: about ${v} GB for graphics.</li>`).join("\n            ")}
          </ul>
          <p>So a 16 GB Mac has more room for graphics than an 8 GB graphics card, and a 36 GB M4 Max more than a 16 GB card. The catch is that the game itself, macOS and your other apps come out of the same pool, whereas a PC with 16 GB of RAM and an 8 GB card has 24 GB in total. In practice, video memory is rarely what holds a Mac back in games; GPU speed is.</p>
          <p>Avoid 8 GB Macs for gaming. Modern games swap to the SSD, and in our model the ${mac("mac-mini-m4", "Mac mini M4")}'s 1% lows drop from ${fmt(eight[0].low1)} to ${fmt(eight[1].low1)} FPS with 8 GB, which you feel as stutter. Base models from the M4 generation on start at 16 GB.</p>`,
      },
      {
        id: "laptops", toc: "MacBook vs gaming laptop", h2: "MacBook vs gaming laptop",
        html: `
          <p>Laptops are where the Mac case is strongest, because battery life, noise and weight matter as much as frame rate. Gaming laptops are framed by tier here, since prices vary widely by brand and screen.</p>
          ${lapTable}
          <p>A mid-range gaming laptop with an ${name("rtx-5060-laptop")} gets about ${f(l60.r[0])} FPS in Cyberpunk 2077 at 1080p, against ${f(m5.r[0])} on the ${mac("macbook-pro-14-m5", "MacBook Pro M5")} and ${f(air.r[0])} on the ${mac("macbook-air-13-m4-8-core-gpu", "base MacBook Air M4")}. The Air also has no fan, so it slows down after 10 to 15 minutes of gaming; our numbers include that drop. At the top end, the ${mac("macbook-pro-16-m4-max-40-core-gpu", "16-inch MacBook Pro M4 Max")} roughly matches an ${name("rtx-5070-ti-laptop")} in native games (${f(max16.r[0])} vs ${f(l70ti.r[0])} FPS) but falls behind in translated ones like CS2 (${f(max16.r[1])} vs ${f(l70ti.r[1])}), and an ${name("rtx-5080-laptop")} is faster still.</p>
          <p>What you get in return: a MacBook lasts far longer on battery, stays quiet, and is lighter. Gaming laptops are fast when plugged in, but many get loud under load, and they lose much of their speed on battery. Our guide to ${guide("gaming-laptop-bottleneck", "gaming laptop bottlenecks")} explains how laptop CPUs and GPUs pair.</p>`,
      },
      {
        id: "who", toc: "Who should buy which", h2: "Who should buy which",
        html: `
          <ul>
            <li><strong>Buy a gaming PC</strong> if gaming is the main reason for the purchase, you play competitive shooters with anti-cheat, you want new Windows releases on day one, or you want to upgrade later. Our ${guide("balanced-gaming-pc-build", "balanced build guide")} shows how to plan one.</li>
            <li><strong>Buy a Mac</strong> if you need macOS for work or study, mostly play native titles such as Baldur's Gate 3, World of Warcraft, League of Legends or Minecraft, and can use cloud gaming for the rest. Choose at least 16 GB of memory, and a Pro or Max chip if games matter.</li>
            <li><strong>Buy a MacBook over a gaming laptop</strong> if you'll carry it every day and game occasionally. Buy the gaming laptop if you game most days and mostly play plugged in.</li>
            <li><strong>Consider both:</strong> a Mac for work plus a budget gaming PC or a console often costs about the same as a high-end Mac, and plays far more games.</li>
          </ul>
          <p>Already own a Mac? Find your model in the ${link.mac("Mac gaming calculator")} to see what it can run, game by game.</p>`,
      },
    ],
    faq: [
      ["Is a Mac or a PC better for gaming?", `A PC. At similar prices a gaming PC is usually two to three times faster in games and runs titles a Mac can't, such as Valorant and Warzone. In Cyberpunk 2077 at 1080p High, a Mac mini M4 gets about ${f(T0.m[0])} FPS and a budget PC with an Arc B580 about ${f(T0.p[0])}.`],
      ["What PC graphics card is a Mac equal to?", `In native games, our model puts the Mac mini M4 Pro with a 20-core GPU near an ${name(eq["mac-mini-m4-pro-20-core-gpu"].gpu.id)}, the M4 Max with a 32-core GPU near an ${name(eq["mac-studio-m4-max-32-core-gpu"].gpu.id)} and the 40-core M4 Max near an ${name(eq["mac-studio-m4-max-40-core-gpu"].gpu.id)}. Only the far more expensive M3 Ultra Mac Studio reaches RTX 5070 class. Translated Windows games run slower still.`],
      ["Can you play Valorant, Warzone or Fortnite on a Mac?", "Not directly. Valorant's Vanguard and Call of Duty's Ricochet anti-cheat don't run on macOS, and Fortnite has no macOS version. All three can be played through cloud gaming services such as GeForce NOW or Xbox Cloud Gaming, which stream the game from a PC."],
      ["How much VRAM does a Mac have?", `Macs share unified memory between the CPU and GPU. macOS lets the GPU use about two-thirds of it, so a 16 GB Mac has about ${Macs.vramFor(16)} GB for graphics and a 36 GB Mac about ${Macs.vramFor(36)} GB. That memory also holds the game and macOS, so it isn't directly comparable to a graphics card's VRAM.`],
      ["Is a MacBook good for gaming?", `For native and light games, yes; for demanding games, a gaming laptop is much faster. In Cyberpunk 2077 at 1080p a MacBook Pro M5 gets about ${f(m5.r[0])} FPS and an RTX 5060 gaming laptop about ${f(l60.r[0])}. MacBooks win on battery life, noise and weight.`],
      ["How much slower are Windows games on a Mac through CrossOver?", `In our model, a Windows game translated through CrossOver or the Game Porting Toolkit runs about ${Math.min(...trLoss)}–${Math.max(...trLoss)}% slower than a native Mac version on Apple Silicon, and some games don't run at all because of anti-cheat.`],
    ],
    related: ["balanced-gaming-pc-build", "budget-gaming-pc-build", "gaming-laptop-bottleneck"],
    cta: { href: "../../mac/", text: "Check your Mac's FPS" },
  };
};
