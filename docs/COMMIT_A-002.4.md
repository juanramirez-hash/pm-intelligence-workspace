# Commit A-002.4 — CommercialTargetQueries

## Identificación

```text
Producto: PM Intelligence Workspace
Versión: 0.9.1
Sprint: Architecture Sprint A-002
Commit: A-002.4
Fecha: 2026-07-26
```

## Objetivo

Crear el Query Object oficial para consultar objetivos comerciales de marca desde
Business Repository, manteniendo encapsulado el índice `brandTargets` de
`BusinessDataModel`.

## Impacto arquitectónico

```text
BusinessDataModel.brandTargets
              │
              ▼
CommercialTargetQueries
              │
              ▼
BusinessRepository.targets
              │
              ▼
Target Attainment Engine (A-002.5)
```

## Archivos nuevos

```text
src/core/business/repository/commercialTargetQueries.ts
src/core/business/repository/commercialTargetQueries.test.ts
docs/COMMIT_A-002.4.md
```

## Archivos modificados

```text
src/core/business/repository/businessRepository.ts
src/core/business/repository/index.ts
docs/ARCHITECTURE_DECISIONS.md
docs/CHANGELOG.md
docs/RELEASE_NOTES.md
docs/ROADMAP.md
package.json
package-lock.json
```

## API incorporada

```ts
repository.targets.getAll()
repository.targets.findBrandTarget(brandId, periodId)
repository.targets.findPeriodTargets(periodId)
repository.targets.findTargetsByBrand(brandId)
repository.targets.exists(brandId, periodId)
repository.targets.getAvailablePeriods()
repository.targets.getTargetedBrands()
```

## Decisiones técnicas

- Se reutilizan las funciones oficiales de normalización del dominio Targets.
- La consulta exacta conserva acceso O(1) mediante `PERIOD::BRAND`.
- Se construyen índices por marca y periodo una sola vez en el constructor.
- Las colecciones se ordenan de forma determinista.
- Las consultas devuelven copias superficiales de los arreglos indexados.
- El Query Object no calcula KPIs ni resultados de cumplimiento.

## Validación

Ejecutar desde la raíz del proyecto:

```bash
npm install
npm run test
npm run build
```

## Breaking changes

Ninguno.

## Siguiente commit

```text
A-002.5 — Target Attainment Engine
```
