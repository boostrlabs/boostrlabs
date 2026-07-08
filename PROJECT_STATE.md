# BOOSTR Labs Project State

Last updated: 2026-07-07

Architecture note: current production runtime is the root Vite app with Cloudflare Pages Functions and Cloudflare D1. `apps/ecosystem` exists in the repository but is not the current deploy target.

## Current Goal

Prepare the local BOOSTR Labs folder to become the GitHub source of truth, with the newest text direction, roadmap, manifests, and strategic documentation applied before more coding.

## Active Source Of Truth

- Current highest-priority text direction zip: `C:\Users\juanq\Downloads\BOOSTR_CODEX_TEXT_DIRECTION_UPDATE_v1_0.zip`
- Extracted into: `C:\Users\juanq\Documents\BOOSTR Labs\text_direction_update_v1_0`
- Local docs now live in:
  - `docs/`
  - `manifests/`
  - `prompts/`
  - `source_digest/`
- Previous high-priority ecosystem source remains preserved at:
  - `ecosystem_ready/BOOSTR_LABS_CODEX_ECOSYSTEM_READY`
- The July text direction update overrides older roadmap, positioning, workflow, and architecture assumptions where they conflict.

## Current Direction

BOOSTR Labs is technology infrastructure and intelligence for partners.

BOOSTR is not an agency, not a record label, not a marketplace, not a generic CRM, not Linktree, and not Booksy.

Confirmed direction:

- Build modular systems activated by plan, need, agreement, vertical, and permissions.
- Treat BOOSTR first-party data as the core intelligence layer.
- Use API access when possible.
- Use authorized access, manual export, and evidence workflows when APIs are not available.
- Use central BOOSTR identity to power custom partner front doors, domains, workspaces, personas, roles, permissions, rewards, and access.
- Allow one user to have multiple personas, workspaces, and roles.
- Support guest checkout for simple orders.
- Require accounts for identity, history, access, rewards, licenses, protected workspaces, and complex payment/order flows.
- Keep BOOSTR Network curated, not open self-service.
- Keep BOOSTR for Artists supportive and infrastructure-led, without imposing creativity.
- Design dashboards as modular, visual, mobile-first, custom-looking, and strict-permission based.

## Local Preview

When running locally:

- BOOSTR Engine / Next preview: http://127.0.0.1:3000/
- Public/legacy Vite preview: http://127.0.0.1:5173/

## Last Completed

- Read `CODEX_START_HERE.md` from `BOOSTR_CODEX_TEXT_DIRECTION_UPDATE_v1_0.zip`.
- Extracted the text direction package into `text_direction_update_v1_0/`.
- Created/updated the local documentation layer:
  - `CODEX_START_HERE.md`
  - `PATCH_MANIFEST.json`
  - `docs/`
  - `manifests/`
  - `prompts/`
  - `source_digest/`
- Updated root `README.md` to point to the new text direction and local documentation index.
- Updated this `PROJECT_STATE.md` so future work starts from the latest text-only direction, not older coding assumptions.
- Updated Cloudflare notes to distinguish immediate GitHub/Pages workflow from future app architecture.

## Local App / Prototype Status

- Public Vite site remains present as a legacy/public prototype.
- Next.js BOOSTR Engine shell remains present in `apps/ecosystem`.
- Cloudflare Pages Functions scaffold remains present in `functions/`.
- D1 migration scaffold remains present in `migrations/`.
- Assets remain in `public/assets/` and must not be deleted.
- Historical packages remain preserved in:
  - `foundation/`
  - `core_v2/`
  - `foundation_bank/`
  - `ecosystem_ready/`
  - `text_direction_update_v1_0/`

## Superseded / Deprecated Notes

Current docs mark these as superseded or rejected where they conflict with the latest direction:

- ORCHESTA name/concept.
- Netlify as main workflow.
- Go backend / microservices for the solo founder phase.
- D1/Pages Functions as final architecture.
- Generic marketplace direction.
- Agency language.
- Record-label/disquera-like control.
- Public self-service builder.
- Hard-coded starter package pricing as final strategy.
- AI-sounding copy, corporate filler, and confusing partner-facing text.

See `docs/17_SUPERSEDED_DEPRECATED.md`.

## Missing / Unclear

Current missing/unclear areas are tracked in `docs/18_MISSING_OR_UNCLEAR.md`.

Highest-priority unresolved decisions:

- Final domain.
- Supabase vs Neon.
- Supabase Auth vs alternative.
- Stripe account/payment strategy.
- WhatsApp provider strategy.
- Legal docs for revenue share, direct payments, rewards, licenses, and network referrals.
- Final route map.
- Which local visual modules/assets are latest official versions.

## Do Not Do

- Do not delete assets.
- Do not redesign.
- Do not code without a scoped next task.
- Do not run builds during text-only update work.
- Do not install dependencies during text-only update work.
- Do not treat older prototype scaffolds as final architecture.
- Do not create open public signup.
- Do not create a public self-service Smart Link builder.
- Do not turn BOOSTR Network into an open marketplace.
- Do not impose creative direction inside BOOSTR for Artists.

## Next Recommended Step

Before more implementation: review the documentation index, confirm the local assets/modules inventory, then upload the full local folder to GitHub so GitHub becomes the source of truth.

After GitHub is established, the first scoped build task should be the urgent Rouvssen/Janko-WESTDETRO purchase flow or the first manager workspace route, depending on user priority.

## Resume Prompt

When resuming, say: `continua`.

Start by reading:

1. `CODEX_START_HERE.md`
2. `PROJECT_STATE.md`
3. `docs/00_EXECUTIVE_CURRENT_STATE.md`
4. `docs/16_ROADMAP_PRIORITIES.md`
5. `docs/17_SUPERSEDED_DEPRECATED.md`
6. `docs/18_MISSING_OR_UNCLEAR.md`
