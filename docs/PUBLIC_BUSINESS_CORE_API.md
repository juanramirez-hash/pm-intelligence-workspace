# Public Business Core API

## Punto de entrada recomendado

```ts
import {
  BusinessNarrativeEngine,
  BusinessSnapshotEngine,
  BusinessHealthScoreEngine,
  BusinessRepository,
  formatBusinessPercent,
} from '@/core/business'
```

## Contratos estables

Los siguientes módulos forman la API pública del Core:

- `attainment`
- `builders`
- `cube`
- `formatting`
- `health`
- `metrics`
- `models`
- `narrative`
- `repository`
- `snapshots`
- `targets`

## Regla de consumo

Los Workspaces no deben importar archivos internos como:

```text
core/business/health/healthComponents
core/business/narrative/executiveRisks
core/business/cube/engine/executors/...
```

Deben consumir la fachada pública o el `index.ts` oficial del módulo.

## Estabilidad

- Los contratos exportados por la fachada se consideran públicos.
- Los archivos internos pueden reorganizarse sin afectar consumidores.
- Todo breaking change futuro requiere ADR, versión y migración documentada.
