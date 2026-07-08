# BOOSTR Backend Auth Workspace Status

Status: VERIFIED / UPDATED 2026-07-08

## Repository state

- Previous auth/workspace implementation is committed locally as `3fe711a Implement BOOSTR auth and workspace foundation`.
- Local `main` is ahead of `origin/main` and behind `origin/main`; the auth work is not verified as pushed or merged.
- Current worktree has unresolved frontend/i18n merge conflicts outside this backend pass.
- Remote D1 database: `boostr_labs_core`.
- Remote migrations were applied through `0006_auth_workspace_foundation.sql`; no pending remote migrations were reported in the last check.

## Implemented

- `users` and `workspaces` exist in `migrations/0001_boostr_core.sql`.
- `workspace_id` columns exist for `leads`, `audit_submissions`, and `lead_events` in `migrations/0002_ownership_columns.sql`.
- `orders.workspace_id` exists in `migrations/0001_boostr_core.sql`.
- `workspace_modules` exists in `migrations/0003_workspace_modules.sql`.
- `workspace_members` and `sessions` exist in `migrations/0006_auth_workspace_foundation.sql`.
- `functions/_lib/api.js` includes `requireSession()`, `requireRole()`, `requireWorkspaceAccess()`, `jsonOk()`, and `jsonError()`.
- `requireSession()` accepts bearer token, `X-BOOSTR-Session`, or `boostr_session` cookie and checks `sessions.session_token_hash`.
- `GET /api/session` returns current user, role, roles, workspaces, active workspace, and visible modules.
- `GET /api/me` aliases the session response.
- `GET /api/workspaces` returns scoped workspaces for the current session.
- `GET /api/leads` is protected by session role and workspace access.
- `POST /api/leads` is protected by admin/manager role and stores `workspace_id` plus `created_by_user_id`.
- `GET /api/leads/:id` is protected by role and lead workspace access.
- `PATCH /api/leads/:id` is protected by admin/manager role.
- `POST /api/audit` remains public.
- `POST /api/audit/:id/claim` can link an audit and lead to a workspace, create an invited owner user, and create a workspace membership.
- `GET /api/modules` remains public for registry reads; workspace status reads require session and workspace access.
- `GET /api/events` is protected by session role and workspace access.
- `GET /api/orders` is protected by session role and workspace access.
- `POST /api/orders` is protected by admin/manager role.
- Workspace module activate/deactivate endpoints are protected by admin/manager role.
- Workspace smart-links and artist-profile read endpoints require session and workspace access.
- Workspace smart-links and artist-profile write/deactivate endpoints require admin/manager role.
- Active API errors now use stable snake_case codes through `jsonError()`.

## Not Implemented

- Real login endpoint.
- Session issuance endpoint.
- Logout endpoint.
- Password, magic-link, OAuth, or identity-provider flow.
- Partner referral scoping beyond workspace membership.
- Permission policy table.
- Files, invoices, Stripe, and payment auth scope.
- Frontend login wired to real backend session creation.
- Real production seed for first admin/manager user and session.

## Manager PIN Status

- `MANAGER_PIN` and `X-Manager-Pin` still exist only as a development fallback path inside `requireSession()`.
- `managerAuth()` still exists for compatibility, but no active `functions/api` route calls it after this pass.
- `X-Manager-Pin` works only when `ENVIRONMENT=development` or `ALLOW_MANAGER_PIN_FALLBACK=true`.
- Protected endpoints reject anonymous access unless the explicit development fallback is enabled.

## Required Env Vars

- `DB`: D1 binding.
- `ENVIRONMENT=development`: enables manager PIN fallback in `requireSession()`.
- `ALLOW_MANAGER_PIN_FALLBACK=true`: enables manager PIN fallback outside development if explicitly needed.
- `MANAGER_PIN` or `ADMIN_PIN`: temporary legacy/development PIN.
- `ALLOW_DB_INIT=true`: enables `/api/db-init`; keep disabled in production unless intentionally running schema init.

## Production Requirements

- Apply all D1 migrations before deploy.
- Create at least one real admin/manager user.
- Create a real session issuance path.
- Keep `ALLOW_MANAGER_PIN_FALLBACK` unset or false in production.
- Keep `ALLOW_DB_INIT` unset or false except during controlled setup.
- Configure frontend login to consume the real session endpoint.

## How To Test Locally

1. Run `npm install`.
2. Run `npx wrangler d1 migrations apply boostr_labs_core --local`.
3. Insert a local `users` row.
4. Insert a local `workspaces` row.
5. Insert a local `workspace_members` row for that user/workspace.
6. Insert a local `sessions` row with `session_token_hash` set to the SHA-256 hex hash of a test token.
7. Run the Pages dev server.
8. Call `GET /api/session` or `GET /api/me` with `Authorization: Bearer <test-token>`.
9. Call `GET /api/workspaces` with the same token.
10. Call `GET /api/leads?workspace_id=<workspace-id>` with the same token.
11. Call `POST /api/audit` without auth and confirm it still stores a public audit.

Development bridge test:

1. Set `ENVIRONMENT=development`.
2. Set `MANAGER_PIN`.
3. Call migrated endpoints with `X-Manager-Pin`.

## Temporary Fallbacks

- Manager PIN fallback remains only as a development bridge for `requireSession()`.
- `managerAuth()` remains only as compatibility code.
- `/api/session` and `/api/me` return the current identity payload.

## D1 Migration Status

- Migration files present: `0001_boostr_core.sql` through `0006_auth_workspace_foundation.sql`.
- Remote database name: `boostr_labs_core`.
- Last remote check reported no pending migrations.

## Next Backend Step

Add minimal login/session issuance and logout, then seed the first production admin/manager account.
