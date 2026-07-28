# VALIDATION PMC-002 HOTFIX 1

## Cause

PMC-002 replaced the Product Master-aware Business Data Model builder with a
version that no longer exposed the `productMaster` option. It also made the
canonical Product Master fields mandatory in the transitional `BusinessProduct`
type, breaking legacy test fixtures.

## Resolution

- Restored the Product Master-aware `buildBusinessDataModel.ts` from v0.24.5 REV2.
- Kept `BusinessProductMaster` strict and canonical.
- Reintroduced `BusinessProduct` as a compatibility interface where Product
  Master attributes are optional and legacy analytical fields remain required.

## Validation commands

```bash
npm run build
npm run lint
npm test
```
