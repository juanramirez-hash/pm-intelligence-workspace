# UX-002.6 — Smart Brand Directory

## Versión

`0.20.0-UX002.6`

## Entrega

Se reemplazó el directorio tabular básico de Brand Workspace por un centro operativo de marcas reutilizable y contextual.

### Incluye

- búsqueda por nombre o identificador;
- filtros por ciclo de vida, tendencia y atención comercial;
- ordenamiento por venta, variación, GP, margen, clientes, productos y participación;
- tarjetas ejecutivas con venta, margen, tendencia, clientes, productos y participación;
- acceso directo al detalle contextual de cada marca;
- estados vacío y seleccionado;
- soporte responsive, teclado y motion-reduce;
- prueba de renderizado estático.

## Arquitectura

La capa Atlas consume `BrandIntelligenceItem[]` y el estado existente de Brand Workspace. No se agregaron cálculos de negocio en React ni se modificó Business Repository.
