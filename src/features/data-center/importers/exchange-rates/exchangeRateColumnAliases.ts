export const EXCHANGE_RATE_COLUMN_ALIASES = {
  periodId: [
    'Periodo',
    'Period',
    'Mes',
    'Month',
  ],
  sourceCurrency: [
    'Moneda origen',
    'Source Currency',
    'Moneda',
    'Currency',
  ],
  targetCurrency: [
    'Moneda destino',
    'Target Currency',
  ],
  rate: [
    'Tipo de cambio',
    'Tipo Cambio',
    'Exchange Rate',
    'Rate',
  ],
  sourceReference: [
    'Fuente',
    'Referencia',
    'Source',
    'Source Reference',
  ],
  effectiveDate: [
    'Fecha efectiva',
    'Fecha',
    'Effective Date',
  ],
} as const

export type ExchangeRateField =
  keyof typeof EXCHANGE_RATE_COLUMN_ALIASES
