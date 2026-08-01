export interface NormalizedExchangeRateRow {
  periodId: string
  sourceCurrency: string
  targetCurrency: string
  rate: number
  sourceReference: string | null
  effectiveDate: string | null
  recordedAt: string
}

export interface ExchangeRateDatasetSummary {
  periodStart: string | null
  periodEnd: string | null
  totalRates: number
  currencyPairs: number
  invalidRates: number
  processedRows: number
  ignoredRows: number
}
