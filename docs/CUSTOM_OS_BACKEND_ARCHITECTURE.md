# BOOSTR Custom OS Backend Architecture

Status: IMPLEMENTED FOUNDATION
Last updated: 2026-07-08

## Purpose

BOOSTR Custom OS turns workspace context into cards, actions, modules, product records, payment-link readiness and next steps.

This pass adds the backend foundation only. It does not add Stripe live processing, secrets, visual UI changes or fake paid orders.

## User / Workspace / Persona Model

- `users`: login identity and session owner.
- `workspaces`: scoped data container.
- `workspace_members`: current account/workspace access bridge.
- `personas`: how a user appears inside a workspace.

Persona types:

- `admin`
- `manager`
- `partner`
- `client`
- `artist`
- `creator`
- `producer`
- `seller`
- `agent_later`

One user can hold multiple workspace memberships and multiple personas per workspace.

## Card Engine Model

Table: `cards`

A card is the core unit of BOOSTR intelligence.

It can represent:

- lead
- next step
- product
- music action
- payment action
- order
- file
- invoice
- insight
- health signal
- human need
- asset request
- partner action

Cards are always `workspace_id` scoped.

Visibility:

- Admin/manager can see operational cards.
- Non-operational roles see cards tied to their user, owner role or owner user.
- Workspace access is checked before card data is returned.

Endpoints:

- `GET /api/cards`
- `POST /api/cards`
- `GET /api/cards/:id`
- `PATCH /api/cards/:id`
- `POST /api/cards/:id/action`
- `GET /api/workspaces/:workspace_id/cards`

## Human Need Model

Table: `human_needs`

Human needs capture what the user needs now.

Need types:

- `cash`
- `create`
- `manage`
- `review`
- `boost_product`
- `boost_music`
- `boost_partners`
- `clear_head`
- `feel_artist`
- `feel_business`

Endpoints:

- `POST /api/human-needs`
- `GET /api/human-needs`
- `GET /api/human-needs/latest`

When a need is posted, BOOSTR creates cards.

Current rules:

- `cash` + artist/producer/creator/seller creates payment, product, music and booking-deposit cards.
- `manage` + manager/admin creates lead, partner-action and health cards.
- Other combinations create one human-need review card.

## Audit To Cards

`POST /api/audit` remains public.

When an audit is submitted:

1. Audit submission is stored.
2. Lead is stored.
3. A stable internal `BOOSTR Intake` workspace is created or reused.
4. Cards are created:
   - lead card
   - asset request card if website/system route is missing
   - next-to-boost cards from friction points
   - recommended module insight cards

Public audits are scoped to the internal intake workspace until claimed or converted.

## Smart Payment Link Readiness

Tables:

- `products`
- `payment_links`
- `order_reservations`

No Stripe live processing is implemented.

Supported product types:

- `digital`
- `physical`
- `service`
- `booking`
- `license`
- `membership`
- `auction_later`

Rules encoded in schema fields:

- `requires_account`
- `allow_guest_checkout`
- `license_metadata_json`
- `disclosure_json`
- `fulfillment_type`
- `asset_status`

Use cases prepared:

- digital beats with license metadata
- physical products with later buy-now or auction mode
- services with booking/deposit readiness
- account-required private access or history
- guest checkout for low-risk simple purchases

## Permission Rules

- Protected APIs require a session.
- Workspace data must pass workspace access checks.
- Admin and manager can see operational records.
- Partner sees partner-scoped cards.
- Client sees own workspace cards.
- Artist/producer/creator/seller see own workspace/persona cards.
- Public demo access is not enabled unless a future route explicitly marks it.

## Admin Bootstrap

Existing path:

- `POST /api/session/dev`

Rules:

- Requires `ENVIRONMENT=development` or `ALLOW_DEV_SESSION=true`.
- Requires `X-Manager-Pin`.
- Creates or updates a user with password hash.
- Creates or reuses a workspace by slug.
- Issues a normal session.

Production must not depend on `MANAGER_PIN`. Use the dev endpoint only for controlled bootstrap.

## Pending Work

- Production admin bootstrap policy.
- Invite flow.
- Password reset flow.
- Public demo workspace contract.
- Product/payment-link write APIs.
- Card automation rules beyond the first human-need and audit mappings.
- Claim flow that can move cards from internal intake workspace to client workspace.
- Partner referral scoping beyond owner role/card fields.

## Risks

- `workspace_members` still has the original role CHECK; expanded personas are modeled in `personas`.
- Public Audit creates cards in the internal intake workspace, not the future client workspace.
- Payment-link tables are readiness only; no checkout or live payment state should be inferred.
