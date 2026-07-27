# Commit A-002.7 — Business Health Score Engine

## Versión

```text
v0.9.4
```

## Objetivo

Crear una calificación ejecutiva de salud de marca que sea auditable, explicable
y configurable, sin trasladar fórmulas de negocio a React.

## Arquitectura

```text
BusinessDataModel
        ↓
BusinessRepository / BusinessCube
        ↓
Target Attainment
        ↓
Business Brand Snapshot
        ↓
Business Health Score Engine
        ↓
Brand Workspace / Executive Brief / Copilot
```

## Archivos nuevos

```text
src/core/business/health/
├── healthClassification.ts
├── healthClassification.test.ts
├── healthComponents.ts
├── healthRecommendations.ts
├── healthScore.ts
├── healthScoreEngine.ts
├── healthScoreEngine.test.ts
├── healthScoreOptions.ts
├── healthWeights.ts
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

## Reglas principales

1. El motor recibe un `BusinessBrandSnapshot`; no consulta Repository ni Cube.
2. Cada dimensión conserva valor real, benchmark, score, peso e impacto.
3. Los scores normalizados se limitan al rango de 0 a 100.
4. Un componente sin benchmark válido es `not-evaluable`.
5. Los pesos no evaluables se excluyen y el score restante se renormaliza.
6. Los pesos pueden sustituirse sin modificar el motor.
7. Las recomendaciones derivan de componentes en atención o riesgo.

## API

```ts
const engine = new BusinessHealthScoreEngine()

const result = engine.calculate(snapshot, {
  weights: {
    forecast: 20,
  },
  benchmarks: {
    minimumCustomers: 10,
    minimumProducts: 20,
    revenueTrendRatio: 0.9,
  },
})
```

## Fuera de alcance

- Renderizado en Brand Workspace.
- Persistencia histórica del score.
- Benchmark automático contra otras marcas.
- Tendencia calculada desde Repository.
- Executive Brief.

Estos puntos se abordarán en commits posteriores.
