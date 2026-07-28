# VALIDATION PMC-003

Run in the project root:

```bash
npm run build
npm run lint
npm test
```

Expected results:

- TypeScript build completes without errors.
- Vite production build completes.
- Existing Product Core tests remain valid.
- New Product Repository index tests pass.

Important: catalogue-to-sales reconciliation remains PMC-005. The current
sales-only builder may still consolidate equal models under its legacy product
identity until the Product Master catalogue is applied.
