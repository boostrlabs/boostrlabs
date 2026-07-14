# BOOSTR Artist OS Integration Sprint

Status: PLANNED
Branch: `sprint/artist-os-integration`
Pilot: JANKO / WESTDETRO
Target: Convert the approved Music Player concept into the official reusable frontend for BOOSTR Artist workspaces without replacing the existing backend, authentication, permissions, or workspace model.

## Product lock

- BOOSTR does not distribute music.
- Artist OS organizes releases and provides guidance for distribution or redistribution through external providers.
- Starter scope stays focused on Music, Release, Content, Growth, Smart Link context, and Redistribution Advisor.
- Advanced business modules remain optional and disabled by default for emerging artists.
- Artist identity must remain customizable by workspace.

## Sprint outcome

A reusable Artist OS shell that:

1. Loads the authenticated artist workspace.
2. Uses the Music Player visual system.
3. Receives artist, catalog, release, content, growth, and branding data from adapters or APIs.
4. Runs first in the JANKO workspace behind a safe pilot route or feature flag.
5. Preserves the current `/demo/janko-os/` until QA is approved.

## Workstream 1 — Shared frontend core

Create:

- `public/assets/artist-os/artist-os.css`
- `public/assets/artist-os/artist-os-core.js`
- `public/assets/artist-os/artist-os-adapter.js`
- `public/assets/artist-os/artist-os-defaults.js`

Requirements:

- Extract layout, navigation, player behavior, release progress, checklist state, content list, growth summary, and notification behavior from `/demo/janko-artist-os/`.
- Remove JANKO-specific data from shared files.
- Preserve mobile-first behavior.
- No build-system dependency required for the pilot.

Acceptance:

- Shared shell can render at least two artist configurations without copying the full HTML.

## Workstream 2 — Universal Artist OS route

Create:

- `public/os/artist/index.html`

Responsibilities:

- Resolve workspace and artist context.
- Load the shared Artist OS assets.
- Render `NOW`, `MUSIC`, `RELEASE`, `CONTENT`, and `GROWTH`.
- Display a safe loading state and local fallback when APIs are unavailable.
- Never expose distribution actions such as “publish to Spotify” or “distribute now.”

Acceptance:

- Route works directly and through BOOSTR navigation.
- Unsupported or missing workspace data fails safely.

## Workstream 3 — Data adapter

Use existing backend contracts where possible, including workspace and artist profile endpoints.

Normalized frontend shape:

```js
{
  workspace: {},
  artist: {},
  brand: {},
  activeRelease: {},
  music: [],
  content: [],
  growth: {},
  capabilities: {}
}
```

Adapter rules:

- Strong identifiers first: `workspace_id`, artist profile ID, release ID, track ID.
- Demo data must be explicitly labeled.
- Missing values use placeholders; never invent statistics, release dates, ISRCs, UPCs, or providers.
- Advanced modules are controlled through `capabilities`.

Acceptance:

- JANKO pilot renders from the normalized object.
- The same adapter accepts a second artist config.

## Workstream 4 — JANKO pilot integration

Create or update a JANKO Artist OS configuration using approved existing facts only.

Pilot route options:

- `/os/artist/?workspace=janko`
- `/os/artist/janko/`

Pilot data:

- Artist: JANKO / WESTDETRO
- Active release: LATE NIGHT
- External-provider language only
- Existing catalog items may appear only where already confirmed

Acceptance:

- Current demo route remains available for comparison.
- New pilot route uses shared assets and adapter.
- No unrelated JANKO Custom OS modes are removed.

## Workstream 5 — Launcher and ecosystem entry

Update BOOSTR launcher or workspace navigation so Artist workspaces can open the new Artist OS route.

Rules:

- Entry appears only when Artist OS capability is active.
- Preserve BOOSTR central identity and workspace selection.
- Smart Link remains a public front door; Artist OS remains private workspace software.

Acceptance:

- Authenticated Artist persona can reach Artist OS from BOOSTR.
- Public visitors cannot access private workspace data.

## Workstream 6 — Persistence and actions

Pilot persistence priorities:

1. Release checklist state
2. Active release selection
3. Content item status
4. Artist preference and branding selection

Allowed pilot fallback:

- `localStorage` for explicit demo-only behavior.

Production direction:

- Workspace-scoped API persistence with authorization checks.

Acceptance:

- No cross-workspace data leakage.
- Actions remain scoped to the authenticated workspace.

## Workstream 7 — QA and rollout

Required QA:

- iPhone viewport and safe areas
- Android mobile viewport
- Desktop responsive state
- Keyboard navigation
- Reduced-motion support
- Empty data states
- API failure fallback
- Long titles and artist names
- Missing cover art
- Checklist persistence
- No distribution-service claims

Rollout gates:

1. Shared core complete
2. JANKO pilot connected
3. Mobile QA passed
4. Backend authorization verified
5. Second artist configuration rendered
6. Launcher entry enabled
7. Legacy Artist view deprecated only after approval

## Files likely affected

- `public/demo/janko-artist-os/index.html`
- `public/os/artist/index.html`
- `public/assets/artist-os/*`
- `public/assets/boostr-launcher/registry.js`
- `functions/api/workspaces/[workspace_id]/artist-profile.js`
- `functions/api/workspace-os.js`
- related route and QA documentation

## Explicitly out of scope

- Music distribution
- DSP delivery
- Royalty accounting
- Publishing administration
- Full fan CRM
- Full booking CRM
- Full store migration
- Replacing BOOSTR authentication
- Removing current JANKO Custom OS before approval

## Definition of done

- Music Player design is no longer a standalone hard-coded demo.
- Shared Artist OS frontend renders from normalized workspace data.
- JANKO pilot is reachable inside the BOOSTR ecosystem.
- External distribution language is enforced.
- Existing backend and permissions remain intact.
- Mobile QA and second-artist validation are documented and passed.
