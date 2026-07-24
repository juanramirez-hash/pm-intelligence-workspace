import type {
  CubeMetric,
} from '../../shared';

import type {
  PeriodMetricDefinition,
} from './metricRegistryTypes';

const periodMetricDefinitions:
  Partial<
    Record<
      CubeMetric,
      PeriodMetricDefinition
    >
  > = {
    revenue: {
      metric: 'revenue',
      selectValue:
        period => period.revenue,
    },

    grossProfit: {
      metric: 'grossProfit',
      selectValue:
        period => period.grossProfit,
    },
  };

/**
 * Obtiene la definición de una métrica mensual.
 */
export function getPeriodMetricDefinition(
  metric: CubeMetric,
): PeriodMetricDefinition | undefined {
  return periodMetricDefinitions[
    metric
  ];
}

/**
 * Indica si una métrica está registrada como métrica mensual.
 */
export function hasPeriodMetricDefinition(
  metric: CubeMetric,
): boolean {
  return getPeriodMetricDefinition(
    metric,
  ) !== undefined;
}