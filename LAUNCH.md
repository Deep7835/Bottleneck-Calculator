# Launch checklist

Everything in the site is built. These steps need your accounts or decisions, so they can't be done from the code.

## 1. Domain and owner ✅ done
- [x] Domain set to **https://bottleneckcalculator.si/**. Every canonical, hreflang, sitemap, schema and share-image URL uses it, and it's now the build default.
- [x] Owner set to **Deepam Mishra** ([deepammishra.com](https://deepammishra.com/)) on the About page, guide bylines, schema and footer.
- [ ] Create the mailbox **contact@bottleneckcalculator.si**, which the Contact page shows. Cloudflare Email Routing can forward it to your normal inbox for free.
- [ ] After choosing a host, name it in `privacy/index.html` (search for `OWNER:`).

## 2. Hosting (15 minutes, free)
**Cloudflare Pages** (recommended: free, fast, compresses files automatically):
1. Push the repo to GitHub: create an empty repo, then `git remote add origin <url> && git push -u origin main`.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: framework **None**, build command **empty**, output directory **/** (the repo root is the site).
4. Custom domains → add `bottleneckcalculator.si` (the canonical, no `www`) and `www.bottleneckcalculator.si`, and redirect `www` to the bare domain.

**Cloudflare Workers** (also free; the repo includes `wrangler.jsonc` and `.assetsignore` for it):
1. Cloudflare dashboard → Workers & Pages → Create → Workers → Import a repository → pick the repo.
2. Project name **bottleneck-calculator** (matches `name` in `wrangler.jsonc`), build command **empty**, deploy command `npx wrangler deploy` (the default), root directory `/`.
3. After the first deploy: the Worker → Settings → Domains & Routes → add `bottleneckcalculator.si` and `www.bottleneckcalculator.si` as Custom Domains, then redirect `www` to the bare domain (Rules → Redirect Rules).

Netlify works the same way: "Import from Git", no build command, publish directory `.`. Both hosts read `_headers` (caching and security headers) and serve `404.html` automatically.

## 3. Search engines (20 minutes)
- [ ] **Google Search Console**: add a Domain property, verify with the DNS TXT record, then Sitemaps → submit `sitemap.xml`.
- [ ] Use URL Inspection → "Request indexing" for the homepage, `/fps-calculator/`, `/guides/` and `/bottleneck/`.
- [ ] **Bing Webmaster Tools**: import the site from Search Console (one click). Bing also feeds DuckDuckGo and ChatGPT search.
- [ ] After a week, check Search Console → Pages for "Discovered – not indexed". The 575 build pages index gradually.

## 4. Analytics (optional)
- [ ] For privacy-friendly analytics with no consent banner needed, use Cloudflare Web Analytics (free, one toggle in Pages) or Plausible.
- [ ] Google Analytics 4 works too, but then update the Privacy page and add a consent banner for EU/UK visitors.

## 5. Google AdSense (when the site has content and traffic)
- [ ] Apply only when: the site is live on bottleneckcalculator.si, Search Console shows pages indexed, there's some organic traffic, the contact mailbox works, and there are ~20+ substantial guides.
- [ ] Optional but safer for review: set `"noindexWeakPages": true` in `site.config.json` and rebuild, so the least-searched templated pages aren't indexed.
- [ ] Put your publisher ID in `site.config.json` → `adsense.publisherId`, run `node scripts/build.js`, commit and deploy. This adds ads.txt, the verification tag and the AdSense privacy wording.
- [ ] In AdSense → Privacy & messaging, publish the **European regulations** message (Google's free certified CMP, required for EEA/UK/Switzerland) and optionally the **US state regulations** message.
- [ ] Add the site in AdSense → Sites and request review. Don't click your own ads, ever.
- [ ] After approval: create three display/in-article ad units, paste their IDs into `adsense.slots`, set `showAds: true`, rebuild and deploy. Leave Auto ads off or limited to avoid ads near the calculator.

## 6. First backlinks (ongoing)
- [ ] Answer real "will X bottleneck Y?" questions on r/buildapc, r/buildapcforme and r/pcmasterrace with a pre-filled result link (`/?cpu=…&gpu=…`). Lead with the answer, not the link.
- [ ] List the tool on free tool directories and PC-building forums (Linus Tech Tips forum, Tom's Hardware forum signatures where allowed).
- [ ] The comparison and build pages are linkable assets: share specific pages ("RTX 5070 vs 4070 Super") where they answer the question asked.

## 7. Keep it fresh (monthly, 15 minutes)
- [ ] Add new CPUs and GPUs to `assets/js/hardware.js` when they launch, run the build, and update "Data updates" in `index.html`.
- [ ] Re-check a few popular parts against new reviews.
- [ ] Bump the `?v=` asset version after any CSS or JS change (see README).
