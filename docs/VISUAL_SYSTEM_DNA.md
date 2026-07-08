# BOOSTR Labs Visual System DNA

Status: ACTIVE FRONTEND DIRECTION
Last updated: 2026-07-08

## Core rule

Less text. More signal.

Prefer a short label, a number, a chart, a state, and one action over explanatory paragraphs.

## Visual direction

BOOSTR UI should feel like:

- dark analytics grid
- futuristic glass OS
- mobile fintech premium
- creator/social insights dashboard
- modular command deck

## Extracted visual skills

1. Floating glass cards
2. Drag-and-drop module cards
3. Live search/filter cards
4. Neon only as accent
5. Mini charts on cards
6. Rings, bars, waves and signal visuals
7. Large numbers
8. Short system names
9. Bottom floating navigation
10. Mobile-first dashboards

## Naming system

Use BOOSTR-specific system names instead of generic dashboard labels.

Preferred names:

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

## Copy rule

Avoid internal build language on public/product UI.

Do not show:

- ready for leads
- backend pending
- Codex will connect
- mockup
- invented demo data
- implementation contract, except inside Admin OS

Prefer:

- Open
- Live
- Access
- Intake
- Review
- Active
- Signal
- Queue
- Core
- Map

## UI rule

If something needs explanation, use a tooltip or Admin note later. Do not overload the visible UI.

## Applied frontend pass

Implemented through:

- `public/assets/boostr-mother/console.js`
- updated `public/modules/index.html`
- existing OS pages using the shared console script

The shared console script adds:

- floating card motion
- draggable/reorderable cards
- live search filtering
- mini visual chart elements
- shortened text behavior
- footer normalization
- Audit links opening in new tabs
