import type {
  BusinessCustomerPeriod,
} from '../entities/customerPeriod'

import type {
  BusinessDataModel,
} from '../models'

export interface CustomerPeriodIndexes {
  byCustomerId:
    Map<string, BusinessCustomerPeriod[]>

  byPeriodId:
    Map<string, BusinessCustomerPeriod[]>
}

function addToIndex(
  index: Map<string, BusinessCustomerPeriod[]>,
  key: string,
  value: BusinessCustomerPeriod,
): void {
  const indexedValues =
    index.get(key) ?? []

  indexedValues.push(value)
  index.set(key, indexedValues)
}

function sortChronologically(
  periods: BusinessCustomerPeriod[],
): void {
  periods.sort(
    (left, right) =>
      left.periodId.localeCompare(
        right.periodId,
      ),
  )
}

function sortByCustomerId(
  periods: BusinessCustomerPeriod[],
): void {
  periods.sort(
    (left, right) =>
      left.customerId.localeCompare(
        right.customerId,
      ),
  )
}

export function buildCustomerPeriodIndexes(
  model: BusinessDataModel,
): CustomerPeriodIndexes {
  const byCustomerId =
    new Map<
      string,
      BusinessCustomerPeriod[]
    >()

  const byPeriodId =
    new Map<
      string,
      BusinessCustomerPeriod[]
    >()

  for (
    const customerPeriod of
      model.customerPeriods.values()
  ) {
    addToIndex(
      byCustomerId,
      customerPeriod.customerId,
      customerPeriod,
    )

    addToIndex(
      byPeriodId,
      customerPeriod.periodId,
      customerPeriod,
    )
  }

  for (
    const periods of
      byCustomerId.values()
  ) {
    sortChronologically(periods)
  }

  for (
    const periods of
      byPeriodId.values()
  ) {
    sortByCustomerId(periods)
  }

  return {
    byCustomerId,
    byPeriodId,
  }
}
