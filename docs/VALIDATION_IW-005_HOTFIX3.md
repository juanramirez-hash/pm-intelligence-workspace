# Validation — IW-005 HOTFIX 3

Run:

```text
npm run build
npm run lint
npm test
```

Expected current baseline:

```text
Test Files  55 passed (55)
Tests       207 passed (207)
```

The existing wide-layout regression test must now return `inTransit: 4` for `CEDIS CDMX`.
