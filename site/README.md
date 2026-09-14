# Kwizillo website

Static site for **kwizillo.nl** (Dutch, `index.html`) and **kwizillo.com** (English, `en/index.html`).
No build step. Own server (site + app together): see `../deploy/DEPLOY.md`. Static host: below.

## Hosting (any static host works)
1. Netlify / Vercel / Cloudflare Pages: "new site from folder", drag the `site/` folder (or point the
   repo at `site/` as the publish directory).
2. Add both domains to the site. Point the DNS at your registrar:
   - `kwizillo.nl`  → A/ALIAS record to the host, `www` → CNAME to the host.
   - `kwizillo.com` → same.
3. `_redirects` (Netlify format, already included) makes kwizillo.com open the English pages:
   ```
   https://kwizillo.com/*   /en/:splat   200
   https://www.kwizillo.com/* /en/:splat 200
   ```
   kwizillo.nl serves `index.html` directly.
4. Enable HTTPS (automatic on those hosts).

## Files
- `index.html`, `privacy.html` – Dutch
- `en/index.html`, `en/privacy.html` – English
- `style.css` – shared
- `assets/` – optimised copies of app art and screenshots (2.5 MB)

Screenshots come from the real app (`tests/` harness); regenerate after visual changes.
