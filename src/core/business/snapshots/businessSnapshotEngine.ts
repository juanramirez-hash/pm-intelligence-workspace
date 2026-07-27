import {
  TargetAttainmentEngine,
} from '../attainment'

import type {
  BusinessCube,
} from '../cube'

import {
  buildBusinessCube,
} from '../cube'

import type {
  BusinessBrandPeriod,
} from '../entities/brandPeriod'

import type {
  BusinessBrandTarget,
} from '../entities/brandTarget'

import type {
  BusinessRepository,
} from '../repository'

import type {
  BusinessBrandSnapshot,
  BusinessBrandSnapshotActuals,
  BusinessBrandSnapshotTarget,
} from './businessSnapshot'

import type {
  BusinessSnapshotOptions,
} from './businessSnapshotOptions'

function buildSnapshotId(
  periodId: string,
  brandId: string,
): string {
  return `${periodId}::${brandId}`
}

function buildActuals(
  period: BusinessBrandPeriod | undefined,
  cube: BusinessCube,
): BusinessBrandSnapshotActuals {
  const revenue = period?.revenue ?? 0
  const grossProfit =
    period?.grossProfit ?? 0
  const documents = period?.documents ?? 0

  return {
    revenue,
    grossProfit,
    grossMargin:
      cube.metrics.grossMargin(
        revenue,
        grossProfit,
      ),
    quantity: period?.quantity ?? 0,
    documents,
    customers: period?.customers.size ?? 0,
    products: period?.products.size ?? 0,
    averageTicket:
      cube.metrics.averageTicket(
        revenue,
        documents,
      ),
  }
}

function buildTarget(
  target: BusinessBrandTarget | undefined,
): BusinessBrandSnapshotTarget {
  return {
    revenue: target?.targetRevenue ?? null,
    grossProfit:
      target?.targetGrossProfit ?? null,
    grossMargin:
      target?.targetGrossMargin ?? null,
    workingDays: target?.workingDays ?? null,
  }
}

export class BusinessSnapshotEngine {
  private readonly repository:
    BusinessRepository

  private readonly cube:
    BusinessCube

  private readonly attainmentEngine:
    TargetAttainmentEngine

  constructor(
    repository: BusinessRepository,
    cube: BusinessCube =
      buildBusinessCube(repository),
    attainmentEngine:
      TargetAttainmentEngine =
        new TargetAttainmentEngine(
          repository,
        ),
  ) {
    this.repository = repository
    this.cube = cube
    this.attainmentEngine =
      attainmentEngine
  }

  getBrandSnapshot(
    brandId: string,
    periodId: string,
    options: BusinessSnapshotOptions = {},
  ): BusinessBrandSnapshot | undefined {
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

    const attainment =
      this.attainmentEngine
        .calculateBrandAttainment(
          brandId,
          periodId,
          {
            elapsedWorkingDays:
              options.elapsedWorkingDays,
          },
        )

    if (!attainment) {
      return undefined
    }

    const normalizedBrandId =
      attainment.brandId

    const brand =
      this.repository.brand.findById(
        normalizedBrandId,
      )

    return {
      id: buildSnapshotId(
        attainment.periodId,
        normalizedBrandId,
      ),
      entityType: 'brand',
      generatedAt:
        this.repository.getGeneratedAt(),
      brand: {
        id: normalizedBrandId,
        name:
          brand?.name ??
          normalizedBrandId,
      },
      periodId: attainment.periodId,
      hasActual: period !== undefined,
      hasTarget: target !== undefined,
      actuals: buildActuals(
        period,
        this.cube,
      ),
      target: buildTarget(target),
      attainment,
    }
  }
}
