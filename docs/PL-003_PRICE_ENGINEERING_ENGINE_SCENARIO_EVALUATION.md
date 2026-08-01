# PL-003 — Price Engineering Engine & Scenario Evaluation

## Propósito

PL-003 materializa el núcleo matemático del Pricing Laboratory. Su función es
probar hipótesis de precio y comparar sus efectos unitarios sin modificar la
fuente real.

Este sprint no administra precios. No publica listas, no sustituye el precio
del ERP, no cambia Product Master y no escribe en Sales, Inventory, Forecast,
Purchasing, Executive ni otros Workspaces.

## Contrato de aislamiento

Cada ejecución publica explícitamente:

```ts
executionMode: 'simulation-only'
isolation: {
  mutatesSourcePrice: false,
  persistsScenarioResults: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

Los resultados existen únicamente durante la evaluación y pueden descartarse
sin afectar `BusinessPrice` ni `BusinessPriceScenario`.

## Metodología

```text
price-engineering-v1
```

El motor recibe un `BusinessPrice` ya normalizado y una lista ordenada de
escenarios. Cada escenario declara de forma explícita la variable de entrada.

### Bases soportadas

| Base | Cálculo |
|---|---|
| `selling_price` | Utiliza un precio de venta capturado para la simulación |
| `discount_rate` | Aplica un descuento sobre el precio de lista |
| `target_gross_margin` | Despeja el precio requerido para el margen objetivo |
| `target_gross_profit` | Suma el GP unitario objetivo al costo |
| `selling_price_factor` | Multiplica el costo por un factor de venta |
| `additional_discount` | Compone un descuento adicional sobre lista o precio actual |

El descuento adicional es compuesto. Por ejemplo, un precio actual de 150 con
5% adicional produce 142.50; no se suman mecánicamente porcentajes de descuento.

## Resultados por escenario

Cada evaluación incluye:

- precio de venta;
- descuento efectivo contra lista;
- GP unitario;
- Gross Margin sobre venta;
- factor de lista sobre costo;
- factor de venta sobre costo;
- banda de margen;
- variación de precio, descuento, GP y margen contra el estado actual;
- señales y explainability;
- estado `valid`, `warning`, `blocked` o `invalid`.

## Restricciones explícitas

PL-003 no contiene políticas comerciales ocultas. El consumidor puede adjuntar
restricciones de laboratorio para:

- margen mínimo;
- GP unitario mínimo;
- precio piso;
- precio máximo;
- descuento máximo.

Cada restricción declara si su incumplimiento es una advertencia o un bloqueo.
Sin una restricción suministrada, el motor no inventa un límite de aprobación.

## Pricing Groups

Los identificadores `SILVER`, `GOLD` y `PLATINUM` pueden conservarse como
etiquetas de un escenario existente, pero PL-003 no les asigna descuentos ni
márgenes. Las plantillas y reglas comerciales corresponden a PL-004.

## Moneda

Todos los cálculos permanecen en la moneda del `BusinessPrice` de origen. No se
realizan conversiones, no se consulta tipo de cambio y no se mezclan costos y
precios de monedas distintas.

## API pública

```ts
import {
  PriceEngineeringEngine,
  createEngineeringScenarioFromStored,
  evaluatePriceLaboratory,
  evaluatePriceScenario,
} from '@/core/business'
```

`createEngineeringScenarioFromStored()` adapta un escenario persistido a una
entrada descartable de laboratorio. La evaluación resultante no se guarda.

## Pruebas

La cobertura automatizada verifica:

- precio directo;
- descuento sobre lista;
- margen objetivo;
- GP objetivo;
- factor sobre costo;
- descuento adicional compuesto;
- restricciones blocking y warning;
- entradas imposibles;
- adaptación de escenarios almacenados;
- resumen de múltiples escenarios;
- preservación de moneda;
- inmutabilidad del precio fuente.

## Fuera de alcance

- modificación o aprobación de precios;
- escritura al ERP o Product Master;
- persistencia de simulaciones;
- descuentos predefinidos para Pricing Groups;
- recomendación automática;
- Price DNA;
- interfaz del laboratorio;
- exportación ejecutiva.
