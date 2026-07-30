import type { SalesField } from './salesColumnAliases'

export const REQUIRED_SALES_FIELDS: SalesField[] = [
  'date',
  'brand',
  'revenue',
]

export const RECOMMENDED_SALES_FIELDS: SalesField[] = [
  'grossProfit',
  'customerId',
  'productName',
  'model',
  'quantity',
  'documentNumber',
  'location',
]

export const OPTIONAL_SALES_FIELDS: SalesField[] = [
  'customerName',
  'productCode',
  'salesRep',
  'currency',
  'productStatus',
]

export const ALL_SALES_FIELDS: SalesField[] = [
  ...REQUIRED_SALES_FIELDS,
  ...RECOMMENDED_SALES_FIELDS,
  ...OPTIONAL_SALES_FIELDS,
]