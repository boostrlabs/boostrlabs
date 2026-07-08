# Custom OS API Contract

Status: CURRENT / BACKEND CONTRACT
Last updated: 2026-07-08

## Auth

- Private endpoints require a valid session cookie, `Authorization: Bearer <token>`, or `X-BOOSTR-Session`.
- `X-Manager-Pin` is development fallback only when explicitly enabled.
- Public-safe endpoints include `GET /api/health`, `GET /api/readiness`, `POST /api/invite-codes/validate`, `POST /api/signup`, `GET /api/signup/check-username`, `POST /api/session`, `POST /api/audit`, and `GET /api/demo/janko-os`.
- `POST /api/admin/bootstrap` is public-routed but protected by `BOOSTR_ADMIN_BOOTSTRAP_KEY` and first-admin-only rules.
- Errors return `{ ok: false, error, message }` with stable snake_case `error`.
- Password hashes, full API tokens, plaintext invite codes and env var values are never returned.

## Production Readiness

`GET /api/readiness`

Public-safe. Does not expose secrets.

Returns:

- environment status: `ready`, `missing_migrations`, `needs_config`, or `degraded`
- D1 binding state
- critical table checks
- critical user column checks
- seeded invite-code readiness
- admin existence
- whether admin bootstrap key is configured, without returning the value
- required migrations
- next steps

Critical migrations for current launch:

- `0010_invite_codes.sql`
- `0011_seed_initial_invite_codes.sql`
- `0012_signup_workspace_bootstrap.sql`

## Admin Bootstrap

`POST /api/admin/bootstrap`

Creates the first BOOSTR admin safely.

Request:

```json
{
  "bootstrap_key": "from-founder",
  "display_name": "Founder",
  "username": "admin",
  "email": "founder@email.com",
  "password": "secure-password-12-plus",
  "workspace_name": "BOOSTR Labs CORE"
}
```

Rules:

- Requires env var `BOOSTR_ADMIN_BOOTSTRAP_KEY`.
- Compares key server-side only.
- Never returns or logs the env var value.
- Fails with `admin_already_exists` if an active admin exists.
- Creates admin user, CORE workspace, admin workspace member, admin persona, workspace preferences, admin first-run cards, activity event and session.
- Password is hashed.
- Does not commit or assume default credentials.

## Signup / Registration

`POST /api/signup`

Public. Creates a real user account, active workspace, workspace membership, persona, workspace preferences, first-run cards, activity event and session.

Required fields:

- `display_name`
- `username`
- `email`
- `password`
- `workspace_name`
- `language`

Optional fields:

- `phone`
- `business_type`
- `default_persona`
- `secret_boostr_code`
- `source`
- `timezone`

Rules:

- email is unique
- username is unique
- normalized phone is unique when provided
- username is normalized lowercase
- password is hashed through PBKDF2-SHA256
- secret code usage increments only after signup completion
- no admin role is granted through public signup
- public signup may create normal roles only: `client`, `artist`, or `partner` when server-side invite rules permit it

`GET /api/signup/check-username?username=...`

Public. Returns username availability and normalized username.

Reserved usernames include `admin`, `root`, `boostr`, `boostrlabs`, `api`, `support`, `login`, `signup`, `audit`, `manager`, `app`, `dashboard`, `jankodiorr`, and `82ngel`.

## Session / Login

`POST /api/session`

Public. Accepts:

```json
{
  "identifier": "email_or_username_or_phone",
  "password": "password"
}
```

`identifier` can be email, username, or phone.

`GET /api/session` / `GET /api/me`

Private. Returns current user, active workspace, memberships, roles, personas and visible modules.

`DELETE /api/session`

Private. Revokes the current session.

## Dashboard

`GET /api/dashboard`

Private. Returns active workspace, active persona, workspace preferences, first-run/default cards and recent activity.

## Secret BOOSTR Code

`POST /api/invite-codes/validate`

Public. Safe validation only.

Rules:

- DB codes are stored as salted hashes only.
- Env fallback can use `BOOSTR_SECRET_CODE` or `BOOSTR_INVITE_CODE` without committing secrets.
- Invalid responses are generic.
- Validation does not increment usage.
- Signup increments usage only after successful account/workspace creation.

## Current User / Profile

`GET /api/me`

Alias of session GET. Returns current user, active workspace, memberships, roles, and active workspace personas.

`GET /api/profile` and `PATCH /api/profile`

Auth required. Profile supports display name, avatar URL, default workspace/persona, language, timezone and theme.

## Contact Methods

`GET /api/profile/contacts`

Auth required. Optional `workspace_id`.

`POST /api/profile/contacts`

Auth required. Supports artist/business email, personal/business phone, WhatsApp, Instagram, website and smart link.

`PATCH /api/profile/contacts/:id` / `DELETE /api/profile/contacts/:id`

Auth required. User-owned contact only.

## Workspaces / Personas / Preferences

`GET /api/workspaces`

Returns workspaces visible to the current session.

`GET /api/personas`, `PATCH /api/personas/:id`, `POST /api/personas/switch`

Auth required and workspace scoped.

`GET /api/workspace-preferences`, `PATCH /api/workspace-preferences`

Auth required and workspace scoped.

## Security

`GET /api/security`

Auth required. Returns safe account security metadata.

`POST /api/security/change-password`

Auth required. Requires current password and new password.

`GET /api/security/sessions`, `DELETE /api/security/sessions/:id`, `POST /api/security/logout-all`

Auth required. Session metadata only.

## Integrations

`GET /api/integrations/api-tokens`

Auth required. Returns token metadata only.

`POST /api/integrations/api-tokens` and `DELETE /api/integrations/api-tokens/:id`

Auth required. Currently return `501` until secure token creation/deletion is implemented.

## Notifications And Activity

`GET /api/notifications`, `PATCH /api/notifications/:id`, `GET /api/activity`, `POST /api/activity`

Auth required and workspace scoped.

## Cards

`GET /api/cards`, `POST /api/cards`, `GET /api/cards/:id`, `PATCH /api/cards/:id`, `POST /api/cards/:id/action`, `GET /api/workspaces/:workspace_id/cards`

Auth required. Card workspace and visibility checked.

Allowed action types include approve, reject, later, follow_up, done, pin, archive, create_payment_link_later, request_asset and open_module.

## Human Needs

`GET /api/human-needs`, `GET /api/human-needs/latest`, `POST /api/human-needs`

Auth required and workspace scoped. Stores need, resolves persona when available, creates cards, and returns created cards.

## Audit

`POST /api/audit`

Public. Safe for guest submissions. Stores audit submission, creates lead, attaches records to internal `BOOSTR Intake` workspace, logs `audit.submitted`, and creates cards.

## JANKO Demo

`GET /api/demo/janko-os`

Public. Static safe demo payload. No D1 reads, private records, real sales, fake paid orders or Stripe.

## Language Runtime

The ecosystem supports `en` and `es`. Selected language persists in `localStorage.boostr_lang`.

## Product And Payment Readiness

Current tables:

- `products`
- `payment_links`
- `order_reservations`

Not implemented:

- product APIs
- payment-link APIs
- Stripe checkout
- paid orders
