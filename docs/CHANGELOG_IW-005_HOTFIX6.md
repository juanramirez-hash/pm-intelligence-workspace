# IW-005 HOTFIX 6

## Fixed

- Normalizes the accumulated inventory value to two decimal places in the import summary.
- Removes IEEE-754 floating-point noise such as `10.950000000000001` when the business value is `10.95`.
- Does not change normalized position values, stock quantities, reconciliation, or wide-layout parsing.
