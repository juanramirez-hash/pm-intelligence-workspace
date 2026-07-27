import type { BusinessRepository } from '../../../repository';
import type { BusinessCubeMetrics } from '../../metrics';
import type { CubeMetric } from '../../shared';

export type RevenuePeriod = ReturnType<
  BusinessRepository['revenue']['getMonthly']
>[number];

export type PeriodMetricSelector = (
  period: RevenuePeriod,
  metrics: BusinessCubeMetrics,
) => number | null;

export type PeriodMetricTotalSelector = (
  periods: readonly RevenuePeriod[],
  metrics: BusinessCubeMetrics,
) => number | null;

export interface PeriodMetricDefinition {
  readonly metric: CubeMetric;
  readonly selectValue: PeriodMetricSelector;
  readonly selectTotal?: PeriodMetricTotalSelector;
}
