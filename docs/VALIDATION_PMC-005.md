# VALIDATION PMC-005

## Required commands

```bash
npm run build
npm run lint
npm test
```

## Expected regression result

PMC-005 adds three test files and eleven test cases to the suite validated after
PMC-004. The expected total is:

```text
Test Files  34 passed (34)
Tests       153 passed (153)
```

The exact duration may vary by machine.

## Acceptance criteria

- TypeScript and Vite production build complete without errors.
- Existing Product Master, Product Repository and decision-engine tests remain
  green.
- A unique ERP code resolves the canonical Product Master even when sales brand
  or model labels differ.
- An unknown ERP code can fall back to a unique normalized `Brand + Model`
  match.
- Duplicate ERP codes are classified as ambiguous.
- Multiple Product Master records sharing `Brand + Model` are classified as
  ambiguous.
- Ambiguous sales revenue is isolated from all candidate Product Master
  records.
- Unmatched products remain identifiable as `sales_fallback`.
- Equal model names from different brands do not merge into one fallback
  product.
- The reconciliation summary is available through `BusinessDataModel`,
  `ProductQueries` and `BusinessRepository`.
- Sales imports recognize the optional ERP product-code field without making it
  mandatory for legacy reports.

## Validation performed during package preparation

- Targeted strict TypeScript compilation of all changed files: passed.
- Runtime smoke validation of ERP-code matching, ambiguous isolation, fallback
  collision handling and repository diagnostics: passed.
- Runtime smoke validation of sales product-code column mapping: passed.

Full Vite/Vitest/Oxlint validation must be executed in the project installation
with its local dependencies.
