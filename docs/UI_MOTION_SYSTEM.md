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

## Implemented files

- `public/assets/boostr-mother/night-shift.css`
- `public/assets/boostr-mother/console.js`

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

## Command dock

Visible on core BOOSTR routes:

- BOOSTR CORE
- Audit
- Leads
- Smart Payment Link
- Command

## Command palette

Shortcut:

- `CMD + K`
- `CTRL + K`

Routes included:

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
- cards stacked vertically
- hero visual above or near first fold
- no horizontal overflow

## Animation rules

Use strong visible motion, but keep it premium:

- card pop on load
- floating hero cards
- glow sweep on surfaces
- bars growing on charts
- dock pulse
- phone float
- tilt only on pointer-fine devices

Respect `prefers-reduced-motion`.

## What to improve next

1. Add route transition animation.
2. Add skeleton loaders for API surfaces.
3. Add real state chips from backend.
4. Add visual QA screenshots.
5. Tune mobile after live phone review.
