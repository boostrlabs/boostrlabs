# BOOSTR Labs Front-End Contract for Codex Backend

## Purpose

The front-end is now a navigable BOOSTR Mother UI. Complex functions are intentionally not implemented yet. Codex should connect backend logic without changing the visual direction unless required.

## Role model

| Role | Route | Access level | Future backend behavior |
|---|---|---|---|
| Guest | /audit, /portfolio, /82store, /82ngel, /jankodiorr, /omgbeauty | Public | Can browse, submit audit/lead forms, view public pages. |
| Client | /app | Account required | View projects, files, invoices, modules, stores, dashboards. |
| Artist / Creator | /app/82ngel, /app/gemese | Account required | View artist dashboards, smart link stats, store signals, fan actions. |
| Partner | /partner-dashboard | Account required | View referral leads, partner pages, commission status, client introductions. |
| Manager | /manager | Internal account required | Manage leads, audits, builds, clients, partners, modules. |
| Admin | /admin | Admin account required | Manage auth, roles, integrations, environment, database and system settings. |

## Account rules

- Guest checkout/actions are acceptable only for simple browsing and low-risk lead capture.
- Account required for dashboards, private files, recurring access, rewards, licenses, partner payouts, client portals, order history, private content and high-trust actions.
- BOOSTR Labs should remain the central identity/auth system.
- Partner custom domains/front-doors can exist, but auth should originate from or federate into BOOSTR Labs.

## Core routes

| Route | Type | Backend target |
|---|---|---|
| /home | Mother UI | public landing + module status |
| /login | Mother UI | auth provider, role routing, sessions |
| /manager | Mother UI | leads, audits, clients, projects, partner records |
| /admin | Mother UI | users, roles, integrations, database, logs |
| /app | Mother UI | client workspaces, files, invoices, messages |
| /partner-dashboard | Mother UI | referrals, partner links, payout status |
| /ecosystem | Mother UI | network map and module registry |
| /modules | Mother UI | QA index and route registry |
| /audit | Custom/static | lead capture, score, report generation |
| /82store | Custom/static | products, cart, checkout intent, orders |
| /82ngel | Custom/static | smart link, fan capture, music/social actions |
| /jankodiorr | Custom/static | smart link, music/booking actions |
| /app/82ngel | Custom/static | artist dashboard data |
| /app/gemese | Custom/static | partner/artist dashboard data |
| /omgbeauty | Custom/static | portfolio/client proof route |

## Backend modules to implement later

1. Authentication and role-based routing.
2. Lead intake API for /audit and partner pages.
3. Manager OS database schema: leads, clients, modules, projects, partners.
4. Client OS records: project status, files, invoices, messages.
5. Partner OS records: referral code, source tracking, payout readiness.
6. Store engine: products, inventory, cart, checkout, orders.
7. Notifications: email and WhatsApp.
8. Admin logs and settings.

## Design rule

BOOSTR Mother UI applies to system-level pages. Custom UI applies to client/artist/store/portfolio pages when brand identity requires it.
