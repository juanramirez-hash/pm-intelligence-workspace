import type { CubeQuery, CubeResult } from '../../shared';

/**
 * Contrato para ejecutar una métrica específica del Business Cube.
 */
export interface CubeMetricExecutor {
  execute(query: CubeQuery): CubeResult;
}