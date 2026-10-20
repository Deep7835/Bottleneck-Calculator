/*
 * AdSense and indexing switches, driven by site.config.json.
 *
 *   adsense.publisherId  "pub-1234567890123456" (or "ca-pub-…"). When set:
 *       - ads.txt is written,
 *       - every page gets the google-adsense-account verification tag,
 *       - content pages load the AdSense script (also needed for Google's
 *         consent message in the EEA/UK/Switzerland),
 *       - the privacy policy and terms switch to their AdSense wording,
 *       - the footer shows a "Privacy & cookie settings" link.
 *   adsense.showAds       true once approved: fills the <!-- AD:name --> slots
 *                         with the ad unit IDs in adsense.slots.
 *   seo.noindexWeakPages  noindex + drop from the sitemap the least-searched
 *                         build and comparison pages (see combo-pages.js / compare-pages.js).
 *
 * Everything is idempotent: run the build with the switches on or off and the
 * pages end up in the matching state.
 */
const fs = require("fs");
const path = require("path");

function loadConfig(ROOT) {
  const file = path.join(ROOT, "site.config.json");
  const cfg = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const ads = cfg.adsense || {};
  const raw = String(ads.publisherId || "").trim();
  if (raw && !/^(ca-)?pub-\d{16}$/.test(raw)) throw new Error(`site.config.json: adsense.publisherId "${raw}" should look like pub-1234567890123456`);
  const pub = raw ? raw.replace(/^ca-/, "") : "";
  return {
    pub,
    client: pub ? `ca-${pub}` : "",
    showAds: !!(pub && ads.showAds),
    slots: ads.slots || {},
    noindexWeak: !!(cfg.seo && cfg.seo.noindexWeakPages),
  };
}

// Pages that aren't content pages get the verification tag but never ad code.
const NON_CONTENT = /^(404\.html|(about|contact|privacy|terms|editorial-policy)\/index\.html)$/;

// ---------- Privacy policy and terms wording ----------
const TEXT = {
  off: {
    lead: `<p class="lead">Short version: the calculator runs entirely in your browser. We don't have accounts and we don't set cookies. The only thing saved on your device is your light or dark theme choice, if you make one.</p>`,
    cookies: `<section>
          <h2>Cookies and local storage</h2>
          <p>This site doesn't set cookies. If you use the light/dark switch in the header, your choice is saved in your browser's <code>localStorage</code> under the key <code>theme</code> so the site remembers it next time. It never leaves your device, and you can clear it at any time by clearing site data. Nothing else is stored.</p>
        </section>`,
    ads: `<section>
          <h2>Analytics and advertising</h2>
          <!-- OWNER: before turning on analytics, add the provider here (what it collects, cookies or not, link to its policy). AdSense wording switches on automatically from site.config.json. -->
          <p>We don't currently use analytics, advertising or tracking scripts.</p>
          <p>If we add them in future (for example a privacy-friendly analytics tool, Google Analytics or Google AdSense), we'll update this page before they go live. It will name each provider, explain what it collects and whether it uses cookies, and link to its own privacy policy. Where the law requires it, we'll ask for your consent first, and you'll be able to opt out of personalised ads.</p>
        </section>`,
    "terms-ads": `<section>
          <h2>Ads and affiliate links</h2>
          <p>The site doesn't currently show ads or use affiliate links. If that changes, we'll say so on the pages concerned and in the <a href="../privacy/">privacy policy</a>. It will never change how hardware is rated; see our <a href="../editorial-policy/">editorial policy</a>.</p>
        </section>`,
  },
  on: {
    lead: `<p class="lead">Short version: the calculator runs in your browser and we don't have accounts. The site shows ads from Google AdSense, which uses cookies to serve and measure ads, and you can control personalised ads at any time. Your light or dark theme choice is saved on your device if you make one.</p>`,
    cookies: `<section>
          <h2>Cookies and local storage</h2>
          <p>Our own code doesn't set cookies. If you use the light/dark switch in the header, your choice is saved in your browser's <code>localStorage</code> under the key <code>theme</code>; it never leaves your device.</p>
          <p>Google AdSense and its advertising partners set cookies and use similar technologies to show, personalise and measure ads (see <a href="#advertising">Advertising</a> below). In the European Economic Area, the UK and Switzerland we ask for your consent through a Google-certified consent message before personalised ads or advertising cookies are used. You can change your choice at any time with <strong>Privacy &amp; cookie settings</strong> in the footer.</p>
        </section>`,
    ads: `<section id="advertising">
          <h2>Advertising (Google AdSense)</h2>
          <!-- OWNER: add any analytics provider here too (what it collects, cookies or not, link to its policy). -->
          <p>We use Google AdSense to show ads, which keeps the site free.</p>
          <ul>
            <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.</li>
            <li>You can opt out of personalised advertising in <a href="https://myadcenter.google.com/">Google's My Ad Center</a> (or <a href="https://adssettings.google.com/">Ads Settings</a>). You can also opt out of some third-party vendors' cookies for personalised advertising at <a href="https://www.aboutads.info/choices/">aboutads.info</a>, or at <a href="https://www.youronlinechoices.eu/">youronlinechoices.eu</a> in Europe.</li>
            <li>Ads may also be served by third-party ad networks that Google certifies. Google publishes the <a href="https://support.google.com/admanager/answer/9012903">list of ad technology providers</a> it works with.</li>
            <li>How Google uses information from sites that use its services: <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>.</li>
          </ul>
          <p>Depending on where you live (for example in some US states), you may have the right to opt out of the "sale" or "sharing" of personal information for targeted advertising. Use the opt-out links above or <strong>Privacy &amp; cookie settings</strong> in the footer where it's shown.</p>
          <p>Ads are labelled "Advertisement" and are chosen by Google, not by us. They never affect how hardware is rated.</p>
        </section>`,
    "terms-ads": `<section>
          <h2>Ads and affiliate links</h2>
          <p>The site shows ads served by Google AdSense. They're labelled "Advertisement", chosen by Google rather than by us, and never change how hardware is rated; see our <a href="../editorial-policy/">editorial policy</a> and the <a href="../privacy/#advertising">privacy policy</a> for how ad cookies work. We don't use affiliate links.</p>
        </section>`,
  },
};

const CONSENT_LINK = `<!-- CONSENT-LINK --><button type="button" class="consent-link" onclick="window.googlefc=window.googlefc||{};googlefc.callbackQueue=googlefc.callbackQueue||[];googlefc.callbackQueue.push(function(){googlefc.showRevocationMessage()})">Privacy &amp; cookie settings</button><!-- /CONSENT-LINK -->`;

function slotHtml(cfg, name) {
  const id = cfg.slots[name];
  if (!cfg.showAds || !id) return "";
  const inArticle = name === "inArticle";
  const attrs = inArticle
    ? `style="display:block; text-align:center;" data-ad-layout="in-article" data-ad-format="fluid"`
    : `style="display:block" data-ad-format="auto" data-full-width-responsive="true"`;
  return `<aside class="ad-slot${inArticle ? " ad-in-article" : ""}" aria-label="Advertisement"><span class="ad-label">Advertisement</span><ins class="adsbygoogle" ${attrs} data-ad-client="${cfg.client}" data-ad-slot="${id}"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></aside><!-- /AD -->`;
}

// Apply the current switches to one page's HTML.
function applyToPage(html, relFile, cfg, isWeak) {
  // Head: verification tag everywhere, ad script on content pages only.
  html = html.replace(/\n?\s*<!-- ADSENSE:START -->[\s\S]*?<!-- ADSENSE:END -->/, "");
  if (cfg.pub) {
    const script = NON_CONTENT.test(relFile) ? "" : `\n  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cfg.client}" crossorigin="anonymous"></script>`;
    html = html.replace("</head>", `  <!-- ADSENSE:START -->\n  <meta name="google-adsense-account" content="${cfg.client}">${script}\n  <!-- ADSENSE:END -->\n</head>`);
  }
  // Ad slots
  html = html.replace(/<!-- AD:(\w+) -->(?:[\s\S]*?<!-- \/AD -->)?/g, (_, name) => `<!-- AD:${name} -->${NON_CONTENT.test(relFile) ? "" : slotHtml(cfg, name)}`);
  // Footer consent link
  html = html.replace(/<!-- CONSENT-LINK -->(?:[\s\S]*?<!-- \/CONSENT-LINK -->)?/, cfg.pub ? CONSENT_LINK : "<!-- CONSENT-LINK -->");
  // Privacy / terms wording
  html = html.replace(/<!-- PRIVACY:([\w-]+) -->[\s\S]*?<!-- \/PRIVACY -->/g, (_, k) => `<!-- PRIVACY:${k} -->${TEXT[cfg.pub ? "on" : "off"][k]}<!-- /PRIVACY -->`);
  // Robots: noindex weak pages when asked, otherwise restore the normal tag.
  const robots = isWeak && cfg.noindexWeak ? "noindex, follow" : "index, follow, max-image-preview:large";
  html = html.replace(/<meta name="robots" content="(index, follow, max-image-preview:large|noindex, follow)">/, `<meta name="robots" content="${robots}">`);
  return html;
}

function writeAdsTxt(ROOT, cfg) {
  const file = path.join(ROOT, "ads.txt");
  if (cfg.pub) fs.writeFileSync(file, `google.com, ${cfg.pub}, DIRECT, f08c47fec0942fa0\n`);
  else if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { loadConfig, applyToPage, writeAdsTxt };
