# BOOSTR Labs official entry + PWA

Status: implementation candidate on `official-entry-pwa`.

## Entry rule

The public root and the installed PWA use one neutral entry:

- **Iniciar sesión** for people who already have a BOOSTR account or invitation.
- **Comenzar BOOSTR Audit** for people who need BOOSTR to discover what their operation needs.

The root does not ask visitors to choose Manager, Client or Partner. Roles are resolved only after authentication.

## Authenticated PWA launch

When the root is opened as an installed PWA and `/api/session` confirms an active session, the app opens the authorized redirect returned by the session. Guest users remain on the neutral entry.

## Public secondary paths

- Invitation: `/accept-invite/`
- Continue Audit: `/audit/`
- Explore work: `/portfolio/`

## Update and privacy behavior

- Navigation is network first.
- APIs, login, account dashboards, payments, orders, leads, invitations and authenticated requests are not cached.
- Offline mode never displays cached private business records.
- A new deployment can activate through the controlled **Actualizar BOOSTR** prompt.
