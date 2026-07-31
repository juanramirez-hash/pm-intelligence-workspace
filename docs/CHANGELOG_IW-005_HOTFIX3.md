# IW-005 HOTFIX 3

## Fixed

- Preserves the exact Excel/NetSuite header as the raw row lookup key.
- Normalized matching continues to tolerate accents, leading spaces, repeated spaces, and non-breaking spaces.
- Fixes `inTransit: null` for headers such as ` CEDIS CDMX Cantidad Actual en Tránsito`.

## Root cause

Header detection trimmed the source header before storing it in the wide-location column map. The normalized row still used the original key with its leading space, so `row[column]` could not retrieve the value.
