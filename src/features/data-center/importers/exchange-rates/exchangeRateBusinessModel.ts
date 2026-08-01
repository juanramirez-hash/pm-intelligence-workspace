import type {
  ExchangeRateDatasetSummary,
  NormalizedExchangeRateRow,
} from './exchangeRateTypes'

export interface ExchangeRateBusinessModel {
  rates: NormalizedExchangeRateRow[]
  summary: ExchangeRateDatasetSummary
}

function exchangeRateKey(
  row: Pick<
    NormalizedExchangeRateRow,
    'periodId' | 'sourceCurrency' | 'targetCurrency'
  >,
): string {
  return `${row.periodId}::${row.sourceCurrency}::${row.targetCurrency}`
}

export function upsertExchangeRateRows(
  existingRows: readonly NormalizedExchangeRateRow[],
  incomingRows: readonly NormalizedExchangeRateRow[],
): NormalizedExchangeRateRow[] {
  const rowsByKey = new Map<string, NormalizedExchangeRateRow>()

  for (const row of existingRows) {
    rowsByKey.set(exchangeRateKey(row), row)
  }

  for (const row of incomingRows) {
    rowsByKey.set(exchangeRateKey(row), row)
  }

  return [...rowsByKey.values()].sort(
    (left, right) =>
      left.periodId.localeCompare(right.periodId) ||
      left.sourceCurrency.localeCompare(right.sourceCurrency) ||
      left.targetCurrency.localeCompare(right.targetCurrency),
  )
}

export function buildExchangeRateBusinessModel(
  rows: readonly NormalizedExchangeRateRow[],
  ignoredRows = 0,
): ExchangeRateBusinessModel {
  const rates = upsertExchangeRateRows([], rows)
  const periods = rates
    .map((rate) => rate.periodId)
    .sort()

  return {
    rates,
    summary: {
      periodStart: periods[0] ?? null,
      periodEnd: periods.at(-1) ?? null,
      totalRates: rates.length,
      currencyPairs: new Set(
        rates.map(
          (rate) => `${rate.sourceCurrency}::${rate.targetCurrency}`,
        ),
      ).size,
      invalidRates: rates.filter(
        (rate) => !Number.isFinite(rate.rate) || rate.rate <= 0,
      ).length,
      processedRows: rates.length,
      ignoredRows,
    },
  }
}
