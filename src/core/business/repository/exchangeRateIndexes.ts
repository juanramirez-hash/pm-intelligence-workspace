import type {
  BusinessExchangeRate,
} from '../entities/exchangeRate'

import type {
  BusinessDataModel,
} from '../models'

export interface ExchangeRateIndexes {
  byPeriod: Map<string, BusinessExchangeRate[]>
}

export function buildExchangeRateIndexes(
  model: BusinessDataModel,
): ExchangeRateIndexes {
  const byPeriod = new Map<string, BusinessExchangeRate[]>()

  for (const rate of model.exchangeRates?.values() ?? []) {
    const items = byPeriod.get(rate.periodId) ?? []
    items.push(rate)
    byPeriod.set(rate.periodId, items)
  }

  return { byPeriod }
}
