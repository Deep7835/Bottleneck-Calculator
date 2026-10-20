/*
 * Shared site header for every English page. Generators call header(root, current);
 * build.js stamps it into the hand-written pages between their <header> tags.
 *   root:    relative path to the site root ("", "../", "../../" or "/")
 *   current: key of the section the page belongs to (see NAV), for aria-current
 */
// Site owner, used for bylines, schema and the footer credit.
const OWNER = { name: "Deepam Mishra", url: "https://deepammishra.com/" };
const OWNER_SCHEMA = { "@type": "Person", "@id": `${OWNER.url}#person`, name: OWNER.name, url: OWNER.url };

const NAV = [
  { key: "calculator", href: "#calculator", label: "Calculator" },
  { key: "fps", href: "fps-calculator/", label: "FPS calculator" },
  { key: "compare", href: "compare/", label: "Compare" },
  { key: "mac", href: "mac/", label: "Mac" },
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
      <div class="header-tools">
        <button type="button" class="icon-btn search-btn" data-root="${root}" aria-label="Search the site" aria-keyshortcuts="/ Control+K Meta+K"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button>
        <button type="button" class="icon-btn theme-btn" aria-label="Switch light or dark theme"><svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg></button>
      </div>
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

const ICON = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

/*
 * Footer shell shared by every language. o = {
 *   home, tagline, cta: {href, label}, badges: [label], columns: [{title, links: [[href, label, attrs]]}],
 *   copyright (HTML), status, disclaimer, langSwitch (HTML), siteLabel, lang
 * }
 * The giant striped wordmark lights up under the cursor (motion.js adds the spotlight).
 */
function footerShell(o) {
  const cols = o.columns.map((c) => `<div class="fcol">
          <h2>${c.title}</h2>
          <ul>${c.links.map(([href, label, attrs = ""]) => `<li><a href="${href}"${attrs}>${label}</a></li>`).join("")}</ul>
        </div>`).join("\n        ");
  return `<footer class="site-footer">
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-brand">
          <a class="logo footer-logo" href="${o.home}" aria-label="BottleneckCalc home">
            ${LOGO}
            <span>Bottleneck<b>Calc</b></span>
          </a>
          <p class="footer-tagline">${o.tagline}</p>
          <a class="footer-cta" href="${o.cta.href}">${o.cta.label}<span class="footer-cta-icon">${ICON.arrow}</span></a>
          <ul class="footer-badges">
            <li>${ICON.check}${o.badges[0]}</li>
            <li>${ICON.refresh}${o.badges[1]}</li>
          </ul>
        </div>
        <nav class="footer-cols" aria-label="${o.siteLabel}">
        ${cols}
        </nav>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">${o.copyright}</p><!-- CONSENT-LINK -->${o.langSwitch ? `\n        ${o.langSwitch}` : ""}
        <p class="footer-status"><span class="live-dot" aria-hidden="true"></span>${o.status}</p>
      </div>
      <p class="footer-disclaimer">${o.disclaimer}</p>
    </div>
    <div class="wordmark" aria-hidden="true"><span class="wm-base">BottleneckCalc</span><span class="wm-glow">BottleneckCalc</span></div>
  </footer>`;
}

// langSwitch: optional language row (only pages that have translations carry one).
function footer(root = "", langSwitch = "") {
  const r = root;
  const home = root || "./";
  return footerShell({
    home,
    tagline: "Free CPU and GPU bottleneck calculator. See your FPS, compare parts and find the upgrade that actually helps.",
    cta: { href: `${r}#calculator`, label: "Check your build" },
    badges: ["Free, no sign-up", "Data updated monthly"],
    siteLabel: "Site",
    columns: [
      { title: "Tools", links: [[home, "Bottleneck calculator"], [`${r}fps-calculator/`, "FPS calculator"], [`${r}compare/`, "Compare parts"], [`${r}mac/`, "Mac gaming"], [`${r}bottleneck/`, "Popular builds"]] },
      { title: "Resources", links: [[`${r}guides/`, "Guides"], [`${r}#how-it-works`, "How it works"], [`${r}#min-cpu`, "Best CPU for your GPU"], [`${r}editorial-policy/`, "Editorial policy"]] },
      { title: "Company", links: [[`${r}about/`, "About"], [`${r}contact/`, "Contact"], [`${r}privacy/`, "Privacy"], [`${r}terms/`, "Terms"]] },
    ],
    copyright: `© 2026 Bottleneck Calculator · Built by <a href="${OWNER.url}">${OWNER.name}</a>`,
    status: "Hardware data updated October 2026",
    disclaimer: "Estimates are for guidance only; real performance varies by game, settings, drivers and cooling. Product names are trademarks of their owners. Not affiliated with AMD, Intel or NVIDIA.",
    langSwitch,
  });
}

// Replace the footer of a hand-written page, keeping its language row if it has one.
function stampFooter(html, root) {
  const re = /<footer class="site-footer">[\s\S]*?<\/footer>/;
  const old = html.match(re);
  if (!old) throw new Error("stampFooter: no site-footer found");
  const lang = (old[0].match(/<nav class="lang-switch"[\s\S]*?<\/nav>/) || [""])[0];
  return html.replace(re, footer(root, lang));
}

module.exports = { OWNER, OWNER_SCHEMA, NAV, LOGO, header, stampHeader, footer, footerShell, stampFooter };
