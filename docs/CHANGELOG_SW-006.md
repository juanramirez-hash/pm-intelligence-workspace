# SW-006 — Executive Export & Closure

## Objetivo

Cerrar Sales Workspace v0.26.0 con salidas ejecutivas, narrativa determinística, impresión, exportación estructurada y optimización del bundle inicial.

## Funcionalidad incorporada

### Resumen ejecutivo

- Lectura automática de venta, Gross Profit y margen.
- Comparación contra el periodo seleccionado.
- Perspectiva de cierre contra cuota.
- Principal impulsor y principal deterioro.
- Prioridad comercial de mayor impacto.
- Contexto exacto de filtros activos.

### Exportación Excel

El archivo se genera bajo demanda y contiene:

1. Resumen ejecutivo.
2. KPIs.
3. Desempeño por marca.
4. Oportunidades comerciales.
5. Contribuciones y variaciones.
6. Detalle segmentado.
7. Conciliación con Product Master.

### Impresión / PDF

- Oculta navegación, Topbar, filtros y botones.
- Conserva colores ejecutivos.
- Ajusta el Workspace a formato A4 horizontal.
- Evita cortes internos en tarjetas, paneles y filas de tabla.

### Optimización

- Las páginas principales se cargan mediante rutas diferidas.
- Data Center deja de formar parte del bundle inicial.
- La librería `xlsx` se descarga solo cuando el usuario exporta.

## Arquitectura

SW-006 permanece dentro de `features/sales-workspace` y consume el ViewModel ya construido. No modifica entidades, builders ni repositorios del Business Core.
