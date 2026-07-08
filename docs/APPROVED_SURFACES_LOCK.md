# BOOSTR Approved Surfaces Lock

Status: ACTIVE PROTECTION RULE
Last updated: 2026-07-08

## Purpose

Some BOOSTR routes are core product surfaces. Others are branded worlds.

Do not flatten branded worlds into generic BOOSTR dashboards.

## Approved principles from product direction

These rules are active:

1. Separate BOOSTR core from client/artist branded pages.
2. Restore before improving.
3. EN / ES toggle must be visible where language switching is expected.
4. Names must be clear before they are clever.
5. QA live after meaningful commits.
6. BOOSTR Audit is an experience, not a generic form.
7. JANKO/WESTDETRO must feel custom, not like a BOOSTR template.
8. 82NGEL must keep its own world and visual identity.

## Core BOOSTR routes

These can share the BOOSTR visual system, console behavior, floating cards and module language.

| Route | Product name | Visual ownership |
|---|---|---|
| `/home` | BOOSTR CORE | BOOSTR core |
| `/login` | Login | BOOSTR core |
| `/manager` | Manager | BOOSTR core |
| `/manager/leads` | Leads | BOOSTR core |
| `/modules` | Module Deck | BOOSTR core |
| `/app` | Dashboard | BOOSTR core |
| `/partner-dashboard` | Partners | BOOSTR core |
| `/admin` | BOOSTR CORE / Admin | BOOSTR core |

## Protected branded/custom routes

These routes should not be made generic.

| Route | Surface | Protection rule |
|---|---|---|
| `/audit` | BOOSTR Audit | Must be premium interactive diagnosis, not a basic contact form. Restore best version before further changes. |
| `/jankodiorr` | JANKO / WESTDETRO Link OS | Must feel JANKO/WESTDETRO/NNE first, BOOSTR-powered second. Preserve approved logo/assets/mood. |
| `/82ngel` | 82NGEL OS | Must preserve 82NGEL red/black/white artist world. |
| `/app/82ngel` | 82NGEL Dashboard | Must preserve 82NGEL dashboard direction and not become generic SaaS. |
| `/82store` | 82 Storefront | Commerce reference route with 82NGEL identity. |
| `/portfolio` | Proof | Proof only, not a core dashboard module. |

## Restore-before-improve rule

Before changing a protected route:

1. Check whether the current route is the approved version.
2. If the owner says an earlier version was better, stop feature work.
3. Search commit history or request the old ZIP/screenshot.
4. Restore the approved direction first.
5. Only then apply language, performance or small bug fixes.

## Global script rule

Global scripts must not blindly rewrite protected routes.

Allowed globally:

- visible EN / ES toggle
- safe language support
- bug fixes that do not change layout or visual identity

Not allowed globally on protected routes:

- injecting generic BOOSTR labels
- adding automatic charts
- replacing visual hierarchy
- changing approved logo/assets
- renaming a branded route into generic BOOSTR language
- replacing custom design with core dashboard cards

## Language rule

EN / ES can be added to protected routes, but language work must not change the visual identity.

Correct:

- same layout
- same assets
- same logo
- translated labels only

Wrong:

- rebuilding the route into a generic form/dashboard
- replacing artist visual direction
- removing approved logos
- changing mood while translating

## JANKO/WESTDETRO lock

`/jankodiorr` must feel:

- JANKO first
- WESTDETRO/NNE worldbuilding
- dark underground premium
- music-tech
- press-ready
- Apple/Spotify-coded
- not a Linktree clone
- not a generic BOOSTR landing

Must preserve or restore:

- approved JANKO/WESTDETRO logo usage
- approved music/press visuals
- approved dark mood
- approved service/music links
- many CTA buttons

## 82NGEL lock

82NGEL routes must feel:

- red/black/white
- Carrd-style where appropriate
- artist/fashion/music
- direct and visual
- not generic dashboard SaaS

## BOOSTR Audit lock

`/audit` must be:

- premium interactive diagnosis
- multi-step or high-signal flow
- short questions
- progress state
- EN / ES support
- public guest access
- useful Leads output

It must not remain a basic contact form as the final direction.

## QA after commit

After changing any protected route, live QA must verify:

- approved logo still present
- route mood still matches owner
- EN / ES does not break layout
- mobile still works
- no spanglish
- no generic BOOSTR overwrite
- links still work

## Final rule

Approved branded surfaces are not raw material for global cleanup.

They are product assets.
