# COMMIT PMC-002

## Suggested commit

```text
feat(product-master): introduce canonical BusinessProductMaster contract
```

## Scope

- Add the stable product master entity.
- Preserve the existing Product Intelligence runtime contract.
- Expand builder defaults without changing current sales aggregation behaviour.
- Expose Product Master types through the Business Core public facade.

## Architectural rule

From PMC-002 onward, new stable catalogue attributes belong to
`BusinessProductMaster`. Transactional or time-varying values must be modelled in
period or snapshot entities instead of being added to the master.
