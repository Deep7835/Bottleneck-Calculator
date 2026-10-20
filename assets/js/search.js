/*
 * Site search. motion.js loads this file the first time someone opens search
 * (button, "/" or Ctrl/⌘+K); the page index is built by scripts/build.js.
 */
(function () {
  const WEIGHT = { Tool: 6, Hub: 5, Guide: 4, Mac: 3, Compare: 2.5, Build: 2, Info: 1.5, "Español": 1, "日本語": 1 };
  const LABEL = { Tool: "Tool", Hub: "Section", Guide: "Guide", Mac: "Mac", Compare: "Comparison", Build: "Build", Info: "Page", "Español": "Español", "日本語": "日本語" };
  // Same shorthand the part pickers accept: "r5 5600" → "ryzen 5 5600".
  const norm = (s) => s.toLowerCase().replace(/\br\s?([3579])\b/g, "ryzen $1").replace(/geforce|radeon/g, " ")
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0)).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  let root = "", index = [], dialog, input, list, shown = [], active = 0;

  async function init(r, ver) {
    root = r;
    const res = await fetch(`${root}search-index.json${ver || ""}`);
    index = (await res.json()).map(([url, title, type]) => {
      const n = ` ${norm(title)} `;
      return { url, title, type, n, c: n.replace(/ /g, "") };
    });
    build();
  }

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "search-dialog";
    dialog.setAttribute("aria-label", "Search the site");
    dialog.innerHTML = `<div class="search-head">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input type="search" role="combobox" aria-expanded="true" aria-controls="search-results" aria-autocomplete="list" placeholder="Search parts, Macs, comparisons, guides…" autocomplete="off" spellcheck="false">
        <kbd>Esc</kbd>
      </div>
      <ul class="search-results" id="search-results" role="listbox" aria-label="Results"></ul>`;
    document.body.appendChild(dialog);
    input = dialog.querySelector("input");
    list = dialog.querySelector("ul");
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(shown.length - 1, active + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(0, active - 1)); }
      else if (e.key === "Enter" && shown[active]) { e.preventDefault(); location.href = root + shown[active].url; }
    });
    list.addEventListener("mousemove", (e) => { const li = e.target.closest("li[data-i]"); if (li) setActive(+li.dataset.i); });
    // Click on the backdrop closes the dialog.
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }

  function search(q) {
    const nq = norm(q);
    if (!nq) return index.filter((x) => x.type === "Tool" || x.type === "Hub").slice(0, 8);
    const tokens = nq.split(" "), compact = nq.replace(/ /g, "");
    return index.map((x) => {
      const all = tokens.every((t) => x.n.includes(t));
      if (!all && !x.c.includes(compact)) return null;
      let s = WEIGHT[x.type] || 1;
      if (tokens.every((t) => x.n.includes(" " + t))) s += 3;
      if (x.n.startsWith(" " + tokens[0])) s += 2;
      s -= x.title.length / 200; // prefer shorter, more specific titles
      return { x, s };
    }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 12).map((r) => r.x);
  }

  function highlight(title, q) {
    const tokens = norm(q).split(" ").filter((t) => t.length > 1);
    if (!tokens.length) return esc(title);
    const re = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return esc(title).replace(re, "<mark>$1</mark>");
  }

  function render() {
    const q = input.value;
    shown = search(q);
    active = 0;
    list.innerHTML = shown.length
      ? shown.map((x, i) => `<li role="option" id="sr-${i}" data-i="${i}"><a href="${root}${x.url}"><span class="s-title">${highlight(x.title, q)}</span><span class="s-type">${LABEL[x.type] || x.type}</span></a></li>`).join("")
      : `<li class="search-empty">No pages match “${esc(q)}”. Try a model number like “5070” or “M4”.</li>`;
    setActive(0);
  }

  function setActive(i) {
    active = i;
    list.querySelectorAll("li[data-i]").forEach((li) => li.classList.toggle("active", +li.dataset.i === i));
    const li = list.querySelector(`[data-i="${i}"]`);
    if (li) { input.setAttribute("aria-activedescendant", li.id); li.scrollIntoView({ block: "nearest" }); }
  }

  function open() {
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    input.select();
    render();
  }

  window.SiteSearch = { init, open };
})();
