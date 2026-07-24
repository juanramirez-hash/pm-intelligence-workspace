import type { BusinessRepository } from '../../../repository';

import type {
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

/**
 * Ejecuta consultas de la métrica grossProfit.
 */
export class GrossProfitExecutor
  implements CubeMetricExecutor
{
  private readonly repository: BusinessRepository;

  public constructor(
    repository: BusinessRepository,
  ) {
    this.repository = repository;
  }

  public execute(
    query: CubeQuery,
  ): CubeResult {
    if (
      query.groupBy !== 'period' ||
      query.periodGranularity !== 'month'
    ) {
      throw new Error(
        'GrossProfitExecutor currently supports only groupBy "period" with periodGranularity "month".',
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
          value: period.grossProfit,
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
      'grossProfit',
      'period',
      rows,
    );
  }
}