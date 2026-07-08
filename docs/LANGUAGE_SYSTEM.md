# BOOSTR Labs Language System

Status: ACTIVE PRODUCT STANDARD
Last updated: 2026-07-08

## Core rule

No spanglish in product UI.

BOOSTR can be English or Spanish, but a visible screen should not mix both unless the element is a proper noun, brand name, route name, product name or user-generated content.

## Default language behavior

1. Detect browser/system language.
2. If language starts with `es`, show Spanish.
3. If language starts with `en`, show English.
4. Unsupported languages fall back to English.
5. Store selection in `localStorage` as `boostr_lang`.
6. Stored preference overrides browser detection.

## Supported languages

- English: `en`
- Spanish: `es`

## Implemented files

- `public/assets/boostr-mother/i18n.js`
- `public/assets/boostr-mother/i18n/en.json`
- `public/assets/boostr-mother/i18n/es.json`
- `public/assets/boostr-mother/console.js`

## EN / ES toggle

Pages loading `i18n.js` or `console.js` should show a compact `EN / ES` toggle.

Behavior:

- `EN` switches UI copy to English
- `ES` switches UI copy to Spanish
- selection persists after refresh
- missing keys should not show raw keys

## Current naming standard

Use names people understand.

| Route | English visible name | Spanish visible name |
|---|---|---|
| `/home` | BOOSTR CORE | BOOSTR CORE |
| `/login` | Login | Login |
| `/manager` | Manager | Manager |
| `/manager/leads` | Leads | Leads |
| `/modules` | Module Deck | Module Deck |
| `/app` | Dashboard | Dashboard |
| `/partner-dashboard` | Partners | Partners |
| `/admin` | BOOSTR CORE / Admin | BOOSTR CORE / Admin |
| `/audit` | BOOSTR Audit | BOOSTR Audit |
| `/portfolio` | Proof | Proof |
| `/jankodiorr` | JANKO / WESTDETRO Link OS | JANKO / WESTDETRO Link OS |
| `/82ngel` | 82NGEL OS | 82NGEL OS |
| `/smart-payment-link` | Smart Payment Link | Smart Payment Link |

## Deprecated names

Do not use these in visible UI:

| Deprecated | Replace with |
|---|---|
| Mother OS | BOOSTR CORE |
| Signal Inbox | Leads |
| Workspace Core | Dashboard |
| Partner Grid | Partners |
| System Core | BOOSTR CORE / Admin |
| BOOSTR Intake | BOOSTR Audit |
| Proof Vault | Proof |

## What gets translated

Translate:

- navigation labels
- button labels
- helper text
- form labels
- placeholders
- errors
- success states
- status labels
- table headers
- onboarding copy
- CTA text

## What does not get translated

Do not translate:

- BOOSTR Labs
- BOOSTR CORE
- Module Deck
- BOOSTR Audit
- Smart Payment Link
- Smart Link OS
- JANKO / WESTDETRO Link OS
- 82NGEL OS
- client/artist names
- partner names
- route slugs
- email addresses
- user-generated content

## UI tone

### English

Use:

- short labels
- premium product language
- direct verbs
- minimal explanation

Avoid:

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
| Lead | Lead | Lead |
| Audit | Audit | Audit |
| Dashboard | Dashboard | Dashboard |
| Module | Module | Módulo |
| Route | Route | Ruta |
| Owner | Owner | Responsable |
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
- temporary access token, except inside internal testing surfaces
- auth next
- shell, except in docs/internal admin language
- placeholder
- TODO
- lorem ipsum

## How to test EN/ES manually

1. Open `/home`.
2. Confirm `EN / ES` appears.
3. Click `ES`.
4. Refresh.
5. Confirm Spanish persists.
6. Click `EN`.
7. Confirm English persists.
8. Repeat page-by-page.

## Pass/fail language rule

A screen passes only if:

- it is fully English or fully Spanish
- product names stay fixed
- no internal build language appears
- no spanglish appears in core UI
- buttons and states are short
- selected language persists after refresh
