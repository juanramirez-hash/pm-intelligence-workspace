# IW-001 — Inventory Import Foundation

## Added

- Automatic inventory report detection.
- Canonical inventory normalization by `Name`, location and snapshot.
- Initial inventory summary and load-quality warnings.
- IndexedDB persistence for the current inventory dataset.
- Inventory activation in Data Catalog.
- Support for physical, available, committed, in-transit and on-order quantities.
- Optional unit cost, inventory value and currency fields.

## Scope

This sprint establishes ingestion and persistence only. Inventory domain repositories, coverage, rotation and operational recommendations remain in IW-002 onward.
