# BOOSTR Production Launch Checklist

Status: READY FOR LIVE CONFIGURATION
Last updated: 2026-07-08

## Purpose

This checklist is the manual launch path for turning the current BOOSTR signup/login foundation into a live registration environment.

No secrets belong in the repository.

## 1. Apply D1 migrations

Apply these Cloudflare D1 migrations in order:

```text
0010_invite_codes.sql
0011_seed_initial_invite_codes.sql
0012_signup_workspace_bootstrap.sql
```

Why:

- `0010` creates Secret BOOSTR Code tables.
- `0011` seeds the initial codes as salted hashes.
- `0012` adds signup username/phone/onboarding fields.

## 2. Configure Cloudflare env vars

Required:

```text
BOOSTR_ADMIN_BOOTSTRAP_KEY
```

Optional:

```text
BOOSTR_SECRET_CODE
BOOSTR_INVITE_CODE
```

Rules:

- Never commit these values.
- Configure them only in Cloudflare environment settings.
- The admin bootstrap key is only useful before the first active admin exists.

## 3. Open readiness API

Open:

```text
/api/readiness
```

Expected once configured:

```json
{
  "ok": true,
  "status": "ready"
}
```

Other valid states:

- `missing_migrations`
- `needs_config`
- `degraded`

## 4. Open readiness console

Open:

```text
/admin/readiness
```

Confirm:

- D1 binding ready
- critical tables ready
- critical user columns ready
- Secret BOOSTR Codes seeded
- admin bootstrap key configured
- no secrets visible

## 5. Bootstrap first admin

Use `/admin/readiness` or call:

```http
POST /api/admin/bootstrap
```

Payload shape:

```json
{
  "bootstrap_key": "from-cloudflare-env-match",
  "display_name": "Founder",
  "username": "admin",
  "email": "founder@email.com",
  "password": "secure-password-12-plus",
  "workspace_name": "BOOSTR Labs CORE"
}
```

Rules:

- Only works if `BOOSTR_ADMIN_BOOTSTRAP_KEY` is configured.
- Only works if no active admin exists yet.
- Never returns the env var.
- Creates admin user, CORE workspace, admin persona, cards, preferences and session.

## 6. Re-check readiness

Open:

```text
/api/readiness
/admin/readiness
```

Expected:

- `admin_exists: true`
- no missing critical tables
- no missing critical columns

## 7. Test Secret BOOSTR Code

Open:

```text
/audit
```

Test seeded founder codes:

```text
NOSOTROSNOELLOS
WESTDETRO
82
```

Expected:

- red Matrix unlock screen
- account creation CTA
- redirect to `/signup?secret=...`

## 8. Test signup

Open:

```text
/signup
```

Create a non-admin account.

Confirm response creates:

- user
- workspace
- workspace member
- persona
- workspace preferences
- first-run cards
- activity event
- session

## 9. Test login by email

Open:

```text
/login
```

Use email + password.

Expected:

- redirect to `/app`
- `/app` status chip says `Backend dashboard`
- workspace name appears
- cards render

## 10. Test login by username

Use the same password with the registered username.

Expected:

- same `/app` backend dashboard result

## 11. Test login by phone

Only if the account has phone.

Expected:

- same `/app` backend dashboard result

## 12. Test app dashboard

Open:

```text
/app
```

Confirm:

- workspace appears clearly
- persona appears
- backend cards replace static fallback cards
- activity appears if available
- session clear works from `/login`

## 13. Confirm health

Open:

```text
/api/health
```

Confirm:

- version includes production readiness
- `/api/readiness` appears
- `/api/admin/bootstrap` appears
- `/api/signup` appears
- `/api/dashboard` appears

## 14. Bootstrap protection

After first admin exists, `/api/admin/bootstrap` should return:

```text
admin_already_exists
```

Optional hardening:

- remove `BOOSTR_ADMIN_BOOTSTRAP_KEY` after bootstrap
- keep first-admin existence protection as fallback

## Still pending after live launch

- email verification
- password reset email delivery
- Audit lead claim into workspace
- product/payment-link APIs
- files/invoices
- OAuth Google/Apple/Microsoft
- Stripe after LLC/payment setup
