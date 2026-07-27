import type {
  CubeDimension,
  CubeMetric,
  CubeResult,
  CubeResultRow,
} from '../../shared';
import { calculateCubeTotal } from './calculateCubeTotal';

export function buildCubeResult(
  metric: CubeMetric,
  groupBy: CubeDimension,
  rows: readonly CubeResultRow[],
  aggregateTotal?: number,
): CubeResult {
  const resultRows = [...rows];

  return {
    metric,
    groupBy,
    total: aggregateTotal ?? calculateCubeTotal(resultRows),
    rows: resultRows,
  };
}
