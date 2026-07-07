# BOOSTR FOUNDATION BANK — READ FIRST

This ZIP is the foundational text bank for BOOSTR Labs LLC.

It is not a pitch deck. It is not a normal software spec. It is the source-of-truth text bank that explains what BOOSTR Labs is, how it should operate, how it can make money, what it must avoid, what the first platform must support, and how Codex or any technical team should understand the company before building.

## Priority order

1. Human Bank / user-written decisions and language.
2. Confirmed business rules from the conversation.
3. Expert synthesis added to make the company buildable, legal-readable, and technically actionable.
4. Technical recommendations for Codex.

If a future Codex task conflicts with this ZIP, the ZIP wins until the Foundation is officially updated.

## Core idea

BOOSTR Labs LLC is a Technology Solutions and Business Infrastructure Services Provider. BOOSTR helps small businesses, creators, artists, founders, local service providers, car sellers, beauty businesses, and other creative operators turn what they already sell into a stronger, more organized, better-converting digital business system.

BOOSTR is not a label, not a talent manager, not a distribution company, not a generic CRM, not Wix, not Linktree, not Booksy, and not merely a website agency.

BOOSTR builds custom business infrastructure.

## Official direction

- Smart Link is the entry product.
- Business OS is the deeper platform/product for qualified partners.
- BOOSTR Managers create partner accounts. No open self-service signup at the beginning.
- Every partner can have a custom Smart Link.
- Every partner can eventually have a custom dashboard/workspace.
- The Smart Link is not automatically generated. BOOSTR studies each business and designs it manually.
- The platform core should reuse patterns and code where possible, but each partner experience should feel custom.
- Revenue share applies only to the specific modules, offers, services, campaigns, products, or payment flows defined in writing. It does not automatically apply to all partner revenue.
- BOOSTR Balance and BOOSTR Rewards are separate in v1.
- Rewards are not crypto, not a public coin, and not freely cash-outable without specific rules.
- Payments must be handled carefully because of carding, refunds, chargebacks, and tax/legal exposure.
- SOLVE remains its own product/domain/hosting and should not be taken down or migrated. It can be used as technical reference and case study.
- The first dashboard should be BOOSTR Manager.

## Codex interpretation

Codex should not build “everything” at once. Codex should first create a production-quality foundation:

- Foundation docs folder.
- Auth and role model.
- BOOSTR Manager workspace.
- Partner profiles.
- Partner inventory.
- Smart Link pages/custom route support.
- Lead separation between BOOSTR leads and partner leads.
- Payment placeholders / payment layer.
- Rewards and Balance placeholders.
- PostgreSQL schema.
- Cloudflare-ready deploy structure.

This project is now PRIME standard: TypeScript frontend, robust typed backend, PostgreSQL, strict security, strict data integrity, modularity, and mobile-ready API design.
