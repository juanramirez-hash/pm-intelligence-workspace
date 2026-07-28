# SW-004 — Variance & Contribution Analysis

## Added

- Motor determinístico de explicación de variaciones dentro de Sales Workspace.
- Comparación de venta, Gross Profit, margen, cantidad y documentos contra el periodo base activo.
- Descomposición de la variación en contribuciones positivas y negativas.
- Análisis por marca, cliente y producto.
- Participación actual, participación comparable y cambio de mezcla en puntos porcentuales.
- Peso relativo de cada entidad sobre el movimiento absoluto del periodo.
- Clasificación de clientes:
  - nuevos;
  - recuperados;
  - en crecimiento;
  - en baja;
  - perdidos;
  - estables.
- Panel ejecutivo con selección de dimensión y listas priorizadas de impulsores y deterioros.

## Business rules

- La contribución de una entidad corresponde a su venta actual menos la venta del periodo comparable.
- La contribución positiva suma únicamente variaciones mayores que cero.
- La contribución negativa se presenta como magnitud absoluta de las variaciones menores que cero.
- El cambio de mezcla corresponde a participación actual menos participación comparable.
- El peso del movimiento se calcula sobre la suma absoluta de todas las variaciones de la dimensión.
- Un cliente es `nuevo` cuando compra en el periodo actual, no compró en el comparable y no tiene ventas anteriores.
- Un cliente es `recuperado` cuando compra en el periodo actual, no compró en el comparable y sí tiene historial anterior.
- Un cliente es `perdido` cuando compró en el periodo comparable y no compra en el actual.
- Los cálculos respetan el periodo, la base de comparación y todos los filtros activos del Workspace.

## Architecture

```text
BusinessRepository.salesSegmentation
        ↓
Variance & Contribution Engine
        ↓
SalesWorkspaceViewModel
        ↓
SalesVarianceContributionPanel
```

SW-004 es aditivo y no modifica entidades, builders ni repositorios del Business Core.
