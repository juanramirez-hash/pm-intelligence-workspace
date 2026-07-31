# IW-005 HOTFIX 1 — Wide Inventory Layout Adapter

## Fixed

- Detects the real NetSuite inventory report with one product per row and repeated location metrics in columns.
- Adds `Item` as a supported canonical product identity header.
- Unpivots location blocks such as `CEDIS CDMX En Mano` and `VENTAS QRO Cantidad Actual Disponible` into normalized inventory positions.
- Excludes `TOTAL` columns to prevent double counting.
- Tolerates accents, leading spaces, and repeated spaces in headers.
- Derives inventory value as `onHand * Average Cost` when the source has no explicit value column.
- Preserves the original long inventory format.
