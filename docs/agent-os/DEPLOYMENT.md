# Agent OS deployment — 2026-09-09
Production: https://boostrlabs.pages.dev
Deployment: https://66e70628.boostrlabs.pages.dev
Previous production rollback: a95b0856-52b8-4ad4-827a-dd4e554e8035
Branch: feat/agent-os-v2. Direct deployment; changes are not merged into main. Merge this branch before the next main deployment to retain the new homepage.
Existing modules and DB preserved; new AGENT_DB isolated.
Admin credentials: local ignored .deploy/admin-credentials.json.
Stripe existing credentials are TEST mode. Live invoice creation is explicitly blocked until live credentials are configured. Reconnect the webhook for the live account before launch of real payments.
Commissions are automatically recorded after signed invoice.paid; payouts are performed by administration and recorded with method/reference. No funds were charged or transferred during this deployment.
Tests: scripts/agent-os-test.mjs passes forms, invites, PIN, privacy, quota, webhook signature, idempotency and payout authorization. Full build and Pages Functions compilation passed. Production admin login verified.
