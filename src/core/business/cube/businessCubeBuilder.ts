import type { BusinessRepository } from '../repository';

import type { BusinessCube } from './businessCube';
import type { CustomerCubeQueries } from './customers';
import type { BrandCubeQueries } from './brands';
import type { ProductCubeQueries } from './products';
import type { BusinessCubeMetrics } from './metrics';

import { GenericCubeQueryEngine } from './engine';

export function buildBusinessCube(
  repository: BusinessRepository,
): BusinessCube {
  const customers: CustomerCubeQueries =
    new GenericCubeQueryEngine(repository, 'customers');

  const brands: BrandCubeQueries =
    new GenericCubeQueryEngine(repository, 'brands');

  const products: ProductCubeQueries =
    new GenericCubeQueryEngine(repository, 'products');

  const metrics: BusinessCubeMetrics = {};

  return {
    repository,
    customers,
    brands,
    products,
    metrics,
  };
}