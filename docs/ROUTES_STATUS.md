# BOOSTR Labs Routes Status

Status: CURRENT ROUTE MAP
Last updated: 2026-07-08

Purpose: define which routes are official, which are aliases, which are internal, and which should not be treated as primary product surfaces.

Source of truth: `public/_redirects` is the runtime route map for the Cloudflare Pages static deployment. This document explains product intent so future frontend/backend work does not edit or promote the wrong route.

## Status labels

- `OFFICIAL` = primary route to use publicly or internally.
- `ALIAS` = supported shortcut that should resolve to an official route.
- `INTERNAL` = internal/admin/development surface.
- `CLIENT/PARTNER` = workspace or partner-facing surface; account-required once auth is live.
- `LEGACY` = existing route/file that should not be expanded without review.
- `ARCHIVE_CANDIDATE` = likely duplicate or older path; document before deleting.

## Primary public routes

| Route | Serves | Status | Purpose | Backend needed |
|---|---|---:|---|---|
| `/` | `/home/index.html` | OFFICIAL | Main BOOSTR Labs entry. | No |
| `/home` | `/home/index.html` | OFFICIAL | Main BOOSTR Labs Mother UI home. | No |
| `/audit` | `/audit/index.html` | OFFICIAL | Main public lead entry / BOOSTR Audit. | `POST /api/audit` already exists; needs spam/rate protection later. |
| `/portfolio` | `/portfolio/index.html` | OFFICIAL | Public proof / selected systems. | No |
| `/modules` | `/modules/index.html` | OFFICIAL | Module registry / system map. | Optional `/api/modules` later. |
| `/ecosystem` | `/ecosystem/index.html` | OFFICIAL | Ecosystem map / product architecture view. | No |

## Core OS routes

| Route | Serves | Status | Purpose | Backend needed |
|---|---|---:|---|---|
| `/login` | `/login/index.html` | OFFICIAL | Role-based login shell. | Real auth/session backend. |
| `/manager` | `/manager/index.html` | OFFICIAL / INTERNAL | BOOSTR Manager OS shell. | Session auth + manager permissions. |
| `/manager/leads` | `/manager/leads/index.html` | OFFICIAL / INTERNAL | Lead inbox. | Replace temporary access token with user session + role scope. |
| `/admin` | `/admin/index.html` | INTERNAL | Backend/admin contract surface. | Admin auth + protected system APIs. |
| `/app` | `/app/index.html` | OFFICIAL / CLIENT | Client OS workspace hub. | User login + workspace records. |
| `/partner-dashboard` | `/partner-dashboard/index.html` | OFFICIAL / PARTNER | Partner OS workspace hub. | Partner login + referral scoping. |

## Public client / artist / commerce routes

| Route | Serves | Status | Purpose | Backend needed |
|---|---|---:|---|---|
| `/82store` | `/82store/index.html` | OFFICIAL | 82 Store public commerce frontend. | Orders/payments later. |
| `/82ngel` | `/82ngel/index.html` | OFFICIAL | 82NGEL public artist route. | No immediate backend. |
| `/jankodiorr` | `/jankodiorr/index.html` | OFFICIAL | Janko Diorr / WESTDETRO public route. | No immediate backend. |
| `/omgbeauty` | `/portfolio/omgbeauty/index.html` | OFFICIAL | OMG Beauty public/portfolio route. | No immediate backend. |

## Account/workspace demo routes

| Route | Serves | Status | Purpose | Backend needed |
|---|---|---:|---|---|
| `/app/82ngel` | `/app/82ngel/index.html` | CLIENT/PARTNER | 82NGEL Artist OS preview/dashboard. | Artist workspace auth. |
| `/app/gemese` | `/app/gemese/index.html` | CLIENT/PARTNER | GEMESE OS demo/dashboard. | Workspace auth + partner/client scoping. |

## Partner routes

| Route | Serves | Status | Purpose | Backend needed |
|---|---|---:|---|---|
| `/partner` | `/partner/index.html` | OFFICIAL / PARTNER ENTRY | General partner page. | Referral tracking later. |
| `/partner/gemese` | `/partner/gemese/index.html` | OFFICIAL / PARTNER | GEMESE private partner route. | Referral tracking later. |
| `/partner/janko` | `/partner/janko/index.html` | OFFICIAL / PARTNER | Janko private partner route. | Referral tracking later. |
| `/partner/omgbeauty` | `/partner/omgbeauty/index.html` | OFFICIAL / PARTNER | OMG Beauty private partner route. | Referral tracking later. |

## Supported aliases

These routes should keep working, but should not be treated as the main product route in docs, UI, or Codex tasks.

| Alias | Resolves to | Status | Notes |
|---|---|---:|---|
| `/client` | `/app/index.html` | ALIAS | Use `/app` as official route. |
| `/client-os` | `/app/index.html` | ALIAS | Use `/app` as official route. |
| `/manager-os` | `/manager/index.html` | ALIAS | Use `/manager` as official route. |
| `/partner-os` | `/partner-dashboard/index.html` | ALIAS | Use `/partner-dashboard` as official route. |
| `/82-store` | `/82store/index.html` | ALIAS | Use `/82store` as official route. |
| `/janko` | `/jankodiorr/index.html` | ALIAS | Use `/jankodiorr` publicly unless a shorter artist route is intentionally preferred. |
| `/westdetro` | `/jankodiorr/index.html` | ALIAS | Useful for campaign routing. |
| `/johanka` | `/82ngel/index.html` | ALIAS | Use `/82ngel` publicly. |
| `/portfolio/omgbeauty` | `/portfolio/omgbeauty/index.html` | ALIAS/OFFICIAL SECONDARY | `/omgbeauty` is cleaner public route. |

## Runtime fallback

| Route | Serves | Status | Notes |
|---|---|---:|---|
| `/*` | `/home/index.html` | FALLBACK | Unknown routes return the home shell instead of a blank/broken page. |

## Known cleanup targets

These are not deletion approvals. They are review targets before cleanup.

| Item | Status | Why it needs review | Suggested action |
|---|---|---|---|
| Duplicate alias folders such as `/client`, `/client-os`, `/manager-os`, `/partner-os` | ARCHIVE_CANDIDATE | `_redirects` routes these to official OS pages, but old static files may still exist. | Inventory files, then archive/delete only after confirming no direct runtime dependency. |
| `/82store` vs `/82-store` | ALIAS DUPLICATE | Both naming styles exist in route history. | Keep `/82store` official; keep `/82-store` as alias. |
| `/omgbeauty` vs `/portfolio/omgbeauty` | ALIAS DUPLICATE | Brand route and portfolio route serve the same surface. | Keep `/omgbeauty` for public sharing; keep portfolio route as proof context. |
| Root Vite app vs `apps/ecosystem` | ARCHITECTURE REVIEW | Root deploy uses Vite/static output; ecosystem app may represent future shell. | Do not mix without an explicit migration plan. |

## Rules for future work

1. Do not add a new public route without updating this file and `public/_redirects`.
2. Do not promote aliases as official routes in UI copy.
3. Do not delete legacy folders until route behavior has been verified in production.
4. Public entry for leads remains `/audit`.
5. Account-required product surfaces are `/manager`, `/manager/leads`, `/app`, `/partner-dashboard`, `/admin`, and future private workspace routes.
6. Artist/client public front doors can stay custom-branded, but account access should federate into BOOSTR identity later.
7. Unknown routes should keep falling back to `/home/index.html` unless a proper 404 page is intentionally created.
