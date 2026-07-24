import type {
  CubeDimension,
  CubeMetric,
  CubeResult,
  CubeResultRow,
} from '../../shared';

import {
  calculateCubeTotal,
} from './calculateCubeTotal';

/**
 * Construye el resultado estándar de una consulta del Business Cube.
 */
export function buildCubeResult(
  metric: CubeMetric,
  groupBy: CubeDimension,
  rows: readonly CubeResultRow[],
): CubeResult {
  const resultRows =
    [...rows];

  return {
    metric,
    groupBy,
    total: calculateCubeTotal(
      resultRows,
    ),
    rows: resultRows,
  };
}