export interface BusinessExchangeRate {
  id: string
  periodId: string
  sourceCurrency: string
  targetCurrency: string
  rate: number
  sourceReference: string | null
  effectiveDate: string | null
  recordedAt: string
}
