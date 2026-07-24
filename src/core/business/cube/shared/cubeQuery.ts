import type {
  CubeDimension,
  CubeMetric,
  CubePeriodGranularity,
  CubeSortOrder,
} from './cubeTypes';

import type { CubeFilter } from './cubeFilter';

/**
 * Configuración estándar para una consulta del Business Cube.
 */
export interface CubeQuery {
  /**
   * Métrica principal que se desea calcular.
   */
  readonly metric: CubeMetric;

  /**
   * Dimensión utilizada para agrupar los resultados.
   *
   * Si se omite, la consulta devuelve un resultado agregado.
   */
  readonly groupBy?: CubeDimension;

  /**
   * Granularidad temporal para consultas agrupadas por tiempo.
   */
  readonly periodGranularity?: CubePeriodGranularity;

  /**
   * Filtros aplicados a la consulta.
   */
  readonly filter?: CubeFilter;

  /**
   * Campo utilizado para ordenar los resultados.
   *
   * Por defecto puede interpretarse como la métrica principal.
   */
  readonly orderBy?: CubeMetric | CubeDimension;

  /**
   * Dirección del ordenamiento.
   */
  readonly order?: CubeSortOrder;

  /**
   * Número máximo de resultados.
   */
  readonly limit?: number;
}