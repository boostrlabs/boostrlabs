# BOOSTR Morning Review Checklist

Status: OWNER REVIEW
Last updated: 2026-07-08

## Review on phone first

Open these routes after Cloudflare deploy completes:

1. `/home`
2. `/modules`
3. `/smart-payment-link`
4. `/manager/payment-links`
5. `/manager/orders`
6. `/app/orders`
7. `/app/files`
8. `/app/invoices`
9. `/jankodiorr`
10. `/audit`

## What to check visually

- Does it feel more like an app?
- Does the bottom dock appear on core routes?
- Do animations feel strong enough?
- Does mobile feel more Apple/finance-app coded?
- Do cards move/drag/drop?
- Does command palette open with command button or CMD/CTRL + K?
- Is text shorter and clearer?
- Is BOOSTR CORE better than Mother OS?
- Is Dashboard clearer than Workspace Core?
- Is Leads clearer than Signal Inbox?

## Protected route check

For `/jankodiorr`:

- WESTDETRO logo visible?
- JANKO first, BOOSTR second?
- Many CTAs visible?
- Spotify, YouTube, LATE NIGHT working?
- Email CTAs acceptable for now?

For `/audit`:

- Still interactive?
- Not basic form?
- Works on mobile?
- Result screen feels premium enough?

For `/82ngel`:

- No generic BOOSTR overwrite?
- 82NGEL identity preserved?

## Product check

Smart Payment Link:

- Does `/smart-payment-link` feel like a product?
- Is guest/account required logic clear?
- Is the no-real-payment disclaimer clear?
- Does quantity/offer selection work?
- Does reserve state update?

## Backend/Codex next

When Codex is available:

1. Bootstrap first admin securely.
2. Verify `/api/session`.
3. Verify `/api/me`.
4. Verify `/api/workspaces`.
5. Connect Leads to session auth.
6. Prepare payment_links/order backend foundation.

## Must not forget

- Do not commit passwords.
- Do not add Stripe secrets.
- Do not claim payments are live.
- Do not genericize branded pages.
