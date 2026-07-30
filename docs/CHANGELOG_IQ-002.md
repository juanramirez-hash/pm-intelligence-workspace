# IQ-002 — Name-Based Product Reconciliation

## Objetivo

Adoptar `Name` como identidad primaria y unica del producto, utilizando `Marca` y `Modelo` como atributos de validacion y como fallback controlado.

## Cambios

- Nuevo campo canonico `name` en Product Master y `productName` en ventas.
- Alias explicito de la columna `Name` en ambos importadores.
- Prioridad de conciliacion: `Name` → codigo alterno → `Marca + Modelo`.
- Deteccion de `Name` duplicado o ambiguo.
- Advertencias cuando `Name` coincide pero Marca o Modelo difieren.
- Indice `productsByName` y consulta `findByName()`.
- Quality Gate con cobertura primaria por Name, cobertura total, fallbacks y advertencias de atributos.
- Exportacion CSV ampliada con Name, candidatos y advertencias.
- Compatibilidad con Product Master persistido por IQ-001 mediante fallback `name ?? code`.

## Nota de migracion

Los registros de ventas persistidos antes de IQ-002 no contienen `productName`. Debe reimportarse el dataset de Ventas para materializar la columna `Name` y recalcular la cobertura primaria.
