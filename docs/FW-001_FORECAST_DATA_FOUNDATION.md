# FW-001 — Forecast Data Foundation & Contract Definition

## Objetivo

Construir la base contractual del Forecast Workspace sin introducir todavía un algoritmo de proyección, una pantalla o un archivo manual que compita con los hechos del Business Repository.

## Decisión principal

Forecast es un dominio derivado:

```text
BusinessDataModel
        │
        ├── Ventas históricas
        ├── Objetivos por marca
        ├── Días laborales declarados
        ├── Inventario actual
        └── Product Master
                │
                ▼
       Forecast Data Foundation
                │
                ▼
        Future Forecast Engine
```

Un forecast manual futuro solo podrá entrar como escenario u override explícito. Nunca sustituirá las ventas, objetivos o inventario base.

## API pública

`BusinessRepository` expone:

```ts
repository.forecast.getFoundation()
repository.forecast.getSeries('portfolio')
repository.forecast.getSeries('brand')
repository.forecast.getSeries('product')
repository.forecast.getSeries('customer')
repository.forecast.findSeries('brand', brandId)
repository.forecast.findSource(sourceId)
repository.forecast.findCapability(capabilityId)
repository.forecast.findGranularity(granularity)
repository.forecast.getQualityIssues()
```

Todas las colecciones se devuelven clonadas para impedir que una UI o consumidor modifique el contrato interno.

## Fuentes

| Fuente | Papel | FW-001 |
|---|---|---|
| Histórico de ventas | Obligatoria | Activa cuando existen hechos mensuales |
| Objetivos comerciales | Enriquecimiento | Permite contexto de cumplimiento |
| Días laborales | Enriquecimiento | Permite ritmo mensual sin inventar calendario |
| Inventario | Enriquecimiento | Preparado para cobertura y agotamiento |
| Product Master | Enriquecimiento | Categoría, Superseded y sustituto directo |
| Purchasing | Futura | Planeada y no bloqueante |

## Granularidades

- Portafolio: primaria.
- Marca: primaria.
- Producto: primaria.
- Cliente: secundaria y reservada para una etapa posterior.

## Métricas base

- Venta.
- Gross Profit.
- Cantidad.

Los documentos se conservan dentro de las observaciones como contexto operacional.

## Escenarios

FW-001 define los contratos:

- Conservador.
- Esperado.
- Acelerado.

No asigna multiplicadores, probabilidades ni valores proyectados. Esas reglas pertenecen a FW-002.

## Readiness y calidad

La foundation reporta:

- periodos disponibles;
- baseline anterior al periodo actual;
- continuidad mensual;
- cobertura de objetivos;
- cobertura de días laborales;
- conciliación con Product Master;
- conciliación de inventario;
- capacidades listas, parciales, no disponibles o planeadas;
- incidencias bloqueantes, advertencias e información.

El mínimo contractual inicial es de tres periodos mensuales. Tener menos periodos no bloquea el dominio, pero lo marca como parcial.

## Fuera de alcance

FW-001 no incluye:

- proyección estadística;
- ponderaciones;
- estacionalidad;
- simulaciones calculadas;
- cobertura futura;
- recomendaciones;
- UI;
- exportación;
- importador de forecast manual.

## Siguiente entrega

FW-002 implementará el Forecast Engine sobre las series y contratos creados aquí.
