# Secret BOOSTR Code Backend QA

Status: PART 2 COMPLETE / SEEDED
Last updated: 2026-07-08

## Scope

This pass implements the backend validation foundation for Secret BOOSTR Codes, upgrades the Audit unlock screen, and seeds the initial founder-approved codes as salted hashes.

No signup/workspace bootstrap was implemented in this pass.
No Stripe, payment credentials, OAuth providers, password reset, or paid-order logic was added.

## Files changed

- `migrations/0010_invite_codes.sql`
- `migrations/0011_seed_initial_invite_codes.sql`
- `functions/api/invite-codes/validate.js`
- `functions/api/health.js`
- `public/audit/index.html`
- `docs/CUSTOM_OS_BACKEND_STATUS.md`
- `docs/SECRET_BOOSTR_CODE_BACKEND_QA.md`

## New tables

### `invite_codes`

Fields include:

- `id`
- `code_hash`
- `code_salt`
- `label`
- `status`
- `max_uses`
- `used_count`
- `expires_at`
- `allowed_role`
- `allowed_persona`
- `allowed_workspace_type`
- `campaign`
- `source`
- `bypass_audit`
- `metadata_json`
- `created_by_user_id`
- timestamps
- `revoked_at`

Statuses:

- `active`
- `used`
- `expired`
- `revoked`

### `invite_code_events`

Used for safe validation events.

## Seeded initial codes

Migration `0011_seed_initial_invite_codes.sql` seeds three founder-approved Secret BOOSTR Codes as salted hashes only.

Rules:

- plaintext codes are not committed in repo
- each seed has `max_uses = 100`
- each seed has `bypass_audit = 1`
- campaign is `founder_seed`
- source is `manual_seed`
- usage increment still waits for signup completion in the next backend pass

## Endpoint

```http
POST /api/invite-codes/validate
```

Request:

```json
{
  "code": "secret-code",
  "source": "audit_entry"
}
```

Valid response:

```json
{
  "ok": true,
  "valid": true,
  "label": "BOOSTR private access",
  "bypass_audit": true,
  "allowed_role": "client",
  "allowed_persona": "client",
  "allowed_workspace_type": "onboarding",
  "campaign": null,
  "source": null,
  "message": "Cheat BOOSTR Code unlocked"
}
```

Invalid response:

```json
{
  "ok": true,
  "valid": false
}
```

## Security rules

- No plaintext invite code is stored by the migration.
- DB codes are matched through SHA-256 hash using `code_salt` when present.
- Environment fallback can use `BOOSTR_SECRET_CODE` or `BOOSTR_INVITE_CODE` without committing secrets.
- Invalid responses remain generic.
- Two-character codes are allowed because one founder-approved code is intentionally short.
- Validation does not increment usage yet.
- Usage should increment only after successful signup completion in the next backend pass.
- Public validation logs safe metadata only.

## Audit unlock UI

When validation succeeds, `/audit` now shows the red interactive unlock state:

```text
HAS INGRESADO EL CÓDIGO SECRETO;
ROMPISTE LOS LÍMITES QUE LA MATRIX LE IMPONE A TU NEGOCIO,
es momento de saber lo que es un BOOST de verdad. Bienvenido.
```

The primary action becomes account creation/registration:

- `Crear cuenta BOOSTR`
- redirects to `/signup?secret=...`

Secondary action:

- continue Audit anyway

## What is still pending

- Remote D1 must receive migrations `0010_invite_codes.sql` and `0011_seed_initial_invite_codes.sql` for DB-backed invite codes.
- Code creation/admin UI is pending.
- Signup backend is pending.
- Usage increment after signup completion is pending.
- Workspace bootstrap from valid code is pending.
- Role/persona assignment from code is pending.

## Part 2 health target

Target score: 92–93.

Expected score after this pass: 93.5, assuming `/api/invite-codes/validate` deploys and D1 receives migrations `0010` and `0011`.
