# COMMIT PMC-004

## Suggested commit

```text
feat(product-master): enrich products with canonical ERP catalogue data
```

## Scope

- Normalize canonical Product Master catalogue fields.
- Populate canonical fields in `BusinessDataModel`.
- Preserve legacy aliases for compatibility.
- Add repository indexes and queries for catalogue dimensions.
- Add PMC-004 unit coverage.

## Architectural result

Product identity and ERP catalogue metadata are now represented through the
canonical `BusinessProductMaster` contract, while commercial aggregates remain
in the transitional `BusinessProduct` compatibility shape and product-period
entities.
