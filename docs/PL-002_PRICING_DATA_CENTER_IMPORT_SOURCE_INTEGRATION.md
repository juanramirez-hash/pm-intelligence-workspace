# PL-002 — Pricing Data Center Importer & Source Integration

## Status

Completed in version `0.40.0`.

## Objective

Connect real cost and price sources to the Pricing domain introduced by
PL-001 without allowing spreadsheets to define Business Core semantics.

PL-002 detects, validates and normalizes source rows into
`BusinessPriceInput`-compatible records. The Business Core remains the owner of
Gross Profit, Gross Margin, discount, pricing factor, margin bands and quality
rules.

## Architecture

```text
Spreadsheet / ERP price report
              |
              v
Pricing Import Plugin
  - source detection
  - header validation
  - monetary channel isolation
  - row normalization
              |
              v
NormalizedPricingRow[]
              |
              +--> IndexedDB v8
              |
              +--> Product Master reconciliation
              |
              v
buildBusinessDataModel({ prices })
              |
              v
BusinessRepository.prices
```

The importer does not calculate commercial recommendations, floor prices or
Pricing Group policy. Those responsibilities belong to PL-003 and PL-004.

## Supported source layouts

### Canonical layout

A generic price source can declare:

- Product ID or SKU;
- Brand;
- Cost;
- List Price;
- Currency;
- optional Selling Price;
- optional Effective Date;
- optional Pricing Group and source reference.

### ERP dual-currency layout

The production source `TSCostosdecompraItemResults` can generate independent
price facts for MXN and USD.

#### MXN price fact

```text
Cost       <- Purchase Price
List Price <- Precio Lista (MXN)
Currency   <- MXN
```

`Purchase Price` is treated as the base-currency cost already published by the
ERP. No additional conversion is applied.

#### USD price fact

```text
Cost       <- Purchase Price (Foreign Currency)
Fallback   <- Ultimo precio de compra (USD)
List Price <- Precio USD
Currency   <- USD
```

The USD fact is generated only when the source declares `Moneda = USD`, or
when a generic explicit-USD source does not provide a purchase-currency
column. This prevents a MXN cost from being paired with a USD list price.

Rows where the source declares another purchase currency remain auditable
through `usdChannelSkippedForCurrencyMismatch` and the dataset summary
`skippedUsdCrossCurrencyRows`.

## Monetary isolation rules

- Currency is mandatory for every normalized price fact.
- MXN and USD are separate records; they are never merged into one price.
- The importer does not use a hidden exchange rate.
- A USD list price without a valid USD cost does not become a USD price fact.
- A source row may produce zero, one or two price facts.
- Duplicate product/currency/effective-date identifiers are resolved by the
  PL-001 builder and preserved as quality warnings.

## Selling price policy

When the source does not expose a current selling price, PL-002 sets:

```text
Selling Price = List Price
```

This represents the current base fact with zero discount. It does not infer a
promotion, customer level or Pricing Group scenario.

## Effective date policy

Only explicit price-effective fields are accepted as `effectiveDate`.
`Date Created` is not treated as price validity because it describes the item
record, not necessarily the current cost or price revision.

Sources without an effective date remain valid and are marked as undated. A
future source with a reliable price revision date can populate the same
contract without changing Business Core.

## Quantity Pricing Schedule

`Quantity Pricing Schedule` is preserved as source traceability. PL-002 does
not convert its free-form text into Silver, Gold, Platinum or promotional
scenarios. Commercial policy mapping belongs to PL-004.

## Product Master reconciliation

When Product Master is available, PL-002 reconciles every materialized price
against the canonical product identity used by Business Core.

The summary publishes:

- reconciled price facts;
- prices without a Product Master record;
- brand differences;
- product coverage rate.

Missing products and brand differences remain auditable warnings. Invalid
monetary records remain blocking issues under the PL-001 contract.

Reconciliation is recalculated when either Pricing or Product Master is
reloaded, and again during IndexedDB hydration.

## Data Center integration

PL-002 adds:

- automatic Pricing report detection;
- Pricing import summary;
- active Pricing entry in Data Catalog;
- normalized price persistence;
- file and timestamp traceability;
- IndexedDB schema version 8;
- Workspace Context integration;
- `BuildBusinessIntelligenceOptions.prices`.

## Persistence

```text
Store: pricingMetadata
Key: current-pricing-dataset
Persistence version: 1
Database version: 8
```

The persisted payload contains:

- `PricingDatasetSummary`;
- `NormalizedPricingRow[]`;
- last imported file;
- last imported timestamp.

## Source validation performed

The implementation was exercised against the real ERP workbook
`TSCostosdecompraItem UNV 21-05-2026 v1.xlsx`, sheet
`TSCostosdecompraItemResults`.

The validation confirmed:

- 3,800 source rows;
- 49 detected columns;
- coexistence of MXN and USD price channels;
- 6,007 normalized monetary channel rows;
- 5,515 final price facts after canonical duplicate resolution;
- 233 USD pairings rejected because the source declared a non-USD purchase currency;
- 679 source rows without a complete usable monetary channel;
- duplicate exported header handling;
- currency-gated USD cost pairing;
- undated price traceability;
- zero blocking monetary issues in the source-level import pass;
- 40 negative-margin warnings and 492 duplicate-key warnings preserved for audit.

Counts of final materialized facts may be lower than normalized rows when the
source repeats the same canonical product, currency and effective-date key.
The PL-001 builder retains the latest record and reports the duplicate.

## Scope excluded

PL-002 does not include:

- Price Engineering recommendations;
- target, floor or recommended price;
- commercial discount policies;
- automatic Silver, Gold or Platinum rules;
- scenario simulation;
- Price DNA;
- Pricing Laboratory page;
- Excel executive export.

## Acceptance criteria

- Data Center detects both canonical and ERP Pricing sources.
- MXN and USD costs are never silently mixed.
- Normalized records are compatible with PL-001 contracts.
- Pricing persists and hydrates independently in IndexedDB.
- Product Master reconciliation is visible and recalculable.
- Data Catalog identifies Pricing as active after import.
- Business Intelligence receives prices through Workspace Context.
- Build, lint and test suite remain green.
