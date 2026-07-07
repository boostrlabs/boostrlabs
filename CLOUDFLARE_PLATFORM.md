# BOOSTR Labs Cloudflare / GitHub Direction

Last updated: 2026-07-07

## Current Target

GitHub becomes the source of truth for the full BOOSTR Labs local folder.

Cloudflare Pages should deploy from GitHub and provide preview URLs for review on desktop and iPhone before changes are treated as approved.

## Immediate Workflow

1. Consolidate local text direction.
2. Preserve assets and prototypes.
3. Upload the full local folder to GitHub.
4. Connect GitHub repo to Cloudflare Pages.
5. Confirm the root preview deploys.
6. Use scoped branches/tasks for future implementation work.

See `docs/14_CLOUDFLARE_GITHUB_WORKFLOW.md`.

## Initial Static/Prototype Deploy Option

If the repo is deployed before the final app architecture is chosen and the root `index.html` remains the deploy target:

- Framework preset: None
- Build command: `exit 0`
- Build output directory: `/`
- Root directory: `/`
- Production branch: `main`

This is an initial preview workflow, not the final product architecture.

## Future App Direction

The current strategic direction favors:

- TypeScript.
- Next.js App Router.
- Modular monolith for the solo founder/developer phase.
- Managed Postgres through Supabase or Neon.
- Central BOOSTR identity, personas, workspaces, roles, and permissions.
- Modular dashboards and partner front doors.
- API-first data access where possible.
- Authorized/manual/evidence data workflows where APIs are not available.

When the final app becomes the Cloudflare target, Cloudflare build settings must be updated according to the actual selected deployment approach.

## Legacy Scaffold Still Present

The following files remain in the local folder as prototypes/reference:

- `functions/api/health.js`
- `functions/api/intake.js`
- `migrations/0001_boostr_core.sql`

These came from an earlier Cloudflare Pages Functions / D1 pass. They should not be treated as final architecture unless the user explicitly re-selects that direction.

## Superseded Direction

- Netlify as main workflow is superseded.
- D1 as final data architecture is not current direction.
- Pages Functions as final backend architecture is not current direction.
- Go backend / microservices are not current direction for this phase.

## Branch Concept After GitHub

- `main`: stable production/base.
- `feature/82ngel-dashboard`: 82NGEL dashboard work.
- `feature/gemese-dashboard`: GEMESE dashboard work.
- `feature/rouvssen-checkout`: urgent purchase flow.
- `feature/barber-os`: barber module.
- `feature/manager-workspace`: internal BOOSTR manager workspace.

Do not develop major changes directly on `main` once the GitHub workflow starts.
