# IQ-002 HOTFIX 2

## Fixed

- Updated the repository-level Product Identity Quality test to the historical-product semantics introduced by IQ-002 HOTFIX 1.
- A sales row with a valid `Name` absent from the current Product Master is now expected to be `historical_unlisted`.
- Historical identities count toward total identity coverage but remain separately measurable.
