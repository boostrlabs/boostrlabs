# BOOSTR Backend Foundation Priority Map

Status: CODEX HANDOFF / BACKEND ROADMAP
Last updated: 2026-07-08

## Purpose

This document converts the backend section of the 100 improvements list into executable priority order.

Do not commit secrets.
Do not commit passwords.
Do not expose Stripe credentials.

## Priority 1 — Production admin bootstrap

Create first real admin securely.

Rules:

- email: `boostrlabs@gmail.com`
- password must be provided through a secure runtime path only
- no password in repo
- no password in docs
- no password in migrations
- no password in logs

Validate:

- `/api/session` login works
- `/api/me` works
- `/api/workspaces` works
- admin role is correct

## Priority 2 — Session production verification

Check:

- token/cookie behavior
- logout
- expired sessions
- invalid password errors
- missing password errors
- no manager PIN fallback in production

## Priority 3 — Workspace scope

Every private object must be scoped.

Objects:

- leads
- audit submissions when claimed
- events
- orders
- payment links
- files
- invoices
- modules

## Priority 4 — Audit → Lead → Workspace

Required flow:

```text
POST /api/audit
→ audit_submission
→ lead
→ manager review
→ workspace claim/create
→ workspace_members
→ workspace_modules
→ events
```

## Priority 5 — Smart Payment Link backend

Tables needed later:

- payment_links
- orders
- order_events

Routes later:

- GET `/api/payment-links/:slug`
- GET `/api/payment-links`
- POST `/api/payment-links`
- PATCH `/api/payment-links/:id`
- POST `/api/orders/reserve`

## Priority 6 — Files and invoices

After workspace/auth is stable:

- files table
- invoices table
- storage strategy
- visibility rules
- workspace access checks

## Priority 7 — Stripe Connect later

Only after LLC/business setup:

- connected account onboarding
- checkout sessions
- webhooks
- platform fees
- refunds/disputes
- production keys outside repo

## Backend health test

A backend pass is valid only if:

- anonymous users cannot access private records
- admin can access what admin should access
- manager can manage leads/workspaces
- partner/client/artist cannot access other workspaces
- public Audit still works
- public payment-link offer read can work without exposing private data
