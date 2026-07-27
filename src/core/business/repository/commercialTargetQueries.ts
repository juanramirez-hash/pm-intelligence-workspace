import type {
  BusinessBrandTarget,
} from '../entities/brandTarget'

import type {
  BusinessDataModel,
} from '../models'

import {
  getBrandTargetId,
  normalizeBusinessIdentifier,
  normalizeBusinessPeriodId,
} from '../targets'

function sortTargets(
  targets: BusinessBrandTarget[],
): BusinessBrandTarget[] {
  return targets.sort(
    (
      targetA,
      targetB,
    ) => {
      const periodDifference =
        targetA.periodId.localeCompare(
          targetB.periodId,
        )

      if (periodDifference !== 0) {
        return periodDifference
      }

      return targetA.brandId.localeCompare(
        targetB.brandId,
      )
    },
  )
}

export class CommercialTargetQueries {
  private readonly model:
    BusinessDataModel

  private readonly targetsByBrandId:
    Map<
      string,
      BusinessBrandTarget[]
    >

  private readonly targetsByPeriodId:
    Map<
      string,
      BusinessBrandTarget[]
    >

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model

    this.targetsByBrandId =
      new Map<
        string,
        BusinessBrandTarget[]
      >()

    this.targetsByPeriodId =
      new Map<
        string,
        BusinessBrandTarget[]
      >()

    for (
      const target of
        model.brandTargets.values()
    ) {
      const brandTargets =
        this.targetsByBrandId.get(
          target.brandId,
        ) ?? []

      brandTargets.push(target)

      this.targetsByBrandId.set(
        target.brandId,
        brandTargets,
      )

      const periodTargets =
        this.targetsByPeriodId.get(
          target.periodId,
        ) ?? []

      periodTargets.push(target)

      this.targetsByPeriodId.set(
        target.periodId,
        periodTargets,
      )
    }

    for (
      const targets of
        this.targetsByBrandId.values()
    ) {
      sortTargets(targets)
    }

    for (
      const targets of
        this.targetsByPeriodId.values()
    ) {
      sortTargets(targets)
    }
  }

  getAll():
    BusinessBrandTarget[] {
    return sortTargets([
      ...this.model.brandTargets.values(),
    ])
  }

  findBrandTarget(
    brandId: string,
    periodId: string,
  ): BusinessBrandTarget | undefined {
    const normalizedBrandId =
      normalizeBusinessIdentifier(
        brandId,
      )

    const normalizedPeriodId =
      normalizeBusinessPeriodId(
        periodId,
      )

    if (
      !normalizedBrandId ||
      !normalizedPeriodId
    ) {
      return undefined
    }

    return this.model.brandTargets.get(
      getBrandTargetId(
        normalizedPeriodId,
        normalizedBrandId,
      ),
    )
  }

  findPeriodTargets(
    periodId: string,
  ): BusinessBrandTarget[] {
    const normalizedPeriodId =
      normalizeBusinessPeriodId(
        periodId,
      )

    if (!normalizedPeriodId) {
      return []
    }

    return [
      ...(
        this.targetsByPeriodId.get(
          normalizedPeriodId,
        ) ?? []
      ),
    ]
  }

  findTargetsByBrand(
    brandId: string,
  ): BusinessBrandTarget[] {
    const normalizedBrandId =
      normalizeBusinessIdentifier(
        brandId,
      )

    if (!normalizedBrandId) {
      return []
    }

    return [
      ...(
        this.targetsByBrandId.get(
          normalizedBrandId,
        ) ?? []
      ),
    ]
  }

  exists(
    brandId: string,
    periodId: string,
  ): boolean {
    return this.findBrandTarget(
      brandId,
      periodId,
    ) !== undefined
  }

  getAvailablePeriods(): string[] {
    return [
      ...this.targetsByPeriodId.keys(),
    ].sort()
  }

  getTargetedBrands(): string[] {
    return [
      ...this.targetsByBrandId.keys(),
    ].sort()
  }
}
