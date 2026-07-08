# BOOSTR Labs Route Cleanup Plan

Status: DOCUMENTED CLEANUP PLAN
Last updated: 2026-07-08

Purpose: identify duplicate, legacy or alias route folders before deleting anything. This is not a deletion approval. It is a cleanup map so Codex/Aider can avoid touching the wrong files.

Primary source of truth:

- `docs/ROUTES_STATUS.md`
- `public/_redirects`

## Cleanup principle

Do not delete a static folder just because an alias exists. First verify production behavior, internal links, asset dependencies and redirects.

## Official routes to keep and develop

| Official route | Primary file | Keep? | Notes |
|---|---|---:|---|
| `/home` | `public/home/index.html` | YES | Main BOOSTR entry. |
| `/audit` | `public/audit/index.html` | YES | Public lead intake. |
| `/manager` | `public/manager/index.html` | YES | Internal Manager OS. |
| `/manager/leads` | `public/manager/leads/index.html` | YES | Lead Inbox. |
| `/login` | `public/login/index.html` | YES | Role access shell. |
| `/app` | `public/app/index.html` | YES | Client OS hub. |
| `/partner-dashboard` | `public/partner-dashboard/index.html` | YES | Partner OS hub. |
| `/admin` | `public/admin/index.html` | YES | Backend contract shell. |
| `/modules` | `public/modules/index.html` | YES | Module registry. |
| `/ecosystem` | `public/ecosystem/index.html` | YES | Ecosystem map. |
| `/portfolio` | `public/portfolio/index.html` | YES | Proof index. |
| `/82store` | `public/82store/index.html` | YES | Official store route. |
| `/82ngel` | `public/82ngel/index.html` | YES | Official 82NGEL route. |
| `/jankodiorr` | `public/jankodiorr/index.html` | YES | Official Janko/WESTDETRO route. |
| `/omgbeauty` | `public/portfolio/omgbeauty/index.html` | YES | Clean public brand route via redirect. |

## Alias routes to keep as redirects only

| Alias | Official route | Keep alias? | Develop alias folder? |
|---|---|---:|---:|
| `/client` | `/app` | YES | NO |
| `/client-os` | `/app` | YES | NO |
| `/manager-os` | `/manager` | YES | NO |
| `/partner-os` | `/partner-dashboard` | YES | NO |
| `/82-store` | `/82store` | YES | NO |
| `/janko` | `/jankodiorr` | YES | NO |
| `/westdetro` | `/jankodiorr` | YES | NO |
| `/johanka` | `/82ngel` | YES | NO |

## Archive candidates

These should be inspected before any deletion. If they only duplicate official routes and contain no unique assets or content, move/delete in a separate cleanup commit.

| Folder/file pattern | Reason | Suggested action |
|---|---|---|
| `public/client/` | Alias now resolves to `/app`. | Compare with `public/app/`; if duplicate/older, archive/delete later. |
| `public/client-os/` | Alias now resolves to `/app`. | Compare with `public/app/`; if duplicate/older, archive/delete later. |
| `public/manager-os/` | Alias now resolves to `/manager`. | Compare with `public/manager/`; if duplicate/older, archive/delete later. |
| `public/partner-os/` | Alias now resolves to `/partner-dashboard`. | Compare with `public/partner-dashboard/`; if duplicate/older, archive/delete later. |
| `public/82-store/` | Alias now resolves to `/82store`. | Keep redirect alias; archive duplicate folder if not needed. |
| `public/omgbeauty/` | Clean route resolves to portfolio path. | Compare with `public/portfolio/omgbeauty/`; keep best file, avoid duplicate editing. |
| Any older smart-link route that duplicates `/82ngel` or `/jankodiorr` | Could be stale from earlier link-system builds. | Keep official public routes only unless campaign-specific. |

## Safe cleanup sequence

1. List all `public/*/index.html` files.
2. Compare them against `docs/ROUTES_STATUS.md`.
3. Mark every file as `OFFICIAL`, `ALIAS_DUPLICATE`, `LEGACY`, or `UNKNOWN`.
4. Do not delete files with unique assets, working forms, or unique brand content.
5. Update internal links to official routes first.
6. Keep redirect aliases in `public/_redirects` for existing shared links.
7. Remove/archive duplicate folders only after route tests pass.

## Internal linking rules

Use official routes in UI:

- Use `/app`, not `/client` or `/client-os`.
- Use `/manager`, not `/manager-os`.
- Use `/partner-dashboard`, not `/partner-os`.
- Use `/82store`, not `/82-store`.
- Use `/82ngel`, not `/johanka`.
- Use `/jankodiorr`, not `/janko` for official site links.
- Use `/westdetro` only for campaign sharing if desired.

## Why this matters

BOOSTR should feel like one system, not a pile of experiments. Route cleanup reduces the chance that Codex, Aider or a future developer edits a dead page while production serves another file.
