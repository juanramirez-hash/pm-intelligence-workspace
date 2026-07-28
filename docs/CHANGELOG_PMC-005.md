# CHANGELOG PMC-005

## Sales Reconciliation

### Added

- Dedicated Product Sales Reconciliation engine with normalized indexes for:
  - ERP product code;
  - brand and model.
- Deterministic reconciliation results:
  - `matched`;
  - `ambiguous`;
  - `unmatched`.
- Explicit matching strategies:
  - `erp_code`;
  - `brand_model`;
  - `none`.
- Reconciliation summary in `BusinessDataModel` with:
  - total processed sales rows;
  - matches by ERP code;
  - matches by brand and model;
  - ambiguous rows;
  - unmatched rows;
  - rows without product identity;
  - global match rate.
- Product Repository accessors:
  - `getReconciliationSummary()`;
  - `getReconciliationRate()`.
- Business Repository accessor:
  - `getProductReconciliationSummary()`.
- Optional sales field `productCode`, including aliases for common ERP, item and
  SKU column names.
- Unit coverage for the reconciliation engine, Business Data Model integration,
  repository summary and sales importer column recognition.

### Matching order

1. A unique ERP product-code match is authoritative.
2. When no unique code match exists, the engine evaluates normalized
   `Brand + Model`.
3. Multiple code or `Brand + Model` candidates are classified as ambiguous.
4. Rows without a catalogue match remain as sales fallback products.

### Changed

- `buildBusinessDataModel` now delegates product identity resolution to the
  reconciliation engine.
- Ambiguous sales rows are isolated under synthetic IDs such as:

  ```text
  AMBIGUOUS::UNV::IPC-A
  ```

  Their revenue is not assigned to any candidate Product Master record.
- Fallback IDs avoid merging equal model names from different brands.
- Sales rows containing an ERP code can be reconciled even when model or brand
  labels differ from the catalogue.
- Product Master records with a valid ERP code remain loadable even when brand
  or model data is incomplete.

### Compatibility

- `productCode` is optional in `NormalizedSalesRow`; existing fixtures and
  imports continue compiling.
- Files without an ERP product-code column continue reconciling through
  `Brand + Model`.
- Existing model-only fallback IDs remain unchanged when no collision exists.
- Existing `product_master`, `sales_fallback` and `ambiguous_match` identity
  sources remain available.

### Not included

- Manual UI for resolving ambiguous matches.
- Persistent reconciliation overrides.
- Fuzzy matching or synonym dictionaries.
- Product Workspace reconciliation dashboard.
