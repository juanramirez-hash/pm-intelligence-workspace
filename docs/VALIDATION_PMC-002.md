# VALIDATION PMC-002

## Required commands

```bash
npm run build
npm run lint
npm test
```

## Acceptance criteria

- TypeScript compiles without errors.
- Vite production build completes.
- Existing Product Intelligence tests remain green.
- Existing imports from `entities/product` remain valid.
- New code can import `BusinessProductMaster` from `entities/productMaster` or
  from the Business Core model facade.
- The sales builder continues producing the same revenue, gross profit,
  quantity, documents, customer, location and period aggregates.
