# Validation — SW-004

## Completed during package preparation

- TypeScript project compilation with `tsc -b`.
- Runtime validation of the variance engine using the real Business Builder and Business Repository.
- Runtime validation of Sales Workspace integration.
- Deterministic checks for:
  - net revenue variance;
  - positive and negative contributions;
  - Gross Profit, quantity, document and margin variance;
  - brand, customer and product contribution;
  - mix variation;
  - customer status classification;
  - active filter isolation;
  - missing comparison period.
- Type-safe server-rendering contract for the new panel.

## Required after installation

```bat
npm run build
npm run lint
npm test
```

Expected suite based on the validated SW-005 HOTFIX 1 baseline:

```text
Test Files  42 passed (42)
Tests       180 passed (180)
```

The Vite chunk-size warning remains non-blocking and is reserved for SW-006.
