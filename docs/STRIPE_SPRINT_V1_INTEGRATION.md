# Stripe Sprint v1 — Ecosystem integration

## Implemented
- Secure decryption of founder Stripe credentials stored in D1.
- Stripe API helper with idempotency support.
- `stripe_payments` ledger in D1.
- Checkout Session creation from active BOOSTR Payment Links.
- Hosted Stripe Checkout redirect from `/pay/:id`.
- Server-side Stripe session verification on `/pay/success/`.
- Payment state synchronization and activity events.
- Explicit TEST/LIVE mode recording.

## Routes
- `POST /api/public/payment-links/:id/checkout`
- `GET /api/public/stripe/session?session_id=...`
- `/pay/:id`
- `/pay/success/`

## Security
- Secret key never leaves the backend.
- Card data is handled only by Stripe Checkout.
- Payment success is verified server-side against Stripe.
- Checkout creation uses an idempotency key.

## Remaining hardening
- Signed Stripe webhook endpoint for asynchronous refunds, disputes and delayed methods.
- Webhook secret management UI.
- Manager payment ledger UI and automated regression tests.
