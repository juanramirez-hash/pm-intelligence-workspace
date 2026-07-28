# P-001.1 — Product Core Migration

Version: `0.23.0-P001.1`

## Scope

- Expanded `BusinessProduct` with SKU, first/last sale, document count, active periods, brands and locations.
- Expanded `BusinessProductPeriod` with brands and locations.
- Added aggregate document deduplication for products.
- Added reusable `ProductPeriodIndexes` by product and by period.
- Migrated `ProductQueries` to indexed timelines and typed relationship queries.
- Preserved the existing `brand` property for Product Workspace compatibility.
- Added Product Core tests for aggregation, relationships, periods and indexes.

## Architectural boundary

This sprint changes the Business Core only. Product decision rules and Product Workspace UX remain outside P-001.1.
