import type { BusinessRepository } from '../../repository';

import type {
  CubeExecutionOptions,
  CubeQuery,
  CubeQueryEngine,
  CubeResult,
} from '../shared';

import { CubeQueryValidator } from './cubeQueryValidator';

import {
  RevenueExecutor,
} from './executors';

/**
 * Motor genérico de consultas del Business Cube.
 */
export class GenericCubeQueryEngine implements CubeQueryEngine {
  protected readonly repository: BusinessRepository;

  private readonly validator: CubeQueryValidator;

  private readonly revenueExecutor: RevenueExecutor;

  public constructor(
    repository: BusinessRepository,
    _domain: string,
  ) {
    this.repository = repository;
    this.validator = new CubeQueryValidator();
    this.revenueExecutor =
      new RevenueExecutor(
        repository,
      );
  }

  public query(
    query: CubeQuery,
    _options?: CubeExecutionOptions,
  ): CubeResult {
    this.validator.validate(query);

    switch (query.metric) {
      case 'revenue':
        return this.revenueExecutor.execute(query);

      default:
        throw new Error(
          `Metric "${query.metric}" is not implemented yet.`,
        );
    }
  }
}