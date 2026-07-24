import type {
  CubeDimension,
  CubeDimensionValue,
  CubeMetric,
} from './cubeTypes';

/**
 * Una fila devuelta por una consulta del Business Cube.
 */
export interface CubeResultRow {
  /**
   * Valor de la dimensión agrupada.
   *
   * Ejemplo:
   *  - UNV
   *  - 2026-07
   *  - Cliente 100001
   */
  readonly dimension?: CubeDimensionValue;

  /**
   * Valor calculado de la métrica solicitada.
   */
  readonly value: number;
}

/**
 * Resultado estándar de cualquier consulta.
 */
export interface CubeResult {
  /**
   * Métrica consultada.
   */
  readonly metric: CubeMetric;

  /**
   * Dimensión utilizada para agrupar.
   */
  readonly groupBy?: CubeDimension;

  /**
   * Total agregado de la consulta.
   */
  readonly total: number;

  /**
   * Filas devueltas.
   */
  readonly rows: readonly CubeResultRow[];
}