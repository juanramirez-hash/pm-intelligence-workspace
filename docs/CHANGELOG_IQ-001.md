# IQ-001 - Product Identity Quality Gate

## Objective

Establish a measurable entry gate before Inventory Workspace by validating the relationship between Sales and Product Master.

## Changes

- Registered Product Master as a first-class Data Center dataset.
- Added Product Master detection, validation, normalization, summary and IndexedDB persistence.
- Connected persisted Product Master rows to Business Intelligence construction.
- Added row-weighted and sales-value-weighted reconciliation coverage.
- Added grouped exception diagnostics by ERP code, brand and model.
- Added thresholds:
  - rows: 90 percent
  - sales value: 95 percent
  - classified exceptions: 100 percent
- Added Product Identity Quality repository queries.
- Added `/data-quality/products` dashboard.
- Added CSV export of reconciliation exceptions.
- Added navigation from Sales Workspace reconciliation panel.

## Architecture

The quality gate is additive. It does not change Product Master identity and does not expose normalized rows to Workspaces.

Data flow:

Sales + Product Master
-> Product reconciliation
-> Product identity quality report
-> BusinessRepository
-> Product Identity Quality page
