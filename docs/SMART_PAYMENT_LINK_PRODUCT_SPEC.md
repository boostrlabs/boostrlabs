# BOOSTR Smart Payment Link Product Spec

Status: PRE-STRIPE PRODUCT SPEC
Last updated: 2026-07-08

## Definition

BOOSTR Smart Payment Link is a sellable checkout route with context.

It is not only a payment URL. It is a BOOSTR-powered sales flow that can capture the buyer, explain the offer, collect payment, create an order record, trigger fulfillment and connect the buyer to a workspace when needed.

## Core promise

Send one link. Collect money. Capture the customer. Route the next step.

## Product position

Smart Payment Link is useful before a business needs a full store.

It should work for:

- artists selling services
- producers selling beats or sessions
- creators selling drops or VIP access
- beauty/local services taking deposits
- consultants selling packages
- partners selling one-off offers
- brands testing products before full ecommerce

## Public buyer flow

```text
Open Smart Payment Link
→ read offer
→ see price and fulfillment type
→ enter contact
→ choose guest or account flow
→ continue to payment later
→ confirmation
→ order record
→ receipt / next step
```

## Manager / seller flow

```text
Open Manager
→ create offer
→ set price, status, fulfillment type and account rule
→ generate public link
→ share link
→ review orders
→ update fulfillment status
→ follow up with buyer
```

## Guest checkout rules

Guest checkout is allowed for low-risk simple purchases:

- one-time deposit
- simple service reservation
- basic digital consultation
- low-ticket order
- public product drop
- non-private booking request

Guest checkout still requires contact capture.

Minimum guest fields:

- name
- email or phone
- optional Instagram/WhatsApp

## Account-required rules

BOOSTR account is required when the purchase needs identity, history, private access or future control.

Require account for:

- recurring access
- VIP unlock
- rewards
- private content
- digital licenses/contracts
- high-ticket orders
- downloads that need ownership history
- warranties
- ticket transfers
- BNPL when account linkage is needed
- anything needing private dashboard access

## Offer fields

Minimum Smart Payment Link offer fields:

- `id`
- `workspace_id`
- `created_by_user_id`
- `slug`
- `title`
- `subtitle`
- `description`
- `price_amount`
- `currency`
- `image_url`
- `status`
- `requires_account`
- `allow_guest_checkout`
- `quantity_mode`
- `fulfillment_type`
- `success_message`
- `metadata_json`
- `created_at`
- `updated_at`

## Order fields

Minimum order fields:

- `id`
- `workspace_id`
- `payment_link_id`
- `buyer_user_id`
- `buyer_name`
- `buyer_email`
- `buyer_phone`
- `buyer_handle`
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

## Payment link statuses

- `draft`
- `active`
- `paused`
- `archived`

## Order statuses

- `new`
- `reserved`
- `pending_payment`
- `paid`
- `cancelled`
- `refunded`

## Payment statuses

- `not_started`
- `pending`
- `paid`
- `failed`
- `refunded`
- `disputed`

## Fulfillment statuses

- `not_started`
- `in_progress`
- `delivered`
- `blocked`

## Future Stripe Connect flow

After LLC and Stripe setup:

1. Create BOOSTR Stripe platform account.
2. Enable Stripe Connect.
3. Add connected account onboarding.
4. Store connected account ID per workspace.
5. Create Checkout Sessions from Smart Payment Links.
6. Add platform fee logic.
7. Add webhook receiver.
8. Update order payment status from webhooks.
9. Add refund/dispute handling.
10. Lock production secrets outside repo.

## Stripe events to support later

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `charge.dispute.created`
- `account.updated`

## UI route proposal

Public routes:

- `/smart-payment-link`
- `/pay/:slug` later

Manager routes later:

- `/manager/payments`
- `/manager/payment-links`

Dashboard routes later:

- `/app/orders`
- `/app/payments`

## What can be built before LLC

Allowed before Stripe/LLC:

- static public prototype
- offer creation spec
- order schema planning
- dashboard UI mock with no real money movement
- guest/account rules
- fulfillment statuses
- Stripe Connect checklist
- test-only local planning

## What must wait for LLC / Stripe

Wait for business setup before:

- live payment processing
- production Stripe Connect onboarding
- real platform fees
- production webhooks
- payouts
- refunds/disputes
- any claim that payments are live

## Prototype constraints

The current static prototype must not:

- process real payment
- collect card data
- fake completed payment
- promise Stripe is active
- store secrets
- imply LLC setup is complete

## Definition of ready for Stripe

Smart Payment Link is ready for Stripe when:

- auth works
- workspace ownership works
- offer records work
- public offer route works
- order records work
- guest/account rules are enforced
- Stripe Connect account mapping is designed
- no secrets are committed
- LLC/Stripe business setup is complete
