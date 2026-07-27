import type {
  BusinessCustomerBrandPeriod,
} from '../entities/customerBrandPeriod'

import type {
  BusinessDataModel,
} from '../models'

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

export class CustomerBrandQueries {
  private readonly model:
    BusinessDataModel

  private readonly periodsByCustomerId:
    Map<string, BusinessCustomerBrandPeriod[]>

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model
    this.periodsByCustomerId = new Map()

    for (
      const item of
        model.customerBrandPeriods.values()
    ) {
      const items =
        this.periodsByCustomerId.get(
          item.customerId,
        ) ?? []

      items.push(item)

      this.periodsByCustomerId.set(
        item.customerId,
        items,
      )
    }

    for (
      const items of
        this.periodsByCustomerId.values()
    ) {
      items.sort(
        (itemA, itemB) =>
          itemA.periodId.localeCompare(
            itemB.periodId,
          ),
      )
    }
  }

  findPeriod(
    customerId: string,
    brandId: string,
    periodId: string,
  ): BusinessCustomerBrandPeriod | undefined {
    const normalizedCustomerId =
      normalizeIdentifier(customerId)

    const normalizedBrandId =
      normalizeIdentifier(brandId)

    const normalizedPeriodId =
      normalizePeriodId(periodId)

    if (
      !normalizedCustomerId ||
      !normalizedBrandId ||
      !normalizedPeriodId
    ) {
      return undefined
    }

    return this.model.customerBrandPeriods.get(
      `${normalizedPeriodId}::${normalizedCustomerId}::${normalizedBrandId}`,
    )
  }

  findPeriodsByCustomerId(
    customerId: string,
  ): BusinessCustomerBrandPeriod[] {
    const normalizedCustomerId =
      normalizeIdentifier(customerId)

    return [
      ...(
        this.periodsByCustomerId.get(
          normalizedCustomerId,
        ) ?? []
      ),
    ]
  }

  findTimeline(
    customerId: string,
    brandId?: string | null,
  ): BusinessCustomerBrandPeriod[] {
    const normalizedBrandId =
      brandId
        ? normalizeIdentifier(brandId)
        : null

    return this.findPeriodsByCustomerId(
      customerId,
    ).filter(
      (item) =>
        !normalizedBrandId ||
        item.brandId === normalizedBrandId,
    )
  }

  getBrandIdsForCustomer(
    customerId: string,
  ): string[] {
    return [
      ...new Set(
        this.findPeriodsByCustomerId(
          customerId,
        ).map(
          (item) => item.brandId,
        ),
      ),
    ].sort()
  }
}
