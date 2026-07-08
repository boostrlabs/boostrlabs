# BOOSTR Roadmap v1

Status: ACTIVE PRODUCT ROADMAP
Last updated: 2026-07-08

## North Star

Cada negocio merece su propio sistema operativo.

BOOSTR diagnoses, builds, connects and improves that operating system through first-party data.

## Phase 1 — Foundation

Goal: make BOOSTR usable as a real platform.

Must complete:

1. Production admin bootstrap.
2. Session login verified.
3. `/api/me` verified.
4. Workspace scope verified.
5. Dashboard uses real workspace/session state.
6. Leads uses real session, not manual token.
7. Audit creates complete records.
8. Lead converts to workspace.

## Phase 2 — Product Flow

Goal: connect the actual app journey.

Flow:

```text
BOOSTR Audit
→ Leads
→ Dashboard
→ Modules
→ Smart Payment Link
→ Orders
→ Files / Invoices
→ Intelligence Engine
```

## Phase 3 — Smart Payment Link

Goal: prepare money movement before Stripe goes live.

Pre-LLC:

- public prototype
- offer model
- order model
- guest/account rules
- fulfillment rules
- manager UI
- dashboard UI

Post-LLC:

- Stripe Connect
- connected accounts
- checkout sessions
- webhooks
- payouts
- refunds/disputes

## Phase 4 — Branded Worlds

Goal: show that BOOSTR powers custom worlds without flattening them.

Protected branded worlds:

- JANKO / WESTDETRO Link OS
- 82NGEL OS
- 82NGEL Dashboard
- 82 Storefront
- client/partner routes

Rule:

BOOSTR powers the infrastructure. The brand keeps the visual world.

## Phase 5 — Intelligence Engine

Goal: make BOOSTR feel proprietary.

Inputs:

- Audit signals
- Leads history
- workspace events
- module usage
- payment behavior
- orders
- fulfillment

Outputs:

- recommended modules
- next best action
- conversion risk
- readiness score
- human review flags

## Phase 6 — Scale

After foundation works:

- partner onboarding
- client onboarding
- files
- invoices
- smart checkout
- repeatable OS templates
- reporting
- proof/case studies

## Immediate next 10 tasks

1. Live QA `/home` on mobile.
2. Live QA `/modules` on mobile.
3. Live QA `/smart-payment-link` on mobile.
4. Live QA `/jankodiorr` on mobile.
5. Live QA `/audit` on mobile.
6. Codex: bootstrap first admin.
7. Codex: verify session/workspace endpoints.
8. Codex: connect Leads to real auth.
9. ChatGPT: finish i18n route-by-route.
10. ChatGPT/Codex: Smart Payment Link backend model.
