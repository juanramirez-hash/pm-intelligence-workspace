# 0.33.0-FW-005

- Sustituye el placeholder de `/forecast` por Forecast Workspace conectado a `ForecastWorkspaceModel`.
- Executive Hero con cierre proyectado, cumplimiento, brecha, margen y score de confianza.
- Selector interactivo de escenarios conservador, esperado y acelerado sin modificar los datos base.
- KPIs de venta, GP, demanda, disponibilidad y productos criticos.
- Filtros por busqueda, marca, cobertura, prioridad y confianza.
- Mapa visual de cobertura y balance entre demanda restante, disponibilidad y entradas agregadas.
- Tabla ejecutiva por marca con objetivo, cumplimiento, confianza, cobertura y riesgo.
- Rankings navegables de riesgo y oportunidad con acceso a Brand Workspace, Product Workspace y sustitutos.
- Paneles de explainability, limitaciones y estados sin datos.
- Diseno responsive, impresion/PDF y pruebas de componentes visuales.
- FW-005 consume exclusivamente FW-004; no duplica formulas de Forecast ni inventa fechas de Purchasing.

# 0.32.0-FW-004

- Nuevo `ForecastWorkspaceModel` como contrato único para la futura interfaz de Forecast Workspace.
- Selector contractual de escenarios conservador, esperado y acelerado sin duplicar fórmulas del Business Core.
- Resumen ejecutivo consolidado de venta, GP, cantidad, margen, objetivo, cumplimiento, brecha, ritmo laboral y confianza.
- Agregación ejecutiva por marca con proyección, objetivo, cobertura, criticidad y navegación a Brand Workspace.
- KPIs de inventario recalculados sobre filtros de marca, cobertura, prioridad, confianza y búsqueda.
- Rankings separados de riesgo y oportunidad con navegación a Product Workspace y al sustituto resuelto.
- Contratos explícitos de periodos, filtros, opciones, explainability, limitaciones y estados vacío/parcial/listo.
- Nuevo hook `useForecastWorkspace()` conectado exclusivamente a `BusinessRepository` mediante Workspace Context.
- Pruebas para composición, cambio de escenario, filtros, navegación y ausencia de Repository.
- FW-004 no incorpora UI ni recalcula Forecast Baseline o Forecast Inventory Intelligence.

# 0.31.0-FW-003

- Nueva capa `forecast-inventory-v1` para cruzar demanda proyectada, inventario activo y Product Master por producto.
- Calcula demanda restante, cobertura disponible y cobertura con entradas agregadas en meses y días laborales.
- Clasifica stockout, brecha para el cierre, cobertura baja, cobertura balanceada, exceso e inventario sin demanda proyectada.
- Genera señales priorizadas y explicables de riesgo, oportunidad y contexto.
- Detecta inventario en productos Superseded, referencias no resueltas y sustitutos con disponibilidad.
- `inTransit` y `onOrder` se mantienen como entradas agregadas sin inventar fechas de llegada mientras Purchasing no esté conectado.
- La ausencia global de inventario produce estado `partial` y nunca se interpreta automáticamente como stock cero.
- API pública ampliada en `repository.forecast` para reporte, detalle por producto, ranking y filtros de cobertura.
- Pruebas para shortage, stockout, inbound recovery, exceso, Superseded, sustitución, ausencia de inventario y aislamiento de resultados.

# 0.30.1-FW-002-HOTFIX1

- Corrige la expectativa de prueba de `recentTrendRate`: la variación se mide contra el último periodo cerrado, no contra el promedio histórico.
- Para una venta reciente de 120 y una tendencia proyectada de 140, la tasa correcta es `0.1667` (16.67%).
- Añade una prueba directa al contrato matemático para evitar que el denominador cambie accidentalmente.
- No modifica el Forecast Baseline Engine productivo, sus pesos, escenarios ni la proyección esperada de `176.13` del caso de referencia.

# 0.30.0-FW-002

- Forecast Baseline Engine determinista para portafolio, marca y producto.
- Métodos `run-rate`, promedio histórico, tendencia lineal reciente y referencia estacional con pesos redistribuidos según disponibilidad.
- Proyección simultánea de venta, GP y cantidad, con margen derivado.
- Escenarios conservador, esperado y acelerado activados mediante banda de incertidumbre basada en confianza y volatilidad.
- Contexto contra objetivo: cumplimiento esperado, brecha y venta diaria requerida.
- Confianza explicable por historia, continuidad, ritmo laboral, avance, estacionalidad y estabilidad.
- Los meses sin actividad de una entidad se incorporan como cero dentro de periodos históricos disponibles.
- API pública en `repository.forecast` para baseline de portafolio, marca y producto.
- Conteo de días laborables centralizado y reutilizado por Brand Decision Engine.
- Pruebas deterministas de calendario, matemáticas, Engine, escenarios, consultas, aislamiento e integración.

# 0.29.0-FW-001

- Forecast se incorpora como dominio de primera clase del Business Core mediante `repository.forecast`.
- Nueva fundación determinística que declara historia disponible, periodo actual, corte de datos, continuidad mensual y baseline histórico.
- Contratos oficiales para granularidades de portafolio, marca, producto y cliente.
- Series mensuales normalizadas de venta, GP, cantidad y documentos, sin calcular todavía proyecciones.
- Registro explícito de fuentes: ventas, objetivos, días laborales, inventario, Product Master y Purchasing futuro.
- Readiness por capacidad para forecast consolidado, marca, demanda de producto, ritmo contra objetivo, cobertura de inventario y sustituciones.
- Escenarios conservador, esperado y acelerado definidos como contratos, sin multiplicadores ni resultados inventados.
- Purchasing queda marcado como fuente futura opcional y no bloqueante.
- Pruebas para foundation, series, queries, aislamiento de colecciones e integración con BusinessRepository.

# 0.28.3-PW-006.1.1

- La ruta de sustitución de catálogo se integra dentro del Executive Hero de Product Workspace.
- El panel se muestra inmediatamente debajo de Riesgo comercial y Potencial de recuperación.
- Se conserva sin cambios el diseño interno, los estados de sustitución, la navegación y las consultas de inventario.
- `ExecutiveHero` incorpora un slot reusable `metricFooter` para contenido contextual asociado a sus métricas.
- Se elimina el espacio vertical duplicado que generaba el panel como sección independiente.
- Prueba Atlas ampliada para validar el nuevo slot del Executive Hero.

# 0.28.2-PW-006.1

- Product Workspace incorpora una ruta de sustitución de catálogo conectada al Product Master.
- Expone `NETSTOCK Superseded By` y `Producto sustituto directo` dentro del expediente del SKU.
- Consulta existencia, disponibilidad y ubicaciones activas de cada producto de reemplazo desde Inventory Repository.
- Permite abrir directamente el expediente del sustituto cuando está conciliado con Product Master.
- Distingue producto vigente, Superseded con sustituto directo, Superseded sin sustituto y sustituto directo sin Superseded.
- Mantiene sin cambios Business Score, ciclo de vida, riesgo comercial y reglas de Product Decision Core.

# 0.28.1-IW-006.1

- Inventory Workspace se enriquece desde Product Master sin duplicar atributos en las posiciones de inventario.
- Nuevo filtro dinámico por `CLASIFICACION VALOR` A, B, C, D, E y productos sin clasificación.
- Nuevo filtro por estado de sustitución: Superseded, sustituto directo, ambos o sin reemplazo.
- Drill-down con categoría de valor, `NETSTOCK Superseded By`, sustituto directo y disponibilidad actual de cada reemplazo.
- Resumen ejecutivo ampliado con valor, unidades y cobertura de productos Superseded.
- Exportación Excel 1.1 con columnas de catálogo y nueva hoja `Sustituciones`.
- Pruebas unitarias para enriquecimiento, filtros, resumen y contrato de exportación.

# 0.28.0-IW-006

- Resumen ejecutivo determinístico para Inventory Workspace.
- KPIs, estado de posiciones y narrativa recalculados sobre los filtros activos.
- Exportación Excel bajo demanda con resumen, inventario por ubicación, posiciones, riesgos, oportunidades y metadatos.
- Carga dinámica de `xlsx` únicamente al solicitar la exportación.
- Pruebas unitarias para resumen ejecutivo y contrato del libro exportado.
- Cierre funcional de Inventory Workspace IW-001 a IW-006.

# 0.27.0-IQ-002

- `Name` adoptado como identidad primaria y unica del producto.
- `Marca` y `Modelo` usados para validacion y fallback controlado.
- Nuevo indice por Name, deteccion de duplicados y advertencias de atributos.
- Quality Gate ampliado con cobertura primaria por Name.
- Migracion compatible con Product Master persistido en IQ-001.

# 0.27.0-IQ-001

- Product Master registrado como dataset persistente del Data Center.
- Product Identity Quality Gate con cobertura por filas y valor de venta.
- Excepciones agrupadas y priorizadas por impacto comercial.
- Nueva ruta `/data-quality/products` y exportacion CSV.
- Integracion del Product Master persistido con BusinessRepository.

# 0.21.0-C001.1

- Customer Core Migration sobre `customerPeriods` y `BusinessRepository`.
- Índices temporales por cliente y periodo.
- Cobertura de periodos activos y ubicaciones por periodo.

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

## 0.19.0-UX002.5-P2

- Añade los widgets Atlas reutilizables para Opportunity Radar.
- Incorpora matriz impacto/urgencia y explicabilidad visual.
- Mantiene la integración con Brand Workspace fuera de esta parte.

## 0.19.0-UX002.5-P3

- Integración de Opportunity Radar en Brand Workspace.
- Conexión de Opportunity Engine con Workspace Context.
- Visualización priorizada entre Executive Brief y KPI Cards.

## 0.19.1-UX002.5-P3.1

- Corrige el recorte de tooltips en los bordes de Opportunity Matrix.
- Orienta cada tooltip hacia el espacio disponible y añade soporte de teclado.
- Mantiene intactos Opportunity Engine, scores y reglas de negocio.

## 0.20.0-UX002.6

- Smart Brand Directory integrado en Brand Workspace.
- Navegación contextual por marca, filtros y ordenamiento ejecutivo.

## 0.26.0 — SW-001 Sales Workspace Foundation

- Sales Workspace reemplaza el placeholder de `/sales`.
- Se incorpora contexto comercial por periodo, comparación temporal, KPIs, tendencia y rankings.
- La calidad de conciliación de Product Master se expone dentro del Workspace.
- El módulo consume BusinessRepository sin depender de filas normalizadas.

## 0.26.0 — SW-002 Sales Performance Analytics

- Consolida objetivos mensuales de venta, Gross Profit y margen dentro de Sales Workspace.
- Incorpora cumplimiento, esperado al corte, ritmo diario laboral y proyección de cierre.
- Añade cobertura de objetivos y una tabla priorizada de brechas por marca.
- Mantiene el Business Core congelado y consume únicamente BusinessRepository y Attainment.

## 0.26.0 — SW-003 Sales Segmentation & Drill-down

- Añade segmentación combinable por marca, cliente, producto, ubicación y vendedor.
- Incorpora búsqueda por ID o nombre y chips de filtros activos.
- Recalcula KPIs, comparación, tendencia y rankings sobre el segmento exacto.
- Permite profundizar desde rankings y presenta una tabla detallada agregada.
- Añade `SalesSegmentationQueries` y un grano analítico aditivo al Business Repository.
- Protege la integridad de cuotas desactivando objetivos cuando el filtro no puede atribuirse por marca.

## 2026-07-28 — SW-005: Commercial Opportunity Engine

### Added

- Motor comercial determinístico para convertir señales de ventas en prioridades accionables.
- Brechas de cuota, recuperación y crecimiento de clientes, crecimiento de productos y protección de margen.
- Score, prioridad, confianza, esfuerzo, impacto estimado y evidencia por oportunidad.
- Panel ejecutivo y navegación directa al segmento de marca, cliente o producto.

### Architecture

- Implementación aditiva dentro de Sales Workspace.
- Sin cambios en entidades, builders o repositorios del Business Core.
- SW-004 permanece pendiente como bloque independiente de Variance & Contribution Analysis.

## 2026-07-28 — SW-004: Variance & Contribution Analysis

### Added

- Explicación determinística de la variación comercial contra el periodo comparable.
- Contribuciones positivas y negativas por marca, cliente y producto.
- Cambios de mezcla, participación y peso relativo del movimiento.
- Clasificación de clientes nuevos, recuperados, crecientes, en baja, perdidos y estables.
- Panel ejecutivo integrado antes del Commercial Opportunity Engine.

### Architecture

- Implementación aditiva dentro de Sales Workspace.
- Consume exclusivamente BusinessRepository y Sales Segmentation Queries.
- Sin cambios en entidades, builders o repositorios del Business Core.

## 2026-07-28 — SW-006: Executive Export & Closure

### Added

- Resumen ejecutivo determinístico con lectura del periodo, perspectiva de cierre y hallazgos prioritarios.
- Exportación Excel bajo demanda con hojas de resumen, KPIs, desempeño por marca, oportunidades, contribuciones, detalle y conciliación.
- Vista de impresión optimizada para generar PDF desde el navegador.
- Acciones ejecutivas de impresión y exportación dentro de Sales Workspace.

### Performance

- Carga diferida por ruta para los principales Workspaces y Data Center.
- `xlsx` se carga dinámicamente únicamente al solicitar una exportación.
- Se elimina la dependencia estática de Data Center desde el router principal.

### Closure

- Completa los bloques SW-001 a SW-006 de Sales Workspace v0.26.0.
- Mantiene el Business Core congelado y sin cambios de contrato.
