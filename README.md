# Great Awakening Clothing Store

A fast, static storefront for **Great Awakening Clothing** with an animated cinematic hero, editorial marketplace design, and a built-in integration with the **Hostinger Ecommerce Core API V2** for live products and secure hosted checkout.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Home — cinematic video hero, categories, new arrivals, story, bestsellers, newsletter |
| `shop.html` | Full catalog with collection filters, search (`?q=`) and sorting |
| `product.html` | Product detail (`?p=<slug>`) with variants, gallery and related pieces |

A slide-out cart drawer (localStorage-backed) is available on every page.

## Deploying to Hostinger

1. Push this repo to GitHub (already set up) and, in **hPanel → Websites → Add Website → Import from Git**, point Hostinger at the repository. The site is plain HTML/CSS/JS — no build step. The repo root is the web root.
2. Alternatively upload the files to `public_html` via File Manager or FTP.

## Connecting the live store (Hostinger Ecommerce)

The site ships in **demo mode** with a bundled 8-piece catalog so it is fully browsable immediately. To connect the real store:

1. In Hostinger, set up **Ecommerce** for the site and add your products.
2. Find your **sales channel ID** for the storefront.
3. Open [`assets/js/config.js`](assets/js/config.js) and set:

```js
SALES_CHANNEL_ID: "your-channel-id-here",
```

That's it. With a channel configured the site:

- pulls live products from `GET /v2/channels/{id}/products` (prices arrive in cents and are formatted client-side),
- sends shoppers to **Hostinger's secure hosted checkout** via `POST /v2/channels/{id}/checkout`, which returns the redirect URL — no payment data ever touches this site.

If the API call fails or returns no products, the site quietly falls back to the demo catalog.

## Local development

```bash
npm start
```

Serves the site at http://localhost:8080 (uses `npx serve`, no install required).

## Structure

```
├── index.html / shop.html / product.html
├── assets/
│   ├── css/style.css          # design system (Fraunces + Archivo, ivory/ink/amber)
│   ├── js/config.js           # ← store configuration lives here
│   ├── js/api.js              # Hostinger storefront API client
│   ├── js/catalog.js          # live catalog loader + demo fallback
│   ├── js/cart.js             # cart drawer + hosted checkout
│   ├── js/main.js             # hero animation, reveals, page renderers
│   ├── img/                   # product + editorial photography
│   └── video/hero.mp4         # cinematic hero film
└── package.json
```

## The app (PWA)

The site is an installable Progressive Web App: `manifest.webmanifest` + `sw.js` (offline caching) + `assets/js/pwa.js` (animated install banner). Shoppers on phones see an install invitation automatically; there's also a "📱 Get the app" link in the footer.

**iPhone / iPad (Safari):** open the site → tap Share (the square with the up arrow) → "Add to Home Screen" → Add.

**Android (Chrome):** open the site → tap Install in the banner, or ⋮ menu → "Add to Home screen" / "Install app".

The app icon is generated from the official logo (`assets/img/brand/icon-*.png`). After changing site files, bump the `?v=` version stamp in the HTML and the `CACHE` name in `sw.js` so installed apps pick up the update.

## Coming-soon mode

Flip one line in [`assets/js/config.js`](assets/js/config.js):

```js
COMING_SOON: true,   // cinematic landing page instead of the store
COMING_SOON: false,  // store is open
```

While it's on, every page redirects to `coming-soon.html` — a cinematic sequence (Higgsfield-generated logo-reveal film → the store's hero film looping behind the logo, headline and email signup). Add `?preview=1` to any URL to browse the real site during coming-soon mode (per browser session); `/admin.html` is never blocked. Commit + deploy after flipping the flag.

## Notes

- Hero video autoplays muted, honors `prefers-reduced-motion`, and falls back to a poster image.
- Demo copy (shipping thresholds, perks, contact email) is placeholder — adjust in the HTML and `config.js` before launch.
