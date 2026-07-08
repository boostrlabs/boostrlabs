# BOOSTR Labs Product Truth Map

Status: ACTIVE PRODUCT SOURCE OF TRUTH
Last updated: 2026-07-08

## What BOOSTR Labs is

BOOSTR Labs is a technology company building Custom Operating Systems for businesses, artists, partners and brands.

BOOSTR is the system layer around a project.

It can include:

- public front doors
- intake
- lead review
- workspaces
- partner routes
- storefronts
- files
- invoices
- orders
- dashboards
- analytics
- automations
- identity
- module activation

## What BOOSTR Labs is not

BOOSTR is not:

- a web design agency
- a generic AI agency
- a CRM clone
- a Linktree clone
- a Booksy clone
- a portfolio company only
- a marketplace first
- an ambassador network
- a simple landing page builder
- a bundle of disconnected client pages

## Core product sentence

BOOSTR Labs builds the operating system around each business.

## Public-facing promise

Every serious business needs more than a website.

It needs a system.

## Internal product flow

```text
Public route
→ BOOSTR Intake
→ Signal Inbox
→ Manager review
→ Workspace Core
→ Module activation
→ Files / orders / invoices / analytics
```

## User types

### Guest

Can access:

- public pages
- public smart links/routes
- BOOSTR Intake
- storefront browsing where low-risk

Cannot access:

- private workspaces
- history
- files
- invoices
- private dashboards
- account-required purchases or licenses

### Manager

Uses:

- Manager OS
- Signal Inbox
- Module Deck
- System Core when allowed

Sees:

- incoming applications
- leads
- audits
- workspace status
- modules
- operational queues

### Admin

Uses:

- System Core
- Manager OS
- Module Deck

Sees:

- system map
- users
- workspaces
- permissions
- routes
- modules
- backend status

### Partner

Uses:

- Partner Grid
- scoped routes
- assigned workspaces

Sees:

- referred leads
- partner route status
- assigned accounts
- referral activity

### Client

Uses:

- Workspace Core

Sees:

- own workspace
- active modules
- files
- invoices
- orders
- project status
- history

### Artist

Uses:

- Artist OS
- 82 Command or equivalent artist dashboard

Sees:

- fan signals
- store signals
- release signals
- event signals
- audience/follow-up data

## Product surfaces

| Surface | Role | Public/private | Purpose |
|---|---|---|---|
| Mother OS | all | public/internal | system entry |
| BOOSTR Intake | guest/all | public | diagnosis and lead capture |
| Identity OS | all | public entry/private result | account entry |
| Manager OS | manager/admin | private | operational control |
| Signal Inbox | manager/admin | private | review and route applications |
| Workspace Core | client/artist/partner | private | workspace hub |
| Partner Grid | partner/manager | private | partner route management |
| System Core | admin | private | system control |
| Module Deck | manager/admin/all depending context | mixed | module map |
| Proof Vault | public | public | selected proof and examples |
| 82NGEL OS | public/artist | mixed | artist route and ecosystem |
| WESTDETRO OS | public/artist | mixed | artist route and ecosystem |

## Product rules

### Rule 1 — Public route is not the whole product

A public route can look like a landing, store, artist link or brand page.

The real BOOSTR product is what happens behind it:

- intake
- data
- workspace
- modules
- follow-up
- history
- operations

### Rule 2 — Custom front door, shared system core

Client/artist/partner public pages can be fully branded.

Authentication, workspaces, history, records and modules should federate into BOOSTR.

### Rule 3 — Guest when simple, account when valuable

Guest is allowed for simple low-risk actions.

Account is required for:

- workspace access
- private dashboard
- files
- invoices
- orders requiring history
- rewards
- digital licenses
- recurring access
- high-ticket records
- ticket transfers
- private content

### Rule 4 — Portfolio is proof, not dashboard

Proof Vault exists to show selected work.

It should not sit as a core app module in Manager/Client/Partner navigation.

### Rule 5 — Less text, more signal

Visible UI should use:

- short labels
- numbers
- states
- charts
- one action

Docs and Admin OS can hold deeper explanation.

### Rule 6 — No spanglish

A surface should be English or Spanish.

System names stay fixed.

## Health score levers

To raise BOOSTR toward 100, prioritize:

1. auth/workspace foundation
2. EN/ES i18n layer
3. premium interactive BOOSTR Intake
4. real data in dashboards
5. module activation by workspace
6. file/order/invoice records
7. mobile QA polish
8. Stripe/orders only after auth/workspaces are safe

## Team assignment map

### Human director

Owns:

- product taste
- final approval
- business logic
- brand taste
- what feels real vs generic

### ChatGPT Plus

Best for:

- docs
- product maps
- copy systems
- GitHub direct small commits
- frontend polish within existing files
- QA plans
- prompts for other agents

Avoid assigning:

- huge backend rewrites
- complex local build debugging
- Stripe/auth full implementation

### Antigravity

Best for:

- frontend implementation
- refactors
- reusable UI structure
- i18n static implementation
- responsive polish
- CSS/JS systemization

Avoid assigning:

- database/auth authority unless verified
- Stripe
- product naming decisions without source docs

### Codex

Best for:

- backend
- auth
- workspace scope
- D1 migrations
- API protection
- tests
- integration debugging

Avoid assigning:

- visual taste decisions
- brand copy direction
- large UI rewrites while Antigravity is editing frontend

## Current non-crossing workflow

While agents work in parallel:

- ChatGPT creates source-of-truth docs and small isolated docs commits.
- Antigravity works on frontend i18n and shared UI system.
- Codex works on backend auth/workspace verification.
- Human reviews live deployment and screenshots.

## Definition of stronger BOOSTR

BOOSTR is stronger after a task if it improves at least one of these without weakening another:

- futurism
- frontend quality
- backend reality
- language consistency
- product clarity
- module coherence
- route stability
- app-value perception
- real data flow

## Definition of regression

A change is a regression if it:

- adds spanglish
- adds internal build language to UI
- breaks a route
- makes BOOSTR feel like an agency
- turns the Audit into a generic contact form
- promotes Proof Vault as a core dashboard module
- bypasses workspace/account rules
- adds Stripe before identity/workspace safety
- invents modules without updating source-of-truth docs
