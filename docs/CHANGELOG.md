# Changelog

## 0.18.0-UX002.4-P3

- Integración visible del Executive Brief en Brand Workspace.
- Generación determinística desde el Business Core mediante Workspace Context.
- Renderizado debajo del Executive Hero y antes de los KPI secundarios.

# PM Intelligence Workspace — Changelog

## 0.18.0-UX002.4-P2 — Executive Brief Atlas Widgets

- Añade la capa visual reusable del Executive Brief determinístico.
- Incorpora explainability, confianza, riesgos, oportunidades y recomendaciones.
- Mantiene la integración con Brand Workspace fuera de esta parte.


## 2026-07-25 — Commit A-002.1: Business Cube Metrics Foundation

### Added

- `BusinessCubeMetrics` con contratos para margen, ticket promedio y variación entre periodos.
- Implementaciones puras y reutilizables de las tres métricas.
- Pruebas unitarias de resultados válidos, valores negativos y divisores sin base válida.
- `docs/ARCHITECTURE_DECISIONS.md` con ADR-008 a ADR-011.

### Changed

- `buildBusinessCube()` ahora construye métricas reales mediante `buildBusinessCubeMetrics()`.

### Compatibility

- Sin cambios en `BusinessDataModel`, `BusinessRepository`, Intelligence o UI.
- Sin breaking changes en las consultas existentes del Business Cube.

## 2026-07-26 — Commit A-002.2: Business Cube Engine Consolidation

### Added

- Registro central de métricas mensuales para las nueve métricas oficiales del Cube.
- Totales agregados correctos para `grossMargin` y `averageTicket`.
- Pruebas de integración para métricas aditivas y derivadas.

### Changed

- `GenericCubeQueryEngine` ahora resuelve ejecutores mediante el registro de métricas.
- `PeriodMetricExecutor` consume `BusinessCubeMetrics` y definiciones registradas.
- `buildBusinessCube()` comparte una única instancia de métricas entre todos los motores.
- El modelo mínimo de pruebas ahora contiene hechos representativos.
- `tsconfig.json` dejó de referenciar un `tsconfig.node.json` inexistente.

### Compatibility

- Sin cambios en `BusinessDataModel`, `BusinessRepository`, Intelligence o UI.
- Las consultas existentes de `revenue` y `grossProfit` conservan su contrato.

## 2026-07-26 — Commit A-002.3: Business Targets Domain

### Added

- Entidad pura `BusinessBrandTarget`.
- Índice `brandTargets` dentro de `BusinessDataModel`.
- Contrato `BusinessBrandTargetInput` para entradas normalizadas.
- Builder `buildBusinessBrandTargets()` con validación estructurada.
- Convención reutilizable para claves `PERIOD::BRAND`.
- Pruebas unitarias e integración con `buildBusinessDataModel()`.
- `ADR-013` para formalizar los objetivos comerciales como entidades de primer nivel.
- `docs/RELEASE_NOTES.md` con el historial de la versión `v0.9.0`.

### Changed

- `buildBusinessDataModel()` acepta opcionalmente objetivos de marca sin romper las llamadas existentes.
- El modelo mínimo de pruebas incorpora un índice vacío de objetivos.
- La versión del paquete avanza a `0.9.0`.

### Compatibility

- Las llamadas existentes a `buildBusinessDataModel(rows)` conservan su comportamiento.
- No se modifica Business Repository, Business Cube, Intelligence ni UI.
- No se calculan todavía cumplimiento, run rate, forecast o health score.

## 2026-07-26 — Commit A-002.4: CommercialTargetQueries

### Added

- Query Object `CommercialTargetQueries` para objetivos comerciales de marca.
- Consulta directa por marca y periodo mediante la clave canónica `PERIOD::BRAND`.
- Índices de objetivos por marca y por periodo construidos al inicializar el Repository.
- Consultas de periodos disponibles, marcas con objetivo y existencia de objetivo.
- Pruebas unitarias de normalización, orden, aislamiento de colecciones y casos inexistentes.
- `ADR-014` y documento técnico `docs/COMMIT_A-002.4.md`.

### Changed

- `BusinessRepository` expone `repository.targets` como API oficial de consulta.
- El paquete avanza a la versión `0.9.1`.
- Release Notes y Roadmap reflejan el cierre de A-002.4.

### Compatibility

- Sin cambios en `BusinessDataModel`, Business Cube, Intelligence o UI.
- Las APIs existentes de `brand`, `customer` y `revenue` mantienen su contrato.
- No se calculan todavía cumplimiento, run rate, forecast o health score.

## 2026-07-26 — Commit A-002.5: Target Attainment Engine

### Added

- Motor `TargetAttainmentEngine` para comparar hechos y objetivos por marca y periodo.
- Contratos `BusinessTargetAttainment`, `BusinessMetricAttainment`,
  `BusinessRevenuePace` y `BusinessPerformanceStatus`.
- Cálculos reutilizables de cumplimiento, variación, ritmo esperado y proyección lineal.
- Opciones explícitas para días laborales transcurridos.
- Pruebas unitarias del motor, divisiones entre cero, estados y periodos sin hechos.
- `ADR-015` y documento técnico `docs/COMMIT_A-002.5.md`.

### Changed

- El paquete avanza a la versión `0.9.2`.
- Release Notes y Roadmap reflejan el cierre de A-002.5.

### Compatibility

- Sin cambios en `BusinessDataModel`, Business Repository, Business Cube o UI.
- Las APIs existentes mantienen su contrato.
- No se implementan todavía Business Snapshot, Health Score ni Executive Brief.

## 2026-07-26 — Commit A-002.6: Business Snapshot

### Added

- `BusinessSnapshotEngine` y contrato `BusinessBrandSnapshot`.
- Consolidación de hechos, objetivos y Target Attainment por marca y periodo.
- Métricas de margen y ticket promedio reutilizadas desde Business Cube.
- Opciones explícitas para días laborales transcurridos.
- Pruebas para periodos con hechos y objetivo, sólo objetivo, sólo hechos y datos inexistentes.
- `ADR-016` y documento técnico `docs/COMMIT_A-002.6.md`.

### Changed

- `BusinessRepository` expone `getGeneratedAt()` para metadatos deterministas.
- El paquete avanza a la versión `0.9.3`.
- Release Notes y Roadmap reflejan el cierre de A-002.6.

### Compatibility

- Sin cambios incompatibles en BusinessDataModel, Cube, Targets, Attainment o UI.
- La interfaz web todavía no consume el Snapshot.

## 2026-07-26 — Commit A-002.7: Business Health Score Engine

### Added

- `BusinessHealthScoreEngine` basado exclusivamente en `BusinessBrandSnapshot`.
- Ocho componentes configurables: venta, GP, margen, forecast, ritmo, clientes,
  productos y tendencia.
- Pesos predeterminados y validación de configuraciones personalizadas.
- Clasificación ejecutiva de Excelente a Crítico, incluyendo No evaluable.
- Componentes explicables con valor real, benchmark, score, peso e impacto.
- Recomendaciones estructuradas para dimensiones en atención o riesgo.
- Benchmarks opcionales para amplitud de clientes, productos y tendencia.
- Pruebas unitarias de clasificación, ponderación, renormalización y configuración.
- `ADR-017` y documento técnico `docs/COMMIT_A-002.7.md`.

### Changed

- El paquete avanza a la versión `0.9.4`.
- Release Notes y Roadmap reflejan el cierre de A-002.7.

### Compatibility

- Sin cambios incompatibles en Snapshot, Attainment, Repository, Cube o UI.
- La interfaz web todavía no representa el Health Score.

## 2026-07-26 — Commit A-002.8: Narrative Engine & Executive Brief

### Added

- `BusinessNarrativeEngine` como fachada pública de narrativa determinística.
- `BusinessExecutiveBrief` con resumen, fortalezas, riesgos, oportunidades y recomendaciones.
- Builders especializados por sección y reglas de lenguaje `es-MX`.
- Validación de correspondencia entre Snapshot y Health Score.
- Pruebas de narrativa favorable, ausencia de objetivos y contratos incompatibles.
- `ADR-018` y documento técnico `docs/COMMIT_A-002.8.md`.

### Changed

- La versión del paquete avanza a `0.9.5`.

### Compatibility

- Sin cambios en UI, Repository, Cube, Snapshot, Attainment o Health Score.
- El nuevo módulo es aditivo y se consume mediante su barrel export local.

## 2026-07-26 — Commit A-002.9: Architecture Hardening

### Added

- Fachada pública `src/core/business/index.ts`.
- Formateadores compartidos para números, porcentajes y moneda.
- Pruebas de formateadores y límites arquitectónicos.
- Documentación de API pública, Contribution Guide y Architecture Review.
- `ADR-019` para formalizar contratos y dependencias permitidas.

### Changed

- Narrative Engine reutiliza los formateadores centrales.
- La versión del paquete avanza a `0.9.6`.
- Architecture Sprint A-002 queda cerrado.

### Compatibility

- Sin breaking changes en Snapshot, Health, Narrative, Repository, Cube o UI.
- La fachada pública es aditiva y los exports locales permanecen disponibles.

## 0.9.7 - A-002.9.1

### Fixed

- Isolated the Node-based architecture-boundary test from the browser production source tree.
- Updated Vitest test discovery for the external `tests/` directory.
- Removed the TypeScript build errors caused by `node:fs`, `node:path`, and `node:url` imports under `src/`.

## 0.17.1-UX002.2

- Añade Intelligent KPI Cards y un registro declarativo reutilizable de indicadores.
- Migra los KPI secundarios de Brand Intelligence al nuevo sistema Atlas.
- Mantiene toda la lógica de negocio fuera de React.

## 0.17.2-UX002.3

- Executive Workspace Refinement.
- Executive Hero v2, KPI Cards v2, Executive Panels, Workspace Themes and Motion System.

## 0.18.0-UX002.4-P1

- Executive Brief Core determinístico para Brand Workspace.
- Reglas, explicabilidad, confianza y pruebas unitarias.
- Sin cambios de UI en esta parte.
