# SW-003 — Sales Segmentation & Drill-down

## Added

- Índice analítico `BusinessSalesSegment` con grano completo por:
  - periodo;
  - marca;
  - cliente;
  - producto;
  - ubicación;
  - vendedor.
- `SalesSegmentationQueries` dentro de `BusinessRepository`.
- Filtros combinables por las cinco dimensiones comerciales.
- Búsqueda global por ID o nombre.
- Chips de contexto para visualizar y retirar filtros activos.
- Recalculo exacto de KPIs, comparación, tendencia y rankings.
- Drill-down desde rankings de marca, cliente y producto.
- Tabla detallada de las 100 combinaciones con mayor venta.
- Caché acotada de consultas de segmentación para evitar recorridos repetidos.

## Data integrity

- Los documentos se cuentan de forma distinta mediante identidad documental, evitando sumas duplicadas entre productos o segmentos.
- El cumplimiento contra cuota continúa disponible cuando el alcance puede atribuirse exactamente por marca.
- Los objetivos se marcan como no evaluables al filtrar cliente, producto, ubicación, vendedor o texto libre, evitando comparar un subconjunto contra una cuota completa.

## Architecture

```text
NormalizedSalesRow[]
        ↓ builder
BusinessSalesSegment
        ↓
SalesSegmentationQueries
        ↓
Sales Workspace Engine
        ↓
Filters + KPIs + Rankings + Detail
```

El Workspace no accede a `NormalizedSalesRow[]`, `Map` ni `Set`. La incorporación al Business Core es aditiva y no modifica la identidad de Product Master, Brand o Customer.
