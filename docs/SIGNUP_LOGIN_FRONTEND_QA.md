# BOOSTR Signup/Login Frontend QA

Status: PART 1 COMPLETE
Last updated: 2026-07-08

## Scope

This pass adds the frontend layer for online registration through BOOSTR Audit and traditional login/signup UI.

No backend functions, D1 migrations, auth/session logic, Stripe live processing, payment credentials or secrets were changed.

## Files changed

- `public/audit/index.html`
- `public/signup/index.html`
- `public/login/index.html`
- `public/app/index.html`
- `public/_redirects`
- `docs/SIGNUP_LOGIN_FRONTEND_QA.md`

## Flow map

```text
/audit
→ optional secret BOOSTR code
→ valid code: bypass Audit into /signup
→ invalid/unavailable code: continue Audit normally
→ /signup creates account only if backend accepts POST /api/signup
→ /login signs in through POST /api/session
→ /app shows first-run default dashboard
```

## Audit secret code UX

The first Audit screen now includes:

- language selection
- optional secret BOOSTR code
- tiny helper text
- non-blocking validation

Spanish copy:

```text
Si conoces la clave secreta BOOSTR, escríbela aquí.
Si no sabes de qué estoy hablando, no te preocupes. Solo avanza sin colocar nada.
```

English copy:

```text
If you know the secret BOOSTR code, enter it here.
If you do not know what this means, do not worry. Just continue without entering anything.
```

## Secret code states

### Valid

Shows:

- Cheat BOOSTR Code unlocked
- bypass audit/pre-approval message
- option to continue Audit anyway
- option to create BOOSTR account

The code is carried to `/signup` through query/session storage.

### Invalid

Shows subtle message:

- code not unlocked
- continue Audit normally

### Endpoint unavailable

Shows fallback message:

- code check unavailable
- continue Audit normally

The Audit is never blocked by code validation failure.

## Signup UI

Created route:

- `/signup`

Signup fields:

- display name
- username
- email
- phone
- password
- confirm password
- workspace/business name
- default persona
- secret BOOSTR code
- terms acknowledgement

Frontend behavior:

- username availability request if endpoint exists
- password strength meter
- show/hide password
- confirm password match
- EN/ES toggle
- backend POST `/api/signup`
- no fake account creation

If backend is unavailable, UI says signup backend is not available yet.

## Login UI

Updated `/login`.

Login now uses:

- email / username / phone
- password

Added:

- show/hide password
- create account link
- Audit link
- forgot password placeholder
- disabled Google/Apple/Microsoft login placeholders
- EN/ES toggle

Login posts to `/api/session` with:

```json
{
  "identifier": "email_or_username_or_phone",
  "password": "password"
}
```

## First-run Dashboard

Updated `/app` to show a default first-run dashboard when the workspace is not custom yet.

Cards:

- Complete profile
- Add business details
- Upload logo/assets
- Add first product/service
- Start BOOSTR Audit
- Smart Payment Link later
- Choose persona
- Request BOOSTR Manager setup

This state does not pretend the dashboard is already custom.

## Language behavior

Implemented EN/ES in:

- `/audit`
- `/signup`
- `/login`
- `/app` first-run dashboard

Behavior:

- stores preference in `localStorage` as `boostr_lang`
- uses browser language as initial fallback
- does not overtranslate BOOSTR product names

## Mobile QA checklist

Check on phone:

- `/audit` first screen fits without overflow
- secret code helper is tiny but readable
- keyboard does not hide the primary button
- valid/invalid states do not break flow
- `/signup` fields are at least 44px tall
- password buttons are usable
- `/login` social placeholders do not crowd layout
- `/app` first-run cards stack correctly
- no horizontal overflow
- bottom navigation does not cover submit buttons

## Backend dependencies

This frontend pass expects these endpoints later:

- `POST /api/invite-codes/validate`
- `POST /api/signup`
- `GET /api/signup/check-username`
- `POST /api/session`
- `GET /api/me`
- `GET /api/dashboard`

The UI degrades safely if some are unavailable.

## Must not be faked

- no fake account creation
- no fake successful login
- no fake OAuth
- no fake Stripe
- no fake paid orders
- no real secret token exposure

## Health target

Part 1 target score: 91–92.

Expected score after this pass: 92 if the Audit/start/signup/login flows render cleanly on mobile and desktop.
