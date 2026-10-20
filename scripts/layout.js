/*
 * Shared site header for every English page. Generators call header(root, current);
 * build.js stamps it into the hand-written pages between their <header> tags.
 *   root:    relative path to the site root ("", "../", "../../" or "/")
 *   current: key of the section the page belongs to (see NAV), for aria-current
 */
const NAV = [
  { key: "calculator", href: "#calculator", label: "Calculator" },
  { key: "fps", href: "fps-calculator/", label: "FPS calculator" },
  { key: "compare", href: "compare/", label: "Compare" },
  { key: "builds", href: "bottleneck/", label: "Builds" },
  { key: "guides", href: "guides/", label: "Guides" },
];

const LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2.5" stroke-linecap="round"/><path d="M4 17a8 8 0 0 1 11.3-7.3" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/><path class="logo-needle" d="M12 17l4-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.8" fill="currentColor"/></svg>`;

function links(root, current) {
  return NAV.map((n) => `<a href="${root}${n.href}"${n.key === current ? ' aria-current="page"' : ""}>${n.label}</a>`)
    .join("\n        ");
}

function header(root = "", current = "") {
  return `<header class="site-header">
    <div class="wrap">
      <a class="logo" href="${root || "./"}" aria-label="BottleneckCalc home">
        ${LOGO}
        <span>Bottleneck<b>Calc</b></span>
      </a>
      <nav class="nav" aria-label="Main">
        ${links(root, current)}
      </nav>
      <details class="menu">
        <summary aria-label="Menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></summary>
        <nav class="menu-panel" aria-label="Main (mobile)">
          ${links(root, current)}
        </nav>
      </details>
    </div>
  </header>`;
}

// Replace the <header class="site-header">…</header> block of a hand-written page.
function stampHeader(html, root, current) {
  const re = /<header class="site-header">[\s\S]*?<\/header>/;
  if (!re.test(html)) throw new Error("stampHeader: no site-header found");
  return html.replace(re, header(root, current));
}

const FOOTER_LINKS = [
  ["", "Bottleneck calculator"], ["fps-calculator/", "FPS calculator"], ["compare/", "Compare"],
  ["bottleneck/", "Popular builds"], ["guides/", "Guides"], ["about/", "About"],
  ["editorial-policy/", "Editorial policy"], ["privacy/", "Privacy"], ["contact/", "Contact"],
];

// langSwitch: optional language row (only pages that have translations carry one).
function footer(root = "", langSwitch = "") {
  const links = FOOTER_LINKS.map(([href, label]) => `<a href="${root}${href || (root ? "" : "./")}">${label}</a>`).join("");
  return `<footer class="site-footer">
    <div class="wrap">
      <nav class="footer-nav" aria-label="Site">${links}</nav>${langSwitch ? `\n      ${langSwitch}` : ""}
      <p>© 2026 Bottleneck Calculator. Estimates are for guidance only. Real performance varies by game, settings, drivers and cooling.</p>
      <p>Product names are trademarks of their respective owners. This site isn't affiliated with AMD, Intel or NVIDIA.</p>
    </div>
  </footer>`;
}

// Replace the footer of a hand-written page, keeping its language row if it has one.
function stampFooter(html, root) {
  const re = /<footer class="site-footer">[\s\S]*?<\/footer>/;
  const old = html.match(re);
  if (!old) throw new Error("stampFooter: no site-footer found");
  const lang = (old[0].match(/<nav class="lang-switch"[\s\S]*?<\/nav>/) || [""])[0];
  return html.replace(re, footer(root, lang));
}

module.exports = { NAV, header, stampHeader, footer, stampFooter };
