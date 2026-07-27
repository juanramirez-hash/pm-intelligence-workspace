# Commit A-002.9.1 - Architecture Test Isolation

## Objective

Correct the production build failure introduced by the architecture-boundary test in A-002.9.

## Changes

- Moved `coreBoundaries.test.ts` from `src/core/business/architecture/` to `tests/architecture/`.
- Kept Node-only filesystem APIs outside the production source tree.
- Updated Vitest discovery to include `tests/**/*.test.ts`.
- Added an explicit `string` type to directory entries used by the architecture scan.
- Advanced the package version to `0.9.7`.

## Architecture impact

Production code under `src/` no longer contains Node-only test infrastructure. Architecture validation remains active during `npm run test` but is excluded from `tsc -b` for the browser application.

## Acceptance criteria

- `npm run test` includes the architecture-boundary test.
- `npm run build` completes without Node API type errors.
- Existing Business Core behavior remains unchanged.
