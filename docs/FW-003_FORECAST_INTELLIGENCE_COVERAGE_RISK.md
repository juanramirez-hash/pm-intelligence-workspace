# FW-003 — Forecast Intelligence, Coverage & Risk

## Objetivo

Conectar la proyección base de FW-002 con el corte activo de Inventory y los atributos de Product Master para convertir una cantidad esperada en señales de cobertura, riesgo y continuidad comercial por producto.

FW-003 no introduce una segunda fórmula de forecast. Consume exclusivamente `ForecastBaselineProjection` y conserva la metodología `baseline-v1` como fuente de demanda.

## Metodología

La nueva capa se identifica como:

```text
forecast-inventory-v1
```

Para cada producto se calcula:

- cantidad real acumulada;
- cantidad conservadora, esperada y acelerada;
- demanda esperada restante del periodo;
- disponibilidad actual;
- comprometido;
- unidades en tránsito;
- unidades en orden;
- entradas agregadas;
- cobertura disponible en meses y días laborales;
- cobertura incluyendo entradas agregadas;
- disponibilidad proyectada después de la demanda restante;
- suministro proyectado después de la demanda restante.

## Reglas de cobertura

Los umbrales iniciales son explícitos y forman parte del contrato:

```text
Cobertura baja: menos de 1 mes
Cobertura balanceada: de 1 a menos de 3 meses
Inventario excedente: 3 meses o más
```

Estados posibles:

- `unavailable`: no existe fuente global de inventario;
- `no-demand`: no existe demanda mensual positiva;
- `stockout`: demanda positiva y disponibilidad menor o igual a cero;
- `shortage`: la disponibilidad no cubre la demanda restante del periodo;
- `low`: cobertura menor a un mes;
- `balanced`: cobertura entre uno y tres meses;
- `excess`: cobertura igual o superior a tres meses.

## Señales

FW-003 genera señales deterministas de:

- agotamiento;
- brecha para el cierre mensual;
- cobertura baja;
- inventario excedente;
- inventario sin demanda proyectada;
- recuperación mediante entradas agregadas;
- inventario en producto Superseded;
- sustituto con inventario disponible;
- referencia de sustitución no resuelta.

Cada señal incluye tipo, categoría, prioridad, score, explicación y evidencia.

## Product Master y sustituciones

La ruta de reemplazo se resuelve dentro del Business Core mediante:

1. `directSubstitute`;
2. `supersededBy` cuando no existe sustituto directo.

La referencia se concilia por `id`, `Name`, código o SKU. El inventario del reemplazo se consulta en el mismo corte activo y no se copia al producto original.

## Purchasing futuro

`inTransit` y `onOrder` se consideran entradas agregadas. FW-003 no supone fechas de llegada. Toda señal basada en entradas declara esta limitación:

> Purchasing aún no está conectado; no existe fecha confirmada de recepción.

Por esta razón, las entradas pueden recuperar cobertura numérica, pero no eliminan automáticamente el riesgo operativo.

## API

```ts
repository.forecast.getInventoryIntelligenceReport()
repository.forecast.getProductInventoryInsights()
repository.forecast.findProductInventoryInsight(productId)
repository.forecast.getTopInventoryIntelligence(limit)
repository.forecast.findInventoryInsightsByCoverage(status)
```

## Restricciones

- No modifica ventas, inventario ni Product Master.
- No crea órdenes de compra.
- No asigna fechas a `inTransit` ni `onOrder`.
- No interpreta la ausencia global de inventario como existencia cero.
- No duplica la fórmula de Forecast Baseline Engine.
- No incluye todavía la interfaz final de Forecast Workspace.
