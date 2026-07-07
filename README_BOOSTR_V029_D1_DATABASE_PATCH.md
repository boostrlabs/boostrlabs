# BOOSTR Labs v0.3.0 - Backend/D1 Patch

This patch advances the backend layer for BOOSTR forms, manager leads, module registry and early orders.

## Adds / Updates

- `/api/audit` - receives BOOSTR Audit submissions, stores audit + lead + event.
- `/api/intake` - receives Custom OS intake submissions, stores lead + event.
- `/api/health` - reports D1 binding, table readiness, manager PIN readiness and backend endpoints.
- `/api/leads` - Manager PIN protected lead/audit list, filters, summary and manual lead creation.
- `/api/leads/:id` - Manager PIN protected lead detail, events and status/assignment updates.
- `/api/modules` - public module registry read endpoint, manager mode available with PIN.
- `/api/orders` - Manager PIN protected early order records.
- `functions/_lib/api.js` - shared API helpers for CORS, JSON, auth, D1 and events.
- `migrations/0001_boostr_core.sql` - Cloudflare D1 schema v0.3.0.
- `wrangler.toml` - D1 binding `DB` for `boostr_labs_core`.
- `/manager/leads` - existing internal lead inbox route remains the minimal manager UI.

## Cloudflare State Completed

- D1 database exists: `boostr_labs_core`
- D1 database id: `3998802e-1829-48b4-91dc-971ecfd4c23d`
- Migration applied to remote D1.
- Pages project `boostrlabs` has `DB` binding for production and preview.

## Still Required Before Full Manager Use

Set a private `MANAGER_PIN` in Cloudflare Pages:

```txt
Workers & Pages -> boostrlabs -> Settings -> Environment variables
Name: MANAGER_PIN
```

Do not commit the PIN to GitHub.

## Commit / Deploy

Recommended commit:

```bash
git add functions migrations docs wrangler.toml public/_redirects public/manager/leads PATCH_V029_D1_DATABASE_MANIFEST.json README_BOOSTR_V029_D1_DATABASE_PATCH.md
git commit -m "Add BOOSTR D1 backend endpoints"
git push origin main
```

Cloudflare Pages should deploy from `main`.

## Test Links After Deploy

```txt
/api/health
/api/modules
/api/audit
/api/leads?type=summary
/manager/leads
```
