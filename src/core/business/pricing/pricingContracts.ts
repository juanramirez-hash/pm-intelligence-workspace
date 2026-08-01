import type {
  BusinessPriceScenarioKind,
  BusinessPriceSource,
} from '../entities/price'

/**
 * Source contract used to materialize BusinessPrice facts.
 *
 * `sellingPrice` defaults to `listPrice` when omitted. All rates derived by
 * PL-001 use decimal fractions and all amounts stay in `currency`.
 */
export interface BusinessPriceInput {
  id?: string | null
  productId: string
  brandId: string
  currency: string

  cost: number
  listPrice: number
  sellingPrice?: number | null

  pricingGroupId?: string | null
  effectiveDate?: string | null
  source?: BusinessPriceSource
  sourceReference?: string | null
}

/**
 * Source contract for a stored comparison scenario.
 *
 * A scenario must provide either `sellingPrice` or `discountRate`. When both
 * are provided, PL-001 validates that they describe the same price within the
 * configured monetary tolerance.
 */
export interface BusinessPriceScenarioInput {
  id?: string | null
  priceId: string
  name: string
  kind: BusinessPriceScenarioKind
  pricingGroupId?: string | null

  sellingPrice?: number | null
  discountRate?: number | null

  effectiveDate?: string | null
  source?: BusinessPriceSource
  sourceReference?: string | null
}

export interface BusinessPricingBuildOptions {
  moneyPrecision?: number
  ratePrecision?: number
  consistencyTolerance?: number
}
