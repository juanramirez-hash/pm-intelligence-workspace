# CHANGELOG B-003 — Target Intelligence

## v0.11.0-B003

### Implementado

- Plugin de detección e importación de objetivos comerciales (`quota`).
- Formato mensual por marca con objetivo de venta, GP, margen y días laborables.
- Persistencia de objetivos en IndexedDB, independiente del dataset de ventas.
- Integración de objetivos con `buildBusinessIntelligence` y `BusinessRepository`.
- Activación automática de Target Attainment, Executive Brief y AI Commercial Intelligence.
- Resumen de importación de objetivos en Data Center.
- Registro activo de Objetivos de venta en Data Catalog.
- Plantilla oficial descargable desde Data Center.

### Formato oficial

| Marca | Periodo | Objetivo Venta | Objetivo GP | Margen Objetivo | Días Laborables |
|---|---|---:|---:|---:|---:|
| BELDEN | 2026-07 | 8500000 | 1900000 | 22.35% | 23 |

El archivo puede contener los doce meses del año para todas las marcas.
