# Route Cleanup Log

Date: 2026-07-08

## Deleted Files

- `public/client/index.html`
  - Reason: superseded by redirect; `/client` serves `/app/index.html`.
  - Redirect: `/client        /app/index.html              200`

- `public/client-os/index.html`
  - Reason: superseded by redirect; `/client-os` serves `/app/index.html`.
  - Redirect: `/client-os     /app/index.html              200`

- `public/manager-os/index.html`
  - Reason: superseded by redirect; `/manager-os` serves `/manager/index.html`.
  - Redirect: `/manager-os    /manager/index.html          200`

- `public/partner-os/index.html`
  - Reason: superseded by redirect; `/partner-os` serves `/partner-dashboard/index.html`.
  - Redirect: `/partner-os          /partner-dashboard/index.html 200`

- `public/82-store/index.html`
  - Reason: superseded by redirect; `/82-store` serves `/82store/index.html`.
  - Redirect: `/82-store     /82store/index.html     200`

## Left Alone

- `public/app/index.html`
  - Reason: canonical target for `/app`, `/client`, and `/client-os`.

- `public/manager/index.html`
  - Reason: canonical target for `/manager` and `/manager-os`.

- `public/partner-dashboard/index.html`
  - Reason: canonical target for `/partner-dashboard` and `/partner-os`.

- `public/82store/index.html`
  - Reason: canonical target for `/82store` and `/82-store`.

- `public/portfolio/omgbeauty/index.html`
  - Reason: canonical target for `/portfolio/omgbeauty` and `/omgbeauty`.

## UNCLEAR

- None.

## Redirect Integrity

- No broken redirect target found among the reviewed duplicate/near-duplicate routes.
