# PL-006 — Pricing Laboratory UI & Interactive Scenario Builder

## Propósito

PL-006 conecta la ruta `/pricing` con `pricing-workspace-v1` y entrega la
interfaz operativa del laboratorio. La pantalla permite seleccionar una fuente,
capturar escenarios temporales y revisar resultados del Price Engineering
Engine sin agregar fórmulas comerciales a React.

La interfaz no es un administrador de precios. No guarda, aprueba, recomienda
ni publica cambios.

## Arquitectura

```text
BusinessRepository.prices
        ↓ solo lectura
pricing-workspace-v1
        ↓
Pricing Laboratory UI
        ↓ estado React en memoria
Escenarios temporales y selección visual
```

La página consume `PricingLaboratoryWorkspaceModel`. Las métricas de precio,
descuento, GP, margen, factores, deltas, guardrails y señales proceden del Core.
La UI únicamente captura inputs explícitos y representa el resultado.

## Ruta y navegación

La ruta placeholder `/pricing` se reemplaza por una carga diferida de:

```text
src/features/pricing-laboratory/pages/PricingLaboratoryPage.tsx
```

Sidebar y Topbar muestran `Pricing Laboratory` para distinguirlo de un módulo
de administración de precios.

## Selección de fuente

La pantalla permite:

- buscar por modelo, SKU, marca o identificador;
- seleccionar un producto con datos de Pricing;
- elegir de forma independiente MXN o USD;
- consultar el precio vigente, costo, GP y margen;
- conservar la moneda del precio fuente sin conversión ni fallback cruzado.

Cambiar producto o moneda elimina los escenarios temporales de la sesión para
evitar reutilizar supuestos en una fuente diferente.

## Constructor interactivo

El usuario puede crear escenarios con las plantillas:

- Promotion;
- Silver;
- Gold;
- Platinum;
- Project;
- Custom.

Cada escenario exige una base explícita:

- precio de venta;
- descuento sobre lista;
- margen objetivo;
- GP unitario objetivo;
- factor sobre costo;
- descuento adicional compuesto.

No existe ningún porcentaje, precio, margen, GP o factor precargado. Los
porcentajes capturados visualmente se convierten a tasas decimales antes de
enviarse al motor.

El descuento adicional exige declarar si se aplica al precio vigente o al
precio de lista.

## Guardrails

El constructor admite valores opcionales para:

- margen mínimo;
- GP mínimo;
- precio mínimo;
- precio máximo;
- descuento máximo.

Los campos vacíos no crean reglas. Los guardrails capturados pueden ser de
advertencia o bloqueantes y quedan asociados únicamente al escenario temporal.

## Comparación y detalle

La tabla conserva:

- escenario y origen;
- Pricing Group;
- estado de orquestación y evaluación;
- base de cálculo;
- precio;
- descuento;
- GP;
- margen;
- delta contra precio vigente;
- selección explícita para revisión.

Los escenarios creados en UI pueden quitarse de la sesión. Los escenarios
almacenados son referencias de solo lectura y solo pueden ocultarse mediante el
control de inclusión.

Seleccionar una fila abre:

- métricas completas;
- factores;
- guardrails resueltos;
- señales del motor;
- explicación determinística.

La selección visual no constituye recomendación ni aprobación.

## Estado y persistencia

El estado de PL-006 vive exclusivamente en React:

- producto seleccionado;
- moneda seleccionada;
- plantillas temporales;
- escenario visual seleccionado;
- inclusión de escenarios almacenados;
- secuencia local de identificadores.

Recargar la aplicación elimina los escenarios creados en UI. No se incorporan
acciones de IndexedDB, Data Center, Repository, API o ERP.

## Contrato de aislamiento

```ts
executionMode: 'simulation-only'

isolation: {
  mutatesSourcePrice: false,
  persistsScenarioResults: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-006 no:

- modifica costo, lista o precio de venta;
- persiste resultados;
- crea o edita `BusinessPriceScenario`;
- escribe en Data Center o Business Repository;
- afecta Product Master, Sales, Inventory, Forecast o Purchasing;
- genera Price DNA;
- selecciona un escenario ganador;
- recomienda o publica precios.

## Pruebas

La cobertura añadida verifica:

- obligación de capturar valor y scope;
- conversión visual de porcentajes a tasas;
- descuento adicional compuesto;
- guardrails exclusivamente explícitos;
- rechazo de porcentajes inválidos;
- formateo visual de bases;
- render de comparación y acciones temporales.

## Siguiente entrega

`PL-007 — Pricing Laboratory Executive Export & Functional Closure` podrá
incorporar una salida ejecutiva de las simulaciones visibles, siempre bajo
descarga bajo demanda y sin persistencia ni publicación de precios.
