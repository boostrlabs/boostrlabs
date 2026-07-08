# BOOSTR Labs Naming Bible

Status: ACTIVE PRODUCT LANGUAGE
Last updated: 2026-07-08

## Core rule

BOOSTR names should make the product feel proprietary.

Do not name modules like generic SaaS pages unless the label is purely functional and temporary.

## Naming hierarchy

### Company

- BOOSTR Labs

### Product category

- Custom Operating Systems
- Business Operating Systems
- Artist Operating Systems
- Partner Operating Systems

### Ecosystem language

- OS
- Core
- Deck
- Grid
- Inbox
- Intake
- Pulse
- Radar
- Engine
- Map
- Vault
- Queue

## Fixed BOOSTR system names

These names stay fixed across English and Spanish.

| Official name | Purpose | Route |
|---|---|---|
| Mother OS | Main BOOSTR system entry | `/home` |
| Identity OS | Login and account entry | `/login` |
| Manager OS | Internal operating layer | `/manager` |
| Signal Inbox | Lead/audit review | `/manager/leads` |
| Module Deck | Official module map | `/modules` |
| Workspace Core | Client workspace hub | `/app` |
| Partner Grid | Partner workspace hub | `/partner-dashboard` |
| System Core | Admin/system console | `/admin` |
| BOOSTR Intake | Public audit/lead entry | `/audit` |
| Proof Vault | Portfolio/proof library | `/portfolio` |
| 82NGEL OS | 82NGEL public system | `/82ngel` |
| 82 Command | 82NGEL artist dashboard | `/app/82ngel` |
| WESTDETRO OS | Janko Diorr route | `/jankodiorr` |

## Approved future names

Use these when adding cards, modules or dashboard surfaces.

### Data / analytics

- Signal Engine
- Signal Score
- Revenue Pulse
- Conversion Pulse
- Fan Radar
- Lead Radar
- Demand Radar
- Growth Radar
- Route Map
- Source Map
- Signal Map

### Action / operations

- Action Queue
- Review Queue
- Follow-Up Queue
- Convert Queue
- Assignment Deck
- Priority Deck
- Route Builder
- Workspace Builder
- Module Switchboard

### Client/workspace

- Workspace Core
- Client Core
- Project Core
- File Vault
- Invoice Vault
- Order Vault
- Asset Vault
- History Vault

### Partner/network

- Partner Grid
- Referral Grid
- Route Grid
- Partner Pulse
- Network Map
- Relationship Map

### Artist/creator

- Artist OS
- Fan Radar
- Drop Pulse
- Release Pulse
- Audience Map
- Fan Vault
- VIP Queue
- Content Signal

## Forbidden generic names

Avoid these in visible UI when a BOOSTR name exists:

- Dashboard
- Portal
- CRM
- Admin Panel
- Backend
- Frontend
- User Area
- Client Portal
- Lead Manager
- Partner Dashboard
- Analytics Dashboard
- Settings Page
- Demo Page
- Preview Page
- Module Registry
- Portfolio, except when describing public proof externally

## Acceptable functional labels

These can be used when clarity is more important than product flavor:

- Open
- Access
- Review
- Search
- Save
- Send
- Filter
- Status
- Files
- Orders
- Invoices
- Settings
- Help
- Logout

## Naming by route

| Route | Use this name | Do not use |
|---|---|---|
| `/home` | Mother OS | Home dashboard, landing dashboard |
| `/login` | Identity OS | Login shell, auth preview |
| `/manager` | Manager OS | Backend dashboard, admin dashboard |
| `/manager/leads` | Signal Inbox | Lead Inbox, D1 route, temporary bridge |
| `/app` | Workspace Core | Client portal, app shell |
| `/partner-dashboard` | Partner Grid | Partner dashboard, referral dashboard |
| `/admin` | System Core | Admin panel, backend contract |
| `/modules` | Module Deck | Module registry, QA index |
| `/audit` | BOOSTR Intake | Contact form, audit form only |
| `/portfolio` | Proof Vault | Dashboard proof, portfolio module |
| `/82ngel` | 82NGEL OS | Smart link clone |
| `/app/82ngel` | 82 Command | 82 dashboard mockup |
| `/jankodiorr` | WESTDETRO OS | Linktree, smart link clone |

## Copy pattern

Preferred card structure:

```text
BOOSTR OS
Signal Inbox
24
Review
```

or:

```text
Revenue Pulse
$2.7K
Live
```

Avoid:

```text
This card shows the current backend status of the lead management workflow and will eventually connect to workspace scoped data after Codex implements the authentication layer.
```

## EN/ES rule

System names stay fixed.

Translate only the surrounding UI:

- buttons
- helper labels
- validation
- status
- form fields
- table headers

Example:

English:

- Open Signal Inbox

Spanish:

- Abrir Signal Inbox

Do not translate Signal Inbox as Bandeja de Señales in product UI.

## Final naming test

A name passes if it sounds like:

- proprietary BOOSTR product language
- short
- premium
- modular
- app-native
- not generic SaaS

A name fails if it sounds like:

- agency service menu
- template dashboard
- internal development note
- backend task
- random startup jargon
