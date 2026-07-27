import type {
  BusinessBrandPeriod,
} from '../entities/brandPeriod'

import type {
  BusinessBrandTarget,
} from '../entities/brandTarget'

import type {
  BusinessRepository,
} from '../repository'

import {
  calculateGrossMargin,
} from '../cube/metrics'

import type {
  BusinessTargetAttainment,
} from './businessTargetAttainment'

import {
  calculateMetricAttainment,
  calculateRevenuePace,
} from './targetAttainmentCalculations'

import type {
  TargetAttainmentOptions,
} from './targetAttainmentOptions'

function getAttainmentId(
  periodId: string,
  brandId: string,
): string {
  return `${periodId}::${brandId}`
}

function resolveActualRevenue(
  period: BusinessBrandPeriod | undefined,
): number {
  return period?.revenue ?? 0
}

function resolveActualGrossProfit(
  period: BusinessBrandPeriod | undefined,
): number {
  return period?.grossProfit ?? 0
}

function resolveTargetRevenue(
  target: BusinessBrandTarget | undefined,
): number | null {
  return target?.targetRevenue ?? null
}

function resolveTargetGrossProfit(
  target: BusinessBrandTarget | undefined,
): number | null {
  return target?.targetGrossProfit ?? null
}

function resolveTargetGrossMargin(
  target: BusinessBrandTarget | undefined,
): number | null {
  return target?.targetGrossMargin ?? null
}

export class TargetAttainmentEngine {
  private readonly repository:
    BusinessRepository

  constructor(
    repository: BusinessRepository,
  ) {
    this.repository = repository
  }

  calculateBrandAttainment(
    brandId: string,
    periodId: string,
    options: TargetAttainmentOptions = {},
  ): BusinessTargetAttainment | undefined {
    const period =
      this.repository.brand.findPeriod(
        brandId,
        periodId,
      )

    const target =
      this.repository.targets
        .findBrandTarget(
          brandId,
          periodId,
        )

    if (!period && !target) {
      return undefined
    }

    const normalizedBrandId =
      period?.brandId ??
      target?.brandId

    const normalizedPeriodId =
      period?.periodId ??
      target?.periodId

    if (
      !normalizedBrandId ||
      !normalizedPeriodId
    ) {
      return undefined
    }

    const actualRevenue =
      resolveActualRevenue(period)

    const actualGrossProfit =
      resolveActualGrossProfit(period)

    const actualGrossMargin =
      calculateGrossMargin(
        actualRevenue,
        actualGrossProfit,
      )

    const targetRevenue =
      resolveTargetRevenue(target)

    return {
      id: getAttainmentId(
        normalizedPeriodId,
        normalizedBrandId,
      ),
      brandId: normalizedBrandId,
      periodId: normalizedPeriodId,
      hasActual: period !== undefined,
      hasTarget: target !== undefined,
      revenue:
        calculateMetricAttainment(
          actualRevenue,
          targetRevenue,
        ),
      grossProfit:
        calculateMetricAttainment(
          actualGrossProfit,
          resolveTargetGrossProfit(
            target,
          ),
        ),
      grossMargin:
        calculateMetricAttainment(
          actualGrossMargin,
          resolveTargetGrossMargin(
            target,
          ),
        ),
      revenuePace:
        calculateRevenuePace(
          actualRevenue,
          targetRevenue,
          target?.workingDays ?? null,
          options.elapsedWorkingDays,
        ),
    }
  }
}
