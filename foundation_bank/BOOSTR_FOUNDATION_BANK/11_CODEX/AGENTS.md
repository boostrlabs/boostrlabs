# AGENTS.md — BOOSTR PRIME

You are working on BOOSTR Labs LLC.

This is a PRIME-quality company/platform project.

## Engineering rules

- Frontend: TypeScript only.
- Backend core: statically typed; Go preferred.
- Database: PostgreSQL.
- No JavaScript for new frontend code.
- No Node/Python for core backend logic unless explicitly approved.
- No silent failures.
- No hidden provider coupling.
- No destructive migrations without approval.
- No secrets in code.

## Business rules

- BOOSTR is a Technology Solutions and Business Infrastructure Services Provider.
- BOOSTR is not label/manager/distributor/Wix/Linktree/Booksy/CRM-only.
- No open public signup in v1.
- BOOSTR Managers create partner accounts.
- Smart Links are manually designed.
- Revenue share is module-specific and contract-defined.
- Rewards and Balance are separate.
- Payments stay placeholder until legal/payment setup is approved.
- SOLVE stays separate and live.

## First build priority

Build foundation, not everything.

1. Manager workspace.
2. Partner profile.
3. Partner inventory.
4. Smart Link route support.
5. Lead separation.
6. Payment placeholder.
7. Rewards/Balance placeholders.
8. Insights placeholder.
9. PostgreSQL schema.
10. Cloudflare deploy readiness.

## Reporting

Every task response must include:

- What changed.
- Files changed.
- How to run locally.
- Tests/checks run.
- What remains unresolved.
