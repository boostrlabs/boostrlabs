# Custom OS API Contract

Status: CURRENT / BACKEND CONTRACT
Last updated: 2026-07-08

## Auth

- Private endpoints require a valid session cookie, `Authorization: Bearer <token>`, or `X-BOOSTR-Session`.
- `X-Manager-Pin` is development fallback only when explicitly enabled.
- Public endpoints: `POST /api/audit`, `GET /api/audit`, `GET /api/health`, `GET /api/demo/janko-os`.
- Errors return `{ ok: false, error, message }` with stable snake_case `error`.

## Current User

`GET /api/me`

Returns current user, active workspace, memberships, roles, and active workspace personas.

## Profile

`GET /api/profile`

Auth required. Returns:

- user id
- display name
- email
- avatar_url
- default_workspace_id
- default_persona_id
- language
- timezone
- theme
- created_at
- updated_at

`PATCH /api/profile`

Auth required. Supported fields:

- `display_name`
- `avatar_url`
- `default_workspace_id`
- `default_persona_id`
- `language`
- `timezone`
- `theme`

Password hashes and secrets are never returned.

## Contact Methods

`GET /api/profile/contacts`

Auth required. Optional `workspace_id`.

`POST /api/profile/contacts`

Auth required.

Contact types:

- `artist_email`
- `business_email`
- `personal_phone`
- `business_phone`
- `whatsapp`
- `instagram`
- `website`
- `smart_link`

Visibility values:

- `private`
- `workspace`
- `public_profile`

`PATCH /api/profile/contacts/:id`

Auth required. User-owned contact only.

`DELETE /api/profile/contacts/:id`

Auth required. User-owned contact only.

## Workspaces

`GET /api/workspaces`

Returns workspaces visible to the current session.

## Personas

`GET /api/personas`

Auth required. Workspace scoped.

`PATCH /api/personas/:id`

Auth required. Workspace and owner scoped. Supports `display_name`, `status`, and `metadata`.

`POST /api/personas/switch`

Auth required. Stores the preferred persona on the profile and returns active persona, visible modules, and persona-relevant cards.

## Workspace Preferences

`GET /api/workspace-preferences`

Auth required. Workspace scoped.

`PATCH /api/workspace-preferences`

Auth required. Workspace scoped. Supports:

- `default_mode`
- `default_persona_id`
- `default_language`
- `card_density`
- `show_demo_labels`
- `reduce_motion`
- `notification_preferences`

## Security

`GET /api/security`

Auth required. Returns safe account security metadata.

`POST /api/security/change-password`

Auth required. Requires `current_password` and `new_password`. Never returns password hashes.

`GET /api/security/sessions`

Auth required. Returns session metadata only: id, masked IP, user agent summary, created_at, last_seen_at.

`DELETE /api/security/sessions/:id`

Auth required. Revokes a user-owned session.

`POST /api/security/logout-all`

Auth required. Revokes other sessions and keeps the current session active.

## Integrations

`GET /api/integrations/api-tokens`

Auth required. Returns token metadata only. No plaintext token is returned.

`POST /api/integrations/api-tokens`

Auth required. Returns `501 api_token_creation_not_implemented`.

`DELETE /api/integrations/api-tokens/:id`

Auth required. Returns `501 api_token_delete_not_implemented`.

## Notifications And Activity

`GET /api/notifications`

Auth required. Workspace scoped.

`PATCH /api/notifications/:id`

Auth required. Marks notification `read`, `unread`, or `archived`.

`GET /api/activity`

Auth required. Workspace scoped.

`POST /api/activity`

Auth required. Workspace scoped. Creates a manual activity event.

## Cards

`GET /api/cards`

Auth required.

Query filters:

- `workspace_id`
- `persona_id`
- `mode`
- `card_type`
- `status`
- `priority`
- `source_type`
- `limit`

Priority filter values:

- `urgent`: `priority >= 90`
- `high`: `75 <= priority < 90`
- `medium`: `50 <= priority < 75`
- `low`: `25 <= priority < 50`
- `later`: `priority < 25`
- numeric value: exact priority

Example:

```http
GET /api/cards?workspace_id=WORKSPACE_ID&mode=cash&priority=high
```

Response:

```json
{
  "ok": true,
  "cards": []
}
```

`POST /api/cards`

Auth required. Workspace scope required.

Request:

```json
{
  "workspace_id": "workspace-id",
  "persona_id": "persona-id",
  "card_type": "lead",
  "title": "Review lead",
  "summary": "Lead needs review.",
  "priority": 80,
  "status": "unread",
  "owner_role": "manager",
  "action_label": "Review",
  "metadata": {
    "mode": "manage"
  }
}
```

`GET /api/cards/:id`

Auth required. Card workspace and visibility checked.

`PATCH /api/cards/:id`

Auth required. Supported updates:

- `status`
- `priority`
- `owner_user_id`
- `owner_role`
- `action_label`
- `action_url`

`POST /api/cards/:id/action`

Auth required. Card workspace and visibility checked.

Request:

```json
{
  "action_type": "follow_up",
  "note": "Call tomorrow."
}
```

Allowed `action_type` values:

- `approve`
- `reject`
- `later`
- `follow_up`
- `done`
- `pin`
- `archive`
- `create_payment_link_later`
- `request_asset`
- `open_module`

Behavior:

- validates action
- maps to allowed card status unless `status` is supplied
- updates card
- writes `lead_events.event_type = card.action`
- writes `activity_events.event_type = card.action`
- may create a safe in-app notification for follow-up or asset requests
- returns updated card plus event metadata

`GET /api/workspaces/:workspace_id/cards`

Same filters as `GET /api/cards`, but workspace is fixed by route.

## Human Needs

`GET /api/human-needs`

Auth required. Workspace scoped.

`GET /api/human-needs/latest`

Auth required. Returns the latest visible need.

`POST /api/human-needs`

Auth required. Workspace scoped.

Request:

```json
{
  "workspace_id": "workspace-id",
  "persona_id": "persona-id",
  "need_type": "cash",
  "note": "I need the fastest clean revenue path."
}
```

Behavior:

- stores the need
- resolves persona if available
- creates cards
- returns created cards

Need behavior:

- `cash` + artist/producer/creator/seller prioritizes payment, product, music, and order cards.
- `manage` + admin/manager prioritizes leads, partner actions, and health.
- `feel_artist` prioritizes music/project cards.
- `feel_business` prioritizes catalog and payment readiness.
- `boost_product`, `boost_music`, and `boost_partners` create scoped next-action cards.

## Audit

`POST /api/audit`

Public. Safe for guest submissions.

Behavior:

- validates contact
- stores `audit_submissions`
- creates `leads`
- attaches records to internal `BOOSTR Intake` workspace
- logs `audit.submitted`
- creates cards

Audit card generation:

- lead card
- missing website/system route card
- missing brand asset card
- next_to_boost cards from friction
- Smart Payment Link card when payment friction appears
- recommended module insight cards

## JANKO Demo

`GET /api/demo/janko-os`

Public. Static safe demo payload.

Rules:

- no D1 reads
- no private records
- no real sales
- no fake paid orders
- no Stripe

Response includes:

- `profile`
- `personas`
- `needs`
- `modules`
- `cards`
- `products`
- `health`
- `actions`
- `contact_methods`
- `preferences`
- `security`
- `api_tokens`
- `notifications`
- `activity`

## Language Runtime

The ecosystem supports `en` and `es`.

- Pages using `i18n.js` use keyed dictionaries.
- Pages using `console.js` use the shared BOOSTR runtime.
- Pages without either runtime receive `language-engine.js` through Pages middleware.
- The selected language persists in `localStorage.boostr_lang`.

## Product And Payment Readiness

Current tables:

- `products`
- `payment_links`
- `order_reservations`

Rules:

- digital beats require license/disclosure metadata.
- physical one-of-one products can support buy now now and auction later.
- services require deposit/booking scope.
- account required for licenses, private access, high-ticket, and history.
- guest checkout allowed only for simple low-risk purchases.

Not implemented:

- product APIs
- payment-link APIs
- Stripe checkout
- paid orders
