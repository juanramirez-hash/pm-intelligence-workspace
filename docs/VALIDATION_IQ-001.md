# IQ-001 validation

Run:

```bash
npm run build
npm run lint
npm test
```

Expected baseline after IQ-001:

```text
Test Files  46 passed
Tests       186 passed
```

The exact Vitest count is determined by the installed project state. The release criterion is that all discovered tests pass.

## Functional validation

1. Open Data Center.
2. Import the Product Master file.
3. Confirm the report is detected as Product Master.
4. Confirm the Product Master summary is displayed.
5. Reload the browser and confirm the dataset remains active.
6. Open `/data-quality/products`.
7. Confirm row coverage, value coverage and grouped exceptions.
8. Export the exception CSV.
9. Open Sales Workspace and confirm reconciliation is recalculated.

## Gate criteria

- Row coverage >= 90 percent.
- Sales value coverage >= 95 percent.
- Classified exception rate = 100 percent.

A failed gate does not delete or alter data. It blocks the recommendation to begin inventory analytics until exceptions are corrected or formally accepted.
