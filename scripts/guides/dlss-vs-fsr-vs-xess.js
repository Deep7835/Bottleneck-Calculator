// Guide: DLSS vs FSR vs XeSS (upscaling, frame generation, and why neither fixes a CPU bottleneck)
module.exports = function (h) {
  const { Engine, ev, res, pct, gain, fmt, name, expect, calc, compare, guide, link, table, td, limitTag } = h;

  const UP = ["off", "quality", "balanced", "performance"];
  const UPN = { off: "Native (off)", quality: "Quality", balanced: "Balanced", performance: "Performance" };

  // Render resolution behind each preset (DLSS and FSR use near-identical per-axis scales).
  const SCALE = { quality: 2 / 3, balanced: 0.58, performance: 0.5 };
  const OUT = [["1080p", 1920, 1080], ["1440p", 2560, 1440], ["4k", 3840, 2160]];
  const dims = (w, hh, s) => `${fmt(w * s)} × ${fmt(hh * s)}`;
  const share = (s) => Math.round(s * s * 100);
  const resTable = table(
    ["Output", ...["quality", "balanced", "performance"].map((u) => [`${UPN[u]} <small>(${Math.round(SCALE[u] * 100)}%)</small>`, true])],
    OUT.map(([k, w, hh]) => [td(res(k)), ...["quality", "balanced", "performance"].map((u) => td(dims(w, hh, SCALE[u]), true))]),
  );
  const fpsGainQ = Math.round((Engine.UPSCALE.quality.gpu - 1) * 100);
  const fpsGainP = Math.round((Engine.UPSCALE.performance.gpu - 1) * 100);
  expect(1 / (SCALE.quality ** 2) - 1 > Engine.UPSCALE.quality.gpu - 1, "Quality renders far fewer pixels than its FPS gain suggests");

  // The same presets on a GPU-bound, a borderline and a CPU-bound build.
  const CASES = [
    ["ryzen-7-7800x3d", "rtx-5070", { res: "4k" }, "4K, AAA"],
    ["ryzen-7-7800x3d", "rtx-5070", { res: "4k", workload: "raytracing" }, "4K, ray tracing"],
    ["ryzen-5-5600", "rtx-4060", { res: "1080p" }, "1080p, AAA"],
    ["ryzen-5-3600", "rtx-5070-ti", { res: "1080p" }, "1080p, AAA"],
  ];
  const cases = CASES.map(([c, g, o, label]) => ({ c, g, o, label, r: UP.map((u) => ev(c, g, { ...o, upscale: u })) }));
  const [k4, rt4, mid, cb] = cases;
  expect(k4.r[0].limiter === "gpu" && gain(k4.r[1].fps, k4.r[0].fps) >= 35 && gain(k4.r[3].fps, k4.r[0].fps) >= 75, "GPU-bound 4K: Quality +35%, Performance +75%");
  expect(rt4.r[0].fps < 40 && rt4.r[1].fps >= 45 && rt4.r[3].fps >= 60, "4K ray tracing: under 40 native, 60+ with Performance");
  expect(mid.r[0].limiter === "gpu" && mid.r[2].limiter === "cpu" && gain(mid.r[3].fps, mid.r[2].fps) <= 5, "5600 + 4060 at 1080p turns CPU-bound and stops scaling");
  expect(cb.r[0].limiter === "cpu" && cb.r.every((x) => Math.abs(x.fps - cb.r[0].fps) < 2), "CPU-bound: upscaling adds nothing");
  expect(cb.r[3].gpuFps > cb.r[0].gpuFps * 1.7, "CPU-bound: upscaling raises the GPU ceiling, not the frame rate");
  const upTable = table(
    ["Preset", ...cases.map((x) => [`${name(x.c)} + ${name(x.g)}<br><small>${x.label}</small>`, true])],
    UP.map((u, i) => [
      td(UPN[u]),
      ...cases.map((x) => `<td class="r">${calc(x.c, x.g, { ...x.o, upscale: u }, fmt(x.r[i].fps))}${i ? ` <small>${gain(x.r[i].fps, x.r[0].fps) > 0 ? "+" : "±"}${gain(x.r[i].fps, x.r[0].fps)}%</small>` : ""}<br>${limitTag(x.r[i])}</td>`),
    ]),
  );

  // Which GPU families support what. Derived from the part id so the table can't drift from hardware.js.
  const FAM = [
    ["rtx-5070", "GeForce RTX 50"],
    ["rtx-4060", "GeForce RTX 40"],
    ["rtx-3060-12gb", "GeForce RTX 20 and 30"],
    ["gtx-1660-super", "GeForce GTX 16"],
    ["rx-9070-xt", "Radeon RX 9000"],
    ["rx-7800-xt", "Radeon RX 6000 and 7000"],
    ["arc-b580", "Intel Arc A and B series"],
  ];
  const sup = (id) => {
    const rtx = /^rtx-(\d)0/.exec(id);
    const gen = rtx ? +rtx[1] : 0;
    return {
      dlss: gen >= 2 ? "Yes" : "No",
      fg: gen >= 4 ? "Yes" : "No",
      mfg: gen >= 5 ? "Yes" : "No",
      fsr4: /^rx-9/.test(id) ? "Yes" : "No",
      fsr3: /^gtx-/.test(id) ? "Upscaling only" : "Yes",
      xess: /^arc-/.test(id) ? "Yes (XMX)" : "Yes (DP4a)",
    };
  };
  const supTable = table(
    ["Graphics cards", "DLSS upscaling", "DLSS Frame Gen", "Multi Frame Gen", "FSR 4", "FSR 3.1", "XeSS"],
    FAM.map(([id, fam]) => { const s = sup(id); return [td(`<strong>${fam}</strong><br><small>e.g. ${name(id)}</small>`), td(s.dlss), td(s.fg), td(s.mfg), td(s.fsr4), td(s.fsr3), td(s.xess)]; }),
  );

  // Frame generation: what the base frame rate means for output and feel.
  const BASES = [30, 45, 60, 90];
  const ms = (f) => (1000 / f).toFixed(1);
  const FEEL = {
    30: "Looks smoother, still feels like 30 FPS. Artifacts are easy to spot. Avoid.",
    45: "Usable in slow games with a controller. Mouse aiming feels heavy.",
    60: "The usual recommended minimum. Feels close to normal in single-player games.",
    90: "Ideal. Little visible artifacting, and latency stays low.",
  };
  const fgTable = table(
    [["Base FPS", true], ["Base frame time", true], ["2x output, up to", true], ["4x output, up to", true], "How it plays"],
    BASES.map((b) => [td(fmt(b), true), td(`${ms(b)} ms`, true), td(fmt(b * 2), true), td(fmt(b * 4), true), td(FEEL[b])]),
  );
  const cbase = cb.r[0];
  expect(cbase.fps >= 60, "CPU-bound example has a 60+ base frame rate for frame generation");

  return {
    slug: "dlss-vs-fsr-vs-xess",
    title: "DLSS vs FSR vs XeSS (2026): Upscaling and Frame Generation Explained",
    description: "DLSS, FSR and XeSS compared: how much FPS each preset adds, which graphics cards support what, frame generation latency, and why upscaling can't fix a CPU bottleneck.",
    h1: "DLSS vs FSR vs XeSS: upscaling, frame generation and CPU bottlenecks",
    crumb: "DLSS vs FSR vs XeSS",
    card: "What each upscaling preset is worth, which GPUs support DLSS, FSR 4 and XeSS, how frame generation affects latency, and why none of it fixes a CPU bottleneck.",
    lead: "DLSS, FSR and XeSS all do the same basic job: render fewer pixels and rebuild a sharp image at your monitor's resolution. The differences are in image quality, which graphics cards they run on, and the extras that come with them, such as frame generation. The one thing none of them can do is speed up your processor.",
    sections: [
      {
        id: "short-answer", toc: "The short answer", h2: "The short answer",
        html: `
          <p><strong>On an NVIDIA RTX card, use DLSS.</strong> It's generally the best-looking upscaler. <strong>On a Radeon RX 9000 card, use FSR 4.</strong> <strong>On anything else</strong>, including older Radeon and GTX cards, use FSR 3.1 or XeSS, whichever looks better in the game you're playing. On an Intel Arc card, XeSS runs on the card's own AI hardware and is usually the better choice.</p>
          <p>Upscaling is one of the most effective ways to raise FPS, but only when the <strong>graphics card</strong> is the limit. If your PC is CPU-bound, it adds nothing. Frame generation is different again: it makes motion look smoother without making the game respond faster.</p>`,
      },
      {
        id: "how", toc: "How upscaling works", h2: "How upscaling works, and what the presets mean",
        html: `
          <p>An upscaler renders each frame at a lower internal resolution, then uses motion data from the game and previous frames to reconstruct a full-resolution image. DLSS, FSR 4 and XeSS on Arc cards use machine learning for the reconstruction. FSR 3.1 and older use a hand-tuned algorithm that runs on any modern GPU.</p>
          <p>The presets set the internal resolution. DLSS and FSR use almost the same scale factors per axis, while XeSS names its presets similarly but its ratios have shifted between versions:</p>
          ${resTable}
          <p>Quality mode renders only about ${share(SCALE.quality)}% of the pixels, and Performance mode ${share(SCALE.performance)}%, yet the frame rate doesn't rise in proportion. Some of each frame's work doesn't depend on resolution, and the upscaler itself takes time to run. In our model, Quality raises the graphics card's frame-rate limit by about ${fpsGainQ}% and Performance by about ${fpsGainP}%.</p>
          <p>Output resolution matters for image quality. At 4K, Quality mode starts from a 1440p image and usually looks very close to native. At 1080p, Quality starts from 720p, so there's much less detail to work with and the softness is easier to see. As a rule: Quality at 1080p, Quality or Balanced at 1440p, and Performance is often fine at 4K.</p>`,
      },
      {
        id: "cpu-bound", toc: "Why it can't fix a CPU bottleneck", h2: "What upscaling is worth, and why it can't fix a CPU bottleneck",
        html: `
          <p>Here are the same four presets on four builds, from fully GPU-bound to fully CPU-bound, as estimated by the ${link.calculator("bottleneck calculator")}:</p>
          ${upTable}
          <p><strong>GPU-bound at 4K:</strong> the ${name(k4.g)} gains ${gain(k4.r[1].fps, k4.r[0].fps)}% at Quality and ${gain(k4.r[3].fps, k4.r[0].fps)}% at Performance. With ray tracing on, it goes from ${fmt(rt4.r[0].fps)} FPS native to ${fmt(rt4.r[3].fps)} at Performance. That's what upscaling is for.</p>
          <p><strong>Borderline:</strong> the ${name(mid.c)} with an ${name(mid.g)} at 1080p starts GPU-limited, but from Balanced on it's limited by the processor instead, and Performance adds only ${gain(mid.r[3].fps, mid.r[2].fps)}% over Balanced. Upscaling only helps until the CPU becomes the limit.</p>
          <p><strong>CPU-bound:</strong> the ${name(cb.c)} with an ${name(cb.g)} stays at about ${fmt(cbase.fps)} FPS whatever the preset. Upscaling raises the card's limit from ${fmt(cb.r[0].gpuFps)} to ${fmt(cb.r[3].gpuFps)} FPS, but the processor can only prepare about ${fmt(cbase.cpuFps)} frames per second, so the extra capacity goes unused. The bottleneck grows from ${pct(cb.r[0])}% to ${pct(cb.r[3])}%.</p>
          <div class="callout"><p><strong>If you're CPU-bound, do the opposite.</strong> Turn upscaling off, or use DLAA, FSR Native AA or XeSS Native AA, which apply the same reconstruction at full resolution for a cleaner image. You lose few or no frames, because the graphics card had capacity to spare. For real CPU fixes, see our guide on ${guide("how-to-fix-cpu-bottleneck", "fixing a CPU bottleneck")}.</p></div>`,
      },
      {
        id: "support", toc: "Which GPUs support what", h2: "Which graphics cards support DLSS, FSR and XeSS",
        html: `
          ${supTable}
          <ul>
            <li><strong>DLSS</strong> needs an NVIDIA RTX card, because it runs on the Tensor cores. Every RTX generation gets the upscaler. DLSS Frame Generation needs RTX 40 or newer, and DLSS 4 Multi Frame Generation, which generates several frames for each rendered one, is limited to RTX 50 cards.</li>
            <li><strong>FSR 4</strong> is AMD's machine-learning upscaler, built for the RDNA 4 architecture in the Radeon RX 9000 series. Older Radeon cards use FSR 3.1.</li>
            <li><strong>FSR 3.1</strong> is open and vendor-neutral. Its upscaling runs on practically any modern graphics card, including NVIDIA and Intel ones, and its frame generation works on most recent cards too.</li>
            <li><strong>XeSS</strong> runs on any recent GPU. On Intel Arc it uses the cards' XMX AI units, which gives better image quality and speed. On other cards it falls back to a slower DP4a path.</li>
          </ul>
          <p>Support also depends on the game: each one has to include the technique, and many offer two or all three. Choosing a card partly on upscaler support is reasonable. Our comparisons of the ${compare("rtx-5070-ti", "rx-9070-xt", `${name("rtx-5070-ti")} vs ${name("rx-9070-xt")}`)}, ${compare("rx-9070", "rtx-5070", `${name("rx-9070")} vs ${name("rtx-5070")}`)} and ${compare("rtx-5060", "arc-b580", `${name("rtx-5060")} vs ${name("arc-b580")}`)} cover the raw performance side.</p>`,
      },
      {
        id: "quality", toc: "Image quality", h2: "Image quality: how they compare",
        html: `
          <p>Image quality varies from game to game and version to version, so treat this as a general picture rather than a ranking that holds everywhere:</p>
          <ul>
            <li><strong>DLSS</strong> is broadly regarded as the most consistent, especially since the transformer-based model introduced with DLSS 4. Fine detail and motion hold up well even in Performance mode at 4K. The NVIDIA App can switch many games to a newer DLSS model.</li>
            <li><strong>FSR 4</strong> is a large step up from FSR 3.1 and is generally considered close to DLSS, though only in games that support it and only on RX 9000 cards.</li>
            <li><strong>FSR 3.1</strong> works everywhere but shows more shimmering on fine detail such as foliage and fences, and more ghosting behind moving objects, particularly at 1080p and in Performance mode.</li>
            <li><strong>XeSS</strong> on Arc cards is generally competitive with the better upscalers. The DP4a version on other cards looks softer and gives a smaller FPS boost.</li>
          </ul>
          <p>If a game offers several upscalers, try each at the same preset in a scene with foliage and fast movement. Your own eyes are the best judge.</p>`,
      },
      {
        id: "frame-gen", toc: "Frame generation and latency", h2: "Frame generation: smoother motion, not lower latency",
        html: `
          <p>Frame generation creates extra frames between the ones the game actually renders. DLSS Frame Generation and FSR Frame Generation insert one frame per rendered frame (2x). DLSS 4 Multi Frame Generation on RTX 50 cards launched with 3x and 4x modes. Because generated frames need no work from the processor, frame generation is the one GPU feature that raises the displayed frame rate of a CPU-bound game.</p>
          <p>There are two catches. First, the game still responds at the <strong>base</strong> frame rate, the frames it actually renders, and frame generation holds back a frame to interpolate between, which adds some latency on top. Second, generated frames are guesses, and the lower the base frame rate, the bigger the gap between real frames and the more visible the mistakes.</p>
          ${fgTable}
          <p>This is the reason for the common advice to reach about <strong>60 FPS before turning frame generation on</strong>. It also tells you when multi frame generation makes sense: 4x from a base of ${fmt(BASES[2])} produces up to ${fmt(BASES[2] * 4)} FPS, which only a ${fmt(BASES[2] * 4)} Hz or faster monitor can show. On a 144 Hz screen, 2x is usually enough.</p>
          <p>For the CPU-bound ${calc(cb.c, cb.g, cb.o, `${name(cb.c)} + ${name(cb.g)}`)} above, with a base of about ${fmt(cbase.fps)} FPS, 2x frame generation could put up to ${fmt(cbase.fps * 2)} frames on screen. It will look much smoother but still respond like ${fmt(cbase.fps)} FPS. That's a good trade in a single-player game and a bad one in a competitive shooter.</p>`,
      },
      {
        id: "latency", toc: "Reflex and Anti-Lag", h2: "Reflex, Anti-Lag and keeping latency in check",
        html: `
          <p><strong>NVIDIA Reflex</strong> cuts input latency by stopping the processor from queuing frames ahead of the graphics card. It helps most when the GPU is the limit, which is exactly when the queue builds up. Games with DLSS Frame Generation include Reflex and turn it on with frame generation, which recovers much of the added delay.</p>
          <p><strong>AMD Anti-Lag 2</strong> does the same job on Radeon cards in games that build it in, and is the recommended companion to FSR Frame Generation. The older driver-level Anti-Lag works more broadly but less effectively. Intel offers its own low-latency mode alongside XeSS in supported games.</p>
          <p>Turn these on in any competitive game that offers them, with or without frame generation. They cost nothing in frame rate. To decide what frame rate you actually need, see our guide to ${guide("what-is-a-good-fps", "good frame rates")}, and for the other settings that help, our guide on ${guide("how-to-increase-fps", "increasing FPS")}.</p>`,
      },
    ],
    faq: [
      ["Is DLSS better than FSR?", "DLSS generally gives better image quality than FSR 3.1, with less shimmering and ghosting, but it only runs on NVIDIA RTX cards. FSR 4 on Radeon RX 9000 cards closes most of the gap. FSR 3.1 runs on almost any graphics card, which makes it the fallback for everyone else."],
      ["Can I use DLSS on an AMD graphics card?", "No. DLSS runs on NVIDIA's Tensor cores and needs a GeForce RTX card. On AMD cards, use FSR, or XeSS, which also runs on Radeon and GeForce cards through its DP4a fallback."],
      ["Does DLSS or FSR fix a CPU bottleneck?", `No. Upscaling lowers the graphics card's workload, and a CPU-bound game isn't waiting on the graphics card. In our example, a ${name(cb.c)} with an ${name(cb.g)} at 1080p stays at about ${fmt(cbase.fps)} FPS with upscaling off or on Performance. Frame generation can raise the displayed frame rate, but the game still responds at the base frame rate.`],
      ["Does frame generation add input lag?", "Yes, a little. The game has to hold back a rendered frame to generate the one in between, and it still responds at the base frame rate. NVIDIA Reflex or AMD Anti-Lag 2 recover much of the delay. It's best used from a base of about 60 FPS and avoided in competitive shooters."],
      ["Which GPUs support DLSS 4 Multi Frame Generation?", "Only GeForce RTX 50 series cards. RTX 40 cards support standard DLSS Frame Generation, which inserts one frame per rendered frame, and every RTX card from the 20 series on supports DLSS upscaling."],
      ["Should I use Quality, Balanced or Performance?", "Use Quality at 1080p, Quality or Balanced at 1440p, and Balanced or Performance at 4K, where the upscaler has more pixels to work with. Lower presets give more FPS but a softer, less stable image, especially at lower output resolutions."],
    ],
    related: ["how-to-increase-fps", "how-to-fix-cpu-bottleneck", "what-is-a-good-fps"],
  };
};
