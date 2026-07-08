# Signup/Login Integration QA

Status: PART 4 COMPLETE
Last updated: 2026-07-08

## Scope

This pass connects the frontend registration/login/dashboard experience to the backend foundation created in Part 3.

No new payment logic, Stripe, OAuth provider, email verification, password reset, product API or D1 schema change was added in this pass.

## Files changed

- `public/app/index.html`
- `public/login/index.html`
- `public/signup/index.html`
- `docs/SIGNUP_LOGIN_INTEGRATION_QA.md`

## Integration map

```text
/audit
→ Secret BOOSTR Code unlock
→ /signup?secret=...
→ POST /api/signup
→ stores returned token locally
→ server also sets session cookie
→ /app
→ GET /api/dashboard
→ renders backend workspace/cards/activity when available
```

Existing login flow:

```text
/login
→ identifier + password
→ POST /api/session
→ stores returned token locally
→ server also sets session cookie
→ /app
→ GET /api/dashboard
```

## App dashboard behavior

`/app` now attempts to load:

```http
GET /api/dashboard
```

It sends:

- session cookie through `credentials: same-origin`
- `Authorization: Bearer <token>` when a token exists in `localStorage.boostr_auth_token`

Data states:

- `Backend dashboard` when API responds
- `Cached session` when local session exists but dashboard API is unavailable
- `Local first-run` when no account/session exists
- `Loading dashboard` while fetching

## Signup behavior

`/signup` now stores returned backend information more completely:

- `boostr_auth_token`
- local session email
- username
- role
- workspace name
- persona

The signup request includes:

- `display_name`
- `username`
- `email`
- `phone`
- `password`
- `language`
- `workspace_name`
- `business_type`
- `default_persona`
- `secret_boostr_code`
- `source`

If a Secret BOOSTR Code was carried from Audit, signup marks the source as `audit_secret_code_signup`.

## Login behavior

`/login` now stores returned backend information more completely:

- `boostr_auth_token`
- email / username
- role
- active workspace
- persona

The login request uses:

```json
{
  "identifier": "email_or_username_or_phone",
  "password": "password"
}
```

It also attempts backend session revocation on local session clear:

```http
DELETE /api/session
```

Then it clears local token/session.

## First-run cards

When backend cards exist, `/app` renders the real cards returned by `/api/dashboard`.

When backend is unavailable, `/app` falls back to static first-run cards:

- Complete profile
- Add business details
- Upload logo/assets
- Add first product/service
- Start BOOSTR Audit
- Smart Payment Link later
- Choose persona
- Request BOOSTR Manager setup

## QA checklist

### Signup → App

1. Apply D1 migrations `0010`, `0011`, `0012`.
2. Open `/audit`.
3. Enter a valid Secret BOOSTR Code.
4. Unlock red Matrix screen.
5. Continue to `/signup`.
6. Create account.
7. Verify redirect to `/app`.
8. Verify `/app` status chip says `Backend dashboard`.
9. Verify workspace name appears in header/body.
10. Verify backend cards render.

### Login → App

1. Open `/login`.
2. Login with email.
3. Verify `/app` loads backend dashboard.
4. Repeat with username.
5. Repeat with phone if phone was provided.

### Fallback

1. Clear token/session.
2. Open `/app`.
3. Verify local first-run dashboard still renders.
4. Verify no fake account creation appears.

## Remaining production requirements

Still pending after Part 4:

- remote D1 migration application and live QA
- email verification
- password reset
- admin bootstrap
- Audit lead → workspace claim flow
- product/payment-link APIs
- files/invoices
- OAuth later: Google, Apple, Microsoft
- Stripe later after LLC/payment setup

## Part 4 health target

Target score: 96–97.

Expected score after this pass:

- Codebase: 96.5
- Live production: 95 until D1 migrations and end-to-end signup/login are verified on Cloudflare
