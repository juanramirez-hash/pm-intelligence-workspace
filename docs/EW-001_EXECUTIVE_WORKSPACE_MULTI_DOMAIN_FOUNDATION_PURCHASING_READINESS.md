# EW-001 — Executive Workspace Multi-Domain Foundation & Purchasing Readiness

## Estado

Completado en la versión `0.54.0`.

## Objetivo

Convertir Executive Workspace en una capa ejecutiva multidominio independiente, capaz de publicar la disponibilidad, cobertura y frescura de Sales, Inventory, Forecast y Pricing, además de determinar de forma explícita si Purchasing cuenta con las fuentes mínimas para activarse.

EW-001 prepara Purchasing; no implementa todavía su Workspace operativo.

## Cambio arquitectónico

Antes de EW-001, `ExecutiveWorkspaceModel` era un alias directo de `WorkspaceContextModel` y `useExecutiveWorkspace()` delegaba en `useWorkspaceContext()`.

EW-001 separa ese límite:

```text
DataCenterState
      │
      ├── buildWorkspaceContext()
      │        compatibilidad de datos existentes
      │
      ▼
buildExecutiveWorkspace()
      │
      ├── buildExecutiveDomainRegistry()
      ├── buildExecutiveDomainHealth()
      └── Purchasing readiness
      │
      ▼
ExecutiveWorkspaceModel
      │
      ▼
useExecutiveWorkspace()
      │
      ▼
ExecutiveWorkspacePage
```

El modelo ejecutivo conserva los campos existentes durante la migración, pero deja de ser un alias y agrega contratos propios, metodología y fecha de generación.

## Metodología

```text
executive-workspace-v1
```

La evaluación es determinística y utiliza exclusivamente el registro oficial de datasets construido desde Data Center.

## Dominios evaluados

| Dominio | Fuentes requeridas |
|---|---|
| Sales | Ventas y objetivos |
| Inventory | Inventario y Product Master |
| Forecast | Ventas, objetivos, proyectos, facturación de proyectos, tipo de cambio, inventario, Product Master y calendario laboral |
| Pricing | Pricing, Product Master y tipo de cambio |
| Purchasing | Órdenes de compra, solicitudes de compra, inventario, Product Master y todas las fuentes requeridas por Forecast |

No se infiere disponibilidad a partir de componentes visibles ni de rutas de navegación. Cada resultado se deriva del estado de los datasets.

## Estados de dominio

Cada dominio recibe uno de cuatro estados:

- `ready`: todas las fuentes requeridas están activas, vigentes y sin errores;
- `partial`: existe cobertura utilizable, pero faltan fuentes o alguna requiere actualización;
- `not_available`: no existe ninguna fuente activa del dominio;
- `blocked`: al menos una fuente requerida está en estado de error.

El contrato publica:

- datasets requeridos;
- datasets activos;
- datasets faltantes;
- última actualización;
- estado de frescura;
- incidencias explicables.

## Frescura

EW-001 aplica ventanas explícitas según la frecuencia declarada por cada dataset:

| Frecuencia | Ventana máxima |
|---|---:|
| Semanal | 10 días |
| Mensual | 40 días |
| Anual | 400 días |
| Frecuencia no reconocida | 40 días |

La fecha de referencia puede inyectarse al builder para pruebas reproducibles. En ejecución normal se utiliza la fecha actual.

## Preparación de Purchasing

Purchasing sólo publica `canActivateWorkspace: true` cuando se cumplen simultáneamente estas condiciones:

1. existen órdenes de compra normalizadas;
2. existen solicitudes de compra normalizadas;
3. Inventory está disponible;
4. Product Master está disponible;
5. Forecast tiene estado `ready`;
6. las fuentes requeridas están vigentes;
7. ninguna fuente requerida está bloqueada por error.

Cuando una condición no se cumple, el contrato publica limitaciones concretas. La evaluación no crea datos, no normaliza archivos y no habilita rutas por sí misma.

## Salud ejecutiva

`ExecutiveWorkspaceHealth` conserva la cobertura de datasets y agrega:

- `readyDomains`;
- `totalDomains`;
- `domainCoveragePercentage`;
- `purchasingReady`.

Estos indicadores describen preparación técnica; no equivalen a una evaluación del desempeño comercial.

## Interfaz

`ExecutiveDomainReadinessPanel` muestra:

- Sales, Inventory, Forecast, Pricing y Purchasing;
- estado de cada dominio;
- fuentes activas contra requeridas;
- frescura y última actualización;
- fuentes pendientes;
- cobertura multidominio;
- bloqueo o disponibilidad de Purchasing;
- limitaciones que impiden su activación.

El panel es de solo lectura y se integra en `ExecutiveWorkspacePage` sin reemplazar el diagnóstico de datasets existente.

## Cobertura automatizada

EW-001 incorpora ocho pruebas específicas:

- cinco pruebas del Domain Readiness Engine;
- dos pruebas de integración de `buildExecutiveWorkspace()`;
- una prueba de construcción visual del panel.

Las pruebas cubren:

- dominios completos;
- cobertura parcial y ausencia total;
- fuentes con error;
- datos vencidos;
- activación y bloqueo de Purchasing;
- conservación del modelo ejecutivo previo;
- fecha y metodología determinísticas;
- renderizado de cobertura y limitaciones.

## Restricciones

EW-001 no:

- importa órdenes o solicitudes de compra;
- crea entidades de Purchasing;
- calcula fechas prometidas, recepciones o backorders;
- recomienda cantidades de compra;
- modifica Sales, Inventory, Forecast o Pricing;
- escribe en Business Repository;
- persiste resultados de readiness;
- activa automáticamente la ruta de Purchasing;
- convierte la disponibilidad técnica en aprobación operativa.

## Criterios de cierre

- `npm run build` sin errores;
- `npm run lint` sin advertencias ni errores;
- pruebas dirigidas de readiness, builder y panel aprobadas;
- Executive Workspace conserva sus capacidades previas;
- el modelo ya no es alias de `WorkspaceContextModel`;
- el hook ejecutivo ya no delega en `useWorkspaceContext()`;
- Purchasing permanece bloqueado hasta disponer de sus fuentes reales.

## Siguiente iniciativa

La siguiente iniciativa recomendada es `PVW-001 — Purchasing Data Foundation & Import Contracts`, enfocada en contratos, validación, normalización y trazabilidad de órdenes y solicitudes de compra. Su diseño deberá consumir la preparación publicada por EW-001 y mantener Purchasing como módulo consultivo, sin automatizar decisiones de compra.
