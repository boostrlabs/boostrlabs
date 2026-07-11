# BOOSTR Ecosystem Stabilization Sprint v0.9

Date: 2026-07-10

This document records repairs applied directly to production source before any future health-product UI.

## Repaired

- Public experiences such as `/3d`, artist links, payment pages, portfolio pages and partner public pages are isolated from the private ecosystem runtime.
- Private loading gates and session redirects are limited to private surfaces.
- The floating context shell has a duplicate guard and a direct Workspace OS route.
- Founder workspace enhancement runs only on Janko and Johanka Custom OS surfaces and disconnects its observer.
- Audit Inbox no longer includes Manager PIN UI, PIN headers or demo console effects.
- Audit Inbox loads real Audit submissions automatically and preserves claim/update actions.
- Active workspace metadata is resolved even when a manager accesses a workspace without direct membership.
- Invalid or inactive active-workspace state is repaired safely.
- Founder Artist OS synchronization is idempotent instead of rewriting rows on every session request.
- Johanka Cloud uses one controlled bootstrap path, authenticated private blobs, mobile image fallback and GPU/blob cleanup.
- Login preserves a validated same-origin `next` destination through authentication.
- Historical `/password-reset/` links now preserve their query/token and route to `/forgot-password/`.
- Workspace switching rejects inactive workspaces.
- Critical route, syntax, JSON, PIN, demo-data and local-link checks were added to the deploy workflow.

## Protected surfaces

- `/login/`
- `/manager/leads/`
- `/partner-dashboard/`
- `/app/janko/`
- `/app/johanka/`
- `/app/johanka/cloud/`
- `/3d/`
- `/api/session`
- `/api/session/switch`
- `/api/workspace-os`
- `/api/cloud`
- `/api/3d-model/:id`

## Validation

The `BOOSTR Ecosystem Stability` GitHub Action runs:

1. dependency installation with the repository lockfile;
2. static ecosystem stability checks;
3. the production Vite/Johankarrd build.

No claim of successful Cloudflare browser deployment is made until production QA is completed.
