/*
 * Motion helpers: count-up numbers, the live frame pipeline, scroll reveals,
 * header state and table-of-contents tracking. Everything respects
 * prefers-reduced-motion and pauses when off screen.
 */
(function () {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => mq.matches;
  const css = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

  // ---------- Count-up numbers ----------
  const counting = new Set(); // elements with a count-up, so printing can snap them to the final value
  function countUp(el, to, format, duration = 700) {
    const from = el._v ?? 0;
    el._v = to;
    el._fmt = format;
    counting.add(el);
    cancelAnimationFrame(el._raf);
    if (reduced() || Math.abs(from - to) < 0.5) { el.textContent = format(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = format(from + (to - from) * e);
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  // ---------- Frame pipeline ----------
  // Frames travel CPU → GPU → Display. Frames queue in front of the GPU when it is
  // the limit, and arrive unevenly when the CPU is the limit (worse frame pacing).
  function Pipeline(canvas, nodes, toneEl) {
    const ctx = canvas.getContext("2d");
    const TRAVEL = 1.1; // seconds per lane
    let W = 0, H = 0, lanes = [];
    let a = [], b = [];
    let rate = 8, queue = 0, jitter = 0, nextSpawn = 0;
    let colors = { dot: "#34d399", tone: "#34d399", track: "rgba(255,255,255,.12)" };
    let running = false, visible = true, last = 0;

    function measure() {
      const box = canvas.getBoundingClientRect();
      if (!box.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = box.width; H = box.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const edge = (el) => { const r = el.getBoundingClientRect(); return { l: r.left - box.left, r: r.right - box.left }; };
      const c = edge(nodes.cpu), g = edge(nodes.gpu), d = edge(nodes.display);
      lanes = [{ x0: c.r + 8, x1: g.l - 8 }, { x0: g.r + 8, x1: d.l - 8 }];
      readColors();
      draw();
    }

    function readColors() {
      colors.dot = css(document.documentElement, "--text-2") || colors.dot;
      colors.tone = css(toneEl, "--tone") || css(document.documentElement, "--accent");
      colors.track = css(document.documentElement, "--border-strong");
    }

    function set(r) {
      rate = Math.max(2.5, Math.min(26, r.fps / 7));
      queue = r.limiter === "gpu" && r.pct >= 10 ? Math.min(4, 1 + Math.round(r.pct / 15)) : 0;
      jitter = r.limiter === "cpu" ? Math.min(0.9, r.pct / 40) : 0;
      requestAnimationFrame(() => { readColors(); draw(); });
      kick();
    }

    function frame(x, y, color, alpha = 1, s = 7) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x - s / 2, y - s / 2, s, s, 2) : ctx.rect(x - s / 2, y - s / 2, s, s);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    function draw() {
      if (!W || lanes.length < 2) return;
      ctx.clearRect(0, 0, W, H);
      const y = H / 2;
      ctx.strokeStyle = colors.track;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      for (const l of lanes) { ctx.beginPath(); ctx.moveTo(l.x0, y); ctx.lineTo(l.x1, y); ctx.stroke(); }
      ctx.setLineDash([]);

      if (reduced()) {
        // Static picture: evenly spaced frames plus the queue.
        for (const l of lanes) for (let i = 1; i <= 3; i++) frame(l.x0 + ((l.x1 - l.x0) * i) / 4, y, colors.dot, 0.9);
      } else {
        for (const p of a) frame(lanes[0].x0 + (lanes[0].x1 - lanes[0].x0) * p, y, colors.dot, fade(p));
        for (const p of b) frame(lanes[1].x0 + (lanes[1].x1 - lanes[1].x0) * p, y, colors.dot, fade(p));
      }
      // Waiting frames stacked in front of the GPU.
      for (let i = 0; i < queue; i++) frame(lanes[0].x1 - 4 - i * 11, y, colors.tone, 1 - i * 0.15, 8);
    }

    const fade = (p) => Math.min(1, p * 6, (1 - p) * 6);

    function tick(t) {
      if (!running) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      if (lanes.length < 2) { requestAnimationFrame(tick); return; } // not measured yet
      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        a.push(0);
        const base = 1 / rate;
        nextSpawn = base * (1 + (Math.random() * 2 - 1) * jitter);
      }
      const v = dt / TRAVEL;
      const qEnd = queue ? 1 - (queue * 11) / Math.max(1, lanes[0].x1 - lanes[0].x0) : 1;
      for (let i = a.length - 1; i >= 0; i--) {
        a[i] += v;
        if (a[i] >= qEnd) { a.splice(i, 1); b.push(0); }
      }
      for (let i = b.length - 1; i >= 0; i--) {
        b[i] += v;
        if (b[i] >= 1) b.splice(i, 1);
      }
      draw();
      requestAnimationFrame(tick);
    }

    function kick() {
      const should = visible && !document.hidden && !reduced();
      if (should && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
      if (!should) { running = false; draw(); }
    }

    new ResizeObserver(measure).observe(canvas);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", kick);
    mq.addEventListener?.("change", () => { kick(); draw(); });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { readColors(); draw(); });
    window.addEventListener("themechange", () => requestAnimationFrame(() => { readColors(); draw(); }));
    return { set, measure };
  }

  // ---------- Page-level motion ----------
  function initPage() {
    initWordmark();
    initTheme();
    initSearch();
    initToTop();
    initProgress();
    // Printing: expand every FAQ answer so nothing is hidden on paper.
    window.addEventListener("beforeprint", () => {
      document.querySelectorAll(".faq details, .article details").forEach((d) => (d.open = true));
      counting.forEach((el) => { cancelAnimationFrame(el._raf); el.textContent = el._fmt(el._v); });
    });

    // Close the compact header menu on outside click or Escape.
    const drops = document.querySelectorAll(".site-header details");
    drops.forEach((d) => d.addEventListener("toggle", () => { if (d.open) drops.forEach((o) => { if (o !== d) o.open = false; }); }));
    document.addEventListener("click", (e) => drops.forEach((d) => { if (d.open && !d.contains(e.target)) d.open = false; }));
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      drops.forEach((d) => { if (d.open) { d.open = false; d.querySelector("summary").focus(); } });
    });

    // Scroll reveals
    document.querySelectorAll(".article > section").forEach((s) => s.classList.add("reveal"));
    const targets = document.querySelectorAll(".reveal, .reveal-group");
    if ("IntersectionObserver" in window && !reduced()) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      targets.forEach((t) => io.observe(t));
    } else {
      targets.forEach((t) => t.classList.add("in"));
    }

    // Header hairline once the page scrolls
    const header = document.querySelector(".site-header");
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { header.classList.toggle("scrolled", window.scrollY > 8); ticking = false; });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Highlight the current section in the table of contents
    const links = new Map([...document.querySelectorAll(".toc a")].map((a) => [a.getAttribute("href").slice(1), a]));
    if ("IntersectionObserver" in window && links.size) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach((a) => a.classList.remove("active"));
          links.get(e.target.id)?.classList.add("active");
        }
      }, { rootMargin: "-20% 0px -70% 0px" });
      links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  // ---------- Light/dark switch (choice saved in localStorage as "theme") ----------
  function initTheme() {
    const btns = document.querySelectorAll(".theme-btn, .menu-theme");
    const btn = document.querySelector(".theme-btn");
    if (!btns.length) return;
    const html = document.documentElement;
    const light = window.matchMedia("(prefers-color-scheme: light)");
    const current = () => html.dataset.theme || (light.matches ? "light" : "dark");
    btns.forEach((b) => b.addEventListener("click", () => {
      const next = current() === "light" ? "dark" : "light";
      html.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch {}
      if (btn) { btn.classList.add("spin"); setTimeout(() => btn.classList.remove("spin"), 500); }
      window.dispatchEvent(new Event("themechange"));
    }));
  }

  // ---------- Site search: loads search.js and the index only when first opened ----------
  function initSearch() {
    const btn = document.querySelector(".search-btn");
    if (!btn) return;
    const me = document.querySelector('script[src*="assets/js/motion.js"]');
    const base = me ? me.getAttribute("src").replace(/motion\.js.*$/, "") : "assets/js/";
    const ver = me ? (me.getAttribute("src").match(/\?v=\d+/) || [""])[0] : "";
    let loading = null;
    const open = () => {
      if (window.SiteSearch) return window.SiteSearch.open();
      loading = loading || new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = `${base}search.js${ver}`; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
      loading.then(() => window.SiteSearch.init(btn.dataset.root || "", ver)).then(() => window.SiteSearch.open());
    };
    btn.addEventListener("click", open);
    document.addEventListener("keydown", (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); open(); }
    });
  }

  // ---------- Back to top ----------
  function initToTop() {
    const b = document.createElement("button");
    b.type = "button"; b.className = "to-top"; b.setAttribute("aria-label", "Back to top");
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    b.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
      document.querySelector(".skip")?.focus({ preventScroll: true });
    });
    document.body.appendChild(b);
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { b.classList.toggle("show", window.scrollY > window.innerHeight * 1.5); ticking = false; });
    }, { passive: true });
  }

  // ---------- Reading progress for long articles (marked with data-progress) ----------
  function initProgress() {
    const art = document.querySelector("[data-progress]");
    if (!art) return;
    const bar = document.createElement("div");
    bar.className = "read-progress"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      const r = art.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const k = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
      bar.style.transform = `scaleX(${k})`;
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ---------- Footer wordmark spotlight ----------
  // Mouse: the striped letters light up under the cursor, easing after it.
  // Touch: one slow sweep across when the footer scrolls into view.
  function initWordmark() {
    const wm = document.querySelector(".wordmark");
    if (!wm || reduced()) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const set = () => { wm.style.setProperty("--mx", x + "px"); wm.style.setProperty("--my", y + "px"); };
    const loop = () => {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16; set();
      raf = Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4 ? requestAnimationFrame(loop) : 0;
    };

    if (window.matchMedia("(hover: hover)").matches) {
      const footer = wm.closest(".site-footer") || wm;
      footer.addEventListener("pointermove", (e) => {
        const r = wm.getBoundingClientRect();
        const inside = e.clientY > r.top - 60 && e.clientY < r.bottom + 40;
        if (!inside) { wm.classList.remove("lit"); return; }
        tx = e.clientX - r.left; ty = e.clientY - r.top;
        if (!wm.classList.contains("lit")) { x = tx; y = ty; set(); wm.classList.add("lit"); }
        if (!raf) raf = requestAnimationFrame(loop);
      });
      footer.addEventListener("pointerleave", () => wm.classList.remove("lit"));
    } else if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const w = wm.clientWidth, t0 = performance.now(), dur = 2600;
        y = ty = wm.clientHeight * 0.45;
        wm.classList.add("lit");
        const sweep = (t) => {
          const k = Math.min(1, (t - t0) / dur), ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          x = -150 + (w + 300) * ease; set();
          if (k < 1) requestAnimationFrame(sweep); else wm.classList.remove("lit");
        };
        requestAnimationFrame(sweep);
      }, { threshold: 0.6 });
      io.observe(wm);
    }
  }

  // Static pages: start every pipeline that carries its result in data attributes.
  function autoPipelines() {
    document.querySelectorAll(".pipeline[data-fps]").forEach((el) => {
      const nodes = { cpu: el.querySelector(".node-cpu"), gpu: el.querySelector(".node-gpu"), display: el.querySelector(".node-display") };
      Pipeline(el.querySelector("canvas"), nodes, el.closest(".results") || el)
        .set({ fps: +el.dataset.fps, limiter: el.dataset.limiter, pct: +el.dataset.pct });
    });
  }

  window.Motion = { countUp, Pipeline, initPage, autoPipelines, reduced };
})();
