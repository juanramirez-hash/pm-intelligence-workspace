# UX-001.2A — Executive Shell

## Version

`0.16.0-UX001.2A`

## Scope

Introduces the first composition layer of the Atlas executive experience.

## Added

- `ExecutiveShell`
  - Shared page canvas and responsive content width.
  - Optional pre-content region for future breadcrumbs.
  - Optional header slot.
  - Standard, wide and fluid widths.
- `ExecutiveHeader`
  - Executive identity hierarchy.
  - Eyebrow, title, subtitle, description and metadata.
  - Icon, status and action composition slots.
  - Default and intelligence tones.
  - Compact and default sizes.
  - Extension content region for future scorecards or context panels.
- Barrel export for `src/atlas/shell`.
- Server-rendered component tests.

## Architecture

The components depend only on Atlas semantic tokens and React. They do not import Business Core, repositories, decision engines, routing or workspace ViewModels.

## Compatibility

No existing Atlas component or workspace is modified. Adoption remains incremental.

## Validation

Run:

```powershell
npm run build
npm run lint
npm test
```
