import type { CubeMetric } from '../../shared';
import type {
  PeriodMetricDefinition,
  RevenuePeriod,
} from './metricRegistryTypes';

function sum(
  periods: readonly RevenuePeriod[],
  selectValue: (period: RevenuePeriod) => number,
): number {
  return periods.reduce(
    (total, period) => total + selectValue(period),
    0,
  );
}

const periodMetricDefinitions: Partial<
  Record<CubeMetric, PeriodMetricDefinition>
> = {
  revenue: {
    metric: 'revenue',
    selectValue: period => period.revenue,
  },
  grossProfit: {
    metric: 'grossProfit',
    selectValue: period => period.grossProfit,
  },
  grossMargin: {
    metric: 'grossMargin',
    selectValue: (period, metrics) =>
      metrics.grossMargin(period.revenue, period.grossProfit),
    selectTotal: (periods, metrics) =>
      metrics.grossMargin(
        sum(periods, period => period.revenue),
        sum(periods, period => period.grossProfit),
      ),
  },
  quantity: {
    metric: 'quantity',
    selectValue: period => period.quantity,
  },
  documents: {
    metric: 'documents',
    selectValue: period => period.documents,
  },
  customers: {
    metric: 'customers',
    selectValue: period => period.customerCount,
  },
  products: {
    metric: 'products',
    selectValue: period => period.productCount,
  },
  brands: {
    metric: 'brands',
    selectValue: period => period.brandCount,
  },
  averageTicket: {
    metric: 'averageTicket',
    selectValue: (period, metrics) =>
      metrics.averageTicket(period.revenue, period.documents),
    selectTotal: (periods, metrics) =>
      metrics.averageTicket(
        sum(periods, period => period.revenue),
        sum(periods, period => period.documents),
      ),
  },
};

export function getPeriodMetricDefinition(
  metric: CubeMetric,
): PeriodMetricDefinition | undefined {
  return periodMetricDefinitions[metric];
}

export function hasPeriodMetricDefinition(
  metric: CubeMetric,
): boolean {
  return getPeriodMetricDefinition(metric) !== undefined;
}
