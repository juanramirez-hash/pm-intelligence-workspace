# PL-004 — Pricing Group Templates & Commercial Guardrails

## Propósito

Incorporar plantillas reutilizables para Silver, Gold, Platinum, promoción,
proyecto y escenarios personalizados sin transformar el Pricing Laboratory en
un administrador de precios.

PL-004 organiza supuestos y guardrails; no define ni publica precios.

## Contrato de aislamiento

Todo resultado conserva:

```ts
executionMode: 'simulation-only'
isolation: {
  mutatesSourcePrice: false,
  persistsScenarioResults: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

No existe escritura en Data Center, Product Master, Sales, Inventory, Forecast,
Business Repository ni otros Workspaces.

## Catálogo estándar

El catálogo publica únicamente metadata:

- `PROMOTION`
- `SILVER`
- `GOLD`
- `PLATINUM`
- `PROJECT`
- `CUSTOM`

Cada definición contiene etiqueta, tipo de escenario, Pricing Group y bases de
cálculo sugeridas. La política numérica es siempre:

```text
explicit-input-only
```

Por diseño, ninguna plantilla contiene descuento, margen, GP, factor, precio
piso, precio recomendado o umbral de aprobación.

## Configuración explícita

Cada simulación debe proporcionar una base soportada por PL-003:

- precio de venta;
- descuento sobre lista;
- margen objetivo;
- GP objetivo;
- factor sobre costo;
- descuento adicional compuesto.

La plantilla solo clasifica y explica el escenario; el cálculo continúa a cargo
de `price-engineering-v1`.

## Alcance contextual

Una plantilla puede restringirse por:

- marca;
- producto;
- moneda.

Cuando el precio fuente queda fuera del alcance, el resultado se clasifica como
`not_applicable` y no se envía al motor matemático.

Esto permite representar políticas específicas sin convertirlas en reglas
globales.

## Perfiles de guardrails

Los perfiles son entradas temporales del laboratorio. Pueden agrupar:

- margen mínimo;
- GP unitario mínimo;
- precio mínimo;
- precio máximo;
- descuento máximo.

La precedencia es:

```text
Guardrails predeterminados del ejercicio
→ Perfil seleccionado
→ Guardrails específicos de la plantilla
```

Una capa más específica reemplaza el guardrail del mismo tipo y genera una
señal informativa auditable.

Los guardrails conservan severidad `warning` o `blocking`; el motor no decide
la severidad ni inventa límites.

## Disposiciones

Cada configuración termina como:

- `evaluated`: enviada al motor;
- `disabled`: deshabilitada deliberadamente;
- `not_applicable`: fuera del alcance explícito;
- `invalid`: identificador duplicado, alcance inválido o perfil no disponible.

## Fuente comercial revisada

Se utilizó `MatrizDescuentos2026.xlsx` como referencia de estructura comercial.
El archivo muestra que los niveles y condiciones dependen de la marca y del
contexto. Por esta razón PL-004 no codifica valores globales ni importa la
matriz como política activa.

Cualquier porcentaje o condición de esa matriz deberá capturarse de forma
explícita y acotarse mediante `scope` cuando se use en el laboratorio.

## Fuera de alcance

PL-004 no incluye:

- persistencia de plantillas;
- importación de la matriz comercial;
- modificación o publicación de precios;
- aprobaciones;
- recomendaciones automáticas;
- Price DNA;
- interfaz del Workspace;
- exportación ejecutiva.

## Siguiente entrega

`PL-005 — Pricing Laboratory Workspace Model & Scenario Orchestration` consume
resultados del laboratorio y los organiza para la futura interfaz sin
convertirlos en cambios de precio. Price DNA y recomendaciones automáticas
permanecen fuera del alcance vigente.
