# IW-002 — Inventory Domain & Repository

## Added

- `BusinessInventoryPosition` as the canonical product-location-snapshot grain.
- `BusinessInventorySnapshot` for aggregate inventory cuts.
- Consolidation of duplicate source rows by snapshot date, Name and location.
- Inventory identity resolution against the current Product Master by canonical `Name`.
- Inventory indexes by product, location, snapshot, brand and product-location.
- `InventoryQueries` exposed through `BusinessRepository.inventory`.
- Inventory propagation into `BusinessDataModel` from Workspace Context.

## Scope boundary

This sprint materializes inventory and exposes repository queries. Coverage, rotation, stockout, excess and commercial recommendations remain outside IW-002.
