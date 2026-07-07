# BOOSTR PRIME Technical Architecture

## Standard

The project is now PRIME standard.

This means:

- Production-quality decisions.
- Stability.
- Security.
- Strict typing.
- PostgreSQL data integrity.
- Modular design.
- Future mobile readiness.

## Frontend

- TypeScript only.
- No plain JavaScript for new code/refactors.
- Strict mode.
- Next.js or equivalent modern framework.
- Typed API responses.
- Typed forms.
- Reusable components.

## Backend

Preferred backend direction: statically typed, robust, high-performance language.

Go is the recommended choice for early BOOSTR Core because it is fast, simple to deploy, strongly typed, excellent for APIs, and operationally lighter than Java/C# for a small team.

Avoid Node.js/Python for core backend logic.

## Database

PostgreSQL.

Requirements:

- Strong constraints.
- Foreign keys.
- UUID primary keys.
- Migrations.
- Indexes.
- Role/permission model.
- Audit fields.
- No weak/no-schema storage for core business data.

## Mobile readiness

The API must be clean enough to support:

- Web app.
- Future iOS app.
- Future Android app.
- Hybrid/mirrored web app if needed.

## Abstraction layers

Avoid coupling frontend directly to providers.

Use internal layers:

- BOOSTR Payments Layer -> Stripe / future providers.
- BOOSTR Campaign Layer -> Meta / future ad providers.
- BOOSTR Storage Layer -> Supabase/R2/future storage.

## Initial technical modules

- Auth / roles.
- BOOSTR Manager workspace.
- Partner profiles.
- Partner inventory.
- Smart Link route/page support.
- BOOSTR leads.
- Partner leads.
- Payment placeholders.
- Rewards and Balance placeholders.
- File/document support.
- Legal/Economics docs in repo.
