import type { BusinessRepository } from '../repository';
import type { BusinessCube } from './businessCube';
import type { CustomerCubeQueries } from './customers';
import type { BrandCubeQueries } from './brands';
import type { ProductCubeQueries } from './products';
import { GenericCubeQueryEngine } from './engine';
import { buildBusinessCubeMetrics } from './metrics';

export function buildBusinessCube(
  repository: BusinessRepository,
): BusinessCube {
  const metrics = buildBusinessCubeMetrics();

  const customers: CustomerCubeQueries =
    new GenericCubeQueryEngine(repository, metrics, 'customers');

  const brands: BrandCubeQueries =
    new GenericCubeQueryEngine(repository, metrics, 'brands');

  const products: ProductCubeQueries =
    new GenericCubeQueryEngine(repository, metrics, 'products');

  return {
    repository,
    customers,
    brands,
    products,
    metrics,
  };
}
