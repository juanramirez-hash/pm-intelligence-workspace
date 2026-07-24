import type {
  BusinessBrand,
} from '../entities/brand'

import type {
  BusinessBrandPeriod,
} from '../entities/brandPeriod'

import type {
  BusinessDataModel,
} from '../models'

function normalizeLimit(
  limit: number,
): number {
  if (
    !Number.isFinite(limit) ||
    limit <= 0
  ) {
    return 0
  }

  return Math.floor(limit)
}

function normalizeIdentifier(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
}

function normalizePeriodId(
  value: string,
): string {
  return value.trim()
}

export class BrandQueries {
  private readonly model:
    BusinessDataModel

  private readonly periodsByBrandId:
    Map<
      string,
      BusinessBrandPeriod[]
    >

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model

    this.periodsByBrandId =
      new Map<
        string,
        BusinessBrandPeriod[]
      >()

    for (
      const brandPeriod of
        model.brandPeriods.values()
    ) {
      let brandPeriods =
        this.periodsByBrandId.get(
          brandPeriod.brandId,
        )

      if (!brandPeriods) {
        brandPeriods = []

        this.periodsByBrandId.set(
          brandPeriod.brandId,
          brandPeriods,
        )
      }

      brandPeriods.push(
        brandPeriod,
      )
    }

    for (
      const brandPeriods of
        this.periodsByBrandId.values()
    ) {
      brandPeriods.sort(
        (
          brandPeriodA,
          brandPeriodB,
        ) =>
          brandPeriodA.periodId
            .localeCompare(
              brandPeriodB.periodId,
            ),
      )
    }
  }

  getAll():
    BusinessBrand[] {
    return [
      ...this.model.brands.values(),
    ]
  }

  findById(
    id: string,
  ): BusinessBrand | undefined {
    const normalizedId =
      normalizeIdentifier(id)

    if (!normalizedId) {
      return undefined
    }

    return this.model.brands.get(
      normalizedId,
    )
  }

  topByRevenue(
    limit = 10,
  ): BusinessBrand[] {
    const normalizedLimit =
      normalizeLimit(limit)

    return this.getAll()
      .sort(
        (brandA, brandB) => {
          const revenueDifference =
            brandB.revenue -
            brandA.revenue

          if (
            revenueDifference !== 0
          ) {
            return revenueDifference
          }

          return brandA.id.localeCompare(
            brandB.id,
          )
        },
      )
      .slice(
        0,
        normalizedLimit,
      )
  }

  topByGrossProfit(
    limit = 10,
  ): BusinessBrand[] {
    const normalizedLimit =
      normalizeLimit(limit)

    return this.getAll()
      .sort(
        (brandA, brandB) => {
          const grossProfitDifference =
            brandB.grossProfit -
            brandA.grossProfit

          if (
            grossProfitDifference !== 0
          ) {
            return grossProfitDifference
          }

          return brandA.id.localeCompare(
            brandB.id,
          )
        },
      )
      .slice(
        0,
        normalizedLimit,
      )
  }

  findPeriodsByBrandId(
    brandId: string,
  ): BusinessBrandPeriod[] {
    const normalizedBrandId =
      normalizeIdentifier(
        brandId,
      )

    if (!normalizedBrandId) {
      return []
    }

    const brandPeriods =
      this.periodsByBrandId.get(
        normalizedBrandId,
      )

    if (!brandPeriods) {
      return []
    }

    return [
      ...brandPeriods,
    ]
  }

  findPeriod(
    brandId: string,
    periodId: string,
  ): BusinessBrandPeriod | undefined {
    const normalizedBrandId =
      normalizeIdentifier(
        brandId,
      )

    const normalizedPeriodId =
      normalizePeriodId(
        periodId,
      )

    if (
      !normalizedBrandId ||
      !normalizedPeriodId
    ) {
      return undefined
    }

    const brandPeriodId =
      `${normalizedPeriodId}::${normalizedBrandId}`

    return this.model.brandPeriods.get(
      brandPeriodId,
    )
  }

  getBrandTimeline(
    brandId: string,
  ): BusinessBrandPeriod[] {
    return this.findPeriodsByBrandId(
      brandId,
    )
  }
}