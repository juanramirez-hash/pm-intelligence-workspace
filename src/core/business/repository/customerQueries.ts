import type {
  BusinessCustomer,
} from '../entities/customer'

import type {
  BusinessCustomerPeriod,
} from '../entities/customerPeriod'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildCustomerPeriodIndexes,
} from './customerPeriodIndexes'

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

  private readonly periodsByCustomerId:
    Map<
      string,
      BusinessCustomerPeriod[]
    >

  private readonly periodsByPeriodId:
    Map<
      string,
      BusinessCustomerPeriod[]
    >

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model

    const indexes =
      buildCustomerPeriodIndexes(
        model,
      )

    this.periodsByCustomerId =
      indexes.byCustomerId

    this.periodsByPeriodId =
      indexes.byPeriodId
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

    const customerPeriods =
      this.periodsByCustomerId.get(
        normalizedCustomerId,
      )

    if (!customerPeriods) {
      return []
    }

    return [
      ...customerPeriods,
    ]
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
    return this.findPeriodsByCustomerId(
      customerId,
    )
  }
  findPeriodsByPeriodId(
    periodId: string,
  ): BusinessCustomerPeriod[] {
    const normalizedPeriodId =
      normalizePeriodId(
        periodId,
      )

    if (!normalizedPeriodId) {
      return []
    }

    const customerPeriods =
      this.periodsByPeriodId.get(
        normalizedPeriodId,
      )

    return customerPeriods
      ? [...customerPeriods]
      : []
  }

  getActivePeriodCount(
    customerId: string,
  ): number {
    const customer =
      this.findById(customerId)

    return customer
      ?.activePeriods.size ?? 0
  }

}