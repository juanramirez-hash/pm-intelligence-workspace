# SW-005 HOTFIX 1

## Corrección

Se ajustan los datos de prueba del Commercial Opportunity Engine para respetar el contrato canónico de `BusinessBrandTargetInput`.

`targetGrossMargin` se expresa como razón decimal entre `0` y `1`:

- `30%` → `0.30`
- `25%` → `0.25`

## Causa

El fixture de SW-005 enviaba `30` y `25`. El validador del Business Core rechazaba por completo ambas filas de objetivos, por lo que `brandPerformance` quedaba vacío y no se generaban oportunidades `target-gap` ni `margin-protection`.

## Alcance

- No modifica el Commercial Opportunity Engine.
- No modifica el Business Core.
- No relaja la validación del dominio.
- Corrige exclusivamente el fixture que incumplía el contrato existente.
