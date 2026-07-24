import type { BusinessRepository } from '../repository';

import type { CustomerCubeQueries } from './customers';
import type { BrandCubeQueries } from './brands';
import type { ProductCubeQueries } from './products';
import type { BusinessCubeMetrics } from './metrics';

export interface BusinessCube {
  /**
   * Fuente oficial de datos del Cube.
   */
  readonly repository: BusinessRepository;

  /**
   * Consultas analíticas de clientes.
   */
  readonly customers: CustomerCubeQueries;

  /**
   * Consultas analíticas de marcas.
   */
  readonly brands: BrandCubeQueries;

  /**
   * Consultas analíticas de productos.
   */
  readonly products: ProductCubeQueries;

  /**
   * Métricas compartidas del Cube.
   */
  readonly metrics: BusinessCubeMetrics;
}