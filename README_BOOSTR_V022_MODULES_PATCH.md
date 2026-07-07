# BOOSTR Labs v0.2.2 Front-End Modules Patch

Overlay ZIP for `boostrlabs/boostrlabs`.

## What this adds

- `/audit` — BOOSTR Audit V5 static demo from `BOOSTR_Audit_Demo_V5_Netlify.zip`.
- `/app/gemese` — GEMESE Partner OS Dashboard from `BOOSTR_GEMESE_FINAL_NETLIFY_V7.zip`.
- `/app/82ngel` — 82NGEL Artist Dashboard HTML demo.
- `/modules` — QA index with clickable links for testing migrated modules.
- `public/_redirects` — explicit Cloudflare Pages route rules for static modules + SPA fallback.

## How to apply

Unzip this file directly on top of the local `boostrlabs/boostrlabs` repo root.

Then run:

```bash
git add public/audit public/app/gemese public/app/82ngel public/modules public/_redirects BOOSTR_FRONTEND_ROADMAP_PRE_BACKEND.md
git commit -m "Add migrated BOOSTR front-end modules"
git push origin main
```

Cloudflare Pages should use:

```txt
Build command: npm run build
Build output directory: dist
Root directory: /
```

## Test URLs after deploy

- `/modules?fresh=1`
- `/audit?fresh=1`
- `/app/gemese?fresh=1`
- `/app/82ngel?fresh=1`
- `/janko?fresh=1`
- `/jankodiorr?fresh=1`
- `/82ngel?fresh=1`
- `/quote?fresh=1`

## Notes

- These modules are static front-end demos.
- 82NGEL dashboard asset paths were remapped to existing `/assets/link/82ngel/...` assets from the current BOOSTR repo.
- GEMESE and Audit assets are included inside their own folders.
- No backend logic is added in this patch.
