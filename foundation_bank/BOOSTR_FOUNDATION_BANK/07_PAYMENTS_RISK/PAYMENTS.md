# BOOSTR Payments

## Purpose

BOOSTR Payments is not the entire product. Payments are one important part of business infrastructure.

BOOSTR should not be sold only as a payment processor.

## Payment modes v1/future

BOOSTR should support or prepare for:

- Manual payment links.
- Partner-owned Stripe/LLC account.
- BOOSTR-managed payments under BOOSTR LLC when legally allowed and strategically useful.
- Future provider integrations.
- Zelle/cash/manual tracking where applicable, without necessarily processing the payment directly.

## Smart Payment Link

The Smart Payment Link should help the partner's customer:

- Understand what they are buying.
- See price/terms.
- Accept terms.
- Pay/book/contact.
- Trigger evidence/logging.
- Route payment according to partner mode.

## Payment routing concept

Payment Router is an internal architecture concept.

It decides where a transaction goes:

- Partner Stripe.
- BOOSTR Stripe.
- Manual payment flow.
- Future provider.

The partner/customer does not need to understand the router.

## When BOOSTR processes directly

BOOSTR may process directly when:

- It is legal.
- It is allowed by payment processor terms.
- The partner accepts the agreement.
- The risk is acceptable.
- BOOSTR benefits from controlling the flow.
- The partner lacks structure.

## When partner should use own Stripe/LLC

Partner should use own account when:

- High volume.
- High ticket.
- Existing LLC/bank structure.
- Established business.
- Too much risk for BOOSTR.
- Automotive/car deals where BOOSTR should not hold large money.
- Compliance exposure is high.

## Open questions

- Merchant of record rules by partner type.
- Stripe Connect configuration.
- Tax treatment.
- Payout schedules.
- Reserve rules.
- Refund/chargeback responsibility.
