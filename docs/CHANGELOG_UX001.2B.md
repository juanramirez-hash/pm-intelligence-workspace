# CHANGELOG — UX-001.2B

## ExecutiveStatusBar + ExecutiveBreadcrumbs

Version: `0.16.1-UX001.2B`

### Added

- `ExecutiveBreadcrumbs`
  - Accessible navigation landmark.
  - Link and current-page states.
  - Optional icons and custom separator.
  - Empty-state suppression to avoid an unused navigation landmark.

- `ExecutiveStatusBar`
  - Semantic `<dl>` structure for workspace metadata.
  - Status tones connected to semantic design tokens.
  - Compact/default densities.
  - Default/subtle surface variants.
  - Optional leading and trailing extension regions.

- Unit tests for both components.

### Architecture

The components are presentation-only. They do not read the Business Repository,
execute decision logic, or depend on React Router. Route integration remains the
responsibility of each Workspace composition layer.

### Compatibility

- `ExecutiveShell` and `ExecutiveHeader` remain unchanged.
- Existing Atlas consumers require no migration.
- The public shell barrel now exports both new components.
