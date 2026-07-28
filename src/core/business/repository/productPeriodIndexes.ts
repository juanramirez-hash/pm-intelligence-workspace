import type {
  BusinessProductPeriod,
} from '../entities/productPeriod'

import type {
  BusinessDataModel,
} from '../models'

export interface ProductPeriodIndexes {
  byProductId:
    Map<string, BusinessProductPeriod[]>

  byPeriodId:
    Map<string, BusinessProductPeriod[]>
}

function addToIndex(
  index: Map<string, BusinessProductPeriod[]>,
  key: string,
  value: BusinessProductPeriod,
): void {
  const indexedValues = index.get(key) ?? []
  indexedValues.push(value)
  index.set(key, indexedValues)
}

export function buildProductPeriodIndexes(
  model: BusinessDataModel,
): ProductPeriodIndexes {
  const byProductId =
    new Map<string, BusinessProductPeriod[]>()

  const byPeriodId =
    new Map<string, BusinessProductPeriod[]>()

  for (const productPeriod of model.productPeriods.values()) {
    addToIndex(
      byProductId,
      productPeriod.productId,
      productPeriod,
    )

    addToIndex(
      byPeriodId,
      productPeriod.periodId,
      productPeriod,
    )
  }

  for (const periods of byProductId.values()) {
    periods.sort(
      (left, right) =>
        left.periodId.localeCompare(right.periodId),
    )
  }

  for (const periods of byPeriodId.values()) {
    periods.sort(
      (left, right) =>
        left.productId.localeCompare(right.productId),
    )
  }

  return {
    byProductId,
    byPeriodId,
  }
}
