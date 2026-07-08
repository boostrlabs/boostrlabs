# BOOSTR Labs Language System

Status: ACTIVE PRODUCT STANDARD + FIRST FRONTEND IMPLEMENTATION
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

## Implemented files

The first frontend i18n layer is implemented through:

- `public/assets/boostr-mother/i18n.js`
- `public/assets/boostr-mother/i18n/en.json`
- `public/assets/boostr-mother/i18n/es.json`
- `public/assets/boostr-mother/console.js` auto-loads `i18n.js` on BOOSTR OS pages that already use the shared console layer
- `public/audit/index.html` loads `i18n.js` directly because Audit has its own standalone shell

## EN / ES toggle

Every page loading `i18n.js` receives a compact `EN / ES` toggle.

Behavior:

- `EN` switches UI copy to English
- `ES` switches UI copy to Spanish
- selection is saved in `localStorage` under `boostr_lang`
- unsupported languages fall back to English
- missing translation files use an embedded fallback dictionary
- missing translation keys leave the current visible text instead of showing raw keys

## How implementation works

Current implementation uses a lightweight phrase replacement layer.

It translates:

- exact text nodes
- placeholders
- title attributes
- aria-label attributes

It protects fixed BOOSTR system names and does not translate user-generated content.

Future deeper implementation can move pages to explicit `data-i18n` keys, but the current layer gives immediate EN/ES behavior without a full frontend rewrite.

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

- BOOSTR Labs
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

## How to add a translation phrase

1. Open `public/assets/boostr-mother/i18n/en.json` and `public/assets/boostr-mother/i18n/es.json`.
2. Add the exact visible phrase under `phrases`.
3. Add placeholder copy under `placeholders` if the text is inside an input or textarea placeholder.
4. Keep BOOSTR system names fixed.
5. Test both languages.

Example:

```json
{
  "phrases": {
    "Open": "Abrir"
  }
}
```

## How to test EN/ES manually

1. Open `/home`.
2. Confirm the `EN / ES` toggle appears.
3. Click `ES`.
4. Refresh the page.
5. Confirm Spanish persists.
6. Click `EN`.
7. Confirm English persists.
8. Repeat on:
   - `/login`
   - `/manager`
   - `/manager/leads`
   - `/app`
   - `/partner-dashboard`
   - `/admin`
   - `/modules`
   - `/audit`

## Pass/fail language rule

A screen passes language QA only if:

- it is fully English or fully Spanish
- system names stay fixed
- no internal build language appears
- no spanglish appears in core UI
- buttons and states are short
- text does not fight the visual system
- the EN/ES toggle is visible and works
- selected language persists after refresh
