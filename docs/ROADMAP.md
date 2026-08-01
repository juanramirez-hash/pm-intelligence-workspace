# PM Intelligence Workspace — Roadmap

## Estado actual

```text
Version: v0.41.0
Sprint: PL-003 - Price Engineering Engine & Scenario Evaluation
Estado: Completado
```

## Orden estratégico de ejecución

1. Forecast Workspace.
2. Pricing Laboratory Workspace.
3. Executive Workspace preparado para Purchasing.
4. Purchasing Visibility Workspace como módulo consultivo final.

## Forecast Workspace

| Entrega | Alcance | Estado |
|---|---|---|
| FW-001 | Data Foundation, contratos, fuentes, granularidades y readiness | Completado |
| FW-002 | Forecast Engine y proyección base | Completado |
| FW-003 | Forecast Intelligence, cobertura, riesgo y sustituciones por producto | Completado |
| FW-004 | Workspace Model, comparación de escenarios y priorización ejecutiva | Completado |
| FW-005 | Forecast Workspace UI | Completado |
| FW-006 | Resumen ejecutivo y exportación base | Completado · base reemplazada por FW-010 |
| FW-007 | Project & Project Billing Data Foundation | Completado |
| FW-008 | Project Billing Reconciliation | Completado |
| FW-009 | Project-Aware Forecast Engine | Completado |
| FW-010 | Forecast UI & Export Final Closure | Completado |

FW-001 establece que Forecast es un dominio derivado del Business Repository. Utiliza ventas históricas como fuente obligatoria y objetivos, días laborales, inventario y Product Master como contextos enriquecedores. Purchasing permanece como fuente futura opcional y no bloqueante.

FW-002 implementa el baseline determinista para portafolio, marca y producto. Combina ritmo del periodo, promedio histórico, tendencia reciente y referencia estacional cuando cada componente está disponible. También activa los escenarios conservador, esperado y acelerado con confianza y explicabilidad.

FW-002 Hotfix 1 corrige únicamente el contrato de prueba de `recentTrendRate`: la tasa se expresa contra el último periodo cerrado. No modifica el algoritmo productivo ni sus resultados de proyección.

FW-003 conecta el baseline por producto con Inventory y Product Master. Calcula demanda restante, cobertura disponible y con entradas agregadas, riesgo de agotamiento, exceso, productos sin demanda proyectada y rutas de sustitución. No inventa fechas de llegada y mantiene Purchasing como fuente futura.

FW-004 compone los resultados de FW-002 y FW-003 en `ForecastWorkspaceModel`. Incorpora comparación de escenarios, resumen ejecutivo, agregación por marca, filtros, rankings, explainability y contratos de navegación sin duplicar fórmulas del Core.

FW-005 utiliza `ForecastWorkspaceModel` como unica fuente y entrega la interfaz visual completa con escenarios, KPIs, filtros, cobertura, marcas, rankings, explainability y estados sin datos.

FW-006 entrega la infraestructura de resumen ejecutivo, exportación Excel e impresión/PDF. El cierre definitivo se reabre al identificar que la proyección debe separar venta transaccional, facturación real por proyectos y pipeline maduro pendiente.

FW-006 Hotfix 1 alinea la narrativa ejecutiva `on-track` con el objetivo mensual. No cambia fórmulas, resultados, escenarios ni el contrato de exportación.

FW-007 incorpora en Data Center y Business Repository los dominios Proyectos, Facturación de proyectos y Tipos de cambio mensuales. La fundación conserva el monto original, la moneda, el documento, el status, la fecha estimada de facturación y la trazabilidad necesaria para evitar doble conteo.

FW-008 concilia los números de factura contra Sales Repository, identifica la facturación neta de proyectos en MXN y materializa series históricas transaccionales por periodo y marca. Las excepciones se bloquean para evitar doble conteo.

FW-009 reconstruye el Forecast con componentes por origen: baseline transaccional, facturación real de proyectos y pipeline maduro convertido a MXN. Los proyectos 03–04 se mantienen como upside separado y los bloqueos de calidad impiden declarar oficial un cierre incompleto.

FW-010 conecta la UI, el resumen ejecutivo, la impresión/PDF y la exportación Excel con `project-aware-v1`. La pantalla publica el desglose por origen, pipeline incluido y potencial, calidad, tasas, incidencias y disponibilidad oficial. El libro ejecutivo incorpora la séptima hoja `Pipeline de Proyectos` y conserva la trazabilidad completa del cálculo. Forecast Workspace queda cerrado funcionalmente de FW-001 a FW-010.

FW-010 Hotfix 1 corrige el fixture del estado listo para cargar una fundación mínima de Proyectos y Facturación de proyectos. Se preservan los bloqueos productivos cuando esas fuentes no están disponibles.

FW-010 Hotfix 2 separa la conciliación del periodo actual de la calidad histórica. Los documentos posteriores al corte de Ventas quedan pendientes, las excepciones históricas reducen confianza y los anulados solo bloquean cuando conservan impacto financiero.

FW-010 Hotfix 3 corrige la cobertura del periodo actual cuando no existen documentos elegibles para conciliación. Los pendientes posteriores al corte permanecen auditables, pero no reducen artificialmente la cobertura ni bloquean el Forecast oficial.

## Pricing Laboratory Workspace

| Entrega | Alcance | Estado |
|---|---|---|
| PL-001 | Data Foundation, contratos, Price Repository, indices y calidad | Completado |
| PL-002 | Pricing Data Center Import & Reconciliation | Completado |
| PL-003 | Price Engineering Engine & Scenario Evaluation | Completado |
| PL-004 | Pricing Group Templates & Commercial Guardrails | Siguiente |
| PL-005 | Price DNA & Recommendations | Planeado |
| PL-006 | Pricing Laboratory Workspace UI | Planeado |
| PL-007 | Executive Export & Closure | Planeado |

PL-001 incorpora `BusinessPrice` y `BusinessPriceScenario` como contratos publicos del Business Core. Los precios conservan costo, lista, venta, moneda, vigencia y trazabilidad; GP, margen, descuento y factor se derivan mediante invariantes deterministicas. Los escenarios se almacenan separados y nunca alteran el precio base.

PL-001 agrega indices por producto, marca, moneda, banda de margen, Gross Margin, Gross Profit, precio vigente y Pricing Group. `repository.prices` devuelve copias aisladas y publica resumen y calidad de datos.

PL-002 conecta Data Center con fuentes canonicas y con el reporte ERP de costos y precios. Separa hechos MXN y USD, impide cruces de moneda, conserva trazabilidad, persiste Pricing en IndexedDB v8 y recalcula la conciliacion contra Product Master. La importacion no infiere promociones ni politicas comerciales.

PL-003 incorpora `price-engineering-v1` como laboratorio puro de calculo. Evalua escenarios descartables por precio, descuento, margen objetivo, GP objetivo, factor o descuento adicional compuesto; compara contra el precio actual y aplica exclusivamente restricciones suministradas por el usuario. El motor no persiste resultados, no modifica BusinessPrice y no escribe en otros dominios.

**Siguiente sprint:** PL-004 - Pricing Group Templates & Commercial Guardrails.

## Inventory Workspace — CERRADO

| Entrega | Alcance | Estado |
|---|---|---|
| IW-001 | Inventory Import Plugin | Completado |
| IW-002 | Inventory Business Model & Repository | Completado |
| IW-003 | Inventory Analytics | Completado |
| IW-004 | Risk & Opportunity Engine | Completado |
| IW-005 | Inventory Workspace UI & undated snapshot support | Completado |
| IW-006 | Executive Summary, Excel Export & Closure | Completado |
| IW-006.1 | Category ABCE, Superseded & Direct Substitute Enrichment | Completado |

IW-006 añade una lectura ejecutiva determinística, exportación Excel bajo demanda y consistencia completa entre filtros, KPIs, rankings, riesgos, oportunidades y posiciones exportadas.

IW-006.1 conecta Inventory Workspace con los atributos persistidos de Product Master para filtrar por categoría de valor y analizar Superseded y sustitutos directos, sin duplicar esos datos en el dominio de inventario.

## Product Workspace — Catalog Replacement Visibility

| Entrega | Alcance | Estado |
|---|---|---|
| PW-006.1 | Superseded, sustituto directo e inventario del reemplazo | Completado |
| PW-006.1.1 | Reubicación de la ruta de sustitución dentro del Executive Hero | Completado |

PW-006.1 incorpora la ruta de sustitución dentro del expediente del SKU. La información se obtiene del Product Master y la disponibilidad del reemplazo se consulta desde Inventory Repository, sin alterar las reglas del Product Decision Core.

PW-006.1.1 optimiza la composición visual al colocar la ruta de sustitución inmediatamente debajo de Riesgo comercial y Potencial de recuperación dentro del Executive Hero, conservando intacto el contrato funcional del panel.

## Architecture Sprint A-002

| Commit | Alcance | Estado |
|---|---|---|
| A-002.1 | Business Cube Metrics Foundation | Completado |
| A-002.2 | Business Cube Engine Consolidation | Completado |
| A-002.3 | Business Targets Domain | Completado |
| A-002.4 | CommercialTargetQueries | Completado |
| A-002.5 | Target Attainment Engine | Completado |
| A-002.6 | Business Snapshot | Completado |
| A-002.7 | Health Score Engine | Completado |
| A-002.8 | Narrative Engine & Executive Brief | Completado |
| A-002.9 | Architecture Hardening | Completado |

## Architecture Sprint A-002 — CERRADO

El Core dispone de fachada pública, formatos compartidos y pruebas de límites arquitectónicos.

## Sprint B-001 — Brand Workspace

Después del cierre de A-002 se construirá la primera interfaz conectada al Core:

- Resumen Ejecutivo.
- Ventas.
- Objetivos.
- Health.
- Clientes.
- Productos.
- Tendencias.
- Alertas.
- Copilot.

## Criterio para v1.0.0

- Data Center con dominios prioritarios operativos.
- Business Model estable.
- Business Repository y Business Cube completos.
- Business Snapshot implementado.
- Brand, Customer y Product Intelligence sobre el modelo central.
- Executive Workspace conectado al Business Core.
- Copilot consumiendo contratos de negocio y no estructuras de UI.

## Restricciones vigentes

- Las entidades almacenan hechos, objetivos e identificadores; no KPIs derivados.
- Los Workspaces no duplican fórmulas del Business Core.
- La UI representa Snapshots y resultados derivados; no interpreta el negocio.
- Health Score no inventa benchmarks ausentes.
- Cada cambio se entrega como commit completo, compilable y documentado.

### A-002.9.1 - Architecture Test Isolation

Status: completed. Corrective hardening release separating Node-based architecture tests from production application compilation.
