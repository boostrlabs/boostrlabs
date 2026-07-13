# BOOSTR Labs official entry + PWA

Status: implementation candidate on `official-entry-pwa`.

## Interaction model

The root is a progressive binary router. It displays one question at a time and only two options: **A** or **B**.

The questions identify:

- whether the visitor has an account or invitation;
- whether an Audit is already in progress;
- how much the visitor knows about BOOSTR;
- whether an active operation exists;
- whether the need is already clear;
- whether the visitor wants diagnosis, explanation or real examples.

The visitor is routed only after BOOSTR has enough context. No visitor is forced into the Audit.

## Resolved destinations

- Existing account → `/login/`
- Private invitation → `/accept-invite/`
- New or resumed diagnosis → `/audit/`
- BOOSTR explanation → `/ecosystem/`
- Real work and examples → `/portfolio/`

The entry stores only non-sensitive routing context in `boostr_entry_profile` so future onboarding can understand whether the visitor was new, familiar, clear or uncertain.

## Authenticated PWA launch

When `/api/session` confirms an active session, the binary screen becomes:

- **A — Continuar:** open the authorized account context.
- **B — Hacer un Audit:** evaluate another operation or project.

An installed PWA with an active session continues directly to the authorized session redirect. Guests remain in the A/B router.

## Update and privacy behavior

- Navigation is network first.
- APIs, login, account dashboards, payments, orders, leads and invitations are not cached.
- Offline mode never displays cached private business records.
- New deployments activate through the controlled BOOSTR update prompt.
