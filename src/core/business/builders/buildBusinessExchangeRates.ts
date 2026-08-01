import type {
  NormalizedExchangeRateRow,
} from '../../../features/data-center/importers/exchange-rates/exchangeRateTypes'

import type {
  BusinessExchangeRate,
} from '../entities/exchangeRate'

function normalizeCurrency(value: string): string {
  return value.trim().toLocaleUpperCase('es-MX')
}

export function buildExchangeRateId(
  periodId: string,
  sourceCurrency: string,
  targetCurrency: string,
): string {
  return [
    periodId,
    normalizeCurrency(sourceCurrency),
    normalizeCurrency(targetCurrency),
  ].join('::')
}

export function buildBusinessExchangeRates(
  rows: readonly NormalizedExchangeRateRow[],
): Map<string, BusinessExchangeRate> {
  const rates = new Map<string, BusinessExchangeRate>()

  for (const row of rows) {
    const sourceCurrency = normalizeCurrency(row.sourceCurrency)
    const targetCurrency = normalizeCurrency(row.targetCurrency)
    const id = buildExchangeRateId(
      row.periodId,
      sourceCurrency,
      targetCurrency,
    )

    rates.set(id, {
      id,
      periodId: row.periodId,
      sourceCurrency,
      targetCurrency,
      rate: row.rate,
      sourceReference: row.sourceReference,
      effectiveDate: row.effectiveDate,
      recordedAt: row.recordedAt,
    })
  }

  return rates
}
