# JANKO Custom OS Demo V3 QA

Status: ACTIVE QA NOTE
Last updated: 2026-07-08

## Route

- `/demo/janko-os`
- `/janko-os-demo`
- `/demo/janko`

## Goal of V3

V3 moves the JANKO pilot from a strong desktop demo into a more complete mobile-first app experience.

The route should feel less like a static dashboard and more like a logged-in product with the normal surfaces users expect from a premium app.

## Mobile improvements

Implemented:

- compact fixed mobile top bar
- JANKO OS identity in mobile header
- active mode label in mobile header
- profile/avatar button in mobile header
- horizontal mode selector on mobile
- horizontal Today Stack on mobile
- compact 2-column card grid on small screens when possible
- bottom dock remains thumb-friendly
- detail inspector becomes a bottom sheet on mobile
- profile drawer becomes a mobile bottom sheet
- safe-area padding for iPhone-style devices
- no desktop-sticky inspector on mobile
- no giant hidden left rail required for mobile use

## App-normal functions added

The demo now includes the expected small product surfaces that professional logged-in apps usually have:

- My Profile drawer
- contact methods
- account settings
- security section
- notifications section
- local activity log
- help/support area
- persona/role badges
- workspace placeholder
- language toggle
- card density/preference concepts
- API token future section
- data status chip
- loading/API fallback state
- local action history
- read/unread card state
- pin/favorite action
- archive/later action
- toast feedback
- keyboard command palette

## Profile / settings map

### Identity

Shows:

- display name: JANKO
- profile/legal placeholder
- handle placeholder
- active workspace: JANKO / WESTDETRO
- active persona/role
- role badges: Founder, Manager, Artist, Producer, Seller

### Contact

Uses safe placeholders only:

- artist email: `artist@email.demo`
- business email: `business@email.demo`
- personal phone: `+1 demo number`
- business phone: `+1 business demo`
- WhatsApp placeholder
- Instagram placeholder
- smart link route

No private real contact values are exposed.

### Account

Shows:

- language
- theme: Platinum Dark
- default mode
- timezone
- EN / ES toggle

### Security

Shows placeholders for:

- change password
- two-factor authentication
- active sessions/devices
- recovery email
- logout all devices

No real security endpoint is called from this frontend pass.

### BOOSTR API

Shows future API concept:

- masked token: `bst_demo_••••••••••••`
- status: future / not active
- copy demo token action
- generate later action

No real token is generated.
No secret is exposed.

### Activity

Activity records locally:

- app opened
- mode switched
- module opened
- card opened
- action clicked
- human need changed
- profile opened
- Smart Payment Link opened

## Language support

V3 adds route-local EN/ES support.

Behavior:

- visible language toggle in hero/profile
- persisted in `localStorage` as `boostr_janko_lang`
- product names remain fixed
- UI labels translate between English and Spanish
- no raw translation keys

Fixed names not overtranslated:

- JANKO OS
- BOOSTR
- Custom OS
- Smart Payment Link
- Next to BOOST

## API integration / fallback behavior

The route now attempts:

```http
GET /api/demo/janko-os
```

If successful:

- data status shows `Live demo API`
- safe profile values may hydrate from the payload
- demo notifications/activity can hydrate if present

If it fails:

- UI continues with inline fallback data
- data status shows `Local fallback`
- no blocking loading screen

The route never claims real sales, real paid orders or live Stripe.

## Card behavior

Closed cards remain compact:

- dot
- metric
- title
- short label
- status
- priority

Expanded card/bottom sheet shows:

- status
- priority
- owner
- recommended action
- product type if relevant
- selling route if relevant
- why BOOSTR shows the card
- missing asset if relevant
- action buttons

Supported local actions:

- Done
- Approve
- Follow up
- Later
- Reject
- Pin
- Archive
- Smart Payment Link

Actions update local status, add activity and show toast feedback.

## Human need behavior

Human prompt options:

- Cash
- Feel artist
- Feel business
- Clear head
- Finish
- Start new

Behavior:

- Cash routes to Cash mode
- Feel artist, Clear head, Finish and Start new route to Artist mode
- Feel business routes to Product mode
- each selection logs activity
- route attempts to POST `/api/human-needs`
- failure falls back locally without breaking UI

## What remains backend-connected later

Still future or backend-dependent:

- persistent profile editing
- real contact method CRUD
- real security settings
- real sessions/devices
- real API token generation
- real notification records
- persistent activity records
- authenticated card action sync
- workspace/persona permission filtering
- real Smart Payment Link creation
- real product catalog
- real payments after LLC/Stripe

## Phone QA checklist

Open `/demo/janko-os` on phone and verify:

- first screen feels like a native app
- top bar is compact and useful
- no horizontal overflow
- Today Stack scrolls horizontally
- mode selector is thumb-friendly
- cards are compact
- card click opens bottom sheet
- bottom sheet is readable
- bottom dock does not cover key buttons
- profile drawer opens cleanly
- EN/ES toggle works and persists
- Artist dock button still works
- action buttons show toast
- activity log updates

## Desktop QA checklist

Open `/demo/janko-os` on desktop and verify:

- left rail / center stage / inspector still feel curated
- profile drawer opens
- command palette opens with CMD/CTRL + K
- data chip shows API or fallback state
- cards remain minimal until selected
- inspector is not empty-looking
- profile sections feel like a real app
- no fake sales/payment language appears

## Definition of success

V3 should feel like the first believable app shell for Custom OS:

- one user
- many personas
- different needs
- cards reorganized by context
- profile/settings/security/activity surfaces
- mobile-first interaction
- safe demo API fallback
- no fake production claims
