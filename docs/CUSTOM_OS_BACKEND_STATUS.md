# Custom OS Backend Status

Status: VERIFIED / CURRENT
Last updated: 2026-07-08

## Implemented

- Migration `0008_custom_os_card_engine.sql` created `personas`, `cards`, `human_needs`, `products`, `pilot_profiles`, `payment_links`, and `order_reservations`.
- Migration `0009_app_normal_surfaces.sql` adds profile fields, contact methods, workspace preferences, API token metadata, notifications, and activity events.
- Migration `0010_invite_codes.sql` adds `invite_codes` and `invite_code_events`.
- Migration `0011_seed_initial_invite_codes.sql` seeds three founder-approved Secret BOOSTR Codes as salted hashes only.
- Migration `0012_signup_workspace_bootstrap.sql` adds username, phone, signup source, invite-code linkage and onboarding fields to users.
- Session auth exists through `sessions`, `users`, `workspace_members`, `/api/session`, `/api/session/dev`, `/api/me`, and `/api/workspaces`.
- `POST /api/session` accepts email, username, or phone as `identifier`.
- `POST /api/signup` creates a user, workspace, workspace member, persona, preferences, first-run cards, activity event and session.
- `GET /api/signup/check-username` validates reserved/available usernames.
- `GET /api/dashboard` returns active workspace, persona, preferences, first-run cards and recent activity.
- `MANAGER_PIN` is a development fallback only when `ENVIRONMENT=development` or `ALLOW_MANAGER_PIN_FALLBACK=true`.
- `GET/POST /api/cards` requires auth and workspace scope.
- `GET/PATCH /api/cards/:id` requires auth, workspace access, and card visibility.
- `POST /api/cards/:id/action` requires auth, workspace access, allowed action type, and logs `card.action`.
- `GET /api/workspaces/:workspace_id/cards` requires auth and workspace access.
- Card filters support `workspace_id`, `persona_id`, `mode`, `card_type`, `status`, `priority`, and `source_type`.
- `GET/POST /api/human-needs` requires auth and workspace scope.
- `POST /api/human-needs` stores the need, resolves persona when available, creates cards, and returns created cards.
- `GET /api/human-needs/latest` requires auth and workspace scope.
- Public `POST /api/audit` remains public, stores audit and lead rows, attaches the internal `BOOSTR Intake` workspace, and creates cards.
- Public `POST /api/invite-codes/validate` validates Secret BOOSTR Codes safely, supports short founder-approved codes, and returns generic invalid responses.
- Signup with a valid DB-backed Secret BOOSTR Code increments usage only after user/workspace creation succeeds.
- Public `GET /api/demo/janko-os` returns static safe demo data only.
- Product/payment readiness tables exist without Stripe or paid-order logic.
- `GET/PATCH /api/profile` exists.
- `GET/POST /api/profile/contacts`, `PATCH/DELETE /api/profile/contacts/:id` exist.
- `GET /api/personas`, `PATCH /api/personas/:id`, and `POST /api/personas/switch` exist.
- `GET/PATCH /api/workspace-preferences` exists.
- `GET /api/security`, `POST /api/security/change-password`, `GET /api/security/sessions`, `DELETE /api/security/sessions/:id`, and `POST /api/security/logout-all` exist.
- `GET /api/integrations/api-tokens` returns metadata only; create/delete return `501`.
- `GET/PATCH /api/notifications` and `GET/POST /api/activity` exist.
- `POST /api/cards/:id/action` now writes `activity_events` and can create safe notifications for follow-up/asset actions.
- HTML pages without `i18n.js` or `console.js` receive the minimal `language-engine.js` through Pages middleware.
- `/api/health` lists signup, dashboard and invite-code endpoints.

## Partially Implemented

- Personas exist, can be created by signup, bootstrapped through dev session, listed, updated and switched.
- Cards can be created, filtered, patched and acted on, but there is no full workflow engine.
- Human need logic creates priority cards for cash, manage, feel_artist, feel_business, boost_product, boost_music and boost_partners.
- Audit generates lead, asset_request, next_to_boost, payment readiness and module insight cards.
- Product/payment tables exist, but write/read endpoints are pending.
- Secret BOOSTR Code validation and usage increment exist; admin creation/revocation UI is pending.
- `follow_up` is an action type; card status maps to existing DB status vocabulary.

## Missing

- Production admin bootstrap flow.
- Email verification.
- Password reset flow.
- Claim flow from audit lead into a real client workspace.
- Product write/read APIs.
- Payment link write/read APIs.
- Public payment-link offer endpoint.
- Real Stripe checkout, webhooks, payouts, refunds, or paid orders.
- Card assignment notifications.
- Notification delivery is in-app only; no email/push delivery exists.
- Files and invoices.
- Cross-workspace reporting.

## Risks

- Remote D1 must apply migrations `0010`, `0011`, and `0012` before Secret Code + Signup are fully operational.
- Existing `cards.status` CHECK does not include `follow_up`; action logs preserve `follow_up` while status uses an allowed value.
- Demo data is static and must not be treated as real sales or private records.
- Admin/manager can see operational cards across workspaces by design.
- Product/payment tables are readiness models only until APIs and Stripe rules are added.
- Public Audit writes into internal intake workspace; claim/move logic is not built yet.
- API token creation is intentionally blocked until secure token hashing/storage is implemented.
- Environment fallback `BOOSTR_SECRET_CODE`/`BOOSTR_INVITE_CODE` can unlock a single code without committed secrets if configured in Cloudflare.
- Language middleware injects only the minimal ES/EN runtime; branded pages are not manually edited.

## Next Steps

1. Apply D1 migrations remotely and test `/api/signup` end-to-end.
2. Add production admin bootstrap without committing credentials.
3. Add audit lead claim into workspace.
4. Add product/payment-link APIs without Stripe.
5. Add payment-link public read endpoint with guest/account rules.
6. Add card assignment and product readiness events.
