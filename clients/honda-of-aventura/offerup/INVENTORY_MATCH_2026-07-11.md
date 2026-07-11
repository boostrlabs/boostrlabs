# Honda of Aventura × OfferUp — Inventory Match

Date: 2026-07-11
Status: EXECUTED — MODEL/PRICE MATCH COMPLETE; VIN-LEVEL MATCH PENDING
Source: `fulldata.zip` screenshots plus the complete OfferUp text supplied by the user.

## Dataset

- Dealer website reports 97 used vehicles.
- 96 website vehicles were identified at VIN level from the supplied screenshots/text.
- The uncaptured 97th vehicle is likely the 2025 Hyundai Elantra shown as active in OfferUp; inference only.
- OfferUp source contains 104 listing rows: 98 active and 6 sold/archived.
- The dashboard screenshots alone omitted six active rows during OCR; the original user-supplied OfferUp text restored them.
- Recurring website-to-OfferUp price relationship: website best price is generally OfferUp price + $1,239, with some stale price differences.

## Correct match result

- Every identified website year/model group has sufficient active OfferUp listings to represent the current dealer inventory.
- OfferUp also contains one additional active 2024 Honda CR-V beyond the count visible in the identified website inventory.
- Therefore, no VIN can be honestly classified as confirmed absent using the supplied OfferUp dashboard screenshots.
- Reason: OfferUp rows show year/model/price but not VIN, stock or mileage. Repeated units of the same year/model cannot be resolved at VIN level from these captures.

## Johanka photo-run priorities

Use the 10-photo trip to replace placeholder/weak media and prepare stronger manual listings. Do not label these as confirmed missing.

1. 2024 Honda Civic EX — VIN 2HGFE1F71RH325191 — 9,855 mi — website $26,089
2. 2023 Honda Civic Sport — VIN 2HGFE2F5XPH563199 — 11,336 mi — website $25,214
3. 2025 Toyota Corolla SE — VIN 5YFS4MCE7SP235516 — 7,951 mi — website $25,214
4. 2025 Honda Accord SE — VIN 1HGCY1F46SA091201 — 1,412 mi — website $28,989
5. 2024 Honda HR-V LX — VIN 3CZRZ1H32RM708837 — 12,015 mi — website $25,214
6. 2024 Honda CR-V Hybrid Sport — VIN 7FARS5H50RE018242 — 17,118 mi — website $31,214
7. 2019 Honda Ridgeline RTL — VIN 5FPYK3F59KB002097 — 48,160 mi — website $23,214
8. 2023 Chrysler Pacifica Touring L — VIN 2C4RC1BG6PR525188 — 61,706 mi — website $23,964
9. 2024 Honda Pilot EX-L 7-Passenger — VIN 5FNYG2H53RB000440 — 34,942 mi — website $36,214
10. 2023 Acura Integra A-Spec Technology — VIN 19UDE4H6XPA013881 — 34,328 mi — website $26,214

## Selection logic

- Mostly $23k–$31k inventory.
- Honda/Toyota reliability and broad financing appeal.
- Mix of compact sedan, midsize sedan, compact SUV, hybrid SUV, family three-row vehicle, minivan and pickup.
- Low mileage prioritized where available.
- No ultra-luxury $50k–$80k units.

## Next verification rule

A true missing-VIN report requires one of these OfferUp fields for every active row: VIN, stock number or mileage. Until then, classify matches as model/price-level only.
