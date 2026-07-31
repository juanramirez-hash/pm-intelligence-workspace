# IW-005 HOTFIX 10 — Undated snapshot support

## Fixed

- Restores Inventory Workspace rankings when the imported report does not include a snapshot date.
- Adds `InventoryQueries.getLatestPositions()` as the canonical way to obtain the active inventory cut.
- Treats positions with `snapshotDate = null` as the current valid cut when no dated snapshot exists.
- Restores brand and location filter options derived from the active positions.
- Makes `getLatestSnapshot()` and `findLatestByProduct()` work with the internal `NO_DATE` snapshot.
