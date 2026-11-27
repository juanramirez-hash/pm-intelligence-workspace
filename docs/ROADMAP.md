# PM Intelligence Workspace — Roadmap

## Estado actual

```text
Version: v0.57.0
Sprint: Production Platform Foundation (rama feature/production-platform-foundation-v0.57.0)
Estado: v0.57.0 cerrada; backend desplegado en producción en 543c926 y frontend publicado por última vez el 28 oct 2026
```

## Orden estratégico de ejecución

1. Forecast Workspace — completado.
2. Pricing Laboratory Workspace — completado.
3. Executive Workspace preparado para Purchasing — completado con EW-001 y corregido funcionalmente con EW-001-HOTFIX1.
4. Purchasing Visibility Workspace — completado con PVW-001 (foundation) y PVW-002 (workspace y analítica).
5. Production Platform Foundation — completado en v0.57.0: plataforma PostgreSQL, autenticación, Settings, Actions, búsqueda global y SQL-002.

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

## Executive Workspace — PURCHASING READINESS

| Entrega | Alcance | Estado |
|---|---|---|
| EW-001 | Multi-Domain Foundation & Purchasing Readiness | Completado |
| EW-001-HOTFIX1 | Executive Navigation, Global Period Context & Contextual Attention Queues | Completado |

EW-001 independiza `ExecutiveWorkspaceModel` de `WorkspaceContextModel`, integra un builder y un hook ejecutivos propios y publica disponibilidad, cobertura, frescura e incidencias para Sales, Inventory, Forecast, Pricing y Purchasing.

EW-001-HOTFIX1 convierte la pantalla ejecutiva en una antesala operativa: incorpora navegación real, tendencias comerciales, selector global de periodo, semántica correcta de atención y colas contextuales que abren exactamente los productos, marcas o clientes representados por cada KPI. La clasificación de clientes utiliza historial real y umbrales de 90 días para inactividad y 180 días para pérdida.

Purchasing queda técnicamente listo para evolución consultiva con órdenes y solicitudes de compra normalizadas, Inventory, Product Master y Forecast completo. EW-001 y su hotfix no crean el Workspace de Purchasing ni incorporan decisiones automáticas.

## Purchasing Visibility Workspace — PVW-001 y PVW-002 COMPLETADOS

| Entrega | Alcance | Estado |
|---|---|---|
| PVW-001 | Purchasing Data Foundation & Import Contracts | Completado (v0.55.0) |
| PVW-002 | Purchasing Workspace, Analytics, Inventory & Forecast Intelligence | Completado (v0.56.0) |

PVW-001 incorpora contratos e importadores normalizados para órdenes de compra y solicitudes de compra, persistencia e hidratación desde Data Center, entidades y builders del Business Core, índices derivados, queries y reportes de calidad.

La identidad operativa canónica utiliza `purchaseOrderNumber` —procedente de `Document Number`— para órdenes de compra y `purchaseRequestNumber` —procedente de `ID`— para solicitudes de compra. Los campos `Internal ID` se conservan únicamente para trazabilidad técnica y no funcionan como identidad primaria de negocio.

El Workspace visual de Purchasing y sus analíticas consultivas quedaron fuera del alcance de PVW-001 y llegaron con PVW-002.

PVW-002 incorpora analítica de compras (totales, vínculo de solicitudes con órdenes de compra y ciclo de solicitud a orden), el Purchasing Workspace con enrutamiento manual desde Data Center, inteligencia de inventario con detalle de acciones de abasto y detección de sobrecompra contra Forecast. No se define todavía una entrega PVW posterior.

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

## Architecture Sprint A-002 — CERRADO

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
| A-002.9.1 | Architecture Test Isolation | Completado |

El Core dispone de fachada pública, formatos compartidos y pruebas de límites arquitectónicos.

A-002.9.1 es un hardening correctivo que separa las pruebas de arquitectura basadas en Node de la compilación de la aplicación productiva.

## Brand Workspace — CERRADO

| Entrega | Alcance | Estado |
|---|---|---|
| B-001 | Brand Intelligence Workspace | Completado |
| v0.57.0 | Comparativo comercial, planes, YoY, YTD, proyección anual, consolidación en Brand Workspace e identidad canónica de STREAMAX | Completado |

Brand Workspace es la primera interfaz conectada al Core. El botón Copilot de la barra superior todavía no tiene funcionalidad.

## Production Platform Foundation — v0.57.0 CERRADO

| Frente | Alcance | Estado |
|---|---|---|
| Data Platform | Backend Node/Express sobre PostgreSQL; 11 dominios persistidos en el servidor con importación por chunks, auditoría y cancelación | Completado |
| Auth | Login con Google, sesiones en PostgreSQL, cierre de sesión y endurecimiento básico del servidor | Completado |
| Settings | Usuarios, roles, asignación de marcas y autorización por rol y por marca | Completado |
| Actions | Actions Workspace, acciones por PM y agregados de negocio en el servidor | Completado |
| Búsqueda global | Búsqueda desde la barra superior resuelta con SQL en el servidor | Completado |
| Forecast | Conciliación de facturación de proyectos en el servidor y ajustes de calidad | Completado |
| UI | Navegación en sidebar, navegación móvil y tema Tecno | Completado |
| SQL-002 | Analítica de ventas en SQL (ver sección propia) | Completado |

Despliegue: backend en producción en `543c926`; frontend publicado por última vez el 28 oct 2026.

## Plataforma PostgreSQL

El backend vive en `server/` y persiste los datos en PostgreSQL mediante migraciones SQL numeradas que se aplican manualmente (procedimiento en `CLAUDE.md` §12). Desde la `035`, cada migración nueva lleva su rollback en `server/migrations/rollback/`.

| Migraciones | Contenido |
|---|---|
| 001–011 | Tablas base de importaciones y de los datasets |
| 012–026 | Staging para importación por chunks, identidades lógicas, ajustes de importación y clientes |
| 027–030 | Usuarios, roles y asignación de marcas |
| 031–032 | Agregados de negocio por marca, cliente y periodo, y acciones por PM |
| 033 | Alias canónico de STREAMAX |
| 034 | Propiedad de los agregados de negocio |
| 035 | Caché de dueños de respaldo de productos (SQL-002) |

## Sales Analytics en servidor — SQL-002

| Entrega | Alcance | Estado |
|---|---|---|
| SQL-002 | Segmentación de ventas en SQL: diagnóstico, summary, group-by, filtros, facetas, detalle, API y overlay en Sales Workspace | Completado |
| SQL-002 | Persisted fallback owner cache (`543c926`) | Desplegado en producción el 30 oct 2026 |

SQL-002 persiste los dueños de respaldo de productos en la vista materializada `sales_fallback_owner_candidates` (migración 035), para que la segmentación de Sales Analytics no reconstruya la identidad de producto sobre todo `sales_facts` en cada consulta. Despliegue en producción: migración 035 aplicada, backend reiniciado, validación funcional correcta e importaciones de ventas y productos correctas.

## Seguridad — SEC-001

| Entrega | Alcance | Estado |
|---|---|---|
| SEC-001 (S2) | Importaciones del Data Center (`POST /api/data/*/import`, `/imports/*`, `targets/import` y `POST /api/data/exchange-rates`) limitadas a roles con alcance total (`scope = 'all'`) y escritura (`requireDataImportAccess`) | Desplegado y validado en producción el 12 nov 2026 |
| SEC-001 (S3) | `POST /api/data/sales/analytics/*` (summary, group-by, filter-options, detail-rows) deja de exigir escritura: los roles de solo lectura (engineering) ya pueden usar la segmentación de ventas | Desplegado y validado en producción el 12 nov 2026 |

SEC-001 atiende los hallazgos S2 y S3 de la auditoría. Solo backend y sin migraciones. Los PMs (`scope = 'assigned'`) conservan la creación y edición de acciones (`requireWriteAccess` en `/api/actions` sin cambios), pero ya no pueden importar ni reemplazar datos. La analítica de ventas sigue protegida por `requireAuth`, `loadAuthenticatedUser` y la validación de alcance y marcas de su propio router.

## Seguridad — SEC-002

| Entrega | Alcance | Estado |
|---|---|---|
| SEC-002 (S4) | Dependencias vulnerables: se quitan `axios` y `@tanstack/react-query` (sin uso), `npm audit fix` en raíz y `server/`, y `xlsx` 0.18.5 se sustituye por SheetJS 0.20.3 desde `cdn.sheetjs.com` | Implementado · pendiente de validación funcional y despliegue |

SEC-002 atiende el hallazgo S4 de la auditoría. Después del cambio, `npm audit --omit=dev` reporta 0 vulnerabilidades en la raíz y en `server/` (proxy-addr, body-parser y qs corregidos en `server/`). Sin migraciones.

- Bundle: rolldown 1.2 (vite 8.3) junta en `index` el código que se carga al arrancar, y eso metió `xlsx` en el bundle inicial. `executeImport` en el store del Data Center ahora carga `importService` bajo demanda, así que `xlsx` (492 kB) queda en su propio chunk y solo se descarga al importar o exportar. El JS al arrancar baja a 482 kB.

- `xlsx` se instala desde el tarball oficial de SheetJS, no desde el registro de npm: `npm audit` y `npm outdated` ya no lo revisan, así que sus actualizaciones se siguen a mano en `cdn.sheetjs.com`.
- Despliegue: cambian `package-lock.json` en la raíz y en `server/`, así que hace falta `npm ci` en ambos. El servidor de producción necesita acceso a `cdn.sheetjs.com` para instalar `xlsx`.

## Seguridad — SEC-003A

| Entrega | Alcance | Estado |
|---|---|---|
| SEC-003A (S1) | Visibilidad de costos por rol y marca en el backend: columna `app_roles.cost_access` (migración 037), costos ocultos en pricing, inventario, productos y órdenes de compra fuera del alcance del usuario, ETag con el alcance de costos y `cost_access` editable en Settings (API) | Implementado · pendiente de validación funcional y despliegue |
| SEC-003B | Interfaz de Settings para `cost_access` y protección del rol admin | Ver sección SEC-003B |
| SEC-003C | Costos en NULL en builders, engines, pantallas y exportaciones | Ver sección SEC-003C |

SEC-003A atiende el hallazgo S1 de la auditoría. Decisiones de negocio:

- admin, manager y pm ven costos; engineering no ve ningún costo.
- Con alcance `all` se ven todos los costos; con alcance `assigned`, solo los de las marcas asignadas (`brand_key()` de la marca de la fila contra las marcas del usuario).
- **Clientes, proyectos y facturación de proyectos no cambian: siguen completos para todos los roles.**
- Engineering sí ve utilidad bruta y margen en ventas de sus marcas asignadas; esto permite deducir el costo promedio vendido de esas marcas. Aceptado por la gerencia el 13 nov 2026.

Qué cambia en `GET /api/data/*`:

- `pricing`: solo filas de marcas dentro del alcance de costos. Sin acceso a costos, el dataset llega con cero filas y la misma forma.
- `inventory`: `unit_cost` e `inventory_value` en NULL fuera del alcance.
- `products`: `average_cost_usd`, `total_value`, `inventory_value_mxn` e `inventory_value_usd` en NULL fuera del alcance.
- `purchases`: `amount_foreign_currency` en NULL fuera del alcance.
- Las demás columnas y filas no cambian. El ETag de estos cuatro datasets incluye el alcance de costos y `DATASET_RESPONSE_FORMAT_VERSION` sube a 2.
- `PATCH /api/settings/roles/:roleKey` acepta `costAccess` (boolean). El rol admin no puede quedarse sin `cost_access`.

Despliegue: aplicar la migración 037 **antes** de reiniciar el backend; sin la columna, todas las rutas autenticadas responden 500. Para revertir, primero volver al código anterior y después aplicar el rollback de la 037. Verificación en `pm_intelligence_test` con `server/scripts/sec003aVerification.sql` (solo lectura).

## Seguridad — SEC-003B

| Entrega | Alcance | Estado |
|---|---|---|
| SEC-003B | Protección del rol admin y de los administradores activos, columna "Ver costos" en Settings y alcance de costos en el frontend | Implementado · pendiente de validación funcional y despliegue |

- `PATCH /api/settings/roles/:roleKey`: en los roles de sistema (`system_role`: admin y, hasta NAV-002B, analyst) rechaza con 400 cualquier cambio de alcance, escritura o estado, igual que ya lo bloquea la interfaz. El rol admin conserva `cost_access` (SEC-003A).
- `PATCH /api/settings/users/:id`: usa el mismo patrón transaccional del DELETE. Bloquea con `FOR UPDATE`, en orden de id, a quien hace el cambio, al usuario modificado y a todos los admins activos, y vuelve a verificar que quien hace el cambio siga siendo admin activo. Si el cambio le quita el rol admin o desactiva al último admin activo, responde 409 "Debe quedar al menos un administrador activo". Un admin puede degradarse a sí mismo si queda otro; su sesión refleja el cambio en la siguiente petición.
- Settings > Roles: columna "Ver costos" que envía `costAccess`. En el rol admin, los controles quedan deshabilitados con la nota "El rol Administrador siempre conserva acceso total".
- Settings > Usuarios: confirmación "Vas a quitarte permisos de administrador. ¿Continuar?" antes de que un admin cambie su propio rol o se deshabilite.
- Frontend: `costAccess` en `AuthenticatedUser`, `resolveCostVisibility` (espejo de `resolveCostScope`) y `normalizeBrandKey` en `src/features/auth/brandAccess.ts`, con prueba de paridad contra el servidor (incluido el alias STREAMAX).
- Sin migraciones.

## Seguridad — SEC-003C

| Entrega | Alcance | Estado |
|---|---|---|
| SEC-003C | Manejo de costos en NULL en builders, engines, pantallas y exportaciones | Implementado · pendiente de validación funcional y despliegue |

Antes de SEC-003C el NULL de costos se convertía en 0 en `buildBusinessInventory`, `buildBusinessPurchaseOrders`, `purchasingAnalytics` y el resumen de inventario del Data Center, así que Inventory, Forecast, Purchasing, el Data Center y las exportaciones mostraban $0 para costos ocultos. Decisiones de SEC-003C:

- Los valores de costo pasan a `number | null` en builders y engines. Los totales suman solo los valores presentes y cuentan los faltantes; si falta todo, el total es NULL. La UI solo lo representa.
- Presentación: sin acceso a costos, "Sin acceso a costo". Con alcance `assigned`, los totales que mezclan marcas dicen "Valor de tus marcas" (o la etiqueta equivalente). Un NULL de una marca fuera de alcance muestra "Sin acceso a costo"; un NULL de una marca permitida muestra "Sin dato". Nunca $0.
- Concentración de valor y `valueWeight` en riesgos de inventario: se calculan solo entre las posiciones con valor, con la suma de los valores presentes como denominador. Con alcance `assigned`, la explicación dice "sobre el valor de tus marcas". Si no hay ningún valor, no se calcula y todos quedan en +0. Con datos completos (admin) el resultado debe ser idéntico al actual, con una prueba que lo demuestre.
- Los campos de costo de Product master (`averageCostUsd`, `totalValue`, `inventoryValueMxn`, `inventoryValueUsd`) no se muestran en ninguna pantalla ni exportación; no requieren cambios.

Implementación:

- Reglas de suma en `src/core/business/analytics/costValues.ts`: los totales suman solo los valores presentes, cuentan los faltantes (`positionsWithoutValue`, `productsWithoutValue`, `linesWithoutAmount`, `rowsWithoutValue`) y quedan en NULL solo si falta todo; un conjunto vacío sigue en 0. Los NULL van al final de los rankings por valor.
- Presentación en `src/features/auth/costPresentation.ts` y `useCostVisibility`: "Sin acceso a costo", "Sin dato", etiquetas "de tus marcas" y las notas de alcance de las exportaciones de Inventory y Forecast.
- Una PO con líneas de varias marcas muestra el monto de las líneas visibles como "Parcial (tus marcas)".
- Settings > Usuarios recarga la página cuando un admin se quita el rol o se deshabilita, para que la interfaz refleje el cambio de inmediato.
- No regresión: `tests/services/sec003cNoRegression.test.ts` compara, con datos completos, inventario (totales, grupos, estados, participaciones), riesgos y oportunidades, catálogo, compras, forecast (Valor de inventario, Valor afectado y rankings) y el resumen del Data Center contra una línea base generada con el código anterior a SEC-003C.
- Executive Workspace, las colas de atención y Pulse no leen estos valores; no cambian.

## Operación — OPS-001

| Entrega | Alcance | Estado |
|---|---|---|
| OPS-001 | El backend no arranca sin las migraciones de las que depende, y script de migración con respaldo verificado | Implementado · pendiente de validación funcional y despliegue |

Incidente del 13 nov 2026: la 037 no se aplicó en producción (el `pg_dump` salió en 0 bytes y la migración falló por "must be owner of table app_roles"), el backend se reinició con el código nuevo y `/api/auth/me` respondió 500.

- `server/db/schemaCheck.js`: antes de `app.listen`, el backend verifica en `information_schema` la lista `REQUIRED_SCHEMA` (hoy, la tabla `data_cache_version` de la 036 y `app_roles.cost_access` de la 037). Si falta algo, escribe "Falta la migración NNN: …" por cada faltante y termina con código 1, sin reintentar. Si PostgreSQL no responde, reintenta cada 5 segundos hasta 24 veces ("Esperando a PostgreSQL… intento n/24") y, si se agotan, termina con "No se pudo verificar el esquema: …". Cada migración futura que agregue una tabla o columna que el código lea se agrega a esa lista.
- `server/scripts/apply-migration.sh` (se ejecuta con `bash server/scripts/apply-migration.sh server/migrations/NNN_….sql`): respaldo con `pg_dump` como `postgres` en `~/respaldos/pm_intelligence_db_pre_<NNN>_<fecha>.dump` con `umask 077`; se detiene si pesa menos de 1 MB; aplica con `sudo -u postgres psql -d pm_intelligence_db -v ON_ERROR_STOP=1 -1`; se detiene con un mensaje claro si `psql` falla; lista los requisitos de `REQUIRED_SCHEMA` que sigan faltando, con la misma consulta del backend, e indica reiniciar el servicio sin hacerlo por su cuenta.
- CLAUDE.md §12: `app_users`, `app_roles` y `app_user_brand_assignments` son de `postgres`, no de `pm_intelligence`; las migraciones se aplican con el script.

## Seguridad — SEC-004

| Entrega | Alcance | Estado |
|---|---|---|
| SEC-004 (S5, S6 y timeouts de S8) | Sesión, login, límites de peticiones y timeouts de PostgreSQL | Implementado · pendiente de validación funcional y despliegue |

Hallazgos atendidos:

- **S5 — Sesión y login.** `/signin/google` regenera la sesión (`req.session.regenerate()`) antes de guardar el usuario, para evitar la fijación de sesión. Valida el CSRF de Google: el campo `g_csrf_token` del formulario y la cookie `g_csrf_token` deben existir y ser iguales; si no, redirige a `/?auth_error=csrf` sin verificar la credencial. Se eliminó `POST /api/auth/google`, que el frontend no usaba (el login es `ux_mode: 'redirect'`).
- **S6 — Límites.** `/signin/google`: 20 intentos por 15 minutos por IP, después redirige a `/?auth_error=rate_limited`. `/api/search` y `/api/data/sales/analytics/*`: 120 peticiones por minuto por usuario (o por IP sin sesión), después 429 JSON. Cuerpos: JSON de 100 kb y formularios de 20 kb en general; las rutas de importación (chunks, `/import`, `targets/import` y `POST /api/data/exchange-rates`) aceptan 10 MB, y solo después de `requireAuth`, `loadAuthenticatedUser` y `requireDataImportAccess`. Un cuerpo mayor responde 413 JSON. LoginPage muestra los mensajes de `csrf` y `rate_limited`.
- **S8 — Timeouts.** `statement_timeout` (2 min) e `idle_in_transaction_session_timeout` (1 min) en el pool; 15 min solo en transacciones de importación con refresco de agregados (`finalizeSalesChunkImport`, `importSalesDataset` y `finalizeProductChunkImport`, con `SET LOCAL statement_timeout = '15min'`).

Los contadores de límite viven en memoria: se reinician con el backend y suponen un solo proceso. El límite de cuerpo de nginx (`client_max_body_size`) es independiente y se revisa en producción. Sin migraciones.

## Data Center — DC-001

| Entrega | Alcance | Estado |
|---|---|---|
| DC-001 | Sección "Fuentes de NetSuite" al inicio del Data Center para la carga semanal manual | Implementado · pendiente de validación funcional y despliegue |

- Una fila por importador con el reporte de NetSuite, el botón "Abrir en NetSuite", la última carga, el corte de datos y el estado ("Al día", "Atrasado", "Sin datos" o "Fuente sin configurar"), con color y texto.
- Fuentes configuradas en `src/features/data-center/config/netsuiteSources.ts`: ventas (reporte "TS - Detalle de ventas PM"), inventario (reporte "TS - Reporte de inventario por sucursal"), proyectos (búsqueda guardada "TS - Mis Proyectos PMs") y facturación de proyectos (búsqueda guardada "TS - Facturas por proyecto por item"), cada una con `staleAfterDays: 7`. Los demás importadores aparecen como "Fuente sin configurar" hasta confirmar su reporte.
- Última carga: fecha del último import completado de cada dataset en el store. Corte: fecha máxima de venta (`salesSummary.periodEnd`) y fecha de snapshot de inventario (`inventorySummary.periodEnd`). El estado se mide desde el corte o, sin corte, desde la última carga, comparando la fecha local del navegador (AAAA-MM-DD, sin horas).
- Solo frontend, sin cambios de permisos: se ve donde ya se ve el Data Center. La carga sigue siendo manual (exportar de NetSuite y arrastrar al Data Center).

## Data Center — DC-002

| Entrega | Alcance | Estado |
|---|---|---|
| DC-002 | Importar el inventario tal como sale de NetSuite ("TS - Reporte de inventario por sucursal"), sin normalizarlo a mano | Implementado · pendiente de validación funcional y despliegue |

- El parser detecta el preámbulo de NetSuite también para inventario: la fila de encabezado es la que contiene "Item" y "Marca". Si las sucursales vienen en celdas combinadas con las métricas en la fila siguiente, el encabezado se arma como "<SUCURSAL> <MÉTRICA>" (con `!merges`, o con el último grupo no vacío si no hay combinadas). La detección de ventas no cambia, y los archivos con encabezado en la fila 1 sin celdas combinadas (el V1 normalizado a mano) siguen el camino anterior: una prueba compara su resultado contra una línea base generada antes del cambio.
- Las filas de agrupación ("Inventory Item": texto en el artículo, sin marca, sin código y sin números) cuentan como filas ignoradas, no como errores.
- Alias de sucursales en un solo lugar (`importers/inventory/inventoryLocationAliases.ts`): `002 CDMX : CEDIS` → `CEDIS CDMX`, `002 CDMX : PROYECTOS` → `PROYECTOS`, `002 CDMX : VENTAS.` → `VENTAS CDMX`, `011 QUERETARO : VENTAS` → `VENTAS QRO`, `013 PUEBLA : VENTAS` → `VENTAS PUE`, `015 GUADALAJARA : VENTAS` → `VENTAS GDL`, `017 VERACRUZ : VENTAS` → `VENTAS VER`, `019 MERIDA : VENTAS` → `VENTAS MER`, `021 MONTERREY : CEDIS MTY` → `CEDIS MTY` y `021 MONTERREY : VENTAS` → `VENTAS MTY`. Se comparan sin mayúsculas, acentos, signos ni espacios repetidos. Una sucursal nueva conserva su nombre de NetSuite y el panel de importación muestra el aviso amarillo "Sucursal sin alias: …". "Total" se sigue ignorando.
- Fuentes de NetSuite (DC-001): la ayuda de inventario dice "Ejecutar el reporte, usar Exportar → Excel y arrastrar el archivo tal cual (no hace falta limpiarlo)".
- Verificación con el archivo real del 20 nov 2026 (no versionado): 4,677 artículos, las 10 sucursales con su nombre corto y, en cada artículo, la suma de "En Mano" de las sucursales igual a "Total En Mano". En esa exportación CEDIS CDMX y CEDIS MTY vienen vacías y el reporte no trae "Average Cost" en muchas posiciones; las posiciones sin costo quedan sin valor (SEC-003C).
- El reporte no trae fecha de corte, igual que el V1: el inventario se sigue importando sin `snapshotDate` y en Fuentes de NetSuite se mide por la última carga.

## Purchasing — PUR-001

| Entrega | Alcance | Estado |
|---|---|---|
| PUR-001 | Montos de Purchasing separados por moneda, sin conversión (hallazgo R9 de la auditoría) | Implementado · pendiente de validación funcional y despliegue |

- Decisión del negocio: los montos de compras se muestran por moneda y nunca se convierten con tipo de cambio.
- El engine (`purchasingAnalytics`) calcula totales, grupos (proveedor, comprador, marca y artículo), estados y aging en `amountsByCurrency`: por código de moneda (USD, MXN, …), con su monto, sus líneas sin monto (SEC-003C), órdenes, líneas, cantidad y vencidas. El código se normaliza (mayúsculas, sin espacios); una orden sin moneda va al grupo `SIN_MONEDA` ("Sin moneda") y se cuenta en `purchaseOrdersWithoutCurrency`. El campo `orderedAmountForeignCurrency`, que sumaba todas las monedas, ya no existe.
- `selectPurchasingCurrencyView` arma los rankings, el aging y los estados de una moneda: solo entran las órdenes de esa moneda, ordenadas por su monto en ella. El ranking por comprador no tiene montos (se arma con solicitudes). Los grupos que solo tienen solicitudes, sin órdenes, no aparecen en los rankings con monto.
- Purchasing Workspace: el KPI "Monto ordenado" muestra cada moneda ("USD $1,234,567 · MXN $890,123"), conserva "Monto de tus marcas" y "Sin acceso a costo"; un selector de moneda (USD por defecto) aplica a rankings y aging, e indica cuántas órdenes quedan en otras monedas; aviso amarillo con el número de órdenes sin moneda; cada PO se muestra con su propia moneda.
- Ningún otro módulo usa el monto de compras: no hay exportación de Purchasing, Executive solo usa la disponibilidad de los datasets y el resumen de importación del Data Center ya separaba por moneda.
- Pruebas: no regresión contra una línea base generada antes del cambio con datos solo en USD (mismos montos, faltantes y orden); datos mixtos USD + MXN sin sumas entre monedas; rankings por moneda; grupo "Sin moneda"; combinación con costos ocultos. En la línea base de SEC-003C se quitaron las 17 claves `orderedAmountForeignCurrency` (sus valores quedan en la prueba, que verifica que la separación por moneda los conserva); las órdenes de ese fixture son todas USD.

## Limpieza — R2

| Entrega | Alcance | Estado |
|---|---|---|
| R2 | Eliminar código muerto, rutas de backend sin uso y residuos versionados (hallazgo R2 de la auditoría), sin cambios de comportamiento | Implementado · pendiente de validación funcional y despliegue |

- Frontend: 60 archivos de producción en `src/` que no se alcanzan desde `src/main.tsx` (imports estáticos y dinámicos), 5,791 líneas: Pulse (`features/pulse`, `engine/pulseEngine.ts`, `engine/types.ts` y sus widgets de `atlas`), los widgets `atlas/widgets/executiveBrief` y `atlas/widgets/opportunity`, Brand Dashboard (`features/brand-dashboard`, `components/business/executive-briefing`, `core/insights`), componentes sin uso (`components/business/ranking`, `components/workspace/layout` y `toolbar`, `brand-workspace/components`, `shared/ui`), `core/business/metrics/revenueComparison.ts`, `datasetHealthAdapter.ts`, `ExecutiveInsightPanel.tsx`, `brandIntelligenceTypes.ts` de `features`, `salesPipeline.ts` y 10 índices que solo re-exportaban. Se eliminaron las 2 pruebas que solo cubrían widgets eliminados.
- Se conservan 5 archivos que no alcanza `main.tsx`: `buildConstants.d.ts` (tipos globales), `core/business/testing/createMinimalBusinessModel.ts` y los índices de `importers/inventory`, `importers/products` y `forecast-workspace`, que usan pruebas de código vivo.
- Backend: se eliminaron `GET /api/data/status` (`routes/dataStatus.js`) y las importaciones sin chunks `POST /api/data/sales/import` y `POST /api/data/inventory/import` con `salesImportService.js` e `inventoryImportService.js`; el frontend solo usa las importaciones por chunks. Las pruebas de refresco y `statement_timeout` (SEC-004) siguen vigilando `salesChunkImportService.js` y `productChunkImportService.js`. El límite de 10 MB para `/api/data/<x>/import` no cambia (lo usa `targets/import`).
- Residuos: se eliminaron `scripts/integrate-business-routes.mjs`, `IW006_CONTEXTO_ACTUAL.txt` e `IW006_PREPARAR_CONTEXTO.cmd`; `README_APLICACION.md`, `README_FIX.md`, `CHANGELOG_0.24.2.md` y `PRODUCT_MASTER_CONSOLIDATION_v0.24.5.md` se movieron a `docs/archive/`.

## Mi día — MD-001

| Entrega | Alcance | Estado |
|---|---|---|
| MD-001 | Backend de "Mi día": venta, cuota, avance, cierre por ritmo, brecha diaria, variación, GP, margen, clientes, productos, participación, estado, tendencia y atención de las marcas del usuario, más los clientes por recuperar | Implementado · pendiente de validación funcional y despliegue |

- `GET /api/my-day?period=YYYY-MM`: el periodo por defecto es el mes de la fecha de corte (`MAX(sale_date)`). Devuelve `dataCutoff`, `periodStatus` (`open`, `closed`), días hábiles (`elapsed`, `total`, `remaining`, lunes a viernes, `holidaysExcluded: false`), la ventana de comparación, las reglas (`rules`), el total de la cartera (`portfolio`) y una fila por marca (`brands`). Un periodo posterior al corte responde sin marcas (`reason: 'period-after-data-cutoff'`).
- `GET /api/my-day/lost-customers`: los clientes que compraban la marca y llevan 2 meses completos sin comprarla, con la misma regla y consulta que `/api/metrics/brands/:brand/lost-customers`, para todas las marcas del usuario (una fila por marca y cliente). Acepta `brand` solo dentro de las marcas del usuario, y `period`, `inactivePeriods`, `basePeriods`, `limit` y `offset`.
- Marcas: las asignadas al usuario (`app_user_brand_assignments`), nunca las que envía el cliente. Con alcance `all` y sin asignaciones, todas las marcas con venta o meta en el periodo o el anterior. Sin asignaciones y sin alcance `all`: 200 con `brands: []` y `reason: 'no-brand-assignments'`. Los alcances sin acceso comercial se rechazan con 403, como en `requireBrandScope`.
- Estado, tendencia, participación y atención usan las reglas de la tabla "Detalle ejecutivo por marca" de Executive: ±5 % para estable, caída de 15 % o más para atención, y el mismo comparativo contra el mes anterior cortado en los mismos días hábiles. La participación es dentro de la cartera del usuario. Una prueba de paridad compara umbrales, textos y fechas de corte (todos los días de 2024 a 2027) con el frontend.
- Ritmo: cierre proyectado = venta / días hábiles transcurridos × días hábiles del mes; brecha diaria = (cuota − venta) / días hábiles restantes. En el total de la cartera, la cuota, el avance y la brecha usan solo las marcas con meta. `target.workingDays` de `brand_targets` se devuelve como dato informativo y no se usa en el cálculo.
- Umbrales en `server/services/myDayRules.js` (`MY_DAY_RULES`). Límite de solicitudes de SEC-004 en `/api/my-day`. Sin migraciones; `/api/metrics/*` y `comparisonWindow` no cambian. En el frontend solo se exportan los dos umbrales de `brandIntelligence.ts` para la prueba de paridad.

## Mi día — MD-002

| Entrega | Alcance | Estado |
|---|---|---|
| MD-002 | Backend de disponibilidad de "Mi día": agotados, por agotarse y llegadas de órdenes de compra de las marcas del usuario; `view=all` para alcance `all`; estatus y fecha de última venta desde el inventario (migración 038) | Implementado · pendiente de validación funcional y despliegue |

- `GET /api/my-day/stock-alerts`: resumen con los primeros `limit` (20 por defecto) de cada lista, el total, la calidad de datos y la frescura de inventario, órdenes de compra y ventas (atrasado después de 7 días, igual que DC-001). `GET /api/my-day/stock-alerts/out-of-stock` y `/low-stock`: la lista completa, paginada con `limit` y `offset`.
- Fuente del artículo: el último import completado de inventario (por `import_id`). Llave: el código de "Item" en mayúsculas, sin espacios en los extremos y con espacios colapsados; es la misma llave para `purchase_orders.item_code` y `sales_facts.product_name`. Marca, estatus ("Estatus") y fecha de última venta ("Fecha de ultima venta") salen del inventario, no del Product Master. Existencia = suma de "En Mano" de todas las sucursales; por recibir (`pendingReceiptUnits`) = suma de "Cantidad Actual en Orden", que NetSuite ya calcula descontando lo recibido. No se usa la cantidad de las PO ni "Cantidad Actual en Tránsito" (traspasos entre sucursales).
- Agotados: todos los artículos `DE LINEA` con existencia total 0, sin excluir ninguno, ordenados por venta promedio mensual de los últimos 3 meses (mayor a menor); los que no vendieron en 3 meses van al final por fecha de última venta (más reciente primero) y los que nunca vendieron, al último. Por agotarse: `DE LINEA`, existencia > 0, venta neta > 0 y cobertura ≤ 30 días. Ventana de ventas en días calendario, de la fecha de corte de ventas hacia atrás 3 meses.
- Próxima llegada por artículo (`arrivalStatus`): `scheduled` (PO pendiente con fecha estimada ≥ corte), `overdue` (solo PO con fecha anterior al corte), `no-date`, `no-po-data` (en orden > 0 sin PO pendiente cargada) y `no-po` (en orden = 0; si aun así hay PO pendiente, se cuenta en `dataQuality.purchaseOrdersWithoutOnOrder`). PO pendiente = `Pending Receipt` o `Pending Bill`, solo líneas de producto; `Pending Supervisor Approval` no cuenta.
- `GET /api/my-day/arrivals`: una fila por PO pendiente con fecha estimada entre el corte y el corte + 14 días, más las atrasadas. Montos por moneda sin conversión (PUR-001); sin acceso a costos el monto es `null` con `costHidden: true`, nunca 0 (SEC-003A, misma condición que el servicio de compras).
- Un import de inventario sin estatus responde `reason: 'catalog-status-missing'`; los artículos sin estatus o sin marca se cuentan en `dataQuality`, nunca se infieren. "- Unassigned -" no se oculta.
- `view`: `mine` por defecto (comportamiento de MD-001); `view=all` solo con alcance `all` (403 sin él, 400 con un valor inválido) en `/api/my-day`, `/lost-customers`, `/stock-alerts` y `/arrivals`. El filtro `brand` solo se acepta dentro de las marcas del usuario.
- Migración 038: `catalog_status` y `last_sale_date` en `inventory_snapshots` y en `inventory_import_staging`, con rollback y entrada en `REQUIRED_SCHEMA`. No modifica datos y no sube `data_cache_version`; los datos llegan con la siguiente carga de inventario.
- Reglas en `server/services/myDayAvailabilityRules.js` (`MY_DAY_AVAILABILITY_RULES`), devueltas en `rules`. Sin índices nuevos.
- DC-001: la fuente "TS - Lista de PO con Item" (búsqueda guardada 3582, exportada a Excel) queda configurada para Órdenes de compra.
- Pendiente fuera de MD-002: el export de PO's solo trae PO con fecha del 1 oct al 25 nov 2026; hasta ampliar el filtro a todas las abiertas, habrá artículos con `no-po-data`.

## Mi día — MD-002-HOTFIX1

| Entrega | Alcance | Estado |
|---|---|---|
| MD-002-HOTFIX1 | Agotados completos: un registro por artículo de la última carga de inventario (`inventory_items`, migración 039), incluidos los artículos sin ninguna cantidad, y bandera de cobertura en "Mi día" | Implementado · pendiente de validación funcional y despliegue |

- Causa: el export crudo de NetSuite deja vacías las celdas en cero aunque traiga "Show Zeros". Desde IW-001 (importación por sucursal, 30 jul 2026) el normalizador solo genera posiciones con alguna cantidad, así que un artículo sin ninguna cantidad no llega a `inventory_snapshots`. Con el export del 26 nov 2026 se perdían 2,584 de 4,682 artículos, entre ellos 321 de los 649 `DE LINEA` agotados.
- Las posiciones no cambian: `inventory_snapshots`, `/api/data/inventory`, su ETag, el Inventory Workspace y la regresión V1 quedan igual.
- `buildInventoryItems` (frontend) arma un registro por artículo con los totales de todas las sucursales (celda vacía = 0), sin la fila "Inventory Item" ni las columnas "Total", a partir de las mismas posiciones normalizadas. Se sube en lotes de 500 a `POST /api/data/inventory/imports/:id/items`. Sin costos: si algún día se necesitan, se agregan pasando por `cost_access`.
- Al cerrar la carga, el servidor exige que los registros sean exactamente `expectedItemCount` y que la suma de En Mano, de en orden y de posiciones cuadre con las posiciones de la misma carga (tolerancia 0.0001). Si no cuadra, responde 422 con el detalle, revierte la carga y conserva la anterior. Solo se guardan los registros de la última carga.
- "Mi día" lee agotados y por agotarse de `inventory_items` cuando la carga tiene registros (`inventoryCoverage.complete: true`, `source: 'items'`). Una carga anterior solo tiene posiciones: usa las posiciones y responde `complete: false` con `reason: 'inventory-loaded-before-item-records'`, también en `outOfStock.complete` y `lowStock.complete`. Cada fila trae `positions` (0 = artículo sin ninguna cantidad).
- Migración 039: tabla `inventory_items` (llave `import_id`, `item_code`), creada como `postgres` con `GRANT SELECT, INSERT, DELETE` a `pm_intelligence`; rollback sin `CASCADE`; requisito en `REQUIRED_SCHEMA`; no sube `data_cache_version`. La ruta `items` usa el límite de cuerpo de importación (10 MB) después de la autenticación y el permiso de importación.
- Despliegue: backend antes que frontend (el frontend nuevo llama a la ruta `items`). Hasta recargar el inventario, "Mi día" marca la cobertura como incompleta.

## Mi día — MD-003

| Entrega | Alcance | Estado |
|---|---|---|
| MD-003 | Página "Mi día" (`/my-day`): indicadores, detalle de marcas, acciones prioritarias, clientes por recuperar, por agotarse, agotados y PO's por llegar, solo con `/api/my-day/*` y `/api/actions`; carga de datasets movida a `DataHydrationGate` | Implementado · pendiente de validación funcional y despliegue |

- Ruta `/my-day`, workspace `my-day` para todos los roles (incluido engineering) y entrada "Mi día" en el menú arriba de Executive. `/` sigue siendo Executive; el cambio de página de inicio queda para NAV-001.
- La página solo llama a `/api/auth/me`, `/api/my-day/*` y `/api/actions` con `authenticatedFetch` (una sesión expirada regresa al login). No descarga ningún `/api/data/*`. Cada bloque carga, falla y se reintenta por separado.
- `DataHydrationGate`: `main.tsx` ya no espera `hydratePersistedData()` antes de dibujar. Todas las rutas existentes quedan dentro del gate, que carga los datasets una vez por sesión y muestra "Cargando datos…" hasta tenerlos; `/my-day` queda fuera. La pantalla de login ya no descarga datasets. Eliminar la descarga global sigue siendo C-001.
- Encabezado: "Datos al corte", "Mis marcas / Todas" solo con alcance `all` y selector de periodo (mes de corte y los 11 anteriores). El periodo cambia indicadores, marcas y clientes por recuperar; inventario, por agotarse, agotados y PO's siempre van al corte, y cada bloque lo indica.
- Indicadores: venta (con cuota), avance contra el esperado (días hábiles transcurridos / totales), cierre por ritmo (`projectedRevenueWithTarget` con `projectedAttainment`, y el de todas las marcas como texto secundario) y brecha diaria. Nota: "Cuota, avance, ritmo y brecha consideran solo marcas con meta (N de M)". Colores del cierre por ritmo en un solo lugar (`PACE_THRESHOLDS`): verde ≥ 100 %, ámbar 90 a 99.9 %, rojo < 90 %.
- Detalle de marcas ordenado por venta, con enlace a la ficha de marca (mismo identificador que el modelo de negocio, prueba de paridad), estado y tendencia en español; `null` se muestra como "—" y la venta puede ser negativa.
- Acciones prioritarias: `status=open,in_progress,blocked&limit=500`, filtradas por las marcas del usuario con "Mis marcas" y ordenadas en el cliente por prioridad y vencimiento.
- Agotados con su total y "Ver todos" paginado; por agotarse con cobertura; próxima llegada con `arrivalStatus` en español (Programada, Atrasada, Sin fecha, Sin PO cargada, Sin PO). PO's por llegar con montos por moneda sin convertir y "Sin acceso a costo" en lugar de $0. Avisos de fuente atrasada y de inventario cargado antes de MD-002-HOTFIX1.
- Alcance `pricing` o `legacy` (o un 403 del servidor): "Mi día no está disponible para tu tipo de acceso".
- Sin cambios de backend ni migraciones.

## Mi día — MD-003-HOTFIX1

| Entrega | Alcance | Estado |
|---|---|---|
| MD-003-HOTFIX1 | Ajustes de presentación de "Mi día" encontrados en la validación en producción (26 nov 2026) | Implementado · pendiente de validación funcional y despliegue |

- PO's por llegar: pestañas "Por llegar (N)" (del corte a +14 días, de la más próxima a la más lejana) y "Atrasadas (N)" (antes del corte, de la más reciente a la más antigua), cada una con su paginación. Las 291 atrasadas ya no entierran a las que llegan pronto. Backend: parámetro aditivo `status=upcoming|overdue` en `GET /api/my-day/arrivals` (400 con otro valor); sin él la respuesta es la de MD-002, más el campo `status: 'all'`. `summary` siempre trae los conteos de ambos estatus.
- Clientes por recuperar: con `basePeriods = 1` una sola columna "Venta del mes base"; con más meses base, "Venta base" y "Prom. mensual". La decisión sale de `basePeriods` de la respuesta. Subtítulo construido desde la ventana: "Compraron en agosto de 2026 y no compraron ni en septiembre ni en octubre de 2026" (con más meses, "entre <inicio> y <fin>").
- Formato: todo `src/features/my-day` ya pasaba `es-MX` explícito; el "$60.174.004" del celular venía de un navegador sin los datos de es-MX que cae en "es" (España). Los números de "Mi día" usan es-MX solo si el navegador realmente lo formatea como en México (1,234.5) y si no en-US (mismos separadores); el símbolo de moneda se arma aparte ($ para MXN, el código ISO para otras). Prueba en `tests/architecture/myDayLocale.test.ts` que falla con `toLocale*`, `localeCompare` o `Intl.*` sin locale explícito, o con los formateadores compartidos.
- Selector de periodo: "Noviembre de 2026" (solo la primera letra en mayúscula), sin `capitalize` de CSS.
- Sin migraciones. Despliegue con reinicio del backend (cambia `server/routes/myDay.js` y `server/services/myDayAvailabilityRules.js`).

## Navegación — NAV-001

| Entrega | Alcance | Estado |
|---|---|---|
| NAV-001 | Menú por rol, "Mi día" como inicio, Panorama ejecutivo en `/executive`, navegación en español, buscador con Ctrl+K y "Datos al corte" en la barra superior | Implementado · pendiente de validación funcional y despliegue |
| NAV-002 | Rol de auxiliar vinculado a sus PMs (R3 de la auditoría) | Implementado (ver sección NAV-002) |
| NAV-002B | Retiro de los roles `legacy` (`analyst`, `viewer`, migración 041) | Implementado · pendiente de despliegue (ver sección NAV-002B) |

- Menú (`src/layouts/navigation/navigationConfig.ts`): Inicio (Mi día), Mi trabajo (Marcas, Clientes, Productos, Acciones), Análisis temporal (Ventas, Pronóstico, Inventario, marcados `temporary` para MB-001 y PR-001), Gerencia solo para admin y manager (Panorama ejecutivo, Pricing Lab, Compras; "Proyectos" reservado sin mostrarse) y Administración (Centro de datos con Calidad de producto debajo, Configuración). Los permisos no cambian: un PM puede seguir abriendo Panorama ejecutivo, Pricing Lab o Compras por URL o enlaces internos.
- Rutas: "Mi día" en `/` (todos aterrizan ahí después del login, sin descargar datasets); Panorama ejecutivo en `/executive` y cola de atención en `/executive/attention/:domain`. `/my-day` y `/attention/:domain` redirigen conservando parámetros.
- Español: menú, título de la barra superior y de la pestaña, h1, eyebrow, breadcrumbs y botones "Volver" de todas las pantallas, subtítulo de la marca ("Inteligencia comercial"). Los títulos de secciones internas (Executive Brief, Executive Score, AI Commercial Intelligence, Product Radar, Lost Customers, etc.) quedan para MB-001 y PR-001.
- Buscador: Ctrl+K / Cmd+K desde cualquier pantalla, con indicación visible; visible desde pantallas medianas; texto "Buscar cliente, modelo o marca"; el cliente usa `authenticatedFetch`. No descarga datasets.
- "Datos al corte" en la barra superior con `GET /api/status/data-cutoff` (solo sesión, sin alcance de marcas, con límite de solicitudes): fecha de corte de ventas, punto ámbar si alguna fuente tiene más de 7 días y fechas de ventas, inventario y compras al pasar el cursor. Se vuelve a consultar al regresar a la pestaña.
- Mientras sale NAV-002, "Mi día no está disponible para tu tipo de acceso" muestra enlaces a las pantallas que ese rol puede abrir.
- Sin migraciones. Despliegue con reinicio del backend (endpoint nuevo).

## Mi día — MD-003-HOTFIX2

| Entrega | Alcance | Estado |
|---|---|---|
| MD-003-HOTFIX2 | Cartera de "Mi día" con la venta de TODAS las marcas contra la cuota total | Implementado · pendiente de validación funcional y despliegue |

- Corrige la decisión 5 de MD-003 y la regla de cartera de MD-001 ("cuota, avance y brecha solo con marcas con meta"). Ahora el avance, la brecha, el cierre por ritmo, el avance del cierre y la brecha diaria de la cartera comparan la venta de todas las marcas (con y sin cuota) contra la suma de cuotas, igual que el reporte de avance de cuota (Alcance_cuota_marcas_GAP) y la regla DNR. Ejemplo: octubre 2026 con "Todas" pasa de 78.6 % a 80.4 % ($42,276,165 contra $52,551,606).
- `revenueWithTarget`, `projectedRevenueWithTarget` y `brandsWithTarget` se conservan como datos informativos. Por marca no cambia: una marca sin cuota sigue con avance nulo ("—").
- "Mi día": el cierre por ritmo muestra la proyección de todas las marcas con su avance (deja de decir "Todas las marcas $…"); nota "Avance, ritmo y brecha comparan la venta de todas las marcas contra la cuota total (N marcas sin cuota)". Los colores del cierre por ritmo usan el avance nuevo.
- Sin migraciones. Despliegue con reinicio del backend (`server/services/myDayRules.js`).

## Usuarios — NAV-002

| Entrega | Alcance | Estado |
|---|---|---|
| NAV-002 | Rol "Auxiliar" (`assistant`) vinculado a sus PMs: ve las marcas de ellos, sin costos ni Gerencia (pendiente R3 de la auditoría) | Implementado · pendiente de validación funcional y despliegue |

- Migración 040: rol `assistant` ("Auxiliar", alcance `assigned`, escritura solo para Acciones, sin costos; `cost_access` configurable en Configuración), CHECK `app_users_role_check` con los 7 roles y tabla `app_user_pm_links` (auxiliar–PM, llave del par, sin vincularse a sí misma, borrado en cascada, `GRANT SELECT, INSERT, DELETE` a `pm_intelligence`). Rollback: pasa las auxiliares a `analyst`, restaura el CHECK y borra tabla y rol, sin `CASCADE`. Sin datos de usuarios.
- Marcas efectivas (`server/services/effectiveBrands.js`): asignaciones propias más las de los PMs vinculados que estén activos y con rol `pm`. Las usan `loadAuthenticatedUser` (`requireBrandScope`, `resolveCostScope`, `/api/auth/me` y por tanto "Mi día", búsqueda, ventas y acciones) y Acciones. Una auxiliar sin PMs ni marcas se comporta como un PM sin marcas (mismo 403).
- Acciones: la auxiliar crea, edita y comenta acciones de las marcas a su alcance; puede editar las suyas y las de sus PMs vinculados; no puede asignar ni reasignar acciones a otros (el backend ya lo exigía con alcance total).
- Menú y acceso: Inicio, Mi trabajo y Análisis, como un PM; a diferencia del PM, sin acceso por URL a Panorama ejecutivo, Pricing Lab ni Compras. Sin Administración ni importaciones.
- Configuración (solo admin): "Auxiliar" en el selector de rol; para una auxiliar, "PMs a cargo" (solo PMs activos, nunca ella misma) con `GET`/`PUT /api/settings/users/:id/pms` y "Marcas efectivas" en solo lectura con el PM de donde viene cada una. Al pasar a una auxiliar a otro rol se borran sus vínculos; los vínculos hacia un PM se conservan pero solo cuentan mientras ese PM esté activo con rol `pm`.
- Los roles `analyst` y `viewer` no cambiaron en NAV-002: se retiraron en NAV-002B (migración 041).
- Despliegue: migración 040 antes de reiniciar el backend (la carga del usuario lee la tabla en cada petición).

## Usuarios — NAV-002B

| Entrega | Alcance | Estado |
|---|---|---|
| NAV-002B | Retiro de los roles heredados `analyst` y `viewer` y del alcance `legacy` (pendiente R3 de la auditoría) | Implementado · pendiente de despliegue |

- Migración 041: guarda de seguridad que falla con un mensaje claro (`RAISE EXCEPTION`) y no cambia nada si algún usuario conserva `analyst` o `viewer`; CHECK `app_users_role_check` con `admin`, `manager`, `pm`, `engineering` y `assistant`; `DELETE` de los dos roles de `app_roles`. Se borran y no se desactivan porque no hay llaves foráneas hacia `app_roles` y un rol inactivo seguiría listándose en Configuración; la protección de roles de sistema (SEC-003B) solo bloquea editar alcance, escritura y estado por la API, no una migración. Sin tablas ni columnas nuevas: sin entrada en `REQUIRED_SCHEMA`.
- Rollback 041: restaura el CHECK de 7 roles y los dos roles con los valores de la 028. **Si hubiera que retroceder también la 040, el rollback 041 va primero:** el de la 040 pasa a las auxiliares al rol `analyst`, que después de la 041 no existe.
- Código: `ALLOWED_ROLES`, selector de rol de Configuración, `ROLE_WORKSPACE_ACCESS` y el alcance `legacy` (tipos, `ALLOWED_SCOPES` y opciones de Configuración) sin los roles heredados. El rol preseleccionado al crear un usuario pasa de `viewer` a `engineering` (el de menor privilegio que queda). Un rol sin entrada en la matriz de acceso no tiene acceso y ya no rompe la aplicación.
- "Mi día no está disponible para tu tipo de acceso" se conserva: sigue sirviendo para el alcance `pricing` y para cualquier 403 del servidor.
- Alcance `pricing`: ningún rol lo usa desde la migración 029 (borró el rol `pricing`). No se tocó en este sprint; sigue aceptado en `app_roles.scope`, en Configuración y en el frontend. Pendiente de decidir si se retira.
- Despliegue: consulta previa de usuarios por rol, migración 041 y luego el reinicio del backend (el código nuevo ya no acepta los roles que la migración borra).

## Marcas — MB-001 (entrega 2A, servidor)

| Entrega | Alcance | Estado |
|---|---|---|
| MB-001 · 2A | Ficha de marca servida desde el servidor (`/api/brands`): directorio, encabezado, Ventas, Clientes y Productos | Desplegada con la migración 042 (comparativo anual 94-290 ms) |
| MB-001 · 2B | Pantalla de la ficha de marca (`src/features/brands/`) | Implementada · pendiente de validación funcional y despliegue |

- Endpoints (solo lectura, alcance = marcas efectivas, auxiliares incluidos; fuera de alcance → 403): `GET /api/brands`, `/:brand`, `/:brand/sales` (`sections=comparison,yoy,series,documents`), `/:brand/sales/export`, `/:brand/customers` (`filter=activos|por-recuperar|suben|bajan`), `/:brand/products` (`filter=vendidos|por-recuperar|agotados`).
- La marca se identifica por `brand_key` y la URL acepta el nombre de ventas, el normalizado o la llave (`UNV (UNIVIEW)`, `unv (uniview)`, `UNVUNIVIEW`). Marca sin ventas en el periodo → 200 con ceros y faltantes; marca desconocida → 404.
- Periodo: últimos 12 meses (por defecto el mes del corte), serie de 24 meses. Mes contra mes con las reglas de Mi día (MD-001); año contra año, acumulado y cierre anual portados EXACTAMENTE de `brandCommercialComparison.ts` (prueba de paridad en `tests/services/brandCommercialParity.test.ts`).
- Utilidad bruta y margen revelan el costo: sin acceso a costos de la marca salen como `null` más `costHidden: true` (nunca 0) y el export no trae esas columnas. Supuesto pendiente de confirmar: Mi día y `/api/data/sales` hoy sí las muestran a todos.
- Migración 042 (`idx_sales_facts_brand_key_sale_date` sobre `sales_facts (brand_key(brand), sale_date)`): en producción el comparativo anual tardaba 1.1-1.4 s porque `brand_key()` se evaluaba sobre ~500 mil filas. Transacción propia, sin `CONCURRENTLY` (bloquea escrituras de `sales_facts` mientras se crea: aplicar fuera de horario y fuera de una importación), con rollback, sin subir `data_cache_version` y fuera de `REQUIRED_SCHEMA`. Si una migración futura cambia `brand_key()`, debe hacer `REINDEX` en la misma migración. Sin cambios en `/api/data/*`. Reglas en `server/services/brandRules.js`, SQL en `brandsService.js`, rutas en `server/routes/brands.js`.
- Medición: `node server/scripts/explainBrandQueries.js --cutoff=YYYY-MM-DD BELDEN <marca-top>` imprime un script de solo lectura para `psql`. La migración 042 solo se propone si alguna consulta pasa de ~500 ms.
- Despliegue: solo backend (`git pull` y reinicio). Rollback: `git revert` local del commit.
- 2B (pantalla): `/brands` (directorio con búsqueda, filtro con/sin venta, orden y periodo) y `/brands/:brandId/(ventas|clientes|productos)` fuera de `DataHydrationGate`; `/brands/:brandId` redirige a `/ventas` conservando el periodo; `/brands/:brandId/inteligencia` dentro del gate con la página de inteligencia actual (Decision Core en el navegador). Ventas: 4 indicadores, acciones abiertas, mes contra mes, año contra año (Mes equivalente, Acumulado YTD, Cierre anual con "N de 12 meses" si la cuota está incompleta), serie de 24 meses, documentos paginados y "Exportar detalle" (Excel con SheetJS; avisa si viene `truncated`). Clientes (activos, por recuperar, suben, bajan) y Productos (vendidos, por recuperar, agotados, con existencia y estatus de catálogo). Sin acceso a costos: "—" y una nota, nunca $0. 403 con el mensaje del servidor y 404 "Marca no encontrada". `/sales` redirige a `/brands`; "Ventas" sale del menú; Pronóstico enlaza a `/forecast` marcado MB-002.
- MB-001C (comparativo año contra año de cartera en el directorio): `GET /api/brand-portfolio/year-over-year` (Mis marcas = marcas efectivas; Todas = toda la venta sin filtro de marca, solo alcance `all`, 403 en otro caso), con el panel en `/brands`: abierto por defecto en Mis marcas y colapsado en Todas ("Ver comparativo", carga solo al hacer clic). Mismas reglas que la ficha; distintos sobre toda la cartera; cuota anual de cartera con `monthsWithTarget` / `complete`; costos ocultos (null + `costHidden`) si falta acceso a alguna marca incluida. El SQL de ventanas (una marca, Mis marcas y Todas) cuenta distintos con banderas `BOOL_OR` en lugar de `COUNT(DISTINCT)` (Todas medía 5.3 s). Medido en producción: una marca 119 ms, Mis marcas (11) 132 ms, Todas 2.1 s (CPU; no se cambia `work_mem`); sin caché por decisión. Sin migraciones.
- MB-001B (limpieza, implementada · pendiente de validación y despliegue): se borró `src/features/sales-workspace/` (44 archivos, 14 de pruebas), `src/features/brand-workspace/` (5), `src/atlas/widgets/brandDirectory/` (SmartBrandDirectory, su prueba e index), `src/features/auth/brandIntelligenceAccess.ts` y su prueba, y `BrandCommercialComparisonPanel.tsx` (55 archivos con `git rm`; 37 pruebas eliminadas, todas de código eliminado). La pestaña Inteligencia se muestra embebida en el marco de la ficha (sin `<main>`, sin "Volver", sin encabezado ni periodo propios) con Executive Score, AI Commercial Intelligence, Executive Action Center, Executive Brief, Prioridad comercial, Why, Riesgos, Oportunidades y Recommended Actions; ya no se muestran la fila de 5 KPI, Forecast de cierre, Daily Pace, Gap Analysis, el comparativo comercial, Lost Customers ni Lost Products (viven en Ventas, Clientes y Productos), y el hook ya no llama a `buildBrandCommercialComparison`. Los planes comerciales dicen "El listado completo está en las pestañas Clientes y Productos, filtro Por recuperar". Los enlaces de Executive a `/sales` ahora van a `/brands` ("Abrir Marcas", etiqueta "Marcas" en el motor de preparación de dominios); se quitó `'sales'` de `workspaceAccess.ts` y `/sales` de los títulos de pantalla; `/sales` sigue redirigiendo a `/brands`. Se conserva `core/decision/brands/brandCommercialComparison.ts` (referencia de la prueba de paridad del servidor) hasta MB-003. Sin cambios en el servidor.
- Pendiente de C-001 (retiro de endpoints sin llamador; no se tocó ninguno): `POST /api/data/sales/analytics/summary`, `/group-by`, `/filter-options` y `/detail-rows` (sin llamador en el repo; sus pruebas siguen en `tests/services/salesAnalytics*.test.ts` y `tests/routes/salesAnalytics.test.ts`) y `GET /api/metrics/brands`, `/brands/:brand/comparison` y `/brands/:brand/lost-customers` (sin llamador en `src/`; Mi día solo reutiliza sus reglas). Antes de retirarlos, confirmar que ningún consumidor externo (n8n, DNR, scripts) los usa.
- Pendiente: MB-002 (Pronóstico), MB-003 (Inteligencia en servidor) y C-001.

## Calendario — CAL-001 (fase A)

| Entrega | Alcance | Estado |
|---|---|---|
| CAL-001A | Calendario de días no laborables y regla única de días hábiles en el servidor | Implementada · pendiente de aprobar los números, aplicar la migración 043 y desplegar |

- Regla: días hábiles = lunes a viernes menos los feriados oficiales y los días de la empresa. Reemplaza el conteo de lunes a viernes de Mi día y de la ficha (incluido el comparativo año contra año y sus ventanas equivalentes) y la cartera. Las ventas de días no laborables se siguen sumando: solo cambia el conteo de días.
- Migración 043 (`business_calendar`: fecha PK, tipo `official|company`, descripción, creado y actualizado por): con carga inicial de 2024, 2025 y 2026 (35 fechas, `ON CONFLICT DO NOTHING`), rollback que BORRA la tabla (y lo cargado desde la pantalla; el encabezado lo avisa), permisos para `pm_intelligence`, en `REQUIRED_SCHEMA` y sin subir `data_cache_version`. Se aplica como postgres.
- Servidor: `server/services/businessCalendar.js` (calendario puro, `loadBusinessCalendar`, semilla), `metricPeriods`, `myDayRules` (`resolvePeriodWindow`, `withTemplateWorkingDays`) y `brandRules` (ventanas equivalentes, plan año contra año y comparativo mes contra mes) reciben el calendario (por defecto vacío = lunes a viernes). `GET /api/business-calendar` (cualquier usuario autenticado) y `GET /api/settings/business-calendar?year=`, `PUT` y `DELETE /:date` (solo administradores).
- Año sin calendario: `calendarMissingYears` en Mi día, ficha, directorio y cartera, con aviso en pantalla y conteo de lunes a viernes.
- Plantilla contra calendario: manda el calendario; `workingDays` trae `templateTotal` y `mismatch`, nota discreta en pantalla y lista de avisos en Configuración (febrero de 2026: plantilla 20, calendario 19; diciembre: 23 contra 21).
- Configuración > Calendario (solo administrador): días por año con tipo y descripción, días hábiles por mes, alta, edición y baja, aviso de año sin calendario y avisos de plantilla.
- Simulación de solo lectura antes de aplicar la migración: `node server/scripts/simulateBusinessCalendar.js --cutoff=2026-11-26` (con el calendario dentro del script; `--no-db` solo días y cortes; `--from-db` después de migrar para comparar).
- Cancelada la fase B (cliente): Panorama ejecutivo se retira en EX-001; Pronóstico e Inteligencia usarán el calendario del servidor al reescribirse (MB-002 y MB-003). No se tocaron `dateAnalytics.ts`, `forecastCalendar.ts` ni los motores del cliente. La prueba de paridad Mi día ↔ tabla del Panorama ejecutivo (`tests/server/myDayParity.test.ts`) compara con calendario vacío (lunes a viernes); con calendario, Mi día difiere de esa tabla por diseño.

## Pendientes de seguridad

- S8 — Separar usuarios de PostgreSQL: la app usa pm_intelligence, dueño de casi todos los objetos (excepto app_users, app_roles y app_user_brand_assignments, que son de postgres). Crear un usuario de aplicación con solo SELECT/INSERT/UPDATE/DELETE/EXECUTE y dejar la propiedad y las migraciones a otro usuario.
- Indicadores derivados del monto en órdenes de compra: `value_classification`, `value_score` y `amount_classification` siguen visibles para todos los roles. Revisar si revelan el costo.

## Pendientes técnicos

- Compras × Inventario del frontend (`purchasingInventoryAnalytics.ts`) une `inventory.productCode` con `po.itemCode`. El export crudo de inventario no trae columna de código, así que solo empatan los artículos que existen en el Product Master (su Name se usa como código). Arreglo propuesto: copiar "Item" a `productCode` al armar la fila del inventario, después de descartar las filas de agrupación, con su prueba.

- SQL-002: `p_concurrently` en `refresh_sales_fallback_owner_candidates()` no hace refresh concurrente real. Medido en `pm_intelligence_test`: el refresh tarda ~5 s con 546,520 ventas, así que el refresh concurrente no es necesario por ahora. Reevaluar si el tiempo crece; si se cambia, hacerlo en una migración nueva, no editando la 035.

## Pendientes de calidad de datos

- STREAMAX aparece con dos nombres de marca en ventas: `MERIVA TECHNOLOGY - STREAMAX` (hasta 2025) y `STREAMAX - MERIVA` (desde 2026). Ambos resuelven al mismo `brand_id`, pero generan claves de marca (`scope_brand_key`) distintas; por eso 8 `base_id` aparecen dos veces en `sales_fallback_owner_candidates`.

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
