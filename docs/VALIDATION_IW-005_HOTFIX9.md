# Validation — IW-005 HOTFIX 9

Run:

```text
npm run build
npm run lint
npm test
```

Expected baseline after this package:

```text
Test Files  55 passed (55)
Tests       211 passed (211)
```

Functional validation:

1. Open Inventory Workspace in the Brand dimension.
2. Select BELDEN directly from the inventory ranking.
3. Confirm that the ranking displays only BELDEN.
4. Confirm that BELDEN risks, opportunities, and positions remain visible.
5. Switch to Location and Product; the rankings should remain scoped to BELDEN.
6. Confirm that `Existencia física sin disponibilidad` displays on-hand, committed, available, and inbound quantities.
7. Confirm that inbound opportunities display pending inbound units instead of `0 unidades sugeridas`.
