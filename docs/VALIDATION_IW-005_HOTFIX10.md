# Validation — IW-005 HOTFIX 10

Run:

```text
npm run build
npm run lint
npm test
```

Functional validation:

1. Open Inventory Workspace with the current NetSuite inventory report loaded.
2. Confirm `Inventario por marca` displays all brands when filters are clear.
3. Select BELDEN from the ranking.
4. Confirm the ranking, risks, opportunities, and drill-down are all scoped to BELDEN.
5. Clear filters and confirm all brands return.
