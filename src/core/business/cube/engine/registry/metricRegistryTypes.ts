import type {
  BusinessRepository,
} from '../../../repository';

import type {
  CubeMetric,
} from '../../shared';

export type RevenuePeriod =
  ReturnType<
    BusinessRepository['revenue']['getMonthly']
  >[number];

export type PeriodMetricSelector =
  (
    period: RevenuePeriod,
  ) => number;

export interface PeriodMetricDefinition {
  metric: CubeMetric;
  selectValue: PeriodMetricSelector;
}