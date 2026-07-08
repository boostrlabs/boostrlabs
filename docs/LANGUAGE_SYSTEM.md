# BOOSTR Labs Language System

Status: ACTIVE PRODUCT STANDARD
Last updated: 2026-07-08

## Core rule

No spanglish in product UI.

BOOSTR can be English or Spanish, but a visible screen should not mix both unless the element is a proper noun, brand name, route name, OS name, or user-generated content.

## Default language behavior

1. Detect the user's browser/system language.
2. If the language starts with `es`, show Spanish.
3. If the language starts with `en`, show English.
4. If the language is unsupported, fall back to English.
5. Store the user's selected language in `localStorage`.
6. The stored preference overrides browser detection.

## Supported languages

- English: `en`
- Spanish: `es`

Future languages can be added later, but EN/ES must be clean first.

## EN / ES toggle

Every BOOSTR OS surface should eventually include a small language toggle:

- `EN / ES`
- compact
- non-invasive
- preferably in the topbar, login footer, or compact sidebar
- never larger than primary product actions

Behavior:

- clicking `EN` switches all marked UI copy to English
- clicking `ES` switches all marked UI copy to Spanish
- selected language persists locally
- toggle should not reload the whole page unless needed

## English fallback

English is the fallback language for:

- unsupported browser languages
- missing translation keys
- malformed translation files
- first-time users where browser language cannot be detected

If a translation key is missing, show the English value, not a blank string.

## What gets translated

Translate:

- navigation labels
- button labels
- helper text
- form labels
- placeholders
- error messages
- success messages
- status labels
- tooltips
- onboarding copy
- empty states
- table headers
- modal copy
- CTA text

## What does not get translated

Do not translate:

- BOOSTR Labs
- client/artist names
- partner names
- brand names
- route slugs
- email addresses
- file names
- proper nouns
- user-generated content
- product/system names listed below

## BOOSTR system names that stay fixed

These names stay exactly the same in EN and ES:

- Mother OS
- Identity OS
- Manager OS
- Signal Inbox
- Module Deck
- Workspace Core
- Partner Grid
- System Core
- BOOSTR Intake
- Proof Vault
- 82NGEL OS
- WESTDETRO OS
- 82 Command
- Signal Engine
- Revenue Pulse
- Fan Radar
- Action Queue
- Route Map

Reason: these names are part of the BOOSTR product language and should feel proprietary.

## UI tone

### English

Use:

- global SaaS tone
- short labels
- premium product language
- direct verbs
- minimal explanation

Avoid:

- hype paragraphs
- startup buzzword overload
- technical implementation notes
- casual slang

### Spanish

Use:

- neutral premium Spanish
- clear product language
- short labels
- direct actions

Avoid:

- literal English translation
- Spanglish
- regional slang in core app UI
- long explanatory paragraphs

Spanish can have personality in artist/client-specific content, but core BOOSTR OS should stay clean.

## English / Spanish glossary

| Concept | English UI | Spanish UI |
|---|---|---|
| Open | Open | Abrir |
| Access | Access | Acceder |
| Continue | Continue | Continuar |
| Save | Save | Guardar |
| Send | Send | Enviar |
| Review | Review | Revisar |
| Search | Search | Buscar |
| Filter | Filter | Filtrar |
| Status | Status | Estado |
| Active | Active | Activo |
| New | New | Nuevo |
| Qualified | Qualified | Calificado |
| Lost | Lost | Perdido |
| Won | Won | Ganado |
| Lead | Lead | Lead |
| Application | Application | Aplicación |
| Audit | Audit | Audit |
| Workspace | Workspace | Workspace |
| Module | Module | Módulo |
| Route | Route | Ruta |
| Signal | Signal | Señal |
| Queue | Queue | Cola |
| Owner | Owner | Responsable |
| Note | Note | Nota |
| File | File | Archivo |
| Invoice | Invoice | Factura |
| Order | Order | Orden |
| Storefront | Storefront | Tienda |
| Partner | Partner | Partner |
| Client | Client | Cliente |
| Artist | Artist | Artista |
| Admin | Admin | Admin |

Note: some product nouns can stay in English when they are part of BOOSTR's product language, such as Lead, Audit, Workspace, Partner, OS.

## Forbidden UI words

Do not show these in user-facing UI:

- backend pending
- Codex
- Antigravity
- mockup
- invented demo data
- ready for leads
- preview systems
- user login shell
- implementation contract, except inside Admin OS
- temporary access token, except inside internal Manager-only testing surfaces
- auth next
- shell, except in docs or internal admin language
- demo, except in docs
- placeholder
- TODO
- lorem ipsum

## Preferred short UI words

Use short system language:

- Open
- Live
- Access
- Intake
- Review
- Signal
- Queue
- Core
- Map
- Route
- Active
- New
- Save
- Send
- Sync
- Claim
- Convert
- Assign
- Files
- Orders
- Pulse
- Radar
- Deck
- Grid

## Copy density rule

Visible UI should prefer:

- one short title
- one short label
- one number or state
- one action

Avoid explanatory paragraphs. If something needs deeper explanation, use:

- tooltip
- details panel
- Admin OS note
- docs

## Implementation expectation

A future frontend pass should add:

- `public/assets/boostr-mother/i18n.js`
- `public/assets/boostr-mother/i18n/en.json`
- `public/assets/boostr-mother/i18n/es.json`
- `data-i18n` keys on visible UI text
- small `EN / ES` toggle

The first i18n pass should cover:

- `/home`
- `/login`
- `/manager`
- `/manager/leads`
- `/app`
- `/partner-dashboard`
- `/admin`
- `/modules`

## Pass/fail language rule

A screen passes language QA only if:

- it is fully English or fully Spanish
- system names stay fixed
- no internal build language appears
- no spanglish appears in core UI
- buttons and states are short
- text does not fight the visual system
