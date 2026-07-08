# Auth Workspace Foundation

Status: implemented foundation.

## Env vars

- `MANAGER_PIN`: development bridge only.
- `ALLOW_MANAGER_PIN_FALLBACK=true`: allows `X-Manager-Pin` fallback in development.
- `ENVIRONMENT=development`: also allows the PIN fallback.

Production protected APIs should use a session token:

- Header: `Authorization: Bearer <session_token>`
- Or cookie: `boostr_session=<session_token>`

The token is stored in D1 as `sessions.session_token_hash` using SHA-256 hex.

## Tables

- `users`
- `workspaces`
- `workspace_members`
- `sessions`

Existing records now support workspace scope through `workspace_id`.

## Test

Apply migrations:

```bash
wrangler d1 migrations apply boostr_labs_core --remote
```

Check current session:

```bash
curl https://boostrlabs.pages.dev/api/session \
  -H "Authorization: Bearer <session_token>"
```

List scoped leads:

```bash
curl "https://boostrlabs.pages.dev/api/leads?workspace_id=<workspace_id>" \
  -H "Authorization: Bearer <session_token>"
```

Claim an audit into a workspace:

```bash
curl -X POST https://boostrlabs.pages.dev/api/audit/<audit_id>/claim \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{"workspace_type":"client"}'
```
