import type { BusinessRepository } from '../../../repository';
import type { BusinessCubeMetrics } from '../../metrics';
import type {
  CubeQuery,
  CubeResult,
  CubeResultRow,
} from '../../shared';
import type { CubeMetricExecutor } from './cubeMetricExecutor';
import type { PeriodMetricDefinition } from '../registry';
import {
  buildCubeResult,
  filterRevenuePeriods,
  limitCubeRows,
  sortCubeRows,
} from '../support';

export class PeriodMetricExecutor implements CubeMetricExecutor {
  private readonly repository: BusinessRepository;

  private readonly metrics: BusinessCubeMetrics;

  private readonly definition: PeriodMetricDefinition;

  public constructor(
    repository: BusinessRepository,
    metrics: BusinessCubeMetrics,
    definition: PeriodMetricDefinition,
  ) {
    this.repository = repository;
    this.metrics = metrics;
    this.definition = definition;
  }

  public execute(query: CubeQuery): CubeResult {
    if (
      query.groupBy !== 'period' ||
      query.periodGranularity !== 'month'
    ) {
      throw new Error(
        `PeriodMetricExecutor for "${this.definition.metric}" currently supports only groupBy "period" with periodGranularity "month".`,
      );
    }

    const filteredPeriods = filterRevenuePeriods(
      this.repository.revenue.getMonthly(),
      query.filter,
    );

    let rows: CubeResultRow[] = filteredPeriods.map(period => ({
      dimension: period.id,
      value: this.definition.selectValue(period, this.metrics) ?? 0,
    }));

    rows = sortCubeRows(rows, query);
    rows = limitCubeRows(rows, query.limit);

    const aggregateTotal = this.definition.selectTotal
      ? this.definition.selectTotal(filteredPeriods, this.metrics) ?? 0
      : undefined;

    return buildCubeResult(
      this.definition.metric,
      'period',
      rows,
      aggregateTotal,
    );
  }
}
