# BOOSTR Custom OS Permission Matrix

Status: IMPLEMENTED FOUNDATION
Last updated: 2026-07-08

## Core Rule

No private workspace data is returned without session auth and workspace access.

## Role / Persona Visibility

| Role / persona | Workspace access | Cards | Human needs | Products/payment readiness | Notes |
|---|---|---|---|---|---|
| `admin` | All operational workspaces | All operational cards | All visible needs | All records | System owner role. |
| `manager` | All operational workspaces | All operational cards | All visible needs | All records | Runs Manager OS and intake. |
| `partner` | Assigned workspaces | Partner-owned or partner-role cards | Own needs | Scoped records later | Referral rules still pending. |
| `client` | Own workspaces | Own/user/role cards | Own needs | Own workspace records later | No cross-client visibility. |
| `artist` | Own artist workspaces | Own/user/role cards | Own needs | Own workspace records later | Artist OS cards. |
| `producer` | Own producer workspaces/personas | Own/user/role cards | Own needs | Own digital/service records later | Modeled in `personas`. |
| `creator` | Own creator workspaces/personas | Own/user/role cards | Own needs | Own digital/service records later | Modeled in `personas`. |
| `seller` | Own seller workspaces/personas | Own/user/role cards | Own needs | Own product records later | Modeled in `personas`. |
| `agent_later` | None until explicitly assigned | None until assigned | None until assigned | None until assigned | Reserved vocabulary. |

## Endpoint Rules

| Endpoint | Auth | Scope |
|---|---|---|
| `GET /api/cards` | Required | Workspace scoped; admin/manager can query operational cards. |
| `POST /api/cards` | Required | Workspace scoped; non-admin users cannot create cards for another role. |
| `GET /api/cards/:id` | Required | Card workspace access plus card visibility. |
| `PATCH /api/cards/:id` | Required | Card workspace access plus card visibility. |
| `POST /api/cards/:id/action` | Required | Card workspace access plus card visibility. |
| `GET /api/workspaces/:workspace_id/cards` | Required | Workspace scoped. |
| `POST /api/human-needs` | Required | Workspace scoped; creates cards. |
| `GET /api/human-needs` | Required | Admin/manager see operational needs; others see own needs. |
| `GET /api/human-needs/latest` | Required | Same as human-needs list. |
| `GET/PATCH /api/profile` | Required | Own profile only. |
| `/api/profile/contacts*` | Required | Own contacts; workspace access required for scoped contacts. |
| `/api/personas*` | Required | Workspace access; non-admin users see own personas. |
| `GET/PATCH /api/workspace-preferences` | Required | Workspace scoped. |
| `/api/security*` | Required | Own account/session metadata only. |
| `GET /api/integrations/api-tokens` | Required | Own token metadata only. |
| `/api/notifications*` | Required | Workspace scoped; non-admin users see own or broadcast notifications. |
| `/api/activity*` | Required | Workspace scoped; non-admin users see own or broadcast events. |
| `POST /api/audit` | Public | Stores audit/lead/cards in internal intake workspace. |
| `GET /api/demo/janko-os` | Public | Static safe demo data only. |

## Current Limits

- `workspace_members.role` still supports the original account roles.
- Expanded roles are supported as `personas.persona_type`.
- Public demo access is static and safe only.
- Payment-link tables do not imply paid status.
- No Stripe live credentials or payment processing exists in this layer.
