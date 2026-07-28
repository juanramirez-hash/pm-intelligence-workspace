# COMMIT PMC-005

## Suggested commit

```text
feat(product-master): reconcile sales with ERP product identity
```

## Scope

- Add deterministic sales-to-catalogue reconciliation.
- Prefer unique ERP-code matches over brand and model.
- Detect ambiguous and unmatched sales rows.
- Prevent ambiguous revenue from contaminating Product Master metrics.
- Add reconciliation diagnostics to the Business Data Model and repositories.
- Add optional ERP product-code support to the sales importer.
- Add PMC-005 unit coverage.

## Architectural result

Sales no longer decide product identity directly inside the Business Data Model
builder. Identity resolution is now a dedicated Core service with explicit
rules, outcomes and diagnostics. Product Master records remain canonical, while
unresolved sales are kept isolated and traceable.
