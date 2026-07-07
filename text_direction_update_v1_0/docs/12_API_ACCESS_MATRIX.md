# 12 — API and Data Access Matrix

## Rule

API when available. Authorized access/export/manual evidence when not.

## Prioritize

### Payments / commerce

- Stripe Checkout;
- Stripe BNPL methods if available;
- Shopify API;
- Square API;
- direct payment logging for Zelle/CashApp/etc.

### Messaging / voice

- Twilio WhatsApp/SMS/Voice;
- Meta WhatsApp Cloud API.

### Analytics / ads

- GA4 Data API;
- Meta Pixel / Conversions API;
- YouTube Analytics API;
- YouTube Data API;
- Instagram Graph API;
- Google Business Profile Performance API.

### Music

- Spotify Web API for metadata only;
- Apple Music / Apple Music Analytics if available/applicable;
- YouTube Analytics for videos/channel;
- distributor exports/manual reports.

### Auto

- NHTSA VIN decoder;
- MarketCheck if budget allows;
- Google Business Profile.

### Scheduling / local services

- Square Bookings;
- Calendly;
- Google Calendar.

### Legal/docs

- Dropbox Sign / DocuSign;
- PDF generator.

### Wallet

- Apple Wallet PassKit;
- Google Wallet API.

## Do not assume for v1

- Spotify for Artists analytics API;
- direct Zelle API;
- Booksy/Fresha/GlossGenius APIs;
- dealer CRM/DMS APIs;
- credit/prequal APIs;
- full TikTok organic analytics;
- direct distributor APIs.

## Manual workflow required

For platforms without usable APIs:

- ask partner for authorized manager/moderator access when possible;
- use CSV export;
- screenshot/evidence upload;
- monthly report upload;
- advisor-entered verified data.
