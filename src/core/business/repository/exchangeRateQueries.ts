import type {
  BusinessExchangeRate,
} from '../entities/exchangeRate'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildExchangeRateId,
} from '../builders/buildBusinessExchangeRates'

import {
  buildExchangeRateIndexes,
} from './exchangeRateIndexes'

import type {
  ExchangeRateIndexes,
} from './exchangeRateIndexes'

export interface ExchangeRateConversionResult {
  available: boolean
  periodId: string
  sourceCurrency: string
  targetCurrency: string
  sourceAmount: number
  convertedAmount: number | null
  rate: number | null
  reason: 'converted' | 'same_currency' | 'missing_rate' | 'invalid_amount'
}

export class ExchangeRateQueries {
  private readonly model: BusinessDataModel
  private readonly indexes: ExchangeRateIndexes

  constructor(model: BusinessDataModel) {
    this.model = model
    this.indexes = buildExchangeRateIndexes(model)
  }

  getAll(): BusinessExchangeRate[] {
    return [...(this.model.exchangeRates?.values() ?? [])]
  }

  getByPeriod(periodId: string): BusinessExchangeRate[] {
    return [...(this.indexes.byPeriod.get(periodId) ?? [])]
  }

  find(
    periodId: string,
    sourceCurrency: string,
    targetCurrency = 'MXN',
  ): BusinessExchangeRate | undefined {
    return this.model.exchangeRates?.get(
      buildExchangeRateId(periodId, sourceCurrency, targetCurrency),
    )
  }

  convert(
    amount: number,
    periodId: string,
    sourceCurrency: string,
    targetCurrency = 'MXN',
  ): ExchangeRateConversionResult {
    const source = sourceCurrency.trim().toLocaleUpperCase('es-MX')
    const target = targetCurrency.trim().toLocaleUpperCase('es-MX')

    if (!Number.isFinite(amount)) {
      return {
        available: false,
        periodId,
        sourceCurrency: source,
        targetCurrency: target,
        sourceAmount: amount,
        convertedAmount: null,
        rate: null,
        reason: 'invalid_amount',
      }
    }

    if (source === target) {
      return {
        available: true,
        periodId,
        sourceCurrency: source,
        targetCurrency: target,
        sourceAmount: amount,
        convertedAmount: amount,
        rate: 1,
        reason: 'same_currency',
      }
    }

    const rate = this.find(periodId, source, target)

    if (!rate || !Number.isFinite(rate.rate) || rate.rate <= 0) {
      return {
        available: false,
        periodId,
        sourceCurrency: source,
        targetCurrency: target,
        sourceAmount: amount,
        convertedAmount: null,
        rate: null,
        reason: 'missing_rate',
      }
    }

    return {
      available: true,
      periodId,
      sourceCurrency: source,
      targetCurrency: target,
      sourceAmount: amount,
      convertedAmount: amount * rate.rate,
      rate: rate.rate,
      reason: 'converted',
    }
  }
}
