# Validation — SW-003

## Completed in package preparation

- TypeScript compilation of the modified Business Core, repository and Sales Workspace engine.
- TS/TSX syntax validation of all modified UI, store, hook and test files.
- Functional runtime validation covering:
  - combined brand and period filters;
  - distinct-document counting;
  - filtered comparison against previous period;
  - filtered trend;
  - ranking recalculation;
  - active-filter resolution;
  - detail-row generation.

## Required after installation

```bat
npm run build
npm run lint
npm test
```

Expected suite after SW-003:

```text
Test Files  40 passed (40)
Tests       170 passed (170)
```

The Vite chunk-size warning previously observed remains non-blocking and is not addressed by this sprint.
