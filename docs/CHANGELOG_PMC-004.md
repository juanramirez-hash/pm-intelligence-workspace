# CHANGELOG PMC-004

## ERP Catalog Enrichment

### Added

- Canonical ERP catalogue fields in `NormalizedProductMasterRow`:
  - `vendorName`
  - `classification`
  - `category`
  - `subcategory1`
  - `subcategory2`
  - `createdAt`
  - `updatedAt`
- Optional column aliases for supplier name, classification, catalogue hierarchy,
  creation date and last modification date.
- Product Repository indexes for:
  - supplier;
  - classification;
  - category;
  - subcategories 1 and 2;
  - catalogue status;
  - commercial status;
  - product identity source.
- Repository queries for the new catalogue dimensions.
- Unit tests for normalization, catalogue-only products, enriched products and
  fallback products created from sales.

### Changed

- `buildBusinessDataModel` now materializes all canonical
  `BusinessProductMaster` catalogue fields.
- ERP catalogue products without sales remain available with zero commercial
  metrics.
- Sales fallback products now expose explicit `null` values for canonical
  catalogue fields.

### Compatibility

Legacy fields remain available during the migration:

- `preferredVendor`
- `productClass`
- `secondaryCategory1`
- `secondaryCategory2`

Canonical fields use those legacy values as fallbacks when the source file does
not contain dedicated columns.

### Not included

- Automatic sales-to-catalogue reconciliation changes.
- Resolution of ambiguous `Brand + Model` matches.
- Removal of legacy catalogue aliases.
- Product Workspace UI changes.

Those items remain outside PMC-004. Sales reconciliation belongs to PMC-005.
