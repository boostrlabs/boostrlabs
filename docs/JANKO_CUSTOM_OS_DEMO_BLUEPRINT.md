# JANKO Custom OS Demo Blueprint

Status: ACTIVE DEMO BLUEPRINT
Last updated: 2026-07-08

## Purpose

This demo proves the Custom OS concept through one real-feeling pilot: JANKO.

The goal is not to build a generic dashboard. The goal is to show how BOOSTR adapts to one human user with multiple roles, needs, products, services, emotions and business priorities.

## Route

Static demo route:

- `/demo/janko-os`
- `/janko-os-demo`
- `/demo/janko`

File:

- `public/demo/janko-os/index.html`

## User story

Janko can enter BOOSTR Labs with different needs depending on the day.

He may be:

- at Starbucks with laptop trying to close BOOSTR partners
- on phone checking leads quickly
- stressed and needing cash
- switching from manager mode to artist mode
- trying to sell beats or products
- checking platform health as founder/developer
- trying to make music because he needs to clear his head

BOOSTR should not show him the same generic dashboard every time.

BOOSTR should ask:

```text
What does Janko need today?
```

Then reorganize cards around the human need.

## Roles

Janko can be:

- BOOSTR Founder
- BOOSTR Manager
- partner closer
- artist
- producer
- beatmaker
- songwriter
- creative director
- seller of digital products
- seller of physical products
- human needing cash, creativity, structure or peace

## Needs

Initial demo needs:

- Cash
- Manager Mode
- Make Music
- Boost Product
- Boost Partners
- Review System

Human prompt needs:

- Cash
- Feel like an artist
- Feel like a business
- Clear my head
- Finish something
- Start something new

## Modules in the demo

### BOOSTR Leads for Partners

Purpose:

Janko needs money and wants to close new BOOSTR partners.

Cards use email-like states:

- unread
- read
- high potential
- normal
- spam
- special case
- follow-up
- approved
- rejected
- later

Expanded card shows:

- applicant name
- business type
- audit summary
- why they may need BOOSTR
- potential value
- recommended action
- action buttons

### Next to BOOST — Manager

Purpose:

These are not leads. These are intelligent next actions for current partners or active surfaces.

Example cards:

- OMG Beauty needs stronger booking CTA
- 82NGEL storefront needs new product push
- JANKO Link OS needs exact music CTAs
- Gemese dashboard needs partner status update

### BOOSTR Ecosystem Health

Purpose:

Janko as founder/developer can quickly review the platform.

Cards:

- Frontend health
- Backend health
- i18n health
- Smart Payment Link readiness
- Branded worlds protection
- Mobile QA

All values are demo values.

### Artist OS

Purpose:

Janko switches from manager to artist.

Cards:

- music projects
- beats to sell
- products/services
- insights
- creative next actions

### BOOST Money

Purpose:

Janko needs cash.

Cards:

- Baby Mama Type Beat WESTDETRO
- Tech House Beat de esta mañana
- Nike/Jordan custom side bag 1 of 1
- Mix & Master service
- Production slot
- WESTDETRO beat pack

Each item shows:

- product type
- best selling route
- suggested Smart Payment Link type
- estimated quick action
- asset missing
- CTA

### BOOST My Music / Product

Purpose:

Janko wants to create or finish music.

Cards:

- make beat for quick cash
- finish demo
- release visualizer
- organize beat catalog

## Product differences

A beat is not the same as a bag.

A service is not the same as a song.

Rules:

- Beat = digital/license-based product, needs preview and disclosure.
- Physical bag = physical product, can use Buy Now now and auction later.
- Service = deposit/booking and scope confirmation.
- Song/project = rollout and promotion, not checkout first.

## Demo data rules

Use demo data only.

Do not claim:

- real sales
- real conversion
- real revenue
- real traffic
- real platform data
- real paid orders

Do not invent:

- private links
- exact streams
- exact income
- exact client commitments
- exact legal terms

## What is scalable

Scalable concepts:

- user has multiple personas
- user selects human need
- cards reorganize by context
- cards expand in place
- cards have status, priority, owner and action
- products have type-specific selling routes
- Audit answers become cards
- Next to BOOST can power workflows

## What is hardcoded only for demo

Hardcoded for now:

- Janko demo cards
- health scores
- partner applications
- product suggestions
- Smart Payment Link recommendations
- human need responses

These should later move to backend.

## What should move to backend later

- user personas
- cards
- card status
- card owner
- card actions
- human need logs
- product/service catalog
- Smart Payment Links
- order records
- audit-to-card generation
- permission visibility

## How this adapts to 82NGEL

82NGEL demo should emphasize:

- artist identity
- visuals
- music/content
- storefront
- product drops
- fan engagement
- Smart Link OS
- brand world protection

## How this adapts to ATL Sayago

ATL Sayago demo should emphasize:

- professional service positioning
- architecture/design credibility
- high-value lead capture
- project inquiry flow
- portfolio/proof
- quote/request system
- consultation deposit

## How this adapts to Gemese

Gemese demo should emphasize:

- partner status
- artist/client management
- rollout tasks
- services/products
- partner actions
- dashboard clarity

## Final principle

BOOSTR turns a person's real business life into an operating system.

Not everyone gets the same dashboard.
