# BOOSTR Labs Auth Backend Contract

Status: PENDING BACKEND IMPLEMENTATION

This document defines the next backend/auth pass for BOOSTR Labs after the Mother UI frontend cleanup.

## Decision

BOOSTR should not stay on `MANAGER_PIN` as a product-level access model.

`MANAGER_PIN` or any temporary access token is only a development bridge for protected D1/API testing. The real product direction is role-based user login with workspaces.

## Required account model

One user account can access multiple workspaces.

A workspace can represent:

- BOOSTR internal manager workspace
- Partner workspace
- Client business workspace
- Artist workspace
- Store workspace
- Admin/system workspace

## Roles

Minimum roles:

- `admin`
- `manager`
- `partner`
- `client`
- `artist`

A user may have more than one role across different workspaces.

## Guest vs account-required

Guest allowed:

- Submit `/audit`
- Browse public pages
- Browse public smart links
- Browse public store frontends

Account required:

- Manager lead inbox
- Partner dashboard
- Client OS
- Artist OS
- Audit history
- Files/uploads
- Orders/invoices
- Private dashboards
- Rewards, digital licenses, recurring access, high-ticket records or private content

## Backend tables needed

Suggested minimum tables:

- `users`
- `workspaces`
- `workspace_members`
- `sessions` or auth-provider-backed sessions
- `permissions` or role policy map
- connect existing `leads` to `workspace_id`
- connect existing `audit_submissions` to `workspace_id` once claimed
- connect future `orders`, `files`, `invoices`, `projects` to `workspace_id`

## API requirements

Protected APIs should stop relying on `X-Manager-Pin`.

Expected replacement:

- session cookie or JWT
- server-side role check
- workspace scope check
- response only includes records the user can access

Endpoints to protect first:

- `GET /api/leads`
- `POST /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id`
- future order/file/invoice/project endpoints

`POST /api/audit` should remain public, with spam/rate protection later.

## Frontend already prepared

The frontend now includes:

- `/login` role-based auth shell
- local preview session for navigation testing
- `/manager` rewritten around real login direction
- `/manager/leads` reframed as temporary API bridge, not final auth
- `/app` rewritten as Client OS workspace shell
- `/partner-dashboard` rewritten as Partner OS workspace shell
- `/admin` rewritten as backend contract shell

## Non-negotiable positioning

BOOSTR Labs is a technology company building Custom Operating Systems.

Do not reduce the product to:

- agency website services
- generic AI tools
- simple portfolio pages
- ambassador/pulse bloat

The public entry is `/audit`. The system grows from audit → manager review → account/workspace → modules.
