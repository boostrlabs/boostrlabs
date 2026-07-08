# Custom OS Card Engine

Status: PRODUCT / BACKEND DESIGN STANDARD
Last updated: 2026-07-08

## Core idea

A card is the unit of intelligence in BOOSTR.

BOOSTR should not think only in pages. It should think in cards.

A card can represent:

- lead
- task
- next action
- product
- service
- beat
- song
- order
- file
- invoice
- insight
- health signal
- asset request
- human need
- partner action

## Why cards matter

Cards let BOOSTR reorganize the interface around the user's context.

A user can say:

- I need cash
- I need to manage partners
- I need to make music
- I need to boost a product
- I need to review the system

The card engine decides what should rise to the top.

## Card fields

A future card record should support:

- `id`
- `workspace_id`
- `user_id`
- `persona_id`
- `source_type`
- `source_id`
- `card_type`
- `title`
- `summary`
- `priority`
- `status`
- `owner_user_id`
- `owner_role`
- `action_label`
- `action_url`
- `metadata_json`
- `created_at`
- `updated_at`

## Card types

Initial card types:

- `lead`
- `next_to_boost`
- `product`
- `service`
- `music`
- `payment`
- `order`
- `file`
- `invoice`
- `insight`
- `health`
- `human_need`
- `asset_request`
- `partner_action`

## Priority

Priority can be:

- urgent
- high
- medium
- low
- later

Priority should be influenced by:

- human need
- revenue potential
- deadline
- unread status
- friction severity
- platform health
- product readiness
- relationship value

## Status

Possible statuses:

- unread
- read
- high_potential
- normal
- special_case
- follow_up
- later
- approved
- rejected
- active
- done
- blocked
- archived

## Owner

Cards may belong to:

- Janko
- BOOSTR Manager
- Partner
- Client
- Artist
- Agent later
- System

Owner determines who should act first.

## Action

Every useful card should have a next action.

Examples:

- Approve
- Reject
- Later
- Follow up
- Create Smart Payment Link
- Request asset
- Open Dashboard
- Review Audit
- Create offer
- Post story
- Finish beat
- Update CTA

## Source

A card can come from:

- BOOSTR Audit
- manual lead
- product catalog
- Smart Payment Link
- order
- file
- invoice
- workspace event
- partner activity
- user human need prompt
- platform health report

## Expansion behavior

Cards should expand without forcing a full page change when possible.

Expanded card should show:

- full context
- why BOOSTR is showing it
- recommended action
- priority
- owner
- potential impact
- buttons
- related route

## Role visibility

A card must respect role and workspace permissions.

Examples:

- admin can see system cards
- manager can see partner/lead/workspace cards
- partner can see assigned partner actions
- client can see dashboard/order/file/invoice cards
- artist can see artist/product/music cards
- agent later can see assigned cards only

## Human need input

Human need is a first-class signal.

Examples:

- cash
- create
- manage
- review
- boost_product
- boost_music
- boost_partners
- clear_head
- feel_artist
- feel_business

Human need should not replace data. It should guide prioritization.

## Next to BOOST logic

Next to BOOST cards are generated from:

- audit friction
- missing assets
- product opportunity
- partner needs
- sales risk
- content opportunity
- workspace health
- payment readiness
- human need

Example:

If need = cash and persona = artist:

- prioritize beats ready to sell
- prioritize product with clicks/reactions
- suggest Smart Payment Link
- suggest story/post action
- deprioritize long brand rebuild tasks

If need = feel_artist:

- prioritize finishing music
- suggest visualizer or creative task
- avoid only money-first actions

If need = feel_business:

- prioritize catalog
- pricing
- Smart Payment Link
- offers
- dashboard organization

## Demo vs production

Demo can use inline static card objects.

Production should use:

- database records
- workspace scope
- role visibility
- status changes
- event logs
- real product/payment/order records

## Final rule

The card engine is how BOOSTR becomes Custom OS.

The same platform can feel different for JANKO, 82NGEL, ATL Sayago and Gemese because their cards, roles, needs and actions are different.
