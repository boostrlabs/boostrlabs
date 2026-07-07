# BOOSTR Labs Deployment Guide

This project is ready for Cloudflare Pages once the final domain and services are available.

## Pre-Deploy Checklist

- Confirm final domain.
- Confirm final contact email.
- Choose form backend: Cloudflare Worker, Formspree, Resend, EmailJS or another endpoint.
- Add production environment variables in Cloudflare Pages.
- Run `pnpm build` locally.
- Verify `dist/` output.
- Test forms with a referral URL.
- Test `BOOSTR Scan`, `BOOSTR Match` and partner routes.
- Test BOOSTR Link routes and client preview routes.
- Confirm Open Graph image and favicon.

## Cloudflare Pages Settings

- Framework preset: `Vite`
- Build command: `pnpm build`
- Build output directory: `dist`
- Root directory: `/`
- Node version: Cloudflare default is fine for this static build.

## Domain Architecture

Primary parent site:

```text
boostrlabs.com
```

Flagship BOOSTR Link / artist proof-of-concept:

```text
janko.boostrlabs.com
jankodiorr.boostrlabs.com
```

Client personalized previews:

```text
preview.boostrlabs.com/[client-slug]
```

Local equivalents:

```text
/janko
/preview/[client-slug]
```

The app detects these hostnames/routes in the frontend and renders the right experience. Cloudflare Pages should keep the SPA fallback in `public/_redirects`.

## Environment Variables

Use these in Cloudflare Pages:

```text
VITE_SITE_URL=
VITE_CONTACT_EMAIL=
VITE_FORM_ENDPOINT=
VITE_ANALYTICS_ID=
VITE_REFERRAL_COOKIE_DAYS=30
```

Do not hardcode the final domain in the app. Use `VITE_SITE_URL` after the domain is active.

## Forms

All forms currently submit through `VITE_FORM_ENDPOINT` when it exists.

Expected payload format:

```json
{
  "name": "Client Name",
  "email": "client@email.com",
  "phone": "5555555555",
  "businessProject": "Business Name",
  "link": "https://instagram.com/example",
  "serviceInterested": "Start BOOSTR Build",
  "budgetRange": "$500 - $1,000",
  "message": "Project details",
  "referralCode": "GEMESE",
  "formKind": "lead",
  "language": "en",
  "siteUrl": "",
  "pageUrl": "http://127.0.0.1:5173/?ref=GEMESE",
  "submittedAt": "2026-07-05T00:00:00.000Z"
}
```

## Backend Options

### Cloudflare Worker

Recommended for the final BOOSTR setup. Create a Worker endpoint that accepts JSON, validates fields, sends an email through Resend or Cloudflare Email Service, and stores the payload in D1/KV/R2 if needed.

### Formspree

Set `VITE_FORM_ENDPOINT` to the Formspree endpoint URL. Confirm that JSON POST submissions are enabled for the form.

### Resend

Use a small API route or Cloudflare Worker. Do not expose a Resend API key in Vite frontend env vars.

### EmailJS

Can work for a quick MVP, but the cleaner long-term route is a Worker endpoint.

## Referral MVP

The site checks for:

```text
?ref=CODE
```

It stores `CODE` in:

- `localStorage`: `boostr-referral-code`
- Cookie: `boostr_ref`

Each form includes the code as hidden `referralCode`.

## Partner Pages

Prepared collaboration routes:

```text
/partner/gemese
/partner/janko
/partner/omgbeauty
```

Each page sets its own referral code, shows recommended Builds and includes a partner request form. Keep `public/_redirects` in place for Cloudflare Pages SPA fallback.

## BOOSTR Link / Preview Pages

Prepared routes:

```text
/janko
/jankodiorr
/westdetro
/preview/artist-demo
/preview/beauty-demo
/preview/car-business-demo
/preview/[client-slug]
```

JANKO is a standalone premium artist smart link with subtle `Powered by BOOSTR Labs` branding. Preview pages are reusable demos for outreach and can later be powered by a database or CMS.

## Local Test Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## What Remains After Domain Purchase

- Point domain to Cloudflare Pages.
- Add production env vars.
- Connect the final form endpoint.
- Add analytics if desired.
- Replace placeholder WhatsApp/contact details.
- Test live referral URLs.
