# Data Model Concept

This is conceptual. Codex/engineering should translate into PostgreSQL schema.

## Core objects

### Partner

Represents a business/person accepted into BOOSTR.

Fields:

- id.
- name.
- type.
- industry.
- status.
- owner.
- entity_status.
- assigned_manager.
- active_modules.
- smart_link.
- workspace_config.
- economic_model.
- legal_status.
- score.

### BOOSTR Lead

A potential partner/client for BOOSTR.

Separate from partner leads.

### Partner Lead

A lead/customer generated for a partner's business.

### Partner Inventory Item

Product/service/offer/package/booking/etc.

### Smart Link

Public entry interface for a partner.

### Deep Link

Specific link to exact inventory item/campaign/action.

### Payment Record

Internal record of payment intent/transaction/manual payment.

### Reward Record

Gamified reward/credit record.

### Balance Record

Financial/value balance record, separate from rewards.

### Contract / Agreement

Records signed documents, modules, SOWs, and addenda.

### Insight Card

Custom performance card shown to partner or manager.

### Campaign Request

Partner requests campaign; BOOSTR configures.

## Lead separation

Critical distinction:

- BOOSTR leads: people/businesses that may become BOOSTR Partners.
- Partner leads: leads generated for the partner's own business.

These must not be mixed.

## Smart Link system note

Do not build a self-service link generator in v1.

Build the data structure and route support that allow BOOSTR to manually create custom Smart Links and reuse components later.
