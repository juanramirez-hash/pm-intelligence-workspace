# PL-005 — Pricing Laboratory Workspace Model & Scenario Orchestration

## Propósito

PL-005 construye el contrato único que consumirá la futura interfaz `/pricing`.
El Workspace Model selecciona una fuente de precio, orquesta escenarios y
centraliza la comparación sin incorporar lógica visual ni capacidad de
publicación. PL-006 utiliza este contrato como única fuente para `/pricing`.

El módulo sigue siendo un laboratorio de cálculos. No es un administrador de
precios y no representa una instrucción comercial.

## Metodología

```text
pricing-workspace-v1
```

PL-005 compone exclusivamente contratos públicos existentes:

```text
BusinessRepository.prices
        ↓
BusinessPrice vigente por producto y moneda
        ↓
pricing-template-v1
        ↓
price-engineering-v1
        ↓
PricingLaboratoryWorkspaceModel
```

No se consumen `NormalizedPricingRow[]` ni estructuras internas de Data Center.

## Contrato de aislamiento

Cada modelo declara:

```ts
executionMode: 'simulation-only'
isolation: {
  mutatesSourcePrice: false,
  persistsScenarioResults: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-005 no:

- modifica costo, lista o precio de venta;
- persiste escenarios o selecciones;
- actualiza Product Master;
- escribe en Data Center o Business Repository;
- afecta Sales, Inventory, Forecast, Purchasing o Executive;
- aprueba, recomienda o publica precios;
- envía cambios a ERP.

## Selección de producto y moneda

El modelo publica opciones de producto a partir de los precios disponibles en
`BusinessRepository.prices`. Para cada producto expone las monedas existentes y
el precio vigente de cada canal.

Estados previos a la ejecución:

- `awaiting_selection`: falta producto o moneda;
- `unavailable`: no existe Repository, Pricing o precio vigente;
- `ready`: fuente válida y configuraciones utilizables;
- `partial`: existe fuente válida, pero hay configuraciones inválidas o una
  selección solicitada que no existe.

Cuando un producto tiene más de una moneda, la moneda debe seleccionarse de
forma explícita. PL-005 no convierte monedas ni aplica un fallback cruzado.

## Orquestación de escenarios

El Workspace compone dos orígenes:

1. **Template**: configuraciones temporales de PL-004.
2. **Stored**: `BusinessPriceScenario` ya existente, leído y reevaluado en
   memoria mediante PL-003.

El orden es determinístico:

```text
Plantillas en el orden capturado
→ Escenarios almacenados en el orden del Repository
```

Cada fila conserva:

- origen y clave estable;
- plantilla o escenario fuente;
- nombre, tipo y Pricing Group;
- disposición de orquestación;
- estado de evaluación;
- base matemática;
- precio, descuento, GP, margen y factores;
- deltas contra el precio actual;
- guardrails resueltos;
- señales e issues;
- explainability, referencia y notas.

## Selección explícita

Una fila solo se marca como seleccionada cuando el caller proporciona una clave
existente, por ejemplo:

```text
TEMPLATE:SILVER-MXN
STORED:SCENARIO-001
```

Si la clave no existe, el modelo queda `partial`, conserva todas las
comparaciones y no selecciona otra fila automáticamente.

Esta regla evita convertir orden, margen, GP o descuento en una recomendación
implícita.

## Escenarios bloqueados

Un resultado `blocked` sigue siendo una simulación calculada y visible. Indica
que incumple un guardrail explícito, pero no bloquea la operación del Workspace
ni modifica un precio.

Las configuraciones `invalid` sí dejan el modelo en estado `partial`, porque no
pudieron evaluarse. Las configuraciones `disabled` y `not_applicable` se
conservan para trazabilidad.

## Contrato público

```ts
import {
  buildPricingLaboratoryWorkspace,
} from '@/features/pricing-laboratory'

const model = buildPricingLaboratoryWorkspace(repository, {
  productId: 'P-1',
  currency: 'MXN',
  templates,
  guardrailProfiles,
  defaultGuardrails,
  includeStoredScenarios: true,
  selectedScenarioKey: 'TEMPLATE:SILVER-MXN',
})
```

La futura UI deberá representar este modelo; no deberá recalcular métricas ni
interpretar reglas comerciales.

## Pruebas

La cobertura de PL-005 verifica:

- opciones antes de seleccionar producto;
- selección explícita de moneda para fuentes multimoneda;
- composición de plantillas y escenarios almacenados;
- orden y selección determinísticos;
- configuraciones inválidas junto a resultados válidos;
- escenarios bloqueados como comparaciones visibles;
- selección inexistente sin fallback automático;
- ausencia de Business Repository;
- copias aisladas entre ejecuciones;
- preservación del precio fuente.

## Fuera de alcance

- interfaz React de `/pricing`;
- controles y formularios visuales;
- persistencia de sesión;
- recomendación automática o Price DNA;
- aprobaciones y workflows;
- modificación o publicación de precios;
- exportación Excel o PDF.

## Integración visual

PL-006 consume exclusivamente `PricingLaboratoryWorkspaceModel` y conserva la
misma frontera `simulation-only`. La UI captura supuestos explícitos, pero no
recalcula métricas ni persiste resultados.
