import type { BusinessRepository } from '../../repository';
import type { BusinessCubeMetrics } from '../metrics';
import type {
  CubeExecutionOptions,
  CubeQuery,
  CubeResult,
} from '../shared';
import { CubeQueryValidator } from './cubeQueryValidator';
import { PeriodMetricExecutor } from './executors';
import { getPeriodMetricDefinition } from './registry';

export class GenericCubeQueryEngine {
  private readonly repository: BusinessRepository;

  private readonly metrics: BusinessCubeMetrics;

  private readonly validator: CubeQueryValidator;

  public constructor(
    repository: BusinessRepository,
    metrics: BusinessCubeMetrics,
    _domain: string,
  ) {
    this.repository = repository;
    this.metrics = metrics;
    this.validator = new CubeQueryValidator();
  }

  public query(
    query: CubeQuery,
    _options?: CubeExecutionOptions,
  ): CubeResult {
    this.validator.validate(query);

    const definition = getPeriodMetricDefinition(query.metric);

    if (!definition) {
      throw new Error(`Unsupported cube metric: ${query.metric}`);
    }

    return new PeriodMetricExecutor(
      this.repository,
      this.metrics,
      definition,
    ).execute(query);
  }
}
