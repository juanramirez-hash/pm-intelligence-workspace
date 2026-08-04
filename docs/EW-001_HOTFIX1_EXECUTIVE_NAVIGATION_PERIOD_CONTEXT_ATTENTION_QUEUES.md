# EW-001-HOTFIX1 — Executive Navigation, Global Period Context & Contextual Attention Queues

## Estado

Completado en la versión `0.54.1`.

## Motivo de reapertura

EW-001 cerró correctamente la base multidominio y el readiness de Purchasing, pero la revisión funcional identificó que Executive Workspace seguía operando principalmente como un tablero informativo:

- las tarjetas no funcionaban como accesos operativos;
- las prioridades abrían directorios completos en lugar de los registros que explicaban el KPI;
- Tendencias conservaba placeholders;
- Preparación de Workspaces y salud de datos duplicaban información;
- no existía un periodo global que gobernara toda la lectura ejecutiva;
- el KPI principal de atención mezclaba universo analizado con entidades prioritarias;
- clientes reutilizaba reglas genéricas incompatibles con su ciclo de vida comercial.

El hotfix corrige esas brechas sin modificar hechos de negocio ni implementar Purchasing.

## Objetivo

Convertir Executive Workspace en una antesala operativa y contextual para toda la plataforma, donde el usuario pueda:

1. seleccionar un periodo común de análisis;
2. revisar desempeño, tendencias y prioridades bajo el mismo corte;
3. conocer cuántos productos, marcas y clientes requieren atención;
4. abrir exactamente los registros que componen cada KPI;
5. navegar desde la cola de atención hasta el expediente individual;
6. consultar salud técnica y readiness al final de la página sin duplicar Data Center.

## Parte 1 — Navegación ejecutiva y tendencias reales

Se incorporaron accesos directos desde Executive Workspace hacia:

- Sales Workspace;
- Inventory Workspace;
- Forecast Workspace;
- Pricing Laboratory;
- preparación de Purchasing;
- Brand Workspace;
- Customer Workspace;
- Product Workspace;
- Data Center.

La sección Tendencias dejó de ser un placeholder y ahora publica:

- evolución mensual real de ventas;
- venta del último periodo;
- variación contra el periodo anterior;
- Top 10 real de clientes;
- participación acumulada;
- acceso al reporte individual de cada cliente.

El detalle de datasets fue retirado del tablero ejecutivo y permanece en Data Center. Executive Workspace conserva únicamente un resumen compacto de última sincronización, cobertura y estado general.

## Parte 2 — Estructura, productos y contexto temporal

La composición visual se reorganizó para priorizar la lectura de negocio:

1. rendimiento comercial;
2. periodo de análisis;
3. centro de atención;
4. tendencias;
5. Brand Intelligence;
6. preparación de Workspaces;
7. salud general de la plataforma.

Se agregó análisis de productos con las señales:

- en crecimiento;
- en caída;
- recuperados;
- nuevos;
- inactivos o perdidos.

El KPI principal representa únicamente productos que requieren atención y se separa del universo analizado.

## Parte 3 — Selector global de periodo

El selector global admite:

- último mes;
- últimos tres meses;
- últimos seis meses;
- año actual;
- navegación al periodo anterior o siguiente disponible.

Cada selección genera una ventana actual y una ventana base comparable. El mismo contexto gobierna:

- rendimiento comercial;
- productos;
- marcas;
- clientes;
- tendencias;
- Top 10 de clientes;
- Brand Intelligence.

Las comparaciones no usan periodos hardcodeados. Se derivan de los periodos existentes en Business Repository.

## Semántica de KPI de atención

Para cada dominio se separan dos conceptos:

- `analyzed`: universo cubierto por las ventanas actual y base;
- `requiringAttention`: unión deduplicada de entidades con señales negativas.

El número principal de la tarjeta corresponde a `requiringAttention`. El universo aparece como información secundaria junto con el periodo comparado.

## Parte 4 — Integridad del ciclo de vida de clientes

Clientes dejó de utilizar la clasificación genérica de productos y marcas.

Las reglas vigentes son:

| Clasificación | Regla |
|---|---|
| Nuevo | Primera compra histórica dentro de la ventana actual |
| Recuperado | Compra actual, ausencia en la ventana base e historial anterior |
| En crecimiento | Compra en ambas ventanas y variación positiva superior al umbral |
| En caída | Compra en ambas ventanas y reducción superior al umbral |
| Inactivo | Entre 90 y 179 días sin compra al cierre seleccionado |
| Perdido | 180 días o más sin compra al cierre seleccionado |
| Requiere atención | Unión sin duplicados de en caída, inactivos y perdidos |

La evaluación histórica excluye compras posteriores al cierre seleccionado. Un cliente que deja de comprar únicamente durante el mes inmediato siguiente no se clasifica automáticamente como perdido.

El motor valida que los clientes activos del periodo correspondan con los IDs únicos disponibles en `customerPeriods`.

## Parte 5 — Colas contextuales de atención

Las tarjetas del Centro de Atención ya no abren los directorios completos. Construyen rutas contextuales con dominio, preset y periodo ancla:

```text
/attention/products?view=attention&preset=month&anchor=2026-07
/attention/brands?view=attention&preset=month&anchor=2026-07
/attention/customers?view=attention&preset=month&anchor=2026-07
```

La nueva ruta:

```text
/attention/:domain
```

reconstruye el mismo periodo, calcula nuevamente la vista ejecutiva y filtra por los IDs exactos publicados en `requiringAttention`.

Cada cola incorpora:

- periodo actual y base;
- conteo de resultados;
- buscador;
- paginación;
- razón de atención;
- retorno a Executive Workspace;
- acceso al directorio completo;
- navegación al expediente individual de producto, marca o cliente.

La tarjeta y su destino comparten la misma fuente de IDs, evitando diferencias entre el KPI mostrado y el listado abierto.

## Contratos de IDs

Los resultados ejecutivos publican colecciones de IDs para:

- analizados;
- activos;
- creciendo;
- cayendo;
- estables;
- nuevos;
- recuperados;
- inactivos o perdidos;
- requieren atención.

Las colecciones se construyen con arreglos mutables internos y se exponen como `readonly string[]`. Esta separación resolvió los errores TypeScript producidos por intentar ejecutar `.push()` sobre contratos inmutables.

## Navegación y arquitectura

```text
ExecutiveWorkspacePage
        │
        ├── global period state
        │       └── executivePeriodView
        │
        ├── ExecutiveAttentionCenter
        │       └── buildExecutiveAttentionUrl()
        │
        ▼
/attention/:domain
        │
        ├── parseExecutiveAttentionLocation()
        ├── rebuild selected period view
        ├── filter by requiringAttention IDs
        └── record-level drill-down
```

La URL transporta contexto, no resultados serializados. La cola vuelve a derivar los datos desde Business Repository para preservar trazabilidad y evitar snapshots inconsistentes.

## Cobertura automatizada

El hotfix agrega o amplía pruebas sobre:

- composición y orden de Executive Workspace;
- selector y navegación de periodos;
- tendencias comerciales reales;
- resumen compacto de salud;
- navegación desde Workspaces y Centro de Atención;
- análisis de productos;
- construcción de la vista ejecutiva por periodo;
- ciclo de vida de clientes;
- integridad de `customerPeriods`;
- construcción y lectura de URLs contextuales;
- conservación de IDs y razones de atención;
- integración del builder ejecutivo.

La validación final confirmó:

```text
npm run build
npm run lint
npm run test -- executiveCustomerLifecycle executivePeriodView executiveAttentionNavigation ExecutiveWorkspaceNavigation
```

sin errores. El usuario también confirmó que las tarjetas abren los filtros contextuales correctos.

## Restricciones preservadas

EW-001-HOTFIX1 no:

- modifica ventas, clientes, productos, marcas o inventario;
- persiste clasificaciones ejecutivas;
- crea tareas comerciales automáticas;
- recomienda acciones o prioridades fuera de las reglas explícitas;
- modifica los umbrales centrales de Customer Intelligence;
- crea órdenes o solicitudes de compra;
- activa Purchasing;
- duplica los hechos almacenados en Business Repository.

## Criterios de cierre

- Executive Workspace funciona como centro de navegación operativo;
- Tendencias utiliza datos reales;
- toda la lectura comercial comparte un periodo global;
- KPI y universo analizado aparecen separados;
- clientes utiliza reglas históricas de inactividad y pérdida;
- cada tarjeta de atención abre exactamente sus registros;
- las colas preservan periodo, comparación y razones;
- build, lint y pruebas dirigidas terminan sin errores;
- la rama puede versionarse como `0.54.1`.

## Siguiente iniciativa

Con Executive Workspace funcionalmente cerrado, la siguiente iniciativa permanece:

```text
PVW-001 — Purchasing Data Foundation & Import Contracts
```

Purchasing deberá consumir los contratos de readiness ya publicados y conservar el enfoque consultivo, auditable y no automático de la plataforma.
