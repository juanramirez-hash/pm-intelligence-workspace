import type { ExchangeRateField } from './exchangeRateColumnAliases'

export const REQUIRED_EXCHANGE_RATE_FIELDS: ExchangeRateField[] = [
  'periodId',
  'rate',
]

export const RECOMMENDED_EXCHANGE_RATE_FIELDS: ExchangeRateField[] = [
  'sourceCurrency',
  'targetCurrency',
  'sourceReference',
]

export const OPTIONAL_EXCHANGE_RATE_FIELDS: ExchangeRateField[] = [
  'effectiveDate',
]

export const ALL_EXCHANGE_RATE_FIELDS: ExchangeRateField[] = [
  ...REQUIRED_EXCHANGE_RATE_FIELDS,
  ...RECOMMENDED_EXCHANGE_RATE_FIELDS,
  ...OPTIONAL_EXCHANGE_RATE_FIELDS,
]
