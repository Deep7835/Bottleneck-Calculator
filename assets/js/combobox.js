/*
 * Searchable CPU/GPU combobox, shared by the bottleneck and FPS calculators.
 * Combobox(root, items, kind, onPick) → { set(item) }
 */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const t = (key) => window.I18N.t(key);

  // NFKC folds full-width input from Japanese IMEs ("５６００") to ASCII.
  const norm = (s) => s.normalize("NFKC").toLowerCase().replace(/geforce|radeon|core|intel|nvidia|amd/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

  // Common shorthand people type: "r5 5600" → "ryzen 5 5600".
  const expand = (q) => q.replace(/\br\s?([3579])\b/gi, "ryzen $1");

  function Combobox(root, items, kind, onPick) {
    const input = $("input", root);
    const list = $("ul", root);
    const toggle = $(".combo-toggle", root);
    let current = null;
    let shown = [];
    let active = -1;

    items.forEach((it) => {
      it._s = " " + norm(it.name) + " ";
      it._c = it._s.replace(/ /g, "");
    });

    const meta = (it) => kind === "cpu"
      ? `${it.cores}C/${it.threads}T · ${it.socket === "Laptop" ? "" : it.socket + " · "}${it.year}`
      : `${it.vram ? it.vram + " GB · " : ""}${it.year}`;
    const badge = (it) => it.type === "l" ? `<span class="badge">${t("badge.laptop")}</span>` : it.type === "i" ? `<span class="badge">${t("badge.igpu")}</span>` : "";

    function filter(q) {
      const nq = norm(expand(q));
      if (!nq) return items.slice().sort((a, b) => b.g - a.g);
      const tokens = nq.split(" ");
      const compact = nq.replace(/ /g, "");
      return items
        .map((it) => {
          const all = tokens.every((t) => it._s.includes(t));
          const comp = it._c.includes(compact);
          if (!all && !comp) return null;
          // Prefer matches at the start of a word, then desktop parts, then faster parts.
          let score = it.g / 1000;
          if (tokens.every((t) => it._s.includes(" " + t))) score += 2;
          if (it._s.includes(" " + tokens[tokens.length - 1] + " ")) score += 1;
          if (it.type === "d") score += 0.5;
          return { it, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.it);
    }

    function highlight(name, q) {
      const esc = name.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const tokens = norm(expand(q)).split(" ").filter((t) => t.length > 0);
      if (!tokens.length) return esc;
      const re = new RegExp("(" + tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
      return esc.replace(re, "<mark>$1</mark>");
    }

    function render(q) {
      shown = filter(q).slice(0, 80);
      active = shown.length ? 0 : -1;
      if (!shown.length) {
        list.innerHTML = `<li class="empty" role="option" aria-disabled="true">${t("combo.empty")}</li>`;
      } else {
        list.innerHTML = shown.map((it, i) =>
          `<li role="option" id="${kind}-opt-${i}" data-i="${i}" aria-selected="${current && it.id === current.id}"><span class="opt-name">${highlight(it.name, q)}${badge(it)}</span><span class="opt-meta">${meta(it)}</span></li>`
        ).join("");
      }
      setActive(active);
    }

    function setActive(i) {
      $$("li", list).forEach((li) => li.classList.remove("active"));
      active = i;
      const li = list.querySelector(`[data-i="${i}"]`);
      if (li) {
        li.classList.add("active");
        input.setAttribute("aria-activedescendant", li.id);
        li.scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function open(q = "") {
      render(q);
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }
    function close() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
    function pick(it) {
      current = it;
      input.value = it.name;
      close();
      onPick(it);
    }
    function set(it) {
      current = it;
      input.value = it.name;
    }

    input.addEventListener("focus", () => { input.select(); open(""); });
    input.addEventListener("input", () => open(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); if (list.hidden) open(input.value); else setActive(Math.min(shown.length - 1, active + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(0, active - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); if (!list.hidden && shown[active]) { pick(shown[active]); input.blur(); } }
      else if (e.key === "Escape") { close(); if (current) input.value = current.name; }
    });
    input.addEventListener("blur", () => {
      setTimeout(() => { close(); if (current) input.value = current.name; }, 120);
    });
    list.addEventListener("mousedown", (e) => {
      const li = e.target.closest("li[data-i]");
      e.preventDefault();
      if (li) { pick(shown[+li.dataset.i]); input.blur(); }
    });
    list.addEventListener("mousemove", (e) => {
      const li = e.target.closest("li[data-i]");
      if (li && +li.dataset.i !== active) setActive(+li.dataset.i);
    });
    toggle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (list.hidden) { input.focus(); } else { close(); }
    });

    return { set };
  }

  window.Combobox = Combobox;
})();
