# BOOSTR Ecosystem Engine

This is the new BOOSTR Labs internal ecosystem app.

It starts from `BOOSTR_LABS_CODEX_ECOSYSTEM_READY_2026-07.zip`, not from the older public landing-page brief.

## Purpose

Build the BOOSTR Manager-first engine:

- BOOSTR Audit 60s
- BOOSTR Lead Pipeline
- Partner Profiles
- Partner Inventory
- Smart Links / Deep Links
- Interaction Events
- Data Access Workflow
- Advisor Insight Cards
- Payment Records
- Event / Drop Engine
- Feature flags for future modules

## Non-Negotiables

- TypeScript only.
- Next.js App Router.
- Modular monolith.
- Managed Postgres target.
- Cloudflare-ready target.
- No open public signup in v1.
- No self-service Smart Link generator.
- BOOSTR Managers/Advisors operate the system.
- Partner Leads and BOOSTR Leads must remain separate.

## Local Commands

From the repository root:

```bash
pnpm install
pnpm ecosystem:dev
pnpm ecosystem:typecheck
pnpm ecosystem:build
```

## Current State

The first slice is a typed app shell with local demo data:

- Manager Workspace homepage
- BOOSTR Audit 60s form
- Partner Profile cards
- BOOSTR Lead table
- Partner Inventory cards
- Advisor Insight cards
- Angel Colla Event/Drop pilot block
- Prisma/PostgreSQL schema
- `/api/audit` route with Zod validation and rule-based result

The API does not persist yet. Connect Prisma/Postgres after `DATABASE_URL` is chosen.
