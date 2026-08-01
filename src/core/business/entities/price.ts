export const STANDARD_PRICING_GROUP_IDS = [
  'CURRENT',
  'PROMOTION',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'PROJECT',
  'CUSTOM',
] as const

export type StandardPricingGroupId =
  typeof STANDARD_PRICING_GROUP_IDS[number]

export type BusinessPriceSource =
  | 'manual'
  | 'imported'
  | 'erp'
  | 'product_master'
  | 'api'
  | 'unknown'

export type BusinessPriceScenarioKind =
  | 'current'
  | 'promotion'
  | 'pricing_group'
  | 'project'
  | 'custom'

export type BusinessPriceMarginBand =
  | 'negative'
  | 'zero_to_20'
  | '20_to_25'
  | '25_to_30'
  | '30_to_35'
  | '35_plus'

/**
 * Auditable price fact for one product and effective date.
 *
 * Rates are stored as decimal fractions. For example, 0.35 means 35%.
 * Monetary values are expressed in the declared currency and never mixed
 * silently with another currency.
 */
export interface BusinessPrice {
  id: string

  productId: string
  brandId: string
  currency: string

  cost: number
  listPrice: number
  sellingPrice: number

  discountRate: number
  grossProfit: number
  grossMargin: number
  pricingFactor: number | null
  marginBand: BusinessPriceMarginBand

  pricingGroupId: string | null
  effectiveDate: string | null

  source: BusinessPriceSource
  sourceReference: string | null
}

/**
 * Persisted comparison scenario linked to a price fact.
 *
 * PL-001 only defines and stores scenarios. It does not recommend prices or
 * mutate the underlying BusinessPrice. Scenario calculations will be owned by
 * the future Price Engineering Engine.
 */
export interface BusinessPriceScenario {
  id: string
  priceId: string
  productId: string

  name: string
  kind: BusinessPriceScenarioKind
  pricingGroupId: string | null

  sellingPrice: number
  discountRate: number
  grossProfit: number
  grossMargin: number
  marginBand: BusinessPriceMarginBand

  effectiveDate: string | null
  source: BusinessPriceSource
  sourceReference: string | null
}

export type BusinessPricingQualitySeverity =
  | 'warning'
  | 'blocking'

export type BusinessPricingQualityCode =
  | 'PRICE_INVALID_IDENTIFIER'
  | 'PRICE_INVALID_CURRENCY'
  | 'PRICE_INVALID_COST'
  | 'PRICE_INVALID_LIST_PRICE'
  | 'PRICE_INVALID_SELLING_PRICE'
  | 'PRICE_INVALID_EFFECTIVE_DATE'
  | 'PRICE_DUPLICATE_ID'
  | 'PRICE_PRODUCT_NOT_FOUND'
  | 'PRICE_BRAND_MISMATCH'
  | 'PRICE_NEGATIVE_MARGIN'
  | 'PRICE_ABOVE_LIST'
  | 'SCENARIO_PRICE_NOT_FOUND'
  | 'SCENARIO_INVALID_SELLING_PRICE'
  | 'SCENARIO_INVALID_EFFECTIVE_DATE'
  | 'SCENARIO_DUPLICATE_ID'
  | 'SCENARIO_DISCOUNT_MISMATCH'

export interface BusinessPricingQualityIssue {
  id: string
  code: BusinessPricingQualityCode
  severity: BusinessPricingQualitySeverity
  message: string
  inputIndex: number
  priceId: string | null
  scenarioId: string | null
  productId: string | null
}

export interface BusinessPricingSummary {
  totalPrices: number
  totalScenarios: number
  uniqueProducts: number
  uniqueBrands: number
  uniqueCurrencies: number
  pricesWithNegativeMargin: number
  pricesWithoutEffectiveDate: number
  invalidPriceInputs: number
  invalidScenarioInputs: number
  duplicatePriceRecords: number
  duplicateScenarioRecords: number
  blockingIssues: number
  warningIssues: number
}
