# JANKO Custom OS Demo V2 QA

Status: ACTIVE QA NOTE
Last updated: 2026-07-08

## Route

- `/demo/janko-os`
- `/janko-os-demo`
- `/demo/janko`

## What changed

The JANKO Custom OS demo was rewritten from a loud proof-of-logic mockup into a more curated platinum/dark app shell.

Main changes:

- reduced visible text on first screen
- reduced giant typography scale
- added darker graphite/gunmetal/chrome palette
- moved identity and modes into a left rail
- made center stage card-first and minimal
- made right inspector handle expanded context
- added Today Stack summary strip
- fixed bottom dock mode switching, including Artist
- kept drag/drop cards
- kept in-place expansion
- added local action state updates with toast feedback
- removed paragraph-heavy closed cards

## Visual direction

Target aesthetic:

- platinum spaceship app
- dark urban opium
- oversized but controlled
- Apple-level polish
- mobile finance clarity
- minimal closed cards
- subtle intelligent color accents

Mode accents:

- Cash: acid green
- Artist: violet/blue
- Manager: platinum/white
- Partners: cyan
- Product: amber
- System: silver

## Interaction map

### Need modes

The user can choose:

- Cash
- Manager
- Artist
- Product
- Partners
- System

When selected:

- active mode changes
- rail role changes
- center title/score changes
- module tabs change
- cards change
- inspector resets
- bottom dock active state changes
- color accent changes

### Bottom dock

Bottom dock supports:

- BOOSTR CORE route
- Cash mode
- Manager mode
- Artist mode
- Product mode
- Partners mode
- System mode

Artist/music button now switches mode correctly.

### Cards

Closed card shows only:

- status dot
- metric
- title
- short label
- status chip
- priority chip

Expanded inspector shows:

- summary
- status
- priority
- owner
- action
- type/route if relevant
- why BOOSTR shows this
- missing asset if relevant
- action buttons
- Smart Payment Link route

### Actions

Action buttons update local demo state:

- Done
- Follow up
- Later
- Reject

No backend is called.

## Remaining limitations

- demo data is inline/static
- no real backend card fetch yet
- no saved persistence after refresh
- no real role permission logic inside frontend
- no real Smart Payment Link creation
- no real sales or payment data
- no Stripe
- no order creation

## What should later connect to backend

- `/api/demo/janko-os` demo payload
- `/api/cards` private workspace cards
- `/api/human-needs`
- `/api/cards/:id/action`
- Audit to cards
- product/service catalog
- Smart Payment Link creation
- role/persona visibility

## Phone review checklist

Open `/demo/janko-os` on phone and verify:

- no horizontal overflow
- left rail stacks correctly
- mode buttons are usable
- Today Stack scrolls horizontally
- cards are readable
- inspector appears below cards
- bottom dock is usable
- Artist button works
- no card is too text-heavy before click
- expanded card contains enough detail

## Desktop review checklist

Open `/demo/janko-os` on desktop and verify:

- layout feels curated, not chaotic
- left rail / center / inspector structure is clear
- typography is smaller than V1
- colors feel darker and more expensive
- closed cards do not show paragraphs
- mode switch changes accent and content
- drag/drop works
- action buttons show toast feedback

## Product rule preserved

JANKO is not one user.

The demo still represents Janko as:

- BOOSTR Founder
- BOOSTR Manager
- partner closer
- artist
- producer
- beatmaker
- songwriter
- creative director
- digital product seller
- physical product seller
- human needing cash, creativity, structure or peace

## Final note

V2 improves curation and reduces noise.

The next jump should connect the frontend to the backend card engine once Codex finishes the API contract.
