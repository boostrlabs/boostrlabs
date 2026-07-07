# 20 — Partner Config Guide

## Purpose

Partner configs let BOOSTR feel custom without manually rebuilding the entire app per partner.

## Suggested config fields

```json
{
  "partner_id": "82ngel",
  "display_name": "82NGEL",
  "workspace_type": "artist",
  "theme": "red-black-y2k",
  "tone": "friendly, visual, low-text, non-corporate",
  "modules": ["artist", "apparel", "drops", "fans", "bnpl", "demand_radar"],
  "dashboard_cards": ["hero", "revenue", "what_next", "fan_heat", "drop", "follow_up"],
  "avoid": ["pink-heavy", "too much text", "corporate copy", "technical data overload"],
  "assets_rules": "use only 82NGEL approved assets"
}
```

## Partner-specific examples

### 82NGEL

Modules:

- Artist;
- Apparel;
- Fans;
- Drops;
- BNPL;
- VIP Unlock;
- Demand Radar;
- Fan Passport;
- Follow-Up.

### GEMESE

Modules:

- Artist;
- Apparel;
- NNE;
- Collabs;
- Fans;
- Merch revenue;
- What’s Next;
- BOOSTR Network.

Asset rule:

Janko/WESTDETRO asset appears only for NONONO/WESTDETRO/collab-related card, not main hero.

### Janko/WESTDETRO

Modules:

- Artist;
- Producer;
- Beat Store;
- Licenses;
- Services;
- Collabs;
- Smart Links;
- Orders.

### Frank Barber

Modules:

- Visual service selector;
- Booking;
- Deposits;
- Service packs;
- Before/After;
- Client Memory;
- Reminders.
