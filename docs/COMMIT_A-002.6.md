# Commit A-002.6 — Business Snapshot

**Versión:** 0.9.3  
**Sprint:** A-002 — Core Analytics  
**Estado:** Completado

## Objetivo

Crear el contrato de lectura que conectará el Core Analytics con Brand Workspace,
Health Score, Executive Brief y futuros consumidores. El Snapshot consolida una
marca y un periodo en un único objeto sin trasladar reglas de negocio a React.

## Cambios

### Nuevos archivos

- `src/core/business/snapshots/businessSnapshot.ts`
- `src/core/business/snapshots/businessSnapshotOptions.ts`
- `src/core/business/snapshots/businessSnapshotEngine.ts`
- `src/core/business/snapshots/businessSnapshotEngine.test.ts`
- `src/core/business/snapshots/index.ts`

### Archivos modificados

- `src/core/business/repository/businessRepository.ts`
- `docs/ARCHITECTURE_DECISIONS.md`
- `docs/CHANGELOG.md`
- `docs/RELEASE_NOTES.md`
- `docs/ROADMAP.md`
- `package.json`
- `package-lock.json`

## Contrato principal

```ts
snapshotEngine.getBrandSnapshot(
  brandId,
  periodId,
  { elapsedWorkingDays },
)
```

El resultado consolida:

- identidad de marca y periodo;
- hechos de venta, GP, margen, cantidad y documentos;
- número de clientes y productos;
- ticket promedio;
- objetivos comerciales declarados;
- cumplimiento, variaciones, ritmo y proyección del periodo.

## Decisiones

- El Snapshot es derivado y no se almacena dentro de `BusinessDataModel`.
- La UI representa Snapshots y no recalcula reglas comerciales.
- Los días laborales transcurridos siguen siendo explícitos.
- La fecha de generación se toma del modelo fuente, no del reloj del dispositivo.
- Un periodo con objetivo pero sin hechos produce valores aditivos en cero y
  conserva `hasActual: false`.
- Si no existen hechos ni objetivo, el motor devuelve `undefined`.

## Compatibilidad

No se modifica ningún contrato existente de Repository, Cube, Targets o
Attainment. Se añade `BusinessRepository.getGeneratedAt()` como lectura de
metadatos del modelo.

## Próximo commit

`A-002.7 — Health Score Engine`.
