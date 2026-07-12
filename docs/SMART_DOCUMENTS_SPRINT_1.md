# BOOSTR Smart Documents — Sprint 1

## Status

IMPLEMENTED on `feature/smart-documents-sprint-1`.

## Product decision

`Payment Links` creates the payment experience. The separate `Smart Payment Link` module is removed from the module deck. The public `/pay/:id` page remains the generated Smart Payment Page.

`BOOSTR Smart Documents` is the shared living-document engine for:

- invoices
- receipts
- tickets
- quotes
- contracts
- licenses
- certificates
- delivery notes
- warranty cards
- custom experiences

## Implemented

### Data layer

- `smart_documents`
- `smart_document_events`
- public slugs and permanent `/d/:slug` URLs
- document/customer/status/relationship indexes
- lazy schema bootstrap plus D1 migration `0015_smart_documents.sql`

### Backend

- `GET/POST /api/documents`
- `GET/PATCH/DELETE /api/documents/:id`
- `GET/POST /api/documents/:id/events`
- `GET /api/public/documents/:slug`
- automatic activity timeline
- automatic public URL generation

### Living document renderer

- BOOSTR-branded responsive experience
- themes and animated effects
- images
- video and YouTube embeds
- audio
- QR blocks
- CTA blocks
- file/download blocks
- live timeline
- status and amount metadata

### Dashboard

- `/app/documents`
- workspace selection
- invoice/receipt/ticket/contract/license/custom creator
- multimedia fields
- theme accent/effect controls
- publish and archive controls
- search and type filters
- copy/open public links

### Payments and invoices

- successful Smart Pay transactions create a live receipt
- refunded transactions update the receipt
- payment verification returns the receipt URL
- Smart Pay confirmation injects an `Abrir comprobante interactivo` action
- manual invoices automatically create a living invoice
- reservation-to-invoice conversion automatically creates a living invoice

### Module architecture

- consolidated `BOOSTR Payments` card
- new `BOOSTR Smart Documents` section
- removed the duplicate standalone Smart Payment Link card from the module deck

## QA checklist

1. Open `/app/documents` while authenticated.
2. Select a workspace.
3. Create an active document with title, video or audio, QR and CTA.
4. Open the returned `/d/:slug` URL.
5. Add a timeline event through `POST /api/documents/:id/events` or change status in the UI.
6. Refresh the public URL and confirm the update appears without changing the link.
7. Complete a Sandbox Smart Pay transaction.
8. Confirm the payment result shows `Abrir comprobante interactivo`.
9. Open the receipt and verify amount, customer email and payment timeline.
10. Create a manual invoice and confirm a related Smart Document exists.

## Deferred

- drag-and-drop block editor
- customer-only tokenized access
- document signatures
- downloadable PDF snapshots
- email/WhatsApp delivery
- document analytics and view events
- reusable workspace templates
