# Commit A-002.5 — Target Attainment Engine

## Versión

`PM Intelligence Workspace v0.9.2`

## Objetivo

Crear el motor oficial para comparar hechos mensuales de marca contra objetivos
comerciales, sin almacenar KPIs derivados en `BusinessDataModel`.

## Arquitectura

```text
BusinessDataModel
        ↓
BusinessRepository
   ├── brand
   └── targets
        ↓
TargetAttainmentEngine
        ↓
BusinessTargetAttainment
```

## Archivos creados

```text
src/core/business/attainment/
├── businessTargetAttainment.ts
├── targetAttainmentOptions.ts
├── targetAttainmentCalculations.ts
├── targetAttainmentEngine.ts
├── targetAttainmentCalculations.test.ts
├── targetAttainmentEngine.test.ts
└── index.ts
```

## Archivos modificados

```text
package.json
package-lock.json
docs/ARCHITECTURE_DECISIONS.md
docs/CHANGELOG.md
docs/RELEASE_NOTES.md
docs/ROADMAP.md
```

## API principal

```ts
const engine =
  new TargetAttainmentEngine(repository)

const result =
  engine.calculateBrandAttainment(
    'BELDEN',
    '2026-07',
    {
      elapsedWorkingDays: 10,
    },
  )
```

## Reglas

- Los valores reales provienen de `repository.brand.findPeriod()`.
- Los objetivos provienen de `repository.targets.findBrandTarget()`.
- Los días transcurridos son entrada explícita y validada.
- No se divide entre objetivo cero.
- El motor no altera el Repository ni el Business Model.
- Si existe objetivo pero no hechos, la venta y el GP reales son cero y
  `hasActual` es `false`.

## Riesgos controlados

- No se utiliza la fecha actual, evitando resultados variables entre ejecuciones.
- No se incorporan tolerancias arbitrarias para determinar `on-plan`.
- La proyección es lineal y se etiqueta como cálculo de ritmo, no como forecast.

## Validación

- TypeScript estricto para la capa Business Core.
- Pruebas de cálculo, estados, objetivo cero, días inválidos y ausencia de hechos.
- Sin breaking changes en APIs existentes.

## Próximo commit

`A-002.6 — Business Snapshot`.
