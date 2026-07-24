import type {
  CubeDimensionValue,
  CubePeriodId,
} from './cubeTypes';

/**
 * Filtros estándar para cualquier consulta del Business Cube.
 *
 * Todos los filtros son opcionales y pueden combinarse.
 */
export interface CubeFilter {
  /**
   * Periodo inicial (ISO).
   */
  readonly periodFrom?: CubePeriodId;

  /**
   * Periodo final (ISO).
   */
  readonly periodTo?: CubePeriodId;

  /**
   * Clientes.
   */
  readonly customers?: readonly CubeDimensionValue[];

  /**
   * Marcas.
   */
  readonly brands?: readonly CubeDimensionValue[];

  /**
   * Productos.
   */
  readonly products?: readonly CubeDimensionValue[];

  /**
   * Vendedores.
   */
  readonly salesRepresentatives?: readonly CubeDimensionValue[];

  /**
   * Sucursales.
   */
  readonly locations?: readonly CubeDimensionValue[];

  /**
   * Monedas.
   */
  readonly currencies?: readonly CubeDimensionValue[];
}