# IW-005 HOTFIX 4

## Fixed

- Preserves exact Excel header keys while normalizing only for comparison.
- Fixes wide inventory values whose physical column names contain leading spaces, repeated spaces, or NBSP characters.
- Restores `inTransit` parsing for headers such as ` CEDIS CDMX Cantidad Actual en Tránsito`.
