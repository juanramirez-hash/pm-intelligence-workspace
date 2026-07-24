import type {
  BusinessRepository,
} from '../../repository';

import type {
  CubeExecutionOptions,
  CubeQuery,
  CubeResult,
} from '../shared';

import {
  CubeQueryValidator,
} from './cubeQueryValidator';

import {
  PeriodMetricExecutor,
} from './executors';

/**
 * Motor genérico de consultas del Business Cube.
 */
export class GenericCubeQueryEngine {
  private readonly validator: CubeQueryValidator;

  private readonly revenueExecutor: PeriodMetricExecutor;

  private readonly grossProfitExecutor: PeriodMetricExecutor;

  public constructor(
    repository: BusinessRepository,
    _domain: string,
  ) {
    this.validator =
      new CubeQueryValidator();

    this.revenueExecutor =
      new PeriodMetricExecutor(
        repository,
        'revenue',
        period => period.revenue,
      );

    this.grossProfitExecutor =
      new PeriodMetricExecutor(
        repository,
        'grossProfit',
        period => period.grossProfit,
      );
  }

  public query(
    query: CubeQuery,
    _options?: CubeExecutionOptions,
  ): CubeResult {
    this.validator.validate(
      query,
    );

    switch (query.metric) {
      case 'revenue':
        return this.revenueExecutor.execute(
          query,
        );

      case 'grossProfit':
        return this.grossProfitExecutor.execute(
          query,
        );

      default:
        throw new Error(
          `Unsupported cube metric: ${query.metric}`,
        );
    }
  }
}