# VALIDATION PMC-004

## Required commands

```bash
npm run build
npm run lint
npm test
```

## Expected regression result

Based on the suite completed after PMC-003:

```text
Test Files  31 passed (31)
Tests       142 passed (142)
```

The exact duration may vary by machine.

## Acceptance criteria

- TypeScript and Vite production build complete without errors.
- Existing Product Repository tests remain green.
- Product Master imports still accept the original NetSuite columns.
- Canonical and legacy catalogue fields coexist without breaking consumers.
- Catalogue-only products remain in `BusinessDataModel.products` with zero
  revenue, gross profit, quantity and documents.
- Products reconciled from sales preserve ERP identity and receive canonical
  catalogue metadata.
- Repository queries return normalized results for supplier, classification,
  category, subcategories and statuses.
- Sales products without a catalogue match remain identifiable as
  `sales_fallback`.

## Validation performed during package preparation

- Targeted strict TypeScript compilation of all changed files: passed.
- Runtime smoke validation of normalization, model enrichment and repository
  queries: passed.

Full Vite/Vitest validation must be executed in the project installation with
its local dependencies.
