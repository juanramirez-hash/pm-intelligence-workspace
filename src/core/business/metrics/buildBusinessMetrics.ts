import {
  buildRevenueMetrics,
} from './revenueMetrics'

import type {
  BusinessRepository,
} from '../repository'

import type {
  BusinessMetrics,
} from './businessMetrics'

export function buildBusinessMetrics(
  repository: BusinessRepository,
): BusinessMetrics {
  return {
    revenue:
      buildRevenueMetrics(
        repository,
      ),
  }
}