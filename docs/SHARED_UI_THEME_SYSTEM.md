# BOOSTR Shared UI Theme System

## Scope

The approved productivity/smart-control visual language is applied to BOOSTR shared UI surfaces:

- `/`
- `/app/`
- `/home/`
- `/admin/*`
- `/manager/*`
- `/partner-dashboard/*`
- shared `/app/*` surfaces
- authentication, signup and audit routes
- modules, ecosystem and shared workspace tools

The system is injected by `functions/_middleware.js`.

## Protected custom design routes

The shared theme is not injected into Custom OS or partner-branded experiences, including:

- Janko, Johanka and 82NGEL Custom OS routes
- Hummus FL custom routes
- OMNI JR parking
- JANKO / WESTDETRO, 82NGEL, OMG Beauty and portfolio experiences
- demos, documents and payment experiences with their own visual contract

A future custom page may opt out explicitly:

```html
<meta name="boostr-theme" content="custom">
```

## Theme registry

Available themes:

- `night_blue` — approved dark productivity UI
- `smart_light` — approved monochrome smart-control UI
- `mother_platinum` — preserved original BOOSTR Mother UI

Available accents:

- `blue`
- `violet`
- `rose`
- `emerald`

## Founder control

Janko's private Custom OS receives a `Theme / Color` settings panel. The panel writes to:

- `GET /api/founder-settings/theme`
- `POST /api/founder-settings/theme`

The backend requires Janko's founder email and an authorized founder/admin role. Other users cannot save the global setting.

Shared UI clients read:

- `GET /api/public/theme`

The active configuration is stored in D1 table `boostr_ui_settings`. A local cached copy prevents a flash during page load.

## Files

- `public/assets/boostr-theme/app-ui.css`
- `public/assets/boostr-theme/theme-runtime.js`
- `public/assets/boostr-mother/janko-theme-settings.js`
- `functions/_lib/theme.js`
- `functions/api/public/theme.js`
- `functions/api/founder-settings/theme.js`
- `functions/_middleware.js`
