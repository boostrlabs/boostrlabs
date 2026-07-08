# BOOSTR UI Motion System

Status: ACTIVE FRONTEND DIRECTION
Last updated: 2026-07-08

## Direction

BOOSTR should feel like a premium mobile finance / Apple-style operating system.

Visual references translated into product rules:

- dark glass surfaces
- floating cards
- strong but controlled animation
- mobile-first command dock
- phone-like visual cards
- visible interaction
- drag and drop where useful
- short labels
- large numbers
- status chips
- bottom navigation that feels native

## Platinum app direction

The JANKO Custom OS V3 pass establishes the more expensive app direction:

- deeper black base
- graphite/gunmetal surfaces
- chrome/platinum gradients
- limited intelligent accent colors
- minimal closed cards
- detail only after user interaction
- less hero text on mobile
- profile/settings surfaces that feel native
- bottom-sheet interaction on mobile

This direction should influence BOOSTR core surfaces when safe:

- `/home`
- `/modules`
- `/smart-payment-link`
- `/manager/payment-links`
- `/manager/orders`
- `/app/orders`
- `/app/files`
- `/app/invoices`

Do not blindly apply it to protected branded routes.

## Implemented files

- `public/assets/boostr-mother/night-shift.css`
- `public/assets/boostr-mother/console.js`
- `public/demo/janko-os/index.html`

## Implemented interaction layer

The console layer now injects:

- night shift visual stylesheet
- visible EN / ES toggle
- command dock
- command palette
- drag and drop on core cards
- hover tilt on desktop
- auto mini charts
- animated phone-style hero block
- stronger floating animation
- search filtering

The JANKO Custom OS route adds route-local:

- mobile compact top bar
- profile drawer
- settings/profile sections
- notifications surface
- activity log
- mobile detail bottom sheet
- route-local EN/ES
- API/fallback status chip
- local action history

## Command dock

Visible on core BOOSTR routes:

- BOOSTR CORE
- Audit
- Leads
- Smart Payment Link
- Command

For Custom OS demos, dock can include mode switching:

- Cash
- Manager
- Artist
- Product
- Partners
- System
- Command

## Command palette

Shortcut:

- `CMD + K`
- `CTRL + K`

Routes included in the global command model:

- BOOSTR CORE
- BOOSTR Audit
- Dashboard
- Leads
- Manager
- Partners
- Module Deck
- Smart Payment Link
- Payment Links
- Orders
- Files
- Invoices
- JANKO / WESTDETRO
- 82NGEL
- Admin

## Profile / settings baseline

Every premium logged-in BOOSTR surface should eventually support:

- profile drawer or profile screen
- contact methods
- active workspace
- active persona
- role badges
- language preference
- theme preference
- notifications
- activity log
- security area
- sessions/devices
- future API/integrations section

These can be frontend-only in demos, but production must connect to backend contracts.

## Mobile bottom sheet rule

On mobile, detail-heavy surfaces should open as a bottom sheet instead of forcing a full page reload or burying context below the fold.

Use bottom sheets for:

- card detail
- profile/settings
- command palette
- action confirmation
- product/payment preview

Mobile bottom sheets must:

- respect safe-area padding
- stay under the bottom dock
- avoid horizontal overflow
- keep buttons at least 44px tall
- include a clear close/escape behavior

## Card density baseline

Closed cards should be minimal:

- status dot or icon
- title
- one short label
- metric or state
- one or two chips max

Expanded cards can contain:

- full context
- why BOOSTR shows this
- recommended action
- owner
- source
- product type
- route
- missing assets
- action buttons

Do not put paragraphs in closed cards.

## App-normal feature baseline

BOOSTR is new, so expected app features must be deliberately added.

Required baseline over time:

- loading state
- empty state
- error state
- offline/API fallback state
- language toggle
- profile
- settings
- security
- notifications
- activity log
- help/support
- copy buttons
- read/unread states
- pin/favorite
- archive/later
- local action feedback
- last updated label
- workspace switcher
- persona switcher

## Protected route rule

The global app layer must not genericize protected branded routes.

Protected:

- `/audit`
- `/jankodiorr`
- `/82ngel`
- `/app/82ngel`
- `/82store`
- `/portfolio`

These routes can have custom motion, but should not receive automatic BOOSTR dashboards or labels.

## Mobile rules

Mobile should prioritize:

- bottom dock
- large tap targets
- sticky topbar
- safe-area spacing
- cards stacked or compact 2-column when useful
- hero visual above or near first fold
- profile/settings as drawer or bottom sheet
- card detail as bottom sheet
- no horizontal overflow

## Animation rules

Use strong visible motion, but keep it premium:

- card pop on load
- floating hero cards
- glow sweep on surfaces
- bars growing on charts
- dock pulse
- phone float
- bottom sheet slide
- profile drawer fade
- tilt only on pointer-fine devices

Respect `prefers-reduced-motion`.

## What to improve next

1. Add route transition animation.
2. Add skeleton loaders for API surfaces.
3. Add real state chips from backend.
4. Add visual QA screenshots.
5. Tune mobile after live phone review.
6. Promote platinum mobile rules into shared core surfaces carefully.
