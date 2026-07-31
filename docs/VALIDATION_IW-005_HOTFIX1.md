# Validation — IW-005 HOTFIX 1

Run:

```text
npm run build
npm run lint
npm test
```

Then import `TS-Reportedeinventarioporsucursal V1 2026.xlsx` from Data Center.

Expected functional behavior:

- Report type detected as `Inventario` with high confidence.
- `Item` becomes `productName`.
- One normalized position is generated per product/location with operational quantity data.
- `TOTAL` columns are not imported.
- Blank location blocks are not materialized.
- The report currently has no explicit snapshot date, so the imported cut is stored as `NO_DATE` until a date column or import-date policy is introduced.
- Currency is not inferred from `Average Cost`; it remains unspecified.
