# Signup Workspace Bootstrap QA

Status: PART 3 COMPLETE
Last updated: 2026-07-08

## Scope

This pass implements the backend foundation for real online registration and default workspace bootstrap.

It moves BOOSTR from frontend-only signup surfaces toward actual account creation.

No OAuth, Stripe, payment credentials, email verification, password reset, product APIs or paid-order logic were added.

## Files changed

- `migrations/0012_signup_workspace_bootstrap.sql`
- `functions/api/signup.js`
- `functions/api/signup/check-username.js`
- `functions/api/dashboard.js`
- `functions/api/session.js`
- `functions/api/health.js`
- `docs/CUSTOM_OS_API_CONTRACT.md`
- `docs/CUSTOM_OS_BACKEND_STATUS.md`
- `docs/SIGNUP_WORKSPACE_BOOTSTRAP_QA.md`

## New migration

`0012_signup_workspace_bootstrap.sql`

Adds user fields:

- `username`
- `phone`
- `normalized_phone`
- `signup_source`
- `invite_code_id`
- `onboarding_status`

Adds indexes:

- unique username
- unique normalized phone when provided
- invite code lookup
- onboarding status
- workspace slug

## Endpoints

### `POST /api/signup`

Public.

Creates:

- user
- workspace
- workspace member
- persona
- workspace preferences
- first-run cards
- activity event
- session

Required:

- display name
- username
- email
- password
- workspace name
- language

Optional:

- phone
- business type
- default persona
- Secret BOOSTR Code
- source
- timezone

If a valid DB-backed Secret BOOSTR Code is used, usage increments only after signup successfully creates the account/workspace.

### `GET /api/signup/check-username`

Public.

Returns username availability and normalized username.

Reserved names include:

- admin
- root
- boostr
- boostrlabs
- api
- support
- login
- signup
- audit
- manager
- app
- dashboard
- jankodiorr
- 82ngel

### `GET /api/dashboard`

Private.

Returns:

- current user
- active workspace
- persona
- preferences
- first-run/default cards
- recent activity

### `POST /api/session`

Updated to accept:

- email
- username
- phone

The request field is now:

```json
{
  "identifier": "email_or_username_or_phone",
  "password": "password"
}
```

## Default cards created by signup

- Complete profile
- Add business details
- Upload logo/assets
- Add first product/service
- Start BOOSTR Audit
- Smart Payment Link later
- Choose persona
- Request BOOSTR Manager setup

These are first-run cards, not a fully custom OS yet.

## Secret Code behavior

Signup re-validates `secret_boostr_code` server-side.

If valid:

- user/workspace is created
- `invite_code_id` is attached to user
- first-run cards are created
- activity event records signup
- DB-backed code usage increments

If invalid:

- signup still works normally without bypass metadata

No public signup can grant admin.

## Security rules preserved

- Passwords are hashed.
- Password hashes are never returned.
- Plaintext invite codes are not stored in DB.
- Token is returned only on signup/session creation.
- Session cookie is HttpOnly.
- Signup roles are restricted to safe public roles.
- No OAuth provider was added.
- No Stripe or paid-order logic was added.

## Remote D1 requirement

Apply migrations remotely before full live testing:

```text
0010_invite_codes.sql
0011_seed_initial_invite_codes.sql
0012_signup_workspace_bootstrap.sql
```

Without `0012`, `/api/signup` and username/phone login will not be fully operational.

## QA checklist

### Username

- `/api/signup/check-username?username=janko` returns available if unused.
- reserved names return unavailable.
- short/invalid names return unavailable.

### Signup

- valid signup creates account.
- duplicate email is blocked.
- duplicate username is blocked.
- duplicate phone is blocked when phone exists.
- weak password is blocked.
- signup returns `token`, `user`, `workspace`, `persona`, `default_cards`, `redirect`.

### Secret code

- valid code still unlocks Audit.
- valid code passed into signup increments DB usage after success.
- invalid code does not block normal signup.

### Login

- login by email works.
- login by username works.
- login by phone works when phone was provided.
- bad credentials return a generic error.

### Dashboard

- `/api/dashboard` with session returns workspace/persona/cards/activity.
- `/app` can use local session today and backend dashboard later.

## Part 3 health target

Target score: 94–96.

Expected score after this pass: 95 if migrations apply cleanly and signup/login are verified on Cloudflare.
