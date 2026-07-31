# IW-005 HOTFIX 5

## Fixed

- Preserves the exact physical spreadsheet header while extracting inventory columns.
- Uses normalized header text only for deduplication and matching.
- Prevents wide inventory fields with leading spaces, such as ` CEDIS CDMX Cantidad Actual en Tránsito`, from becoming unreadable during `row[column]` lookup.
