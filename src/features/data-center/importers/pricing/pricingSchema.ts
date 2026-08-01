import type {
  PricingField,
} from './pricingColumnAliases'

export const REQUIRED_PRICING_FIELDS = [
  'productId',
  'brandId',
] as const satisfies readonly PricingField[]

export const RECOMMENDED_PRICING_FIELDS = [
  'costMxn',
  'listPriceMxn',
  'costUsd',
  'costUsdFallback',
  'listPriceUsd',
  'canonicalCost',
  'canonicalListPrice',
  'canonicalCurrency',
] as const satisfies readonly PricingField[]

export const OPTIONAL_PRICING_FIELDS = [
  'model',
  'canonicalSellingPrice',
  'sellingPriceMxn',
  'sellingPriceUsd',
  'purchaseCurrency',
  'effectiveDate',
  'pricingGroupId',
  'sourceReference',
  'quantityPricingSchedule',
] as const satisfies readonly PricingField[]

export const ALL_PRICING_FIELDS = [
  ...REQUIRED_PRICING_FIELDS,
  ...RECOMMENDED_PRICING_FIELDS,
  ...OPTIONAL_PRICING_FIELDS,
] as const satisfies readonly PricingField[]
