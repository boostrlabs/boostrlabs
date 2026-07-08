# BOOSTR Labs QA Command Sheet

Status: ACTIVE QA STANDARD
Last updated: 2026-07-08

## Purpose

This sheet defines what must be tested before calling BOOSTR Labs production-ready.

QA should verify:

- routes
- visual quality
- language quality
- auth behavior
- Signal Inbox behavior
- Audit behavior
- mobile behavior
- backend API behavior

## QA principle

Do not judge only by whether a page loads.

A route passes only if it:

- opens correctly
- looks premium
- has no internal build language
- uses correct system naming
- respects EN/ES language rules
- has working visible actions
- does not break navigation
- feels like part of one BOOSTR OS

## Routes to test

### Core public routes

| Route | Expected surface | Pass criteria |
|---|---|---|
| `/` | Home/Mother OS | Redirects or renders cleanly. |
| `/home` | Mother OS | Premium entry, short copy, Module Deck link. |
| `/audit` | BOOSTR Intake | Public, guest-friendly, captures lead data. |
| `/modules` | Module Deck | Shows official BOOSTR surfaces. |
| `/portfolio` | Proof Vault / Proof Library | Stays outside core dashboard navigation. |

### Internal/app routes

| Route | Expected surface | Pass criteria |
|---|---|---|
| `/login` | Identity OS | Looks like login only. No extra dashboard clutter. |
| `/manager` | Manager OS | Control room for signals, modules, workspaces. |
| `/manager/leads` | Signal Inbox | Loads leads/audits with valid access. |
| `/app` | Workspace Core | Client workspace hub. |
| `/partner-dashboard` | Partner Grid | Partner workspace hub. |
| `/admin` | System Core | Admin/system map. |

### Brand/client/artist routes

| Route | Expected surface | Pass criteria |
|---|---|---|
| `/82ngel` | 82NGEL public route | Custom-branded public front door. |
| `/app/82ngel` | 82 Command | Artist dashboard. |
| `/82store` | 82 Storefront | Commerce reference route. |
| `/jankodiorr` | WESTDETRO OS | Artist/public route. |
| `/omgbeauty` | OMG Beauty route | Proof/client route. |
| `/app/gemese` | GEMESE OS | Partner/client workspace route. |

### Alias routes

Aliases should resolve cleanly and should not be promoted as official UI links.

Test:

- `/client` → `/app`
- `/client-os` → `/app`
- `/manager-os` → `/manager`
- `/partner-os` → `/partner-dashboard`
- `/82-store` → `/82store`
- `/janko` → `/jankodiorr`
- `/westdetro` → `/jankodiorr`
- `/johanka` → `/82ngel`

## Frontend visual QA

A page passes visual QA if:

- dark premium base is intact
- cards feel modular and floating
- glass effect is visible but not noisy
- spacing is balanced
- bottom nav works on supported pages
- active states are clear
- hover/focus states are visible
- search/filter fields look integrated
- charts/rings/bars/waves do not look random or broken
- page does not feel like a generic template
- page does not feel like an agency landing page

Fail if:

- too much text dominates the screen
- UI looks flat or static
- cards overlap unintentionally
- animations make the interface hard to use
- mobile layout is cramped
- footer says only `BOOSTR Labs` without OS context
- Portfolio appears as a primary dashboard module where Module Deck should be used

## i18n QA

A page passes i18n QA if:

- EN/ES toggle exists after i18n implementation
- browser language detection works
- localStorage language preference persists
- unsupported languages fall back to English
- English screen has no Spanish UI copy
- Spanish screen has no English UI copy except fixed product/system names
- BOOSTR system names remain fixed
- placeholders translate
- form labels translate
- table headers translate
- button labels translate
- errors/success messages translate
- no spanglish appears in core UI

Fail if:

- visible UI mixes English and Spanish randomly
- a translated screen has missing keys
- a screen shows raw translation keys
- language switch breaks layout
- system names are translated incorrectly

## Auth QA

Until real auth is finished, distinguish between current bridge behavior and final expected behavior.

### Current bridge pass criteria

- `/login` creates local preview session only
- `/manager/leads` still works with the current protected API method if backend has not replaced it
- public routes do not require login
- `/audit` remains guest-friendly

### Final auth pass criteria

After backend implementation:

- login creates real session
- logout clears real session
- `/api/me` or equivalent returns current user
- user can have multiple workspaces
- active workspace can be identified
- protected routes deny anonymous access
- public `/audit` still works anonymously
- role permissions are enforced

### Role pass criteria

| Role | Expected access |
|---|---|
| admin | all system records and admin surfaces |
| manager | all operational leads/workspaces/modules |
| partner | scoped partner leads/routes/workspaces |
| client | own workspace only |
| artist | own artist workspace only |

Fail if:

- partner sees manager-only data
- client sees another workspace
- anonymous user can read protected lead data
- Manager-only APIs are public

## Signal Inbox QA

Test route:

- `/manager/leads`

Pass criteria:

- page loads cleanly
- search works
- local filter works
- status tabs work
- leads can load with valid access
- audits can load with valid access
- summary can load with valid access
- row selection opens detail panel
- lead status can be changed where backend allows it
- quick actions work where backend allows it
- failed requests show clean short errors
- no long internal copy dominates the page

Fail if:

- table breaks on mobile
- detail panel does not update
- filters erase loaded data incorrectly
- invalid access shows raw stack traces
- internal words appear in user-facing UI

## Audit QA

Current route:

- `/audit`

Pass criteria now:

- public access
- form submits to the correct API
- required fields validate
- success state appears
- error state is readable
- opened from dashboard in a new tab
- no internal module-completion language appears

Future pass criteria:

- interactive multi-step flow
- EN/ES support
- progress state
- animated transitions
- business/project diagnosis
- recommended module output
- Signal Inbox receives useful data
- final screen feels premium

Fail if:

- Audit looks like a generic contact form
- Audit asks too little to route the lead
- Audit uses spanglish
- Audit feels less premium than the dashboards

## Mobile QA

Test widths:

- 390px
- 430px
- 768px
- 1024px
- desktop wide

Pass criteria:

- no horizontal overflow except intentional data tables
- bottom nav usable
- tap targets large enough
- forms usable
- cards stack cleanly
- hero sections do not dominate too much vertical space
- text remains short
- language toggle does not crowd nav
- drag/drop does not block scroll

Fail if:

- primary buttons are hidden
- cards overlap
- search input unusable
- nav impossible to tap
- content looks like desktop squeezed into phone

## Backend API QA

Core endpoints to test:

- `GET /api/health`
- `POST /api/audit`
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id`
- `GET /api/modules`
- `GET /api/orders` if active
- `GET /api/events` if active
- future `GET /api/me`
- future `GET /api/workspaces`

Pass criteria:

- JSON responses are valid
- errors are clean JSON
- public endpoints are public only where intended
- protected endpoints reject anonymous access
- protected endpoints enforce role/workspace scope
- D1 unavailable state returns clean error
- no raw stack traces in production

Fail if:

- protected APIs leak records
- invalid input stores bad data
- API returns HTML error pages
- workspace_id is ignored after workspace implementation

## Text QA

Forbidden words in visible UI:

- backend pending
- Codex
- Antigravity
- mockup
- invented demo data
- ready for leads
- preview systems
- user login shell
- auth next
- shell, except internal docs/admin
- placeholder
- TODO

Pass criteria:

- copy is short
- copy is useful
- screen can be understood visually
- long explanations move to docs/admin/tooltip

## Pass/fail definition

### Route passes

A route passes when:

- it loads
- core actions work
- no forbidden language appears
- page matches BOOSTR visual system
- language behavior is correct
- mobile is acceptable

### Release passes

A release passes when:

- all official routes pass
- protected APIs are not exposed
- public Audit works
- no spanglish appears in core UI
- no internal build language appears
- footer/system naming is consistent
- visual system is cohesive

## Score interpretation

| Score | Meaning |
|---|---|
| 90-100 | Production-grade app/platform vibe |
| 80-89 | Strong MVP with premium visual direction |
| 70-79 | Good prototype, still obvious gaps |
| 60-69 | Functional but inconsistent |
| below 60 | Needs major cleanup |
