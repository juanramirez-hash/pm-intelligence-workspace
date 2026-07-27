# Commit A-002.9 — Architecture Hardening

## Objetivo

Cerrar Architecture Sprint A-002 estabilizando los contratos públicos del Business Core, centralizando el formato de valores de negocio y agregando validaciones automáticas de límites arquitectónicos.

## Cambios principales

### Public Business Core facade

Se incorpora `src/core/business/index.ts` como punto de entrada estable para consumidores externos al Core. Los Workspaces deben importar contratos públicos desde esta fachada o desde los barrel exports documentados de cada módulo.

### Business Formatters

Se incorpora `src/core/business/formatting/` con formateadores compartidos para:

- números;
- porcentajes expresados como ratios;
- monedas;
- fallback de valores no evaluables;
- locale y precisión configurables.

El Narrative Engine deja de mantener formateadores propios y delega en esta utilidad común.

### Architecture Boundary Test

Se agrega una prueba automatizada que impide dependencias del Business Core hacia React y capas de presentación como `components`, `layouts`, `pages`, `hooks` y `stores`.

### Documentación operativa

Se agregan:

- `CONTRIBUTING.md`;
- `docs/PUBLIC_BUSINESS_CORE_API.md`;
- `docs/ARCHITECTURE_REVIEW_A-002.9.md`;
- `docs/VALIDATION_A-002.9.md`.

## Archivos creados

- `src/core/business/index.ts`
- `src/core/business/formatting/businessFormatters.ts`
- `src/core/business/formatting/businessFormatters.test.ts`
- `src/core/business/formatting/index.ts`
- `src/core/business/architecture/coreBoundaries.test.ts`
- `CONTRIBUTING.md`
- `docs/PUBLIC_BUSINESS_CORE_API.md`
- `docs/ARCHITECTURE_REVIEW_A-002.9.md`
- `docs/VALIDATION_A-002.9.md`
- `docs/COMMIT_A-002.9.md`

## Archivos modificados

- `src/core/business/narrative/languageRules.ts`
- `package.json`
- `package-lock.json`
- `docs/ROADMAP.md`
- `docs/CHANGELOG.md`
- `docs/RELEASE_NOTES.md`
- `docs/ARCHITECTURE_DECISIONS.md`

## Compatibilidad

- No cambia el contrato funcional de Snapshot, Health Score o Narrative Engine.
- Los exports locales existentes se mantienen.
- La nueva fachada es aditiva.
- No se modifica la UI.

## Versión

`0.9.6`
