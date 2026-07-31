# FW-004 — Forecast Workspace Model & Executive Aggregation

## Objetivo

Transformar los resultados técnicos de FW-002 y FW-003 en un contrato estable, filtrable y directamente consumible por la futura interfaz de Forecast Workspace.

FW-004 no introduce nuevas fórmulas de forecast ni reinterpreta inventario. Compone exclusivamente:

```text
Forecast Baseline Engine baseline-v1
+ Forecast Inventory Intelligence forecast-inventory-v1
= ForecastWorkspaceModel
```

## Arquitectura

```text
Business Repository
        │
        ├── Forecast Foundation
        ├── Baseline Projections
        └── Inventory Intelligence
                  │
                  ▼
       buildForecastWorkspace()
                  │
                  ▼
       ForecastWorkspaceModel
                  │
                  ▼
       useForecastWorkspace()
```

La futura UI no deberá consultar motores individuales ni recalcular indicadores. Consumirá el modelo generado por FW-004.

## Escenarios

El modelo permite seleccionar:

- `conservative`;
- `expected`;
- `accelerated`.

La selección cambia venta, GP, cantidad, margen, cumplimiento y demanda contextual utilizando los escenarios ya calculados por `ForecastBaselineEngine`.

El Workspace no modifica factores, spreads, pesos ni confianza.

## Resumen ejecutivo de portafolio

El contrato incluye:

- venta, GP y cantidad real acumulada;
- venta, GP y cantidad proyectada por escenario;
- margen proyectado;
- objetivo mensual;
- cumplimiento esperado;
- brecha contra objetivo;
- venta diaria requerida;
- estado contra objetivo;
- score y nivel de confianza;
- explainability y limitaciones del baseline.

El resumen comercial de portafolio conserva siempre la proyección consolidada oficial. Los filtros de producto no alteran ese total.

## Agregación por marca

Cada marca expone:

- datos reales y proyectados;
- margen;
- objetivo, cumplimiento y brecha;
- confianza;
- productos analizados;
- productos críticos y de prioridad alta;
- stockout, shortage, cobertura baja, exceso y productos sin demanda;
- cobertura promedio disponible;
- score máximo de riesgo;
- contrato de navegación a `/brands/:brandId`.

## Inventario y filtros

Los filtros oficiales son:

- búsqueda;
- marca;
- estado de cobertura;
- prioridad;
- confianza.

Sobre la selección filtrada se recalculan:

- productos incluidos;
- demanda esperada y restante;
- disponibilidad y entradas;
- inventario y valor afectado;
- suministro después de demanda;
- distribución por cobertura;
- productos Superseded;
- recuperaciones mediante sustituto.

## Rankings

FW-004 separa dos listas:

### Riesgo

Utiliza la señal de riesgo con mayor score por producto.

### Oportunidad

Utiliza la señal de oportunidad con mayor score por producto.

El orden es determinista:

1. score de señal;
2. valor de inventario afectado;
3. nombre del producto.

Cada elemento incluye evidencia ejecutiva, acción recomendada y navegación a Product Workspace. Cuando existe un sustituto conciliado también incluye navegación directa a su expediente.

## API de la capa de Workspace

```ts
buildForecastWorkspace(repository, request)

useForecastWorkspace(request)
```

Solicitud predeterminada:

```ts
{
  scenarioId: 'expected',
  filters: {
    search: '',
    brandId: 'all',
    coverage: 'all',
    priority: 'all',
    confidence: 'all',
  },
  rankingLimit: 10,
}
```

## Estados

- `unavailable`: no existe Business Repository o proyección de portafolio;
- `partial`: existe forecast, pero Inventory no está listo o la confianza consolidada es baja;
- `ready`: proyección e inteligencia de inventario están disponibles.

La ausencia de Repository devuelve un contrato vacío estable, no una excepción.

## Restricciones

- No crea una segunda fórmula de Forecast.
- No modifica Business Repository.
- No modifica ventas, objetivos, inventario ni Product Master.
- No inventa fechas para `inTransit` u `onOrder`.
- No construye todavía la página visual.
- No aplica filtros de productos sobre el total consolidado del portafolio.
- No convierte recomendaciones en acciones automáticas.
