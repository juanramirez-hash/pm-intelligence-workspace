import type {
  BusinessRepository,
} from '../../../repository';

import type {
  CubeMetric,
  CubeQuery,
  CubeResult,
  CubeResultRow,
} from '../../shared';

import type {
  CubeMetricExecutor,
} from './cubeMetricExecutor';

import {
  buildCubeResult,
  filterRevenuePeriods,
  limitCubeRows,
  sortCubeRows,
} from '../support';

type RevenuePeriod =
  ReturnType<
    BusinessRepository['revenue']['getMonthly']
  >[number];

type PeriodValueSelector =
  (
    period: RevenuePeriod,
  ) => number;

/**
 * Ejecuta métricas mensuales basadas en los periodos
 * expuestos por RevenueQueries.
 */
export class PeriodMetricExecutor
  implements CubeMetricExecutor
{
  private readonly repository: BusinessRepository;

  private readonly metric: CubeMetric;

  private readonly selectValue: PeriodValueSelector;

  public constructor(
    repository: BusinessRepository,
    metric: CubeMetric,
    selectValue: PeriodValueSelector,
  ) {
    this.repository = repository;
    this.metric = metric;
    this.selectValue = selectValue;
  }

  public execute(
    query: CubeQuery,
  ): CubeResult {
    if (
      query.groupBy !== 'period' ||
      query.periodGranularity !== 'month'
    ) {
      throw new Error(
        `PeriodMetricExecutor for "${this.metric}" currently supports only groupBy "period" with periodGranularity "month".`,
      );
    }

    const periods =
      this.repository.revenue.getMonthly();

    const filteredPeriods =
      filterRevenuePeriods(
        periods,
        query.filter,
      );

    let rows: CubeResultRow[] =
      filteredPeriods.map(
        period => ({
          dimension: period.id,
          value: this.selectValue(
            period,
          ),
        }),
      );

    rows =
      sortCubeRows(
        rows,
        query,
      );

    rows =
      limitCubeRows(
        rows,
        query.limit,
      );

    return buildCubeResult(
      this.metric,
      'period',
      rows,
    );
  }
}