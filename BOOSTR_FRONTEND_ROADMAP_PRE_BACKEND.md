# BOOSTR Labs — Front-End Roadmap Before Backend / Codex

Status date: 2026-07-07
Repo target: `boostrlabs/boostrlabs`

## Current front-end core

### Live / already in current BOOSTR repo

- `/` — BOOSTR Labs main website.
- `/janko`, `/jankodiorr`, `/westdetro` — JANKO DIORR / WESTDETRO Smart Link aliases.
- `/82ngel`, `/johanka` — 82NGEL Smart Link aliases.
- `/quote` — BOOSTR Intake route.
- `/app` — generic Client OS placeholder.
- `/admin` — generic Admin placeholder.
- `/login` — auth stub.
- `/partner/gemese`, `/partner/janko`, `/partner/omgbeauty` — generic partner pages.

### Added by this patch

- `/audit` — BOOSTR Audit V5 front-end demo.
- `/app/gemese` — GEMESE Partner OS Dashboard demo.
- `/app/82ngel` — 82NGEL Artist Dashboard demo.
- `/modules` — QA index for testing front-end routes.

## Front-end modules still missing

### 1. 82 Store

Known source: `https://boostrbackrooms.netlify.app/82store/`.
Status: not migrated yet because ZIP is ~90 MB.
Likely issue: heavy media assets, not `node_modules`.
Needed before migration:

- Identify largest images/videos.
- Convert large JPG/PNG assets to WebP where possible.
- Keep only deployment-needed assets.
- Target route: `/82store` first, then later `/82ngel/store` if the ecosystem becomes account-based.

### 2. Custom GEMESE public page

Current `/partner/gemese` is generic.
Needed:

- Decide whether GEMESE needs a public Smart Link, partner landing, or dashboard only.
- If public-facing, build `/gemese` or `/partner/gemese` custom.
- Keep `/app/gemese` as dashboard/demo app route.

### 3. Custom Janko Partner Page

Current `/partner/janko` is generic.
Needed:

- Decide if this is actually needed separate from `/jankodiorr`.
- If yes, build it as a referral/collaboration page, not the artist smart link.

### 4. OMG Beauty route consolidation

Current repo references OMG Beauty as a selected system and generic partner page.
Needed:

- Confirm whether OMG Beauty should live as `/omgbeauty`, `/partner/omgbeauty`, or external Netlify only.
- Pull assets/source if moving into BOOSTR core.

### 5. Public module index / internal QA layer

This patch adds `/modules` as a temporary QA page.
Needed later:

- Decide if `/modules` should remain public, be removed, or be protected behind `/admin`.

## Front-end issues / risks spotted before backend work

### 1. Mixed routing model

The repo currently has a Vite SPA router plus static pages under `public/`.
This is acceptable short-term, but long-term it should be normalized.

Recommended later:

- Either migrate all static HTML modules into Vite-rendered modules, or keep them deliberately as static demos under `/public/labs` or `/public/prototypes`.

### 2. Cache confusion after deploy

Observed issue: `/jankodiorr` worked with `?fresh=1` but not initially without it.
Cause: stale Cloudflare/browser cache.

Recommended:

- Continue testing with `?fresh=1` after deploys.
- Add cache-control headers for HTML routes if needed.
- Keep hashed Vite assets for JS/CSS.

### 3. Generic partner pages can look like missing work

`/partner/gemese` and `/partner/janko` technically exist, but they are generic templates.
This creates confusion because the real dashboards/designs are separate.

Recommended:

- Keep `/partner/*` as public referral pages.
- Use `/app/*` for dashboard demos.
- Add clear labels in UI: `Partner Page` vs `Dashboard Demo`.

### 4. Demo data is hardcoded

GEMESE and 82NGEL dashboards use fictional/static data.
This is good for design, but backend work must not assume data is real.

Recommended data model later:

- Artist profile.
- Smart Link events.
- Fan/contact records.
- Product/drop records.
- Revenue/orders.
- Advisor recommendations.
- Follow-up tasks.

### 5. Forms are fragmented

Current repo has `/quote` and `/api/intake`. BOOSTR Audit has its own interactive flow.

Recommended:

- Before backend, define one canonical lead schema.
- Map Audit answers into the same lead/project intake system.
- Add `source`, `module`, `referralCode`, and `pageUrl` to every submission.

### 6. 82NGEL dashboard assets were remapped

The uploaded HTML expected local assets:

- `assets/82ball.png`
- `assets/playin-dj.jpg`
- `assets/82west.jpg`
- `assets/dori.jpg`
- `assets/archives.jpg`
- `assets/logo-white-small.png`

This patch remaps them to existing BOOSTR repo 82NGEL assets:

- `/assets/link/82ngel/logo.png`
- `/assets/link/82ngel/dj.jpg`
- `/assets/link/82ngel/cover-82west.jpg`
- `/assets/link/82ngel/cover-dori.jpg`
- `/assets/link/82ngel/cover-archives.jpg`

If any asset does not render, inspect existing asset filenames in `public/assets/link/82ngel/`.

## Recommended next build order

1. Deploy this patch and test `/modules`, `/audit`, `/app/gemese`, `/app/82ngel`.
2. Compress and inspect 82 Store ZIP.
3. Migrate 82 Store to `/82store`.
4. Decide public custom pages for GEMESE/Janko/OMG Beauty.
5. Normalize routing labels in main BOOSTR navigation.
6. Only then use Codex for backend foundation:
   - Auth/account model.
   - Intake + Audit API.
   - Dashboard data schema.
   - Admin inbox.
   - Partner/referral tracking.
   - Store/order module.

## Backend should wait until these front-end decisions are stable

- Final route map.
- Public vs private module distinction.
- Which dashboards remain demos vs real client portals.
- Which forms feed the same lead inbox.
- Whether 82 Store is public checkout or account-linked commerce.
