import type {
  BusinessCustomer,
} from '../entities/customer'

import type {
  BusinessCustomerPeriod,
} from '../entities/customerPeriod'

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

export class CustomerQueries {
  private readonly model:
    BusinessDataModel

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model
  }

  getAll():
    BusinessCustomer[] {
    return [
      ...this.model.customers.values(),
    ]
  }

  findById(
    id: string,
  ): BusinessCustomer | undefined {
    const normalizedId =
      normalizeIdentifier(id)

    if (!normalizedId) {
      return undefined
    }

    return this.model.customers.get(
      normalizedId,
    )
  }

  topByRevenue(
    limit = 10,
  ): BusinessCustomer[] {
    const normalizedLimit =
      normalizeLimit(limit)

    return this.getAll()
      .sort(
        (customerA, customerB) => {
          const revenueDifference =
            customerB.revenue -
            customerA.revenue

          if (
            revenueDifference !== 0
          ) {
            return revenueDifference
          }

          return customerA.id.localeCompare(
            customerB.id,
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
  ): BusinessCustomer[] {
    const normalizedLimit =
      normalizeLimit(limit)

    return this.getAll()
      .sort(
        (customerA, customerB) => {
          const grossProfitDifference =
            customerB.grossProfit -
            customerA.grossProfit

          if (
            grossProfitDifference !== 0
          ) {
            return grossProfitDifference
          }

          return customerA.id.localeCompare(
            customerB.id,
          )
        },
      )
      .slice(
        0,
        normalizedLimit,
      )
  }

  findPeriodsByCustomerId(
    customerId: string,
  ): BusinessCustomerPeriod[] {
    const normalizedCustomerId =
      normalizeIdentifier(
        customerId,
      )

    if (!normalizedCustomerId) {
      return []
    }

    return [
      ...this.model.customerPeriods.values(),
    ].filter(
      customerPeriod =>
        customerPeriod.customerId ===
        normalizedCustomerId,
    )
  }

  findPeriod(
    customerId: string,
    periodId: string,
  ): BusinessCustomerPeriod | undefined {
    const normalizedCustomerId =
      normalizeIdentifier(
        customerId,
      )

    const normalizedPeriodId =
      normalizePeriodId(
        periodId,
      )

    if (
      !normalizedCustomerId ||
      !normalizedPeriodId
    ) {
      return undefined
    }

    const customerPeriodId =
      `${normalizedPeriodId}::${normalizedCustomerId}`

    return this.model.customerPeriods.get(
      customerPeriodId,
    )
  }

  getCustomerTimeline(
    customerId: string,
  ): BusinessCustomerPeriod[] {
    return this
      .findPeriodsByCustomerId(
        customerId,
      )
      .sort(
        (
          customerPeriodA,
          customerPeriodB,
        ) =>
          customerPeriodA.periodId.localeCompare(
            customerPeriodB.periodId,
          ),
      )
  }
}