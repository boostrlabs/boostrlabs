# Custom OS Backend Status

Status: VERIFIED / CURRENT
Last updated: 2026-07-08

## Implemented

- Migration `0008_custom_os_card_engine.sql` created `personas`, `cards`, `human_needs`, `products`, `pilot_profiles`, `payment_links`, and `order_reservations`.
- Remote D1 had no pending migrations before this pass.
- Session auth exists through `sessions`, `users`, `workspace_members`, `/api/session`, `/api/session/dev`, `/api/me`, and `/api/workspaces`.
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
- Public `GET /api/demo/janko-os` returns static safe demo data only.
- Product/payment readiness tables exist without Stripe or paid-order logic.

## Partially Implemented

- Personas exist and can be bootstrapped through dev session, but production persona management endpoints do not exist.
- Cards can be created, filtered, patched, and acted on, but there is no full workflow engine.
- Human need logic creates priority cards for cash, manage, feel_artist, feel_business, boost_product, boost_music, and boost_partners.
- Audit generates lead, asset_request, next_to_boost, payment readiness, and module insight cards.
- Product/payment tables exist, but write/read endpoints are pending.
- `follow_up` is an action type; card status maps to existing DB status vocabulary.

## Missing

- Production admin bootstrap flow.
- Invite/password reset flow.
- Claim flow from audit lead into a real client workspace.
- Product write/read APIs.
- Payment link write/read APIs.
- Public payment-link offer endpoint.
- Real Stripe checkout, webhooks, payouts, refunds, or paid orders.
- Card assignment notifications.
- Files and invoices.
- Cross-workspace reporting.

## Risks

- Existing `cards.status` CHECK does not include `follow_up`; action logs preserve `follow_up` while status uses an allowed value.
- Demo data is static and must not be treated as real sales or private records.
- Admin/manager can see operational cards across workspaces by design.
- Product/payment tables are readiness models only until APIs and Stripe rules are added.
- Public Audit writes into internal intake workspace; claim/move logic is not built yet.

## Next Steps

1. Add production admin bootstrap without committing credentials.
2. Add product/payment-link APIs without Stripe.
3. Add audit lead claim into workspace.
4. Add payment-link public read endpoint with guest/account rules.
5. Add card assignment and product readiness events.
