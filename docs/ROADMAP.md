# PM Intelligence Workspace — Roadmap

## Estado actual

```text
Version: v0.53.0
Sprint: PL-015 - Price Corridor, Maximum Discount & Margin Floor Simulation
Estado: PL-015 completado como simulacion temporal de corredores y pisos
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
| PL-004 | Pricing Group Templates & Commercial Guardrails | Completado · Hotfix 1 |
| PL-005 | Pricing Laboratory Workspace Model & Scenario Orchestration | Completado |
| PL-006 | Pricing Laboratory UI & Interactive Scenario Builder | Completado |
| PL-007 | Pricing Scenario Executive Comparison & Export | Completado |
| PL-008 | New Product & Brand Price Design from Cost | Completado |
| PL-009 | New Product & Brand Batch Pricing Matrix | Completado |
| PL-010 | Batch Pricing Sensitivity & Common Factor Feasibility | Completado |
| PL-011 | Multi-Tier Margin Architecture & Discount Ladder | Completado |
| PL-012 | Volume-Weighted Pricing & Portfolio Mix Simulation | Completado |
| PL-013 | Cost & Exchange Rate Sensitivity Stress Test | Completado · Hotfix 1 |
| PL-014 | Landed Cost & Price Waterfall Simulation | Completado |
| PL-015 | Price Corridor, Maximum Discount & Margin Floor Simulation | Completado |

PL-001 incorpora `BusinessPrice` y `BusinessPriceScenario` como contratos publicos del Business Core. Los precios conservan costo, lista, venta, moneda, vigencia y trazabilidad; GP, margen, descuento y factor se derivan mediante invariantes deterministicas. Los escenarios se almacenan separados y nunca alteran el precio base.

PL-001 agrega indices por producto, marca, moneda, banda de margen, Gross Margin, Gross Profit, precio vigente y Pricing Group. `repository.prices` devuelve copias aisladas y publica resumen y calidad de datos.

PL-002 conecta Data Center con fuentes canonicas y con el reporte ERP de costos y precios. Separa hechos MXN y USD, impide cruces de moneda, conserva trazabilidad, persiste Pricing en IndexedDB v8 y recalcula la conciliacion contra Product Master. La importacion no infiere promociones ni politicas comerciales.

PL-003 incorpora `price-engineering-v1` como laboratorio puro de calculo. Evalua escenarios descartables por precio, descuento, margen objetivo, GP objetivo, factor o descuento adicional compuesto; compara contra el precio actual y aplica exclusivamente restricciones suministradas por el usuario. El motor no persiste resultados, no modifica BusinessPrice y no escribe en otros dominios.

PL-004 incorpora un catálogo de plantillas Silver, Gold, Platinum, promoción, proyecto y personalizado sin valores numéricos predeterminados. Cada escenario exige una base explícita, puede limitarse por marca, producto y moneda, y combina guardrails suministrados por el caller con precedencia determinística. Los resultados siguen siendo temporales y no escriben precios ni datos fuera del laboratorio.

PL-004 Hotfix 1 elimina una advertencia de análisis estático en la prueba de aislamiento del catálogo. No altera contratos, plantillas, guardrails ni comportamiento productivo.

PL-005 incorpora `pricing-workspace-v1` como modelo único para la interfaz. Selecciona el precio vigente por producto y moneda, publica opciones de selección, orquesta plantillas y escenarios almacenados, conserva el orden de comparación y centraliza métricas, deltas, señales, guardrails, issues y explainability. El modelo nunca recomienda ni selecciona automáticamente un precio, no persiste resultados y no escribe fuera del laboratorio.

PL-006 conecta `/pricing` con ese modelo e incorpora selección de producto y moneda, constructor de escenarios, guardrails explícitos, comparación, selección visual y explainability. Todo el estado nuevo vive en memoria y las referencias almacenadas permanecen de solo lectura.

PL-007 incorpora `pricing-executive-comparison-v1`, selección documental de escenarios calculables, matriz contra precio vigente, exportación Excel de cinco hojas e impresión/PDF enfocada. Toda salida declara `SIMULACIÓN SIN EFECTO COMERCIAL`, conserva bloqueos y advertencias, y no persiste ni publica precios.

PL-008 corrige la dependencia exclusiva de precios existentes. Incorpora `price-design-v1` y un modo `Nuevo producto / marca` que parte del costo, moneda, descuento y objetivo explícito para derivar precio de lista, venta neta, factor de lista, factor neto, GP y margen. El usuario puede comparar 32%, 34% o cualquier otro descuento como diseños independientes sin crear productos ni registros de precio.

PL-009 incorpora `price-batch-design-v1` para calcular una familia completa de productos nuevos contra varios descuentos. Compara el factor individual requerido con un factor común máximo, promedio o explícito; publica cumplimiento y agregados por descuento; acepta pegado desde Excel y exporta la simulación a Excel o PDF sin crear ni modificar datos comerciales.

PL-010 incorpora `price-batch-sensitivity-v1` para evaluar varios factores comunes explícitos contra toda la matriz de productos y descuentos. Publica mínimos matemáticos por descuento y global, cobertura, bandas de factibilidad, excepciones por producto, resúmenes por factor y exportación documental. Ningún mínimo se presenta como recomendación, aprobación o instrucción para publicar precios.

PL-011 incorpora `price-tier-ladder-v1` para definir niveles comerciales con descuentos y objetivos distintos. Calcula el factor mínimo por nivel, identifica el nivel y producto limitantes, evalúa factores candidatos contra toda la escalera y exporta cobertura, GP, margen y excepciones. Los nombres Silver, Gold, Platinum u otros funcionan únicamente como etiquetas; todos los descuentos y objetivos siguen siendo explícitos.

PL-012 incorpora `price-portfolio-mix-v1` para comparar mezclas explícitas de cantidades contra factores y descuentos. Publica venta, GP, margen consolidado, factor neto ponderado, cobertura por volumen y concentración por producto. Las cantidades son supuestos temporales y no crean Forecast, presupuesto, demanda, inventario o compromisos.

PL-013 incorpora `price-cost-fx-stress-v1` para fijar precios de lista candidatos con costo base y tipo de cambio de referencia, y después medir su exposición bajo variaciones explícitas de costo y tipo de cambio. Publica impacto ponderado, GP, margen, cobertura, factor mínimo requerido y escenario crítico sin consultar tasas en vivo ni modificar costos o precios.

PL-013 Hotfix 1 corrige únicamente la expectativa automatizada de `convertedBaseCost`: el costo base convertido usa el tipo de cambio de referencia, mientras el costo estresado usa la variación de costo y el tipo de cambio del escenario. El motor productivo no cambia.

PL-014 incorpora `price-landed-cost-waterfall-v1` para construir costo aterrizado mediante componentes explícitos y secuenciales. Soporta porcentajes sobre compra o subtotal acumulado, cargos por unidad, totales distribuidos por cantidad o valor, rebates, alcance por producto, escenarios de costo/TC/componentes y trazabilidad del impacto sobre GP y margen. No crea registros contables ni persiste costos.

Pricing Laboratory queda cubierto para producto existente, diseño individual previo al catálogo, diseño por lote de nuevas marcas, sensibilidad de factores comunes, arquitectura comercial multinivel, simulación ponderada de mezcla, stress de costo/TC y construcción de costo aterrizado. Price DNA, recomendaciones automáticas, aprobaciones y publicación de precios permanecen fuera del alcance vigente. Cualquier evolución futura debe preservar el carácter temporal, explicable y no transaccional del laboratorio.


PL-015 convierte los objetivos explícitos de margen y GP en pisos matemáticos por producto. Evalúa el descuento máximo soportado, la distancia de seguridad y el factor mínimo bajo escenarios de costo y tipo de cambio, usando costo de compra convertido o landed cost explícito. No incorpora buffers ocultos, aprobaciones ni persistencia comercial.

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
