# BOOSTR Labs D1 Setup - v0.3.0

Decision for now: **Cloudflare D1**.

## Current Cloudflare State

Completed on 2026-07-07:

- D1 database exists: `boostr_labs_core`
- D1 database id: `3998802e-1829-48b4-91dc-971ecfd4c23d`
- Migration applied to remote D1 through Cloudflare API.
- Pages project `boostrlabs` has D1 binding `DB` in production and preview.

Still required:

- Set `MANAGER_PIN` as a Pages environment variable.
- Commit, push and let Cloudflare deploy the Functions from this repo.

## Tables

The active D1 schema creates:

- `leads`
- `audit_submissions`
- `lead_events`
- `workspaces`
- `users`
- `modules`
- `orders`

It also seeds the first module registry rows:

- `boostr-audit`
- `smart-links`
- `manager-os`
- `smart-checkout`
- `artist-os`

## Pages Binding

The Pages Functions binding must stay:

```txt
DB
```

Current `wrangler.toml` also declares the binding so future deploys keep the same backend target.

## Manager PIN

Cloudflare Dashboard:

```txt
Workers & Pages
-> boostrlabs
-> Settings
-> Environment variables
-> Add variable
Name: MANAGER_PIN
Value: choose a private PIN/password
```

Use this PIN in `/manager/leads` and manager-only APIs.

Do not commit the PIN to GitHub.

## Backend Endpoints

Public / semi-public:

```txt
GET  /api/health
GET  /api/audit
POST /api/audit
POST /api/intake
GET  /api/modules
```

Manager PIN protected:

```txt
GET   /api/leads
POST  /api/leads
GET   /api/leads?type=summary
GET   /api/leads/:id
PATCH /api/leads/:id
GET   /api/orders
POST  /api/orders
GET   /api/modules?manager=1
```

## Test After Deploy

```txt
/api/health
/api/modules
/api/audit
/manager/leads
```

Expected `/api/health` after deploy and `MANAGER_PIN`:

```json
{
  "ok": true,
  "db": {
    "bound": true,
    "writable": true,
    "missing_tables": []
  },
  "manager": {
    "pin_configured": true
  }
}
```

This is not final auth. It is a temporary manager gate until real role login is connected.
