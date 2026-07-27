# Validation A-002.9.1

## Scope

Architecture-test isolation and production-build correction.

## Expected commands

```bash
npm run test
npm run build
npm run lint
```

## Expected result

- All existing tests pass, including `tests/architecture/coreBoundaries.test.ts`.
- TypeScript and Vite build complete successfully.
- No Node-only architecture test is compiled as application source.
