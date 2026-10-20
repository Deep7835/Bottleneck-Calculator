# Launch checklist

Everything in the site is built. These steps need your accounts or decisions, so they can't be done from the code.

## 1. Domain and build (10 minutes)
- [ ] Buy or pick the domain. A short exact-match or brandable `.com` is best.
- [ ] Rebuild with it (trailing slash required):
  ```bash
  SITE_URL=https://www.yourdomain.com/ node scripts/build.js
  ```
- [ ] Fill in every `<!-- OWNER: -->` note: `grep -rn "OWNER:" --include=index.html .`
- [ ] Commit: `git add -A && git commit -m "Set live domain"`

## 2. Hosting (15 minutes, free)
**Cloudflare Pages** (recommended: free, fast, compresses files automatically):
1. Push the repo to GitHub: create an empty repo, then `git remote add origin <url> && git push -u origin main`.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: framework **None**, build command **empty**, output directory **/** (the repo root is the site).
4. Custom domains → add `www.yourdomain.com` and the bare domain, and redirect the bare domain to `www`.

Netlify works the same way: "Import from Git", no build command, publish directory `.`. Both hosts read `_headers` (caching and security headers) and serve `404.html` automatically.

## 3. Search engines (20 minutes)
- [ ] **Google Search Console**: add a Domain property, verify with the DNS TXT record, then Sitemaps → submit `sitemap.xml`.
- [ ] Use URL Inspection → "Request indexing" for the homepage, `/fps-calculator/`, `/guides/` and `/bottleneck/`.
- [ ] **Bing Webmaster Tools**: import the site from Search Console (one click). Bing also feeds DuckDuckGo and ChatGPT search.
- [ ] After a week, check Search Console → Pages for "Discovered – not indexed". The 575 build pages index gradually.

## 4. Analytics (optional)
- [ ] For privacy-friendly analytics with no consent banner needed, use Cloudflare Web Analytics (free, one toggle in Pages) or Plausible.
- [ ] Google Analytics 4 works too, but then update the Privacy page and add a consent banner for EU/UK visitors.

## 5. Ads (later, once traffic is steady)
- [ ] Apply for AdSense when you have consistent daily traffic. The trust pages (About, Editorial policy, Privacy, Contact) are already in place.
- [ ] Before ads go live, update the "Analytics and advertising" section of `privacy/index.html` and enable a Google-certified consent banner (CMP) for EU/UK/Switzerland.
- [ ] Put the ad unit at the `<!-- Optional ad slot -->` comment below the calculator results. Don't put ads above the calculator, because it hurts Core Web Vitals.

## 6. First backlinks (ongoing)
- [ ] Answer real "will X bottleneck Y?" questions on r/buildapc, r/buildapcforme and r/pcmasterrace with a pre-filled result link (`/?cpu=…&gpu=…`). Lead with the answer, not the link.
- [ ] List the tool on free tool directories and PC-building forums (Linus Tech Tips forum, Tom's Hardware forum signatures where allowed).
- [ ] The comparison and build pages are linkable assets: share specific pages ("RTX 5070 vs 4070 Super") where they answer the question asked.

## 7. Keep it fresh (monthly, 15 minutes)
- [ ] Add new CPUs and GPUs to `assets/js/hardware.js` when they launch, run the build, and update "Data updates" in `index.html`.
- [ ] Re-check a few popular parts against new reviews.
- [ ] Bump the `?v=` asset version after any CSS or JS change (see README).
