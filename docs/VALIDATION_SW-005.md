# Validation — SW-005

## Completed in package preparation

- TypeScript project compilation with `tsc -b`.
- Type-safe integration with the existing Sales Workspace view model.
- Deterministic rule validation for:
  - brand target gaps;
  - required daily revenue;
  - customer recovery;
  - customer growth;
  - product growth;
  - margin protection;
  - priority scoring;
  - active-segment isolation.
- Server-rendering contract test for the opportunity panel.

## Required after installation

```bat
npm run build
npm run lint
npm test
```

Expected suite after SW-005, based on the validated SW-003 baseline:

```text
Test Files  41 passed (41)
Tests       174 passed (174)
```

The Vite chunk-size warning remains non-blocking and is reserved for SW-006.
