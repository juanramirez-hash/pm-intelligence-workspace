# UX-001.2C — KPI Layout System

## Version

`0.16.2-UX001.2C`

## Scope

This delivery adds the reusable KPI and action layout layer for the Executive Shell.
It remains fully isolated from Business Core, repositories, decision engines, import pipelines and ViewModels.

## Added

- `KPIContainer`
  - Optional title, description and actions.
  - Plain, surface and subtle variants.
  - Configurable padding and maximum width.
- `KPIGrid`
  - Responsive layouts for 2, 3, 4 and 6 columns.
  - Automatic `auto-fit` layout.
  - Equal-height KPI items by default.
- `ShellActions`
  - Accessible toolbar semantics.
  - Horizontal or vertical orientation.
  - Start, end or distributed alignment.
  - Optional wrapping.
- `ShellActionsGroup`
  - Accessible grouping of related actions.
  - Plain or segmented presentation.
- Server-rendered component tests for all new components.

## Architecture

```text
Primitive Tokens
  -> Semantic Tokens
  -> Atlas Components
  -> Executive Shell
  -> KPI Layout System
  -> Workspaces
```

## Validation

Run locally:

```powershell
npm run build
npm run lint
npm test
```
