# UX-001.2D — Brand Intelligence Executive Shell Integration

Version: `0.16.3-UX001.2D`

## Scope

Integrates the existing Brand Intelligence directory page with the Executive Shell presentation standard. No Business Core, repository, decision-engine, importer, or ViewModel behavior was changed.

## Changes

- Replaced the legacy page wrapper and header composition with `ExecutiveShell` and `ExecutiveHeader`.
- Added `ExecutiveBreadcrumbs` for the route `Inicio / Brand Intelligence`.
- Added `ExecutiveStatusBar` with data status, current period, repository model, and active-brand coverage.
- Added `ShellActions` and `ShellActionsGroup` for filter reset and Data Center navigation.
- Migrated primary and secondary KPI layouts to `KPIContainer` and `KPIGrid`.
- Migrated the three executive ranking panels to `KPIGrid` while preserving their existing content.
- Preserved the brand directory, filtering, selection, navigation, rankings, calculations, and empty state.
- Stabilized the empty brand collection reference in `useBrandWorkspace` to remove the known `useMemo` dependency warning.

## Visible result

The `/brands` page now displays the first complete Executive Shell implementation in the application. Other workspaces remain unchanged.
