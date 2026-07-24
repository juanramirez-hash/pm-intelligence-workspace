import type {
  CubeResultRow,
} from '../../shared';

/**
 * Calcula el total de una colección de filas.
 */
export function calculateCubeTotal(
  rows: readonly CubeResultRow[],
): number {
  return rows.reduce(
    (sum, row) =>
      sum + row.value,
    0,
  );
}