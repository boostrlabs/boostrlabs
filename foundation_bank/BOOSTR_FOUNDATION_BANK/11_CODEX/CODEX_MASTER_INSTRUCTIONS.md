# Codex Master Instructions

## Mission

Build BOOSTR Labs Core from the Foundation documents. Do not invent a new company. Do not overbuild. Do not ignore human decisions.

## Priority

1. Read `00_READ_FIRST.md`.
2. Read Human Bank.
3. Read Economics, Legal, Products, Partners, Payments/Risk, Rewards, UX, and Architecture docs.
4. Build only the foundation first.

## Do not

- Do not create open public signup.
- Do not create automatic Smart Link generator.
- Do not migrate SOLVE or take SOLVE offline.
- Do not implement real payments yet.
- Do not implement rewards cashout yet.
- Do not use JavaScript for new frontend.
- Do not store secrets.
- Do not hardcode pricing as permanent.
- Do not build all modules fully at once.

## Build first

1. Project structure.
2. Docs folder containing Foundation.
3. Auth/roles foundation.
4. BOOSTR Manager Workspace.
5. Partner Profile model.
6. Partner Inventory model.
7. Smart Link route/page support.
8. BOOSTR Leads and Partner Leads separation.
9. Payment placeholder/layer.
10. Rewards and Balance placeholders, separate.
11. Insight Cards placeholder.
12. PostgreSQL schema/migrations.
13. Cloudflare deploy readiness.

## Technical standard

- TypeScript frontend.
- Go backend skeleton preferred.
- PostgreSQL.
- Strict typing.
- Tests.
- Clean API.
- Mobile-ready.
- Provider abstraction.
- Security-first.

## SOLVE

SOLVE is separate.

Do not migrate SOLVE hosting/domain.

Use SOLVE only as:

- Technical reference.
- Case study.
- Source of reusable ideas/patterns if provided.

## Smart Links

Smart Link is an entry product, but every Smart Link is custom/manual in v1.

Build support for custom Smart Link pages, not a cheap builder.

## Naming

Use BOOSTR language:

- Partner, not user.
- BOOSTR Manager, not admin when brand-facing.
- Partner Inventory, not generic product model in brand-facing docs.
- Workspace, not generic dashboard where appropriate.

## Output expected from first Codex run

- Clear file tree.
- README.
- AGENTS.md.
- Environment example.
- Database schema.
- Frontend skeleton.
- Backend skeleton.
- Docs included.
- Local preview instructions.
- Cloudflare deployment notes.
- List of unresolved questions.
