// Guide: Gaming laptop bottlenecks (TGP, thermals, laptop CPU vs GPU limits)
module.exports = function (h) {
  const { ev, cpu, gpu, pct, gain, fmt, name, verdict, expect, calc, guide, link, table, td, limitTag } = h;

  // Same-name laptop vs desktop graphics cards.
  const PAIRS = [["rtx-4060-laptop", "rtx-4060"], ["rtx-5060-laptop", "rtx-5060"], ["rtx-5070-laptop", "rtx-5070"], ["rtx-5070-ti-laptop", "rtx-5070-ti"], ["rtx-5080-laptop", "rtx-5080"], ["rtx-5090-laptop", "rtx-5090"]];
  // Well-known desktop cards to name the closest match for each laptop GPU.
  const DESK = ["rtx-3060-12gb", "rtx-4060", "rtx-5060", "rtx-4060-ti-8gb", "rtx-5060-ti-16gb", "rtx-4070", "rtx-4070-super", "rtx-5070", "rtx-4070-ti-super", "rtx-5070-ti"];
  const closest = (id) => DESK.reduce((a, b) => Math.abs(gpu(b).g - gpu(id).g) < Math.abs(gpu(a).g - gpu(id).g) ? b : a);
  const gpuGap = (l, d) => Math.round((1 - gpu(l).g / gpu(d).g) * 100);
  const gapTable = table(
    ["Laptop GPU", ["VRAM", true], "Desktop namesake", ["VRAM", true], ["Laptop is slower by", true], "Closest desktop card"],
    PAIRS.map(([l, d]) => [td(`<strong>${name(l)}</strong>`), td(`${gpu(l).vram} GB`, true), td(name(d)), td(`${gpu(d).vram} GB`, true), td(`${gpuGap(l, d)}%`, true), td(name(closest(l)))]),
  );
  const gaps = PAIRS.map(([l, d]) => gpuGap(l, d));
  expect(gaps.every((x) => x >= 5), "every laptop GPU is slower than its desktop namesake");
  const gap5070 = gpuGap("rtx-5070-laptop", "rtx-5070");
  const gap5060 = gpuGap("rtx-5060-laptop", "rtx-5060");
  expect(gap5070 >= 30 && gap5060 <= 15, "the 5070 gap is large, the 5060 gap small");
  expect(Math.abs(gpu("rtx-5070-laptop").g - gpu("rtx-5060-laptop").g) <= 5, "5070 Laptop is close to 5060 Laptop");
  expect(gpu("rtx-5070-laptop").vram < gpu("rtx-5070").vram, "5070 Laptop has less VRAM than desktop 5070");

  // Laptop CPU tiers: CPU limit (independent of GPU and resolution).
  const CPUS = [
    ["ryzen-7-5700u", "U"], ["i5-13420h", "H"], ["ryzen-7-7840hs", "HS"], ["ryzen-7-8845hs", "HS"], ["ultra-9-285h", "H"],
    ["i7-13650hx", "HX"], ["i7-14700hx", "HX"], ["ultra-9-275hx", "HX"], ["ryzen-9-9955hx3d", "HX3D"],
  ];
  const capOf = (c, o = {}) => ev(c, "rtx-5090-laptop", { res: "1080p", ...o }).cpuFps;
  const cpuTable = table(
    ["Laptop CPU", "Class", ["Cores", true], ["CPU limit, AAA", true], ["CPU limit, esports", true]],
    CPUS.map(([c, k]) => [td(`<strong>${name(c)}</strong>`), td(k), td(cpu(c).cores, true), td(fmt(capOf(c)), true), td(fmt(capOf(c, { workload: "esports" })), true)]),
  );
  const hxVsK = gain(capOf("i7-14700k"), capOf("i7-14700hx"));
  const x3dVsDesk = gain(capOf("ryzen-7-9800x3d"), capOf("ryzen-9-9955hx3d"));
  const hxVsH = gain(capOf("i7-14650hx"), capOf("ryzen-7-8845hs"));
  const hVsU = gain(capOf("ryzen-7-7840hs"), capOf("ryzen-7-5700u"));
  expect(hxVsK >= 8 && x3dVsDesk >= 5, "laptop HX chips trail their desktop cousins");
  expect(hxVsH >= 15, "HX is clearly faster than HS in our index");
  expect(hVsU >= 50, "H-class is far faster than U-class");
  expect(cpu("ryzen-ai-9-hx-370").g < cpu("ryzen-9-7945hx").g, "HX 370 is below the 7945HX");

  // Typical pairings.
  const PAIRINGS = [
    ["i5-13420h", "rtx-4050-laptop"], ["ryzen-7-7840hs", "rtx-4060-laptop"], ["i7-13650hx", "rtx-4060-laptop"],
    ["ryzen-7-8845hs", "rtx-5060-laptop"], ["i7-14650hx", "rtx-5060-laptop"], ["ryzen-ai-9-hx-370", "rtx-5070-laptop"],
    ["i7-14700hx", "rtx-5070-laptop"], ["ultra-7-255hx", "rtx-5070-ti-laptop"], ["ultra-9-275hx", "rtx-5080-laptop"], ["ryzen-9-9955hx3d", "rtx-5090-laptop"],
  ];
  const HR = { res: "1080p", quality: "medium", upscale: "quality" }; // typical high-refresh settings
  const SETS = [["1080p High", { res: "1080p" }], ["1440p High", { res: "1440p" }], ["1080p Medium + upscaling", HR]];
  const cell = (c, g, o) => {
    const x = ev(c, g, o);
    return `<td class="r">${calc(c, g, o, fmt(x.fps))}<br>${limitTag(x)}</td>`;
  };
  const pairTable = table(
    ["Laptop", ...SETS.map(([l]) => [l, true])],
    PAIRINGS.map(([c, g]) => [td(`<strong>${name(c)}</strong><br><small>${name(g)}</small>`), ...SETS.map(([, o]) => cell(c, g, o))]),
  );
  const nat = PAIRINGS.map(([c, g]) => ev(c, g, { res: "1080p" }));
  const q = PAIRINGS.map(([c, g]) => ev(c, g, { res: "1440p" }));
  const hr = PAIRINGS.map(([c, g]) => ev(c, g, HR));
  expect(nat.every((x) => x.limiter === "gpu" || x.pct < 10), "native 1080p High: no pairing is meaningfully CPU-limited");
  expect(q.every((x) => x.limiter === "gpu"), "1440p High: every pairing is GPU-limited");
  expect(hr.filter((x) => x.limiter === "cpu" && x.pct >= 10).length >= 6, "1080p medium + upscaling: most pairings turn CPU-limited");
  expect(hr.some((x) => x.limiter === "cpu" && x.pct > 25), "some pairings are more than 25% CPU-limited at high-refresh settings");
  expect(PAIRINGS.length === 10, "copy says 10 pairings");
  const hs = { a: ev("ryzen-7-8845hs", "rtx-5060-laptop", HR), b: ev("i7-14650hx", "rtx-5060-laptop", HR) };
  expect(hs.a.limiter === "cpu" && hs.a.pct >= 20 && hs.b.pct < hs.a.pct && hs.b.fps > hs.a.fps, "same GPU: HS more CPU-limited than HX");
  const hx370 = ev("ryzen-ai-9-hx-370", "rtx-5070-laptop", HR);
  const hx14 = ev("i7-14700hx", "rtx-5070-laptop", HR);
  expect(hx370.limiter === "cpu" && hx370.pct >= 20 && hx14.fps > hx370.fps, "HX 370 + 5070 Laptop is CPU-limited at high-refresh settings");
  const top = ev("ryzen-9-9955hx3d", "rtx-5090-laptop", HR);
  expect(top.limiter === "cpu" && top.pct >= 30, "even the 9955HX3D limits a 5090 Laptop at 1080p medium + upscaling");
  const es = [ev("ultra-9-275hx", "rtx-5080-laptop", { res: "1080p", workload: "esports" }), ev("ryzen-9-9955hx3d", "rtx-5090-laptop", { res: "1080p", workload: "esports" }), ev("ryzen-7-7840hs", "rtx-4060-laptop", { res: "1080p", workload: "esports" })];
  expect(es[0].limiter === "cpu" && es[1].limiter === "cpu" && es[2].limiter === "gpu", "esports: top laptops CPU-bound, 4060 laptop GPU-bound");
  const sim = [ev("ryzen-7-7840hs", "rtx-4060-laptop", { res: "1080p", workload: "cpuheavy" }), ev("i7-13650hx", "rtx-4060-laptop", { res: "1080p", workload: "cpuheavy" })];
  expect(sim.every((x) => x.limiter === "cpu"), "CPU-heavy games are CPU-limited on 4060 laptops at 1080p");
  const v4050 = ev("i5-13420h", "rtx-4050-laptop", { res: "1080p" });
  expect(v4050.vramNeed > gpu("rtx-4050-laptop").vram, "6 GB is short at 1080p High");
  const r5070 = [ev("i7-14700hx", "rtx-5070-laptop", { res: "1440p" }), ev("i7-14700hx", "rtx-5070-laptop", { res: "1440p", upscale: "quality" })];
  expect(r5070[0].fps < 60 && r5070[1].fps >= 70, "5070 Laptop at 1440p needs upscaling");
  const desk = ev("i7-14700k", "rtx-5070", { res: "1440p" });

  return {
    slug: "gaming-laptop-bottleneck",
    title: "Gaming Laptop Bottleneck (2026): TGP, CPU Limits and Thermals",
    description: "Why gaming laptops bottleneck differently: TGP and laptop vs desktop GPUs, HX vs H vs U CPUs, FPS for common pairings, plus MUX, power and cooling fixes.",
    h1: "Gaming laptop bottlenecks: TGP, thermals and CPU vs GPU limits",
    crumb: "Gaming laptop bottleneck",
    card: "Laptop vs desktop GPUs, TGP, HX vs H vs U processors and FPS for common pairings, plus the MUX, power and cooling settings that matter.",
    lead: `A gaming laptop's bottleneck works differently from a desktop's. The CPU and GPU share one power budget and one cooling system, the graphics chip is a cut-down version of its desktop namesake, and two laptops with the same GPU can perform very differently. This guide explains what limits a laptop, with numbers for common pairings from our ${link.calculator("bottleneck calculator")}.`,
    sections: [
      {
        id: "short-answer", toc: "The short answer", h2: "The short answer",
        html: `
          <div class="callout">
            <p><strong>At native resolution and High settings, most gaming laptops are GPU-limited.</strong> None of the 10 common pairings below is meaningfully CPU-limited at 1080p High, and all are GPU-limited at 1440p.</p>
            <p><strong>Chasing a 144 Hz or 240 Hz panel changes that.</strong> Drop to Medium and turn on upscaling, and ${hr.filter((x) => x.limiter === "cpu" && x.pct >= 10).length} of the 10 become CPU-limited, some by more than 25%.</p>
            <p><strong>The GPU name isn't the whole story.</strong> An ${name("rtx-5070-laptop")} is about ${gap5070}% slower than a desktop ${name("rtx-5070")} in our index, and its power limit (TGP) varies by model.</p>
            <p><strong>The biggest free fixes:</strong> plug in, use the performance mode, and switch the MUX to the dedicated GPU.</p>
          </div>`,
      },
      {
        id: "laptop-gpus", toc: "Laptop vs desktop GPUs", h2: "Laptop GPUs aren't desktop GPUs",
        html: `
          <p>NVIDIA uses the same names for laptop and desktop chips, but a laptop GPU has to fit a far smaller power and cooling budget. Some are also built on a smaller chip with less memory. Here's how each compares in our GPU index.</p>
          ${gapTable}
          <p>The gap isn't constant. The ${name("rtx-5060-laptop")} is only ${gap5060}% behind its desktop namesake, while the ${name("rtx-5070-laptop")} is ${gap5070}% behind and lands close to the 5060 Laptop, with 8 GB of VRAM instead of 12. That makes the 5070 Laptop a poor upgrade over a 5060 Laptop unless the price gap is small. At 1440p High, a ${calc("i7-14700hx", "rtx-5070-laptop", { res: "1440p" }, "14700HX with an RTX 5070 Laptop")} manages about ${fmt(r5070[0].fps)} FPS, against ${fmt(desk.fps)} for a desktop 14700K and RTX 5070. Turning on DLSS Quality brings the laptop to about ${fmt(r5070[1].fps)}.</p>
          <p>Memory matters on budget laptops too. The ${name("rtx-4050-laptop")} has ${gpu("rtx-4050-laptop").vram} GB, and AAA games at 1080p High want about ${Math.round(v4050.vramNeed)} GB, so lower the texture setting. Our guide on ${guide("is-8gb-vram-enough", "whether 8 GB of VRAM is enough")} goes into detail.</p>`,
      },
      {
        id: "tgp", toc: "TGP explained", h2: "TGP: why two laptops with the same GPU perform differently",
        html: `
          <p>TGP (total graphics power) is the power limit the laptop maker sets for the graphics chip. NVIDIA allows a wide range for each laptop GPU, so a thin 14-inch laptop and a thick 17-inch one can carry the same RTX 5070 Laptop at very different TGPs. A higher limit lets the GPU hold higher clocks, and the gap between a low-TGP and a high-TGP version of the same chip can be larger than the gap to the next GPU tier.</p>
          <p>Many laptops also use Dynamic Boost, which moves power from the CPU to the GPU when the processor has headroom. The advertised maximum often includes that boost, so the GPU only reaches it when the CPU isn't busy. In CPU-heavy games, that's exactly when it can't.</p>
          <p>Our laptop numbers assume a well-cooled machine running at full power. Thin laptops with lower TGP limits can be 10–25% slower.</p>
          <h3>How to check your laptop's TGP</h3>
          <ol class="steps">
            <li><strong>Check the spec sheet.</strong> Most makers list the GPU's maximum graphics power on the product page, often with the Dynamic Boost figure included.</li>
            <li><strong>Open the NVIDIA Control Panel</strong> and click System Information at the bottom left. On most laptops it lists the GPU's maximum graphics power.</li>
            <li><strong>Measure it under load.</strong> Run a game, then check the GPU power reading in HWiNFO or GPU-Z. If it never gets close to the spec, the laptop is in a quiet mode, on battery or running too hot.</li>
            <li><strong>Read reviews of the exact model.</strong> The same laptop line can ship with different TGPs and coolers across sizes and years.</li>
          </ol>`,
      },
      {
        id: "laptop-cpus", toc: "HX vs H vs U processors", h2: "Laptop CPU tiers: HX, H and U",
        html: `
          <p>Laptop processors come in power classes, and the class tells you more than the brand or the core count.</p>
          <ul>
            <li><strong>HX</strong> chips are desktop-class silicon in a laptop package, with high power limits. They're found in larger gaming laptops and come closest to desktop gaming performance.</li>
            <li><strong>H and HS</strong> chips are mainstream laptop processors with moderate power limits, common in thinner gaming laptops. AMD's Ryzen AI 9 HX 370 belongs closer to this group despite its name.</li>
            <li><strong>U</strong> chips are low-power processors for thin-and-light laptops. They can run a light game, but they hold back any real gaming GPU.</li>
          </ul>
          <p>The table shows each chip's CPU limit in our model: the frame rate it can prepare in AAA games and in esports, whatever the graphics card.</p>
          ${cpuTable}
          <p>The jump between classes is large. The ${name("ryzen-7-7840hs")} has about ${hVsU}% more CPU headroom than a U-series ${name("ryzen-7-5700u")}, and a ${name("i7-14650hx")} about ${hxVsH}% more than a ${name("ryzen-7-8845hs")}. Even the best laptop chips trail their desktop relatives: the ${name("i7-14700hx")} is ${hxVsK}% behind a desktop i7-14700K, and the ${name("ryzen-9-9955hx3d")} ${x3dVsDesk}% behind a desktop 9800X3D.</p>`,
      },
      {
        id: "pairings", toc: "FPS for common pairings", h2: "FPS for common gaming laptop pairings",
        html: `
          <p>Estimated average FPS in AAA games, with the bottleneck underneath. The last column uses Medium settings with DLSS or FSR at Quality, which is how most people try to fill a high-refresh laptop panel. Click any number to open it in the calculator.</p>
          ${pairTable}
          <p>At 1080p and 1440p High, the graphics card sets the frame rate in every pairing, so the CPU barely matters. In the high-refresh column the pattern flips. With the same ${name("rtx-5060-laptop")}, the ${name("ryzen-7-8845hs")} is ${pct(hs.a)}% CPU-limited at about ${fmt(hs.a.fps)} FPS, while the ${name("i7-14650hx")} reaches ${fmt(hs.b.fps)}. The ${name("ryzen-ai-9-hx-370")} holds an ${name("rtx-5070-laptop")} back by ${pct(hx370)}%, and even the ${name("ryzen-9-9955hx3d")} is ${pct(top)}% CPU-limited with an ${name("rtx-5090-laptop")}.</p>`,
      },
      {
        id: "high-refresh", toc: "Why high refresh hits the CPU", h2: "Why 1080p high-refresh laptops run into the CPU",
        html: `
          <p>Lower settings and upscaling cut the GPU's work per frame, but the CPU's work per frame stays roughly the same. Push for 165 or 240 FPS and the processor becomes the limit long before the graphics chip does. In CS2-style esports at 1080p, a ${name("ultra-9-275hx")} with an ${name("rtx-5080-laptop")} is ${pct(es[0])}% CPU-limited at about ${fmt(es[0].fps)} FPS, while a ${name("ryzen-7-7840hs")} with an ${name("rtx-4060-laptop")} is still GPU-limited at ${fmt(es[2].fps)}. In CPU-heavy strategy and simulation games, even the 4060 laptops are CPU-limited at 1080p (about ${fmt(sim[0].fps)} FPS with the 7840HS and ${fmt(sim[1].fps)} with the ${name("i7-13650hx")}).</p>
          <p>A laptop adds a second limit our model doesn't capture: shared power and heat. When the GPU is working hard, the CPU often gets less power and lower clocks than it would on its own, which can make CPU-bound games worse on a hot or thin laptop. If GPU usage sits well below 90% while the frame rate stays below your refresh rate, the processor or its power limit is the bottleneck. The ${guide("how-to-check-for-bottleneck", "how to check for a bottleneck guide")} shows how to read that overlay.</p>`,
      },
      {
        id: "fixes", toc: "Getting full performance", h2: "How to get full performance from a gaming laptop",
        html: `
          <ol class="steps">
            <li><strong>Plug in.</strong> On battery, laptops cut GPU and CPU power sharply and often cap the frame rate. Expect a much lower result.</li>
            <li><strong>Use the performance mode</strong> in the maker's control app. Quiet and balanced modes lower power limits for both chips.</li>
            <li><strong>Switch the MUX to the dedicated GPU.</strong> In hybrid mode, frames pass through the integrated graphics on the way to the screen, which costs performance, most of all at high frame rates. A MUX switch (often labeled dGPU or discrete mode) wires the GPU straight to the panel, usually after a restart. Laptops with NVIDIA Advanced Optimus switch automatically. Without a MUX, an external monitor connected to a port wired to the dedicated GPU gets the same benefit on many laptops.</li>
            <li><strong>Give it air.</strong> Use it on a hard surface, keep the vents clear and clean dust from the fans. A cooling pad or simply raising the back a few centimeters lowers temperatures by a few degrees, which can mean steadier clocks.</li>
            <li><strong>Try a GPU undervolt.</strong> Lowering the GPU's voltage curve with a tool such as MSI Afterburner can keep clocks the same at less power and heat. Go in small steps and test for stability. CPU undervolting is locked on many recent laptops.</li>
            <li><strong>Cap the frame rate</strong> just under your refresh rate when you're CPU-limited. It smooths frame pacing and keeps the laptop cooler.</li>
          </ol>
          <p>For per-game estimates, the ${link.fps("FPS calculator")} includes laptop parts. If you're choosing between a laptop, a desktop and a Mac, our ${guide("mac-vs-gaming-pc", "Mac vs gaming PC guide")} compares them.</p>`,
      },
    ],
    faq: [
      ["Is a laptop RTX 5070 as fast as a desktop RTX 5070?", `No. In our index the RTX 5070 Laptop GPU is about ${gap5070}% slower than the desktop RTX 5070 and has 8 GB of VRAM instead of 12 GB. It performs closer to an RTX 5060 Laptop. Its exact speed also depends on the TGP the laptop maker chose.`],
      ["What is TGP on a gaming laptop?", "TGP (total graphics power) is the power limit the laptop maker sets for the graphics chip. The same GPU can run at very different TGPs in different laptops, and a higher TGP means higher sustained clocks. Check it on the spec sheet or in the NVIDIA Control Panel under System Information."],
      ["Do gaming laptops have CPU bottlenecks?", `At native 1080p or 1440p with High settings, most are GPU-limited. At 1080p with Medium settings and upscaling, which is how people chase 144–240 Hz, most common pairings become CPU-limited, especially with H-series processors. An HX processor holds up better.`],
      ["Is an HX processor worth it in a gaming laptop?", `For high-refresh gaming, yes. In our model an Intel Core i7-14650HX has about ${hxVsH}% more CPU headroom than a Ryzen 7 8845HS. At native resolution with High settings the GPU usually sets the frame rate, so the difference matters less there.`],
      ["Does a MUX switch improve gaming performance?", "Yes. In hybrid mode, frames go through the integrated graphics before reaching the screen, which costs performance, most of all at high frame rates. Switching the MUX to the dedicated GPU, or using a laptop with Advanced Optimus, removes that step."],
      ["Why is my gaming laptop slower on battery?", "Laptops cut CPU and GPU power sharply on battery to protect battery life, and many also cap the frame rate. Plug in and select the maker's performance mode for full speed."],
    ],
    related: ["how-to-check-for-bottleneck", "mac-vs-gaming-pc", "is-8gb-vram-enough"],
  };
};
