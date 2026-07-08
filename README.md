# BOOSTR Labs

Local working folder for the BOOSTR Labs ecosystem, strategy, prototypes, assets, and implementation foundation.

Architecture note: current production runtime is the root Vite app with Cloudflare Pages Functions and Cloudflare D1. `apps/ecosystem` exists in the repository but is not the current deploy target.

## Current Direction

BOOSTR Labs is technology infrastructure and intelligence for partners.

BOOSTR is not an agency, not a record label, not a generic CRM, not Linktree, not Booksy, and not an open marketplace. The product direction is a modular internal engine that activates systems by plan, need, agreement, vertical, permissions, and partner context.

Core principles:

- First-party BOOSTR data is the intelligence layer.
- Use API access when possible.
- Use authorized access, manual export, or evidence workflows when APIs are not available.
- A central BOOSTR identity powers custom partner front doors, domains, workspaces, roles, and permissions.
- One user may hold multiple personas, workspaces, and roles.
- Guest checkout exists for simple orders.
- Account identity is required for history, access, rewards, licenses, protected workspaces, and complex payment/order flows.
- BOOSTR Network is curated, not open self-service.
- BOOSTR for Artists supports infrastructure without imposing creativity.
- Dashboards are modular, visual, mobile-first, custom-looking, and strict-permission based.

## Start Here

Read these first:

- [CODEX_START_HERE.md](./CODEX_START_HERE.md)
- [PROJECT_STATE.md](./PROJECT_STATE.md)
- [docs/00_EXECUTIVE_CURRENT_STATE.md](./docs/00_EXECUTIVE_CURRENT_STATE.md)
- [docs/01_IDENTITY_POSITIONING.md](./docs/01_IDENTITY_POSITIONING.md)
- [docs/16_ROADMAP_PRIORITIES.md](./docs/16_ROADMAP_PRIORITIES.md)
- [docs/17_SUPERSEDED_DEPRECATED.md](./docs/17_SUPERSEDED_DEPRECATED.md)
- [docs/18_MISSING_OR_UNCLEAR.md](./docs/18_MISSING_OR_UNCLEAR.md)

## Documentation Index

The current text direction layer lives in:

- [docs](./docs)
- [manifests](./manifests)
- [prompts](./prompts)
- [source_digest](./source_digest)

Important docs:

- [Product Architecture](./text_direction_update_v1_0/docs/02_PRODUCT_ARCHITECTURE.md)
- [Auth, Workspaces, Identity](./text_direction_update_v1_0/docs/03_AUTH_WORKSPACES_IDENTITY.md)
- [Data Intelligence Engine](./text_direction_update_v1_0/docs/04_DATA_INTELLIGENCE_ENGINE.md)
- [Modules and Features](./text_direction_update_v1_0/docs/05_MODULES_AND_FEATURES.md)
- [Checkout, Orders, Payments](./docs/06_CHECKOUT_ORDERS_PAYMENTS.md)
- [Verticals and Pilots](./docs/07_VERTICALS_AND_PILOTS.md)
- [BOOSTR for Artists](./docs/08_BOOSTR_FOR_ARTISTS.md)
- [BOOSTR Network](./docs/09_BOOSTR_NETWORK.md)
- [API Access Matrix](./docs/12_API_ACCESS_MATRIX.md)
- [Dashboard UX Rules](./docs/13_DASHBOARD_UX_RULES.md)
- [Cloudflare / GitHub Workflow](./docs/14_CLOUDFLARE_GITHUB_WORKFLOW.md)
- [Codex Rules](./docs/15_CODEX_RULES.md)

## Current Local Prototypes

This folder still contains local prototypes and assets that must be preserved:

- Public/legacy Vite site in `src/`, `index.html`, and `public/assets/`.
- Next.js BOOSTR Engine shell in `apps/ecosystem`.
- Cloudflare Pages Function scaffold in `functions/`.
- Database migration scaffold in `migrations/`.
- Historical source packages in `foundation/`, `core_v2/`, `foundation_bank/`, and `ecosystem_ready/`.
- Text direction update package extracted in `text_direction_update_v1_0/`.

Do not delete local assets, screenshots, old prototypes, ZIP archives, or client/partner visual modules. If something is outdated, mark it in [docs/17_SUPERSEDED_DEPRECATED.md](./docs/17_SUPERSEDED_DEPRECATED.md) or [manifests/FRONTEND_MODULES_MANIFEST.md](./manifests/FRONTEND_MODULES_MANIFEST.md).

## Local Preview

Current local previews, when servers are running:

- BOOSTR Engine / Next: `http://127.0.0.1:3000/`
- Legacy public frontend / Vite: `http://127.0.0.1:5173/`

## GitHub / Cloudflare Target

Immediate workflow target:

1. Consolidate this local text direction.
2. Preserve assets and prototypes.
3. Upload the full local folder to GitHub.
4. Make GitHub the source of truth.
5. Connect Cloudflare Pages for previews/deploys.
6. Use scoped Codex tasks from the repo after the first GitHub build.

See [docs/14_CLOUDFLARE_GITHUB_WORKFLOW.md](./docs/14_CLOUDFLARE_GITHUB_WORKFLOW.md).
