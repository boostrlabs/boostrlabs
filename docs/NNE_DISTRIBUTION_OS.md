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

## Production gate

The feature remains a demo until all of the following are complete:

- provider agreement and sandbox credentials;
- partner metadata mapping and validation tests;
- update/takedown flow;
- webhook replay and signature tests;
- partner royalty report mapping and reconciliation tests (the statement ledger/import path already exists);
- legal review of artist agreement and rights attestation;
- isolated staging D1/R2 resources;
- migration ledger reconciled with the live schema;
- administrator MFA and dual approval for monetary payouts.

## Health check

Run `node scripts/nne-distribution-health.mjs`, build the frontend, and then run `node scripts/prepare-nne-deploy.mjs`.

Migration: `migrations/0028_nne_distribution_os.sql`.
