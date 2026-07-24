import type {
  CubeResultRow,
} from '../../shared';

/**
 * Aplica el límite de resultados solicitado.
 */
export function limitCubeRows(
  rows: readonly CubeResultRow[],
  limit?: number,
): CubeResultRow[] {
  if (
    limit === undefined
  ) {
    return [...rows];
  }

  return rows.slice(
    0,
    limit,
  );
}