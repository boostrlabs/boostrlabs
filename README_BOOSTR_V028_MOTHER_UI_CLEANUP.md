# BOOSTR Labs v0.2.8 — Mother UI cleanup + Audit endpoint

## What this patch does

- Replaces the root `index.html` so `/` no longer loads the old Vite landing.
- Replaces BOOSTR general UI pages with the new Mother UI direction.
- Removes Ambassador/Pulse/Pulse Plus concepts from BOOSTR UI routes.
- Removes long duplicate lead forms from general BOOSTR pages.
- Keeps custom UI untouched: `/82store`, `/82ngel`, `/jankodiorr`, `/app/82ngel`, `/app/gemese`, `/omgbeauty`.
- Patches `/audit` so final submissions POST to `/api/audit`.
- Adds `functions/api/audit.js` Cloudflare Pages Function.

## Test URLs

- `/` or `/home?fresh=1`
- `/login?fresh=1`
- `/manager?fresh=1`
- `/app?fresh=1`
- `/partner-dashboard?fresh=1`
- `/admin?fresh=1`
- `/ecosystem?fresh=1`
- `/modules?fresh=1`
- `/portfolio?fresh=1`
- `/audit?fresh=1`
- `/api/audit`

## Audit form behavior

The Audit frontend submits JSON to `/api/audit` when the user reaches the final screen.

The function returns:

```json
{ "ok": true, "id": "...", "stored": false, "needsDbBinding": true }
```

until a Cloudflare D1 binding named `DB` is connected and the `leads` table exists. Without D1, the submission appears in Cloudflare Function logs but is not persisted.

## Recommended next Codex task

Connect auth + D1:

- Create `leads` table.
- Bind D1 as `DB` in Cloudflare Pages.
- Show `/api/audit` submissions inside `/manager`.
- Add roles: manager, partner, client, artist, admin.
