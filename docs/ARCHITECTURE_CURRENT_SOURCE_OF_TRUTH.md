# BOOSTR Labs Architecture Current Source Of Truth

Date: 2026-07-08

Scope: this document audits the current repository as-is. It does not add design, features, modules, pages, dependencies, routes, or implementation.

Claim markers:

- `[verified]` means confirmed from repository code/config in this audit.
- `[declared]` means stated in existing documentation, manifests, or roadmap files.
- `[missing]` means expected by declared direction but not present in verified code.
- `[estimated]` means inferred from repository structure; not enough code/docs exist to prove it fully.
- `UNCLEAR` means the repo does not provide enough evidence.

## 1. Actually Implemented From Code Only

### Stack

- `[verified]` The root web app is a Vite/static site project. Evidence: `package.json` has `vite` scripts (`dev`, `build`, `preview`) and `wrangler.toml` uses `pages_build_output_dir = "dist"`.
- `[verified]` The deployed Cloudflare target is Cloudflare Pages. Evidence: `wrangler.toml` has `name = "boostrlabs"` and `pages_build_output_dir = "dist"`.
- `[verified]` Backend code currently uses Cloudflare Pages Functions. Evidence: API route files exist under `functions/api/*.js` and shared helpers exist in `functions/_lib/api.js`.
- `[verified]` The active database binding expected by backend code is Cloudflare D1 binding `DB`. Evidence: `wrangler.toml` declares `[[d1_databases]] binding = "DB"` and API code calls `env.DB`.
- `[verified]` Node engine target is `>=22.12.0`. Evidence: root `package.json`.
- `[verified]` A separate app shell exists under `apps/ecosystem`. Evidence: `apps/ecosystem/package.json`, `apps/ecosystem/next.config.mjs`, `apps/ecosystem/tsconfig.json`, and related app files.
- `[verified]` The `apps/ecosystem` app is not the current Cloudflare Pages deploy output in root config. Evidence: `wrangler.toml` deploy output is `dist`, which is produced by the root Vite build.
- `[estimated]` The current production path is root Vite build plus Pages Functions, not the `apps/ecosystem` app.

### Database

- `[verified]` The canonical migration file is `migrations/0001_boostr_core.sql`.
- `[verified]` The migration defines these tables: `leads`, `audit_submissions`, `lead_events`, `modules`, `workspaces`, `users`, and `orders`.
- `[verified]` `workspaces` and `users` are present as reserved schema. Evidence: `migrations/0001_boostr_core.sql` comments state those tables are reserved for role-based auth later.
- `[verified]` `modules` is currently a registry table seeded with module definitions: `boostr-audit`, `smart-links`, `manager-os`, `smart-checkout`, and `artist-os`.
- `[verified]` There is a second copy of schema creation logic inside `functions/api/db-init.js`.
- `[verified]` `functions/api/db-init.js` does not read `migrations/0001_boostr_core.sql` at runtime; it recreates table/index/seed SQL inline.

### API Endpoints

- `[verified]` `GET /api/health` exists in `functions/api/health.js`.
- `[verified]` `GET|POST /api/db-init` exists in `functions/api/db-init.js`.
- `[verified]` `GET|POST /api/audit` exists in `functions/api/audit.js`.
- `[verified]` `POST /api/intake` exists in `functions/api/intake.js`.
- `[verified]` `GET|POST /api/leads` exists in `functions/api/leads.js`.
- `[verified]` `GET|PATCH /api/leads/:id` exists in `functions/api/leads/[id].js`.
- `[verified]` `GET /api/modules` exists in `functions/api/modules.js`.
- `[verified]` `GET|POST /api/orders` exists in `functions/api/orders.js`.
- `[verified]` `GET /api/events` exists in `functions/api/events.js`.
- `[verified]` `OPTIONS` handling is implemented in shared API behavior and/or individual handlers for the current endpoints.

### API Behavior

- `[verified]` `GET /api/health` checks whether `env.DB` is bound and whether required tables exist.
- `[verified]` `GET /api/health` reports counts for leads, audits, orders, events, and recent lead/audit data when all required tables are present.
- `[verified]` `GET|POST /api/db-init` is manager-protected and creates the current D1 tables/indexes/seeds from inline SQL.
- `[verified]` `POST /api/audit` is public, creates an audit submission, creates or updates a related lead record, and writes a `lead_events` entry with event type `audit.submitted`.
- `[verified]` `POST /api/audit` validates that at least one usable contact channel exists and checks email/phone format before saving.
- `[verified]` `POST /api/intake` is public, creates a lead, and writes a `lead_events` entry with event type `intake.submitted`.
- `[verified]` `POST /api/intake` requires fields but does not provide the same email/phone validation standard as `POST /api/audit`.
- `[verified]` `GET|POST /api/leads` is manager-protected.
- `[verified]` `GET /api/leads` supports manager list/summary behavior through query parameters.
- `[verified]` `POST /api/leads` creates manual lead records and a `lead.created` event.
- `[verified]` `GET|PATCH /api/leads/:id` is manager-protected.
- `[verified]` `PATCH /api/leads/:id` can update lead status, assignment, and notes, and writes events such as `status.changed`, `lead.updated`, or `lead.note`.
- `[verified]` `GET /api/modules` lists rows from the `modules` registry table. Optional manager access is protected when `manager=1` is supplied.
- `[verified]` `GET|POST /api/orders` is manager-protected.
- `[verified]` `POST /api/orders` can create an order linked to a lead and writes an `order.created` event.
- `[verified]` `GET /api/events` is manager-protected and lists lead/audit/order events with filters.

### Auth

- `[verified]` Current manager auth is implemented in `functions/_lib/api.js` as `managerAuth()`.
- `[verified]` `managerAuth()` accepts `env.MANAGER_PIN` or fallback `env.ADMIN_PIN`.
- `[verified]` `managerAuth()` accepts the submitted PIN from `X-Manager-Pin` header or from the `pin` query parameter.
- `[verified]` If no manager PIN is configured, `managerAuth()` returns a JSON response with an auth configuration error.
- `[verified]` If a submitted PIN is missing or invalid, `managerAuth()` returns JSON auth errors.
- `[verified]` There is no implemented session auth, user login, workspace-level authorization, role-based access control, token rotation, or account identity flow in current backend code.

## 2. Documented Target Architecture From Existing Docs Only

- `[declared]` BOOSTR Labs is not meant to be an agency, label, CRM, Linktree clone, Booksy clone, marketplace, or generic social platform. Evidence: `README.md`.
- `[declared]` BOOSTR Labs is described as modular technology infrastructure and intelligence for partners. Evidence: `README.md`, `PROJECT_STATE.md`, `text_direction_update_v1_0/docs/02_PRODUCT_ARCHITECTURE.md`.
- `[declared]` The target architecture is an internal engine where modules are activated by plan, need, agreement, vertical, permissions, and partner context. Evidence: `README.md`, `PROJECT_STATE.md`, `text_direction_update_v1_0/docs/05_MODULES_AND_FEATURES.md`.
- `[declared]` Target identity includes central BOOSTR identity, workspaces, roles, partner/client personas, and permissioned dashboards. Evidence: `README.md`, `text_direction_update_v1_0/docs/03_AUTH_WORKSPACES_IDENTITY.md`.
- `[declared]` Guest checkout/simple orders may exist, but accounts are required for identity, history, access, rewards, licenses, protected workspaces, and complex order/payment flows. Evidence: `README.md`, `text_direction_update_v1_0/docs/03_AUTH_WORKSPACES_IDENTITY.md`.
- `[declared]` Target data architecture centers on first-party data intelligence, signals, events, follow-up, manual exports where needed, and API integrations when possible. Evidence: `README.md`, `text_direction_update_v1_0/docs/04_DATA_INTELLIGENCE_ENGINE.md`.
- `[declared]` Target product surface includes modular dashboards, visual/mobile-first partner tools, smart links, checkout/orders/payments, partner inventory, artist support, and curated network logic. Evidence: `README.md`, `manifests/MODULES_STATUS_TABLE.md`, `text_direction_update_v1_0/docs/05_MODULES_AND_FEATURES.md`.
- `[declared]` One documented future architecture points to TypeScript, Next App Router, modular monolith, managed Postgres such as Supabase or Neon, central identity, modular dashboards, and API-first integration. Evidence: `CLOUDFLARE_PLATFORM.md`.
- `[declared]` Another current backend setup document says Cloudflare D1 is the working backend database for now. Evidence: `docs/CLOUDFLARE_D1_SETUP.md`, `BACKEND_SETUP.md`.
- `[declared]` `CLOUDFLARE_PLATFORM.md` says D1/Pages Functions should not be treated as final architecture unless intentionally reselected.
- `[declared]` `README.md` points to documentation files under root `docs/` such as `docs/02_PRODUCT_ARCHITECTURE.md`, `docs/03_AUTH_WORKSPACES_IDENTITY.md`, `docs/04_DATA_INTELLIGENCE_ENGINE.md`, and `docs/05_MODULES_AND_FEATURES.md`.

## 3. Contradictions Between Implementation And Documentation

- `[verified]` Current implemented backend depends on Cloudflare Pages Functions and D1. `[declared]` `CLOUDFLARE_PLATFORM.md` says D1/Pages Functions are not final unless reselected. File references: `functions/api/*.js`, `wrangler.toml`, `migrations/0001_boostr_core.sql`, `CLOUDFLARE_PLATFORM.md`.
- `[verified]` Current deploy config builds the root Vite app to `dist`. `[declared]` docs also describe a Next.js Engine shell under `apps/ecosystem` as a current prototype/direction. File references: `package.json`, `wrangler.toml`, `README.md`, `PROJECT_STATE.md`, `apps/ecosystem/package.json`.
- `[verified]` Current auth is a shared manager PIN. `[declared]` target architecture requires central BOOSTR identity, workspaces, roles, permissions, partner/client personas, protected areas, and account history. File references: `functions/_lib/api.js`, `migrations/0001_boostr_core.sql`, `README.md`, `text_direction_update_v1_0/docs/03_AUTH_WORKSPACES_IDENTITY.md`.
- `[verified]` `workspaces` and `users` tables exist only as reserved schema and are not used by API authorization. `[declared]` workspaces and identity are core target concepts. File references: `migrations/0001_boostr_core.sql`, `functions/_lib/api.js`, `functions/api/*.js`, `text_direction_update_v1_0/docs/03_AUTH_WORKSPACES_IDENTITY.md`.
- `[verified]` The module system currently reads a `modules` registry table. `[declared]` target modules should activate by plan, need, agreement, vertical, permissions, and partner context. File references: `migrations/0001_boostr_core.sql`, `functions/api/modules.js`, `README.md`, `text_direction_update_v1_0/docs/05_MODULES_AND_FEATURES.md`, `manifests/MODULES_STATUS_TABLE.md`.
- `[verified]` `functions/api/db-init.js` contains inline schema statements. `[verified]` `migrations/0001_boostr_core.sql` contains the migration schema. This creates two schema sources that can diverge. File references: `functions/api/db-init.js`, `migrations/0001_boostr_core.sql`.
- `[verified]` `GET /api/events` exists. `[declared]` `BACKEND_SETUP.md` and `docs/CLOUDFLARE_D1_SETUP.md` list backend endpoints but do not consistently include `/api/events`. File references: `functions/api/events.js`, `BACKEND_SETUP.md`, `docs/CLOUDFLARE_D1_SETUP.md`.
- `[verified]` `README.md` points to root `docs/02_PRODUCT_ARCHITECTURE.md`, `docs/03_AUTH_WORKSPACES_IDENTITY.md`, `docs/04_DATA_INTELLIGENCE_ENGINE.md`, and `docs/05_MODULES_AND_FEATURES.md`. `[verified]` Those files are not present at those root `docs/` paths. Similar files exist under `text_direction_update_v1_0/docs/`. File references: `README.md`, `docs/`, `text_direction_update_v1_0/docs/`.
- `[verified]` `POST /api/audit` validates email/phone format. `[verified]` `POST /api/intake` and `POST /api/leads` do not apply the same validation standard. File references: `functions/api/audit.js`, `functions/api/intake.js`, `functions/api/leads.js`.
- `[declared]` Data intelligence is a core engine with signals/actions/follow-up. `[verified]` Current backend stores events and exposes event lists/counts but has no implemented rule execution, workflow action engine, follow-up dispatcher, scoring engine, or integration job runner. File references: `functions/api/events.js`, `functions/api/health.js`, `migrations/0001_boostr_core.sql`, `text_direction_update_v1_0/docs/04_DATA_INTELLIGENCE_ENGINE.md`.

## 4. Duplicate Or Conflicting Routes Or Systems Found

### Static Route Conflicts

- `[verified]` `public/_redirects` maps `/client` and `/client-os` to `/app/index.html`, while separate files also exist under `public/client/` and `public/client-os/`. File references: `public/_redirects`, `public/app/index.html`, `public/client/index.html`, `public/client-os/index.html`.
- `[verified]` `public/_redirects` maps `/manager-os` to `/manager/index.html`, while `public/manager-os/index.html` also exists. File references: `public/_redirects`, `public/manager/index.html`, `public/manager-os/index.html`.
- `[verified]` `public/_redirects` maps `/partner-os` and `/partner` variants toward partner dashboard surfaces, while `public/partner-os/index.html` also exists. File references: `public/_redirects`, `public/partner-dashboard/index.html`, `public/partner-os/index.html`.
- `[verified]` `public/_redirects` maps both `/82store` and `/82-store` to one storefront path while both naming styles appear in public routes/files. File references: `public/_redirects`, `public/82store/index.html`, `public/82-store/index.html`.
- `[verified]` `public/_redirects` maps `/omgbeauty` to `/portfolio/omgbeauty/index.html`, creating brand route and portfolio route aliases for the same surface. File references: `public/_redirects`, `public/portfolio/omgbeauty/index.html`, `public/omgbeauty/index.html`.
- `[estimated]` Some public HTML files may be orphaned by redirects. Exact runtime behavior depends on Cloudflare Pages redirect precedence. UNCLEAR without production route testing.

### System Conflicts

- `[verified]` The repo contains a root Vite/static Pages app and a separate `apps/ecosystem` app shell. File references: `package.json`, `wrangler.toml`, `apps/ecosystem/package.json`.
- `[verified]` The backend schema exists both as a migration file and as inline SQL in `db-init`. File references: `migrations/0001_boostr_core.sql`, `functions/api/db-init.js`.
- `[declared]` Module status is tracked in docs/manifests. `[verified]` Module rows are also seeded into D1. These are not connected by code. File references: `manifests/MODULES_STATUS_TABLE.md`, `migrations/0001_boostr_core.sql`, `functions/api/modules.js`.

## 5. Missing Pieces To Make The Module System An Actual Engine

- `[missing]` There is no module activation model connected to partners, workspaces, plans, agreements, verticals, or permissions.
- `[missing]` There is no API that enables, disables, configures, or assigns modules to a workspace or partner.
- `[missing]` There is no permission check that gates endpoint behavior by module access.
- `[missing]` There is no runtime module loader, execution contract, or module lifecycle.
- `[missing]` There is no module configuration storage beyond the static `metadata` JSON in the `modules` registry table.
- `[missing]` There is no relationship between `modules` and `orders`, `leads`, `users`, or `workspaces` in the current schema.
- `[missing]` There is no event routing layer that maps lead/order/audit events to module-specific actions.
- `[missing]` There is no rules/scoring/follow-up engine attached to the event log.
- `[missing]` There is no real customer/partner isolation for module data.
- `[missing]` There is no implemented account or billing state that can decide whether a module is available.
- `[missing]` There is no migration path documented in code from registry-only modules to executable modules. UNCLEAR whether this is intended to happen in D1, Next, Workers, or another backend.

## 6. Security Gaps In Current MANAGER_PIN Auth

- `[verified]` Manager access is protected by one shared static PIN, not by user identity.
- `[verified]` The PIN can be sent as a query parameter (`?pin=`), which can leak through browser history, logs, analytics, screenshots, and referrers.
- `[verified]` CORS currently allows all origins through shared JSON helper headers. File reference: `functions/_lib/api.js`.
- `[verified]` There is no workspace-level access control around leads, audits, orders, or events.
- `[verified]` There is no role-based distinction between admin, manager, partner, client, or internal user.
- `[verified]` There is no implemented session expiration, token revocation, device tracking, or audit trail for manager reads.
- `[verified]` There is no rate-limiting or brute-force protection in application code for manager PIN attempts.
- `[verified]` `GET|POST /api/db-init` is reachable as a production route if deployed and can mutate schema when the shared PIN is accepted.
- `[verified]` Public write endpoints accept customer/contact data before any real customer-data governance layer exists.
- `[verified]` `POST /api/intake` and `POST /api/leads` do not match the stricter contact validation used by `POST /api/audit`.
- `[missing]` These gaps block use with real customer data because the current auth cannot prove who accessed records, cannot limit data by customer/workspace, and cannot safely revoke access for one person without rotating the shared secret for everyone.

## 7. Ordered Fix List

1. `[fix]` First, resolve the source-of-truth contradictions: decide and document which runtime is current for production right now (root Vite + Pages Functions + D1, or `apps/ecosystem`), and move/update existing docs so root links match files that actually exist.
2. `[fix]` Second, harden the existing manager boundary before any real customer data is used: remove query-string PIN acceptance, require configured `MANAGER_PIN`, restrict CORS for manager endpoints, and lock down or retire production access to `/api/db-init`.
3. `[fix]` Third, reconcile duplicates that can drift: make migration SQL the only schema source, make one canonical route per surface, and make module docs/manifests match the current registry-only implementation until an engine is actually implemented.

## 8. Exact Next Task After This Doc Is Approved

After this document is approved, the exact next task should be:

> Update only existing documentation and route/schema source-of-truth files so they match this audit: fix broken root docs links, label the current production architecture explicitly, mark the module system as registry-only, and document the manager-auth risks without adding new backend features.

## 5-Line Summary

Current code implements a Vite/Cloudflare Pages site with Pages Functions and D1.
The backend has real lead, audit, event, module-registry, order, health, and db-init endpoints.
The documented target describes a larger identity, workspace, module-engine, and intelligence platform that is not implemented yet.
The biggest contradictions are runtime direction, D1/Pages Functions finality, missing docs paths, module engine claims, and MANAGER_PIN security.
Files changed: exactly 1.

## Files Changed

- `docs/ARCHITECTURE_CURRENT_SOURCE_OF_TRUTH.md`
