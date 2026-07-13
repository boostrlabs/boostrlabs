# Stripe Sprint v1 release notes

BOOSTR Payment Links can now create real Stripe Checkout Sessions using the encrypted founder credentials configured in Janko OS. The public pay route redirects customers to Stripe-hosted checkout, records each attempt in D1, and verifies successful sessions server-side before showing confirmation.

This release intentionally does not claim full webhook coverage yet. Refunds, disputes and delayed payment methods remain the next hardening phase.
