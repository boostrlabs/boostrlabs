# BOOSTR Labs v0.2.3 — 82 Store module patch

Drop this folder over the local `boostrlabs/boostrlabs` repo, then commit and push.

## Adds

- `public/82store/index.html`
- `public/82-store/index.html` alias copy
- `public/assets/82store/*` optimized assets
- updated `public/_redirects`
- updated `public/modules/index.html` QA index

## Routes to test after deploy

- `https://boostrlabs.pages.dev/82store?fresh=1`
- `https://boostrlabs.pages.dev/82-store?fresh=1`
- `https://boostrlabs.pages.dev/modules?fresh=1`

## Notes

The original upload was about 88 MB and included a full deploy bundle, not only 82 Store. This patch extracts only the 82 Store route and compresses referenced assets.

The store is currently a static front-end module with WhatsApp checkout links. Backend/cart/payment can be added later with Codex.
