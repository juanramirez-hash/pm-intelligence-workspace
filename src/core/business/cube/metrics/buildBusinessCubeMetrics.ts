import type {
  BusinessCubeMetrics,
} from './businessCubeMetrics';

import {
  calculateAverageTicket,
} from './averageTicket';

import {
  calculateGrossMargin,
} from './grossMargin';

import {
  calculatePeriodVariation,
} from './periodVariation';

export function buildBusinessCubeMetrics():
BusinessCubeMetrics {
  return {
    grossMargin:
      calculateGrossMargin,
    averageTicket:
      calculateAverageTicket,
    periodVariation:
      calculatePeriodVariation,
  };
}
