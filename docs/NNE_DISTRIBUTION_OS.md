# NNE Distribution OS

Private pilot for NOSOTROSNOELLOS NNE LLC. The application owns the artist experience, canonical catalog, rights data, audit trail, and delivery state. A delivery partner is an interchangeable rail.

## Pilot catalog

- Janko Diorr — WESTDETRO (16-track album, seeded from the official tracklist)
- Gemese — artist profile ready for a pilot release
- Xiam — artist profile ready for a pilot release

The pilot is invite-only. NNE administrators can access all releases; artists and managers receive a one-use, identity-bound link and only see their assigned artist profile.

## Release path

Artist flow: `draft → in_review`. NNE control: `approved → packaged`. The sandbox uses `delivered_demo → live_demo`; a configured partner uses `delivered → live`.

An administrator may return `in_review` or `approved` releases to `changes_requested`. The `delivered_demo` and `live_demo` states are explicitly sandbox-only and must never be represented as a real DSP delivery.

Submission is blocked until the release has:

1. release date and editorial metadata;
2. original artwork stored privately;
3. at least one track and a lossless master for every track;
4. credits for every track;
5. master splits adding to exactly 100% per track;
6. rights confirmation;
7. a versioned distribution agreement acceptance.

## Storage and boundaries

- D1 stores catalog metadata and state.
- R2 stores artwork, lossless masters, and generated delivery manifests under `nne/distribution/releases/{releaseId}`.
- Masters have no public download endpoint.
- NNE Credits remain in `nne_credit_transactions` and are not money.
- Monetary royalties use statement, line-item and payout tables with integer micros. They remain separate from NNE Credits.

## Easy payouts without bypassing tax controls

The payout experience is intentionally short, but the server will not create a payout request until the artist's payee profile is verified and unexpired. The operational default for a US payer suggests W-9 for US payees, W-8BEN for foreign individuals, and W-8BEN-E for foreign entities. This is a routing aid, not country-specific tax advice; NNE Finance must review the document and obtain professional tax guidance before production payouts.

Signed tax PDFs are private R2 objects with a SHA-256 hash. D1 stores only minimal profile metadata, status, audit history, and a safe payout destination hint. SSNs, EINs, full bank credentials, and passwords must never be written to ordinary D1 fields.

## Split agreements and DocuSign

`POST /api/nne/distribution/split-agreements` with `action=generate` creates an immutable, versioned PDF snapshot of every track's master splits and stores it privately. Every participant needs a valid email and every track must total exactly 100%.

When the DocuSign server credentials are configured, `action=send` authenticates with OAuth JWT grant and creates a v2.1 eSignature envelope for all unique participants. `action=refresh` reads envelope state; on completion it downloads the combined executed PDF back into private R2. Until those secrets exist, the send button remains disabled and the local PDF workflow remains usable.

DocuSign secrets:

- `NNE_DOCUSIGN_ACCOUNT_ID`
- `NNE_DOCUSIGN_INTEGRATION_KEY`
- `NNE_DOCUSIGN_USER_ID`
- `NNE_DOCUSIGN_PRIVATE_KEY` (PKCS#8 PEM)
- `NNE_DOCUSIGN_AUTH_BASE` (`https://account-d.docusign.com` in demo)
- `NNE_DOCUSIGN_BASE_URI` (`https://demo.docusign.net/restapi` in demo)

The integration user must grant impersonation consent before JWT works. Production requires DocuSign go-live approval and a reviewed contract template.

## Commercial models and TikTok clips

- `fee_100`: artist pays the agreed distribution fee and retains 100% of distributable royalties.
- `scholarship_80_20`: NNE funds/waives the distribution fee and the artist receives 80%; NNE receives 20%, subject to the signed agreement.

`TikTok Multi-Clip` is modeled as provider-reviewed clip requests. It must only deliver multiple official segments when the selected provider/DSP explicitly supports or approves them. The system must never manufacture duplicate releases or exploit redistributions to bypass platform limits; that behavior risks the whole NNE catalog.

## Provider adapter contract

`buildDistributionManifest()` produces `nne-distribution-package/1.0`. Every real adapter must:

- accept that canonical package without changing the artist-facing schema;
- use the delivery job `idempotency_key` on every retry;
- persist provider release IDs and raw acknowledgements;
- verify webhook signatures;
- map provider status to NNE status without skipping review;
- never expose provider credentials to the browser;
- support update and takedown jobs before production launch.

The current `nne_sandbox` adapter writes the manifest to private R2 and simulates an accepted delivery. A generic server-only HTTP adapter is already present: configure the provider key/name/endpoint/token and add the partner-specific metadata mapping without modifying the artist experience.

Server-only configuration:

- `NNE_DISTRIBUTION_PROVIDER`
- `NNE_DISTRIBUTION_PROVIDER_NAME`
- `NNE_DISTRIBUTION_PROVIDER_ENDPOINT`
- `NNE_DISTRIBUTION_PROVIDER_TOKEN`
- `NNE_DISTRIBUTION_PROVIDER_TAKEDOWN_ENDPOINT`
- `NNE_DISTRIBUTION_PROVIDER_WEBHOOK_SECRET`

The partner reports status to `POST /api/nne/distribution/provider-webhook` with `X-NNE-Signature: sha256=<HMAC-SHA256 of the raw JSON body>`. Normalized payload:

```json
{
  "event_id": "partner-event-unique-id",
  "provider_key": "partner_key",
  "provider_release_id": "partner-release-id",
  "status": "accepted | delivered | live | rejected | takedown_requested | taken_down",
  "message": "optional rejection reason"
}
```

Provider events are idempotent and recorded before they change release state.

## Production gate

The feature remains a demo until all of the following are complete:

- provider agreement and sandbox credentials;
- partner metadata mapping and validation tests;
- update/takedown flow;
- partner-specific webhook fixture tests;
- partner royalty report mapping and reconciliation tests (the statement ledger/import path already exists);
- legal review of artist agreement and rights attestation;
- isolated staging D1/R2 resources;
- migration ledger reconciled with the live schema;
- administrator MFA and dual approval for monetary payouts.

## Health check

Run `node scripts/nne-distribution-health.mjs`, build the frontend, and then run `node scripts/prepare-nne-deploy.mjs`.

Migrations: `migrations/0028_nne_distribution_os.sql`, `migrations/0029_nne_distribution_provider_events.sql`, and `migrations/0030_nne_distribution_compliance_splits.sql`.
