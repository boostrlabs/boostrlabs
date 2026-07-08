# BOOSTR Smart Payment Link Roadmap

Status: PRE-STRIPE PRODUCT ROADMAP
Last updated: 2026-07-08

## Product idea

BOOSTR Smart Payment Link is a checkout link with context.

It is not just a Stripe link.
It is a BOOSTR-powered sales route that can connect payment, identity, order history, fulfillment, access and follow-up.

## Why it matters

This can become one of BOOSTR's strongest products because many creators, artists, service businesses and local brands need a clean way to sell without building a full ecommerce system first.

## Core promise

Send one link. Collect money. Capture the customer. Route the next step.

## Pre-LLC goal

Before Stripe Connect is configured, BOOSTR should prepare everything except live money movement.

Pre-LLC work can include:

- product spec
- UI prototype
- order schema review
- payment link route design
- guest vs account-required rules
- post-payment flow
- fulfillment statuses
- partner/client dashboard hooks
- Stripe Connect setup checklist

## What the Smart Payment Link should support

### Simple sale

Guest allowed.

Examples:

- digital consultation deposit
- booking deposit
- simple merch drop
- low-ticket service payment
- one-time custom order

### Account-required sale

BOOSTR account required.

Examples:

- recurring access
- VIP unlock
- private content
- digital license
- high-ticket service
- warranty/history
- ticket transfer
- downloads requiring identity
- future rewards

## Buyer flow

```text
Open Smart Payment Link
→ view offer
→ choose quantity/options
→ enter contact
→ pay or reserve
→ confirmation
→ order record
→ receipt/follow-up
→ optional account claim
```

## Seller/Manager flow

```text
Create offer
→ generate Smart Payment Link
→ share link
→ watch orders
→ mark fulfillment
→ follow up
→ convert buyer into workspace/contact if needed
```

## Minimum fields

A Smart Payment Link should have:

- `id`
- `workspace_id`
- `created_by_user_id`
- `title`
- `description`
- `price_amount`
- `currency`
- `image_url`
- `status`
- `requires_account`
- `allow_guest_checkout`
- `success_message`
- `fulfillment_type`
- `created_at`
- `updated_at`

## Order fields

An order should track:

- `id`
- `workspace_id`
- `payment_link_id`
- `buyer_user_id`
- `buyer_name`
- `buyer_email`
- `buyer_phone`
- `status`
- `payment_status`
- `fulfillment_status`
- `amount_total`
- `currency`
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `metadata_json`
- `created_at`
- `updated_at`

## Statuses

Payment link status:

- draft
- active
- paused
- archived

Order status:

- new
- paid
- pending
- fulfilled
- cancelled
- refunded

Fulfillment status:

- not_started
- in_progress
- delivered
- blocked

## Routes later

Possible public route:

- `/pay/:slug`

Possible dashboard routes:

- `/manager/payments`
- `/app/payments`
- `/admin/payments`

## Stripe Connect phase

Only after LLC/business setup:

1. Create Stripe account.
2. Configure Stripe Connect.
3. Add platform fee logic.
4. Add connected account onboarding.
5. Connect Checkout Sessions.
6. Add webhooks.
7. Store payment/order status.
8. Test refunds/disputes.
9. Lock down production keys.

## Stripe webhook events to support later

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `account.updated`

## What not to do yet

Do not:

- hardcode Stripe secrets
- use test payments as production proof
- add live money movement before business setup
- create fake completed payments
- mix guest checkout with account-required products
- skip workspace ownership
- skip fulfillment status

## First build phase

Before Stripe:

1. Create Smart Payment Link product spec.
2. Add route and UI prototype with no real payment.
3. Store payment link draft records if backend is ready.
4. Store manual/reserved order records if safe.
5. Prepare Stripe Connect checklist.

## Definition of success

BOOSTR Smart Payment Link is ready for Stripe when:

- workspace ownership works
- auth works
- offer creation works
- public pay route works visually
- order records work
- guest/account rules are clear
- Stripe Connect checklist is complete
- no secret is committed
