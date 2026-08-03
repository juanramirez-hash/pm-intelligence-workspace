# PL-013 Hotfix 1 — Reference FX Test Expectation

## Problema detectado

La prueba `applies explicit cost change and exchange rate before pricing` esperaba que `convertedBaseCost` utilizara el tipo de cambio del escenario de estrés.

Ese supuesto contradice el contrato de PL-013:

```text
convertedBaseCost = base cost × reference exchange rate
stressedUnitCost = base cost × (1 + cost change) × scenario exchange rate
```

Con costo base `10 USD`, TC de referencia `18`, variación de costo `+10%` y TC de escenario `20`:

```text
convertedBaseCost = 10 × 18 = 180 MXN
adjustedCostInSourceCurrency = 10 × 1.10 = 11 USD
stressedUnitCost = 11 × 20 = 220 MXN
```

## Corrección

Se cambia exclusivamente la expectativa del test de `200` a `180`.

El motor `price-cost-fx-stress-v1` no se modifica porque ya implementaba correctamente la separación entre TC de referencia y TC de escenario.

## Límite arquitectónico

El hotfix no modifica fórmulas productivas, contratos, UI, exportaciones, persistencia ni integración con otros Workspaces.
