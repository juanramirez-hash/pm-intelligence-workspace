# CHANGELOG PMC-002

## Product Master Entity Migration

### Added

- `BusinessProductMaster` as the canonical product identity and catalogue contract.
- Stable ERP identity fields: `code`, `erpInternalId`, `brandId`.
- Catalogue fields for description, classification, trend, status, supplier and categories.
- `BusinessProductLegacyAnalytics` as an explicit transitional contract.

### Changed

- The business model builder now creates the expanded Product Master identity.
- `createBusinessProduct` was renamed internally to `createBusinessProductMaster`.
- Product Master contracts are exported through the public Business Core model facade.

### Compatibility

- `src/core/business/entities/product.ts` remains available.
- `BusinessProduct` is a temporary compatibility type combining the Product Master
  identity with the current aggregate analytics required by Product Intelligence.
- No current workspace or decision engine requires an immediate migration.

### Not included

- Product repository master indexes.
- ERP catalogue enrichment.
- Sales-to-catalogue reconciliation.
- Removal of legacy aggregate analytics.

Those changes belong to PMC-003 and later sprints.
