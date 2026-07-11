# OfferUp Inventory Snapshot — 2026-07-11

## SOURCE
- Provided manually by Janko from the Honda of Aventura OfferUp account.
- Scope: vehicle title, listing status, publication date and advertised price.
- Category: Vehicles > Cars & Trucks.
- No VIN, stock number, trim, mileage, color or direct listing URL included in this export.

## CURRENT STATE
- Inventory contains mostly Honda vehicles plus multiple non-Honda trade-ins.
- Visible statuses include `For sale` and `Sold`.
- Most listings were synchronized/published on 2026-07-07; a smaller set was added between 2026-07-08 and 2026-07-10.
- Naming is inconsistent: examples include `HR-V`, `Hr-V`, `CR-V`, `Cr-V`, `Civic`, `Civic Sedan`, `Accord`, and `Accord Sedan`.
- Multiple entries share the same year/model and sometimes the same price. These must not be treated as duplicates without VIN, stock number or mileage.

## IMPORTANT MATCHING LIMITATION
This snapshot alone cannot identify individual physical units reliably. Matching against the dealer website must use this priority:
1. VIN.
2. Stock number.
3. Exact year + make + model + trim + mileage + price.
4. Manual verification when identifiers are missing.

## NORMALIZATION RULES
- Standardize make/model capitalization.
- Normalize `Hr-V` to `HR-V` and `Cr-V` to `CR-V`.
- Preserve body-style distinctions such as `Civic Sedan`, `Civic Hatchback`, `Accord Sedan`, `CR-V Hybrid`.
- Preserve `Sold` records separately; do not count them as active OfferUp coverage.
- Do not collapse same-price/same-model records unless a unique identifier confirms duplication.

## PRELIMINARY OBSERVATIONS
- The active mix is heavily concentrated in Honda SUVs: CR-V, CR-V Hybrid, HR-V, Passport and Pilot.
- There are repeated Accord, Civic and CR-V listings that likely represent separate units.
- Several non-Honda vehicles can be useful as lead magnets because they broaden demand beyond Honda-only shoppers.
- Sold listings remaining visible can distort a simple visual comparison against current website inventory.
- Publication date is not sufficient to determine whether a vehicle remains physically available.

## NEXT INPUT REQUIRED
Dealer website used inventory with, ideally:
- VIN
- stock number
- year
- make
- model
- trim
- mileage
- price
- color
- vehicle URL
- photo count or photo availability

## NEXT OUTPUT
After receiving the website inventory, BOOSTR will produce:
- confirmed matches
- website-only units
- OfferUp-only/stale units
- possible duplicates
- records requiring verification
- ranked shortlist of the best 10 manual OfferUp candidates
- operational photo list for Johanka

## STATUS
- OfferUp raw snapshot: RECEIVED
- Normalization: IN PROGRESS
- Website inventory: PENDING
- Cross-platform match: BLOCKED BY WEBSITE DATA
- Top 10 selection: PENDING