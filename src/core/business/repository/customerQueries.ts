import type {
  BusinessCustomer,
} from '../entities/customer'

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
      id
        .trim()
        .toLocaleUpperCase('es-MX')

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
}