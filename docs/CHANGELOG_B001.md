# Sprint B-001 — Brand Intelligence Workspace

## v0.9.8-B001

### Implementación

- Se creó `src/core/decision/` como capa de decisión desacoplada de React.
- Se agregó `BrandDecisionEngine` como orquestador del Decision Core de marca.
- Se agregó `BrandDecisionModel` como agregado único para consumidores del Workspace.
- Se integraron los contratos existentes de Business Core:
  - `BusinessSnapshotEngine`.
  - `BusinessHealthScoreEngine`.
  - `BusinessNarrativeEngine`.
- Se implementó detección de clientes perdidos por comparación entre periodos.
- Se implementó detección de productos perdidos por comparación entre periodos.
- Se implementó Commercial Priority Score de 0 a 100 con niveles `critical`, `high`, `medium` y `low`.
- Se agregaron razones explicables para actividad, venta, margen, objetivos, clientes y productos.
- Se agregó prueba unitaria del agregado de decisión y de validación de periodos.

### Validación

- TypeScript aislado del nuevo Decision Core: correcto.
- Build completo y Vitest: no ejecutables en este entorno porque la instalación de dependencias quedó incompleta y no generó los binarios locales de `vite` y `vitest`.

### Alcance pendiente

- Fortalecer reglas y ponderaciones del Commercial Priority Score.
- Ampliar explainability a riesgos, oportunidades y acciones recomendadas propias del Decision Core.
- Crear `BrandWorkspaceViewModel`.
- Integrar el ViewModel con React.

## v0.9.10-B001 — React Integration

- Integrated `BrandWorkspaceViewModel` with the active `/brands/:brandId` route.
- Replaced the legacy `BrandDashboardPage` route with `BrandIntelligencePage`.
- Added `useBrandIntelligenceWorkspace` to orchestrate repository → decision engine → view model.
- Exposed `BusinessRepository` and current business period through `WorkspaceContextModel`.
- Added executive brief, KPI cards, Why, risks, opportunities, priority, comparisons, recommended actions, lost customers and lost products presentation.
- Extended chart points with preformatted labels and normalized widths so React does not calculate business or visualization metrics.
- Extended `WorkspaceGrid` to support five KPI columns.
