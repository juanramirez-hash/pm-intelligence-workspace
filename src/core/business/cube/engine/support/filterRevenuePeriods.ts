import type {
  RevenuePeriodSummary,
} from '../../../repository/revenueQueries';

import type {
  CubeFilter,
} from '../../shared';

/**
 * Aplica filtros temporales a los resúmenes mensuales del repositorio.
 */
export function filterRevenuePeriods(
  periods: readonly RevenuePeriodSummary[],
  filter?: CubeFilter,
): RevenuePeriodSummary[] {
  const periodFrom =
    filter?.periodFrom;

  const periodTo =
    filter?.periodTo;

  return periods.filter(
    period => {
      if (
        periodFrom &&
        period.id < periodFrom
      ) {
        return false;
      }

      if (
        periodTo &&
        period.id > periodTo
      ) {
        return false;
      }

      return true;
    },
  );
}