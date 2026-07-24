import type { CubeExecutionOptions } from './cubeExecutionOptions';
import type { CubeQuery } from './cubeQuery';
import type { CubeResult } from './cubeResult';

/**
 * Contrato base para cualquier motor de consultas del Business Cube.
 */
export interface CubeQueryEngine {
  /**
   * Ejecuta una consulta analítica.
   */
  query(
    query: CubeQuery,
    options?: CubeExecutionOptions,
  ): CubeResult;
}