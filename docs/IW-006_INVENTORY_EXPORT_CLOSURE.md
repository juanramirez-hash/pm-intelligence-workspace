# IW-006 — Inventory Export, Executive Summary & Closure

## Estado

Completado en la versión `0.28.0`.

## Objetivo

Cerrar Inventory Workspace con una lectura ejecutiva visible y una exportación Excel construida desde los contratos oficiales de inventario, sin leer el DOM ni volver a interpretar filas normalizadas.

## Alcance implementado

- Resumen ejecutivo determinístico del corte activo.
- Hallazgos de disponibilidad, compromiso, entradas, riesgos, oportunidades y conciliación de productos.
- KPIs y estado de posiciones recalculados sobre la segmentación activa.
- Exportación Excel bajo demanda con seis hojas:
  - `Resumen Ejecutivo`
  - `Inventario por Ubicación`
  - `Posiciones`
  - `Riesgos`
  - `Oportunidades`
  - `Metadatos`
- Carga dinámica de `xlsx` al solicitar la descarga.
- Pruebas unitarias del resumen y del contrato de exportación.

## Arquitectura

La UI consume `InventoryAnalyticsReport`, `InventoryRiskSignal`, `InventoryOpportunitySignal` y `BusinessInventoryPosition`. La exportación recibe estas estructuras ya resueltas y no depende de componentes React, HTML ni filas originales del archivo importado.

## Regresión verificada

La prueba dirigida del importador ancho por sucursal concluyó con `3 passed`. El encabezado de tránsito con espacios y acentos conserva su llave física y produce correctamente `inTransit: 4`.

## Criterios de cierre

- `npm test`
- `npm run lint`
- `npm run build`
- Exportación manual desde Inventory Workspace con datos cargados.
- Validación de las seis hojas y de la aplicación de filtros activos.
