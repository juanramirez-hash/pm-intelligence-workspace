# FW-010 Hotfix 1 — Project-Aware Ready Fixture

## Problema

El test principal de Forecast Workspace esperaba `officialAvailable = true`, pero su repositorio de prueba solo cargaba Ventas, Objetivos, Product Master e Inventario. Desde FW-009, la disponibilidad oficial Project-Aware requiere también Proyectos y Facturación de proyectos.

## Causa

El fixture no había sido migrado al contrato de datos de FW-009. El motor productivo actuó correctamente al devolver un Forecast bloqueado ante fuentes Project-Aware ausentes.

## Corrección

El fixture listo incorpora:

- un proyecto histórico realizado;
- un documento histórico de facturación de proyecto;
- ambos fuera de los periodos usados por el Forecast del caso.

Esto acredita que las fuentes existen sin modificar los valores esperados del periodo actual, el pipeline, los rankings ni la cobertura.

## Decisión arquitectónica

No se debilitan los controles de producción. La ausencia real de Proyectos o Facturación de proyectos continúa siendo bloqueante para declarar oficial el Forecast Project-Aware.

## Impacto

- Sin cambios en fórmulas.
- Sin cambios en UI.
- Sin cambios en Excel.
- Sin cambios en Business Repository.
- Solo se corrige el contrato de prueba y se actualiza la versión a `0.38.1`.
