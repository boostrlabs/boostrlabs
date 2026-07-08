# BOOSTR Labs Modules Source Of Truth

Status: CURRENT MODULE MAP
Last updated: 2026-07-08

Purpose: define the official BOOSTR module registry so frontend, backend, docs, D1 seeds and future Codex work do not drift.

This file is product-level truth. D1 `modules` rows, `/modules`, dashboard cards and docs should follow this map.

## Status labels

- `LIVE` = public route or API is usable now.
- `SHELL` = front-end surface exists, but full backend/data/auth is not complete.
- `PARTIAL` = some backend exists, but product flow is incomplete.
- `PLANNED` = intended module, not ready for user-facing use.
- `INTERNAL` = BOOSTR-only operating surface.
- `ACCOUNT_REQUIRED` = should require BOOSTR identity once auth is implemented.
- `PUBLIC` = can be visited without account.

## Module registry

| Module | Slug | Status | Access | Primary route | Backend/API | Notes |
|---|---|---:|---:|---|---|---|
| BOOSTR Audit | `boostr-audit` | LIVE | PUBLIC | `/audit` | `POST /api/audit` | Main public intake and diagnosis path. Guest allowed. Converts into lead/account history later. |
| Manager OS | `manager-os` | PARTIAL | ACCOUNT_REQUIRED / INTERNAL | `/manager` | `/api/leads`, `/api/events`, `/api/orders`, `/api/modules` | Internal operations shell. Needs real auth + permissions to replace temporary API access. |
| Lead Inbox | `lead-inbox` | PARTIAL | ACCOUNT_REQUIRED / INTERNAL | `/manager/leads` | `GET /api/leads` | Manager review surface for audit and website leads. Needs session auth and lead detail actions. |
| Client OS | `client-os` | SHELL | ACCOUNT_REQUIRED | `/app` | Pending workspace APIs | Client workspace hub for projects, files, invoices, orders and active modules. |
| Partner OS | `partner-os` | SHELL | ACCOUNT_REQUIRED | `/partner-dashboard` | Pending referral/workspace APIs | Partner route, referral attribution and relationship tracking surface. |
| Artist OS | `artist-os` | SHELL | ACCOUNT_REQUIRED | `/app/82ngel` | Pending artist workspace APIs | Artist infrastructure without creative control. Public artist front doors stay custom. |
| Smart Links | `smart-links` | PARTIAL | PUBLIC + ACCOUNT_REQUIRED ADMIN | `/82ngel`, `/jankodiorr` | Workspace smart-link APIs exist but are not fully wired into current static deploy | Public custom-branded front doors. Editing/analytics should require account later. |
| Smart Checkout | `smart-checkout` | PLANNED | MIXED | `/82store` | `/api/orders` partial | Guest/simple purchase allowed later; protected orders/history require account. Payments not complete. |
| Storefront | `storefront` | SHELL | PUBLIC | `/82store` | Orders/payments pending | Public commerce frontend for 82 Store. Needs checkout/payment/order wiring. |
| Portfolio / Proof | `portfolio` | LIVE | PUBLIC | `/portfolio` | None required | Public proof route. Should not become the whole product identity. |
| Module Registry | `module-registry` | LIVE | PUBLIC / INTERNAL QA | `/modules` | Optional `GET /api/modules` | Route QA and module index. Should reflect this document. |
| Ecosystem Map | `ecosystem-map` | SHELL | PUBLIC / INTERNAL | `/ecosystem` | None required | Architecture/product map. Keep clear and non-bloated. |
| Admin OS | `admin-os` | SHELL | ACCOUNT_REQUIRED / INTERNAL | `/admin` | Pending admin APIs | Backend contract surface. Should require admin auth once live. |
| Orders | `orders` | PARTIAL | ACCOUNT_REQUIRED / INTERNAL | Admin/Client workspace later | `GET/POST /api/orders` | Backend exists for manager-protected orders, but no full product UX/payment flow yet. |
| Events | `events` | PARTIAL | ACCOUNT_REQUIRED / INTERNAL | Manager/Admin later | `GET /api/events` | Event storage/listing exists. No automation or workflow engine yet. |
| Files | `files` | PLANNED | ACCOUNT_REQUIRED | Client/Admin workspace later | Pending storage API | Needs R2/S3-style storage, permissions and workspace ownership. |
| Invoices | `invoices` | PLANNED | ACCOUNT_REQUIRED | Client/Admin workspace later | Pending billing API | Needs orders/payments/workspace history. |
| Intelligence Engine | `intelligence-engine` | PLANNED | INTERNAL + ACCOUNT_REQUIRED OUTPUTS | Not exposed as a single public route | Pending scoring/rules/actions engine | Target concept: signals, recommendations, follow-up and first-party data logic. Not implemented yet. |

## D1 seeded modules currently known

The initial D1 migration seeds these module rows:

| D1 slug | Product mapping | Current interpretation |
|---|---|---|
| `boostr-audit` | BOOSTR Audit | LIVE public intake. |
| `smart-links` | Smart Links | PARTIAL public front doors + future workspace editing. |
| `manager-os` | Manager OS | PARTIAL internal operating system. |
| `smart-checkout` | Smart Checkout | PLANNED/PARTIAL order backend and future checkout. |
| `artist-os` | Artist OS | SHELL account-required artist workspace direction. |

## Official module flow

1. Public visitor enters through `/audit`, `/82ngel`, `/jankodiorr`, `/82store`, `/portfolio` or another public route.
2. `/audit` captures structured lead data.
3. Manager reviews lead in `/manager/leads`.
4. Manager qualifies the lead and assigns a module path.
5. Backend creates or connects a `workspace_id`.
6. User gets account-required access to `/app`, `/partner-dashboard`, Artist OS or another workspace.
7. Modules activate by workspace, role, plan, need, agreement or vertical.

## Guest vs account-required module rule

Guest allowed:

- BOOSTR Audit submission
- Public smart links
- Public portfolio
- Public storefront browsing
- Future simple/low-risk checkout

Account required:

- Lead history
- Manager review
- Partner dashboard
- Client OS
- Artist OS
- Files
- Invoices
- Orders requiring history/access
- Rewards, digital licenses, recurring access, protected content or high-ticket records

## Rules for future module work

1. Do not add a new module card without adding it here.
2. Do not seed a D1 module without mapping it here.
3. Do not create a public route for a module without updating `docs/ROUTES_STATUS.md`.
4. Keep BOOSTR positioned as Custom Operating Systems, not agency services, generic AI tools or link-in-bio clones.
5. Public modules can be custom-branded. Account-required access should federate into BOOSTR identity.
6. Prefer fewer strong modules over many vague/unfinished surfaces.
7. If a module is only a visual shell, label it `SHELL` in docs and keep public copy premium.

## Next module priorities

| Priority | Module | Why |
|---:|---|---|
| 1 | BOOSTR Audit | Main lead engine and easiest public conversion path. |
| 2 | Lead Inbox / Manager OS | Turns audit submissions into operating workflow. |
| 3 | Client OS | Makes BOOSTR feel like account-based software, not only a website. |
| 4 | Partner OS | Supports curated network and referral routes. |
| 5 | Smart Checkout / Orders | Adds commerce and monetization infrastructure. |
| 6 | Files / Invoices | Required for real client operations and history. |
| 7 | Intelligence Engine | High-value layer after enough first-party data exists. |
