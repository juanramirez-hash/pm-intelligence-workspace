# IW-002 Validation

Run:

```text
npm run build
npm run lint
npm test
```

Validate that:

- duplicate rows consolidate into one canonical position;
- `Name` resolves against Product Master;
- unresolved inventory identities remain visible;
- latest snapshot queries return the most recent dated cut;
- product, brand, location and product-location queries return immutable arrays;
- Sales Workspace and Product Identity Quality remain unchanged.
