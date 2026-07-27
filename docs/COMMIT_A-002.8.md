# Commit A-002.8 — Narrative Engine & Executive Brief

**Versión:** 0.9.5  
**Fecha:** 2026-07-26  
**Sprint:** Architecture Sprint A-002

## Objetivo

Convertir `BusinessBrandSnapshot` y `BusinessHealthScore` en una lectura
ejecutiva estructurada, determinística y desacoplada de la interfaz.

## Archivos nuevos

```text
src/core/business/narrative/
├── executiveBriefBuilder.ts
├── executiveHighlights.ts
├── executiveOpportunities.ts
├── executiveRecommendations.ts
├── executiveRisks.ts
├── languageRules.ts
├── narrativeEngine.test.ts
├── narrativeEngine.ts
├── narrativeTypes.ts
└── index.ts
```

## Contrato público

```ts
const brief = new BusinessNarrativeEngine()
  .buildExecutiveBrief(snapshot, healthScore)
```

El resultado incluye `summary`, `highlights`, `risks`, `opportunities` y
`recommendations`. El motor verifica que el Health Score pertenezca al Snapshot
recibido.

## Restricciones

- Sin IA generativa.
- Sin acceso a Repository o filas de ventas.
- Sin cálculos dentro de React.
- Sin benchmarks implícitos.
- Misma entrada produce la misma salida.

## Compatibilidad

No se modifica la UI ni se rompe ninguna API de Snapshot, Health, Attainment,
Repository o Cube.
