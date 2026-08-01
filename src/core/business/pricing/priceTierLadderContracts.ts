import type {
  PriceBatchProductInput,
} from './priceBatchDesignContracts'

import type {
  PriceDesignMetrics,
  PriceDesignResult,
} from './priceDesignContracts'

export const PRICE_TIER_LADDER_METHODOLOGY =
  'price-tier-ladder-v1' as const

export type PriceTierLadderMethodology =
  typeof PRICE_TIER_LADDER_METHODOLOGY

export type PriceTierObjective =
  | {
    type: 'minimum_gross_margin'
    grossMargin: number
  }
  | {
    type: 'minimum_gross_profit'
    grossProfit: number
  }

export type PriceTierObjectiveType =
  PriceTierObjective['type']

export interface PriceTierLadderTierInput {
  id: string
  label: string
  discountRate: number
  objective: PriceTierObjective
  notes?: string | null
}

export interface PriceTierLadderInput {
  id: string
  sourceBatchId: string
  brandName: string | null
  currency: string
  products: PriceBatchProductInput[]
  tiers: PriceTierLadderTierInput[]
  commonListFactors: number[]
  notes?: string | null
}

export interface PriceTierLadderOptions {
  moneyPrecision?: number
  ratePrecision?: number
}

export type PriceTierLadderStatus =
  | 'valid'
  | 'warning'
  | 'invalid'

export type PriceTierLadderIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PriceTierLadderIssueCode =
  | 'PRICE_TIER_LADDER_INVALID_IDENTIFIER'
  | 'PRICE_TIER_LADDER_INVALID_SOURCE_BATCH'
  | 'PRICE_TIER_LADDER_INVALID_CURRENCY'
  | 'PRICE_TIER_LADDER_EMPTY_PRODUCTS'
  | 'PRICE_TIER_LADDER_DUPLICATE_PRODUCT_ID'
  | 'PRICE_TIER_LADDER_INVALID_PRODUCT'
  | 'PRICE_TIER_LADDER_EMPTY_TIERS'
  | 'PRICE_TIER_LADDER_DUPLICATE_TIER_ID'
  | 'PRICE_TIER_LADDER_DUPLICATE_TIER_DISCOUNT'
  | 'PRICE_TIER_LADDER_INVALID_TIER'
  | 'PRICE_TIER_LADDER_INVALID_FACTOR'
  | 'PRICE_TIER_LADDER_DUPLICATE_FACTOR'
  | 'PRICE_TIER_LADDER_NO_CANDIDATE_FACTORS'
  | 'PRICE_TIER_LADDER_NO_CALCULABLE_MINIMUM'
  | 'PRICE_TIER_LADDER_BELOW_OBJECTIVE'

export interface PriceTierLadderIssue {
  code: PriceTierLadderIssueCode
  severity: PriceTierLadderIssueSeverity
  message: string
  tierId: string | null
  productId: string | null
  commonListFactor: number | null
}

export interface PriceTierLadderTierMinimum {
  tierId: string
  tierLabel: string
  tierOrder: number
  discountRate: number
  objective: PriceTierObjective
  minimumRequiredFactor: number | null
  limitingProductId: string | null
  limitingProductLabel: string | null
  calculableProductCount: number
}

export type PriceTierLadderBand =
  | 'below_minimum'
  | 'minimum_threshold'
  | 'above_minimum'
  | 'unavailable'

export type PriceTierLadderFeasibility =
  | 'fully_feasible'
  | 'partially_feasible'
  | 'not_feasible'
  | 'invalid'

export interface PriceTierLadderProductResult {
  key: string
  product: PriceBatchProductInput
  tier: PriceTierLadderTierInput
  commonListFactor: number
  requiredListFactor: number | null
  factorGap: number | null
  design: PriceDesignResult
  metrics: PriceDesignMetrics | null
  meetsObjective: boolean | null
}

export interface PriceTierLadderCell {
  key: string
  order: number
  commonListFactor: number
  tierId: string
  tierLabel: string
  tierOrder: number
  discountRate: number
  objective: PriceTierObjective
  minimumRequiredFactor: number | null
  factorGapToMinimum: number | null
  band: PriceTierLadderBand
  feasibility: PriceTierLadderFeasibility
  productCount: number
  calculableCount: number
  meetsObjectiveCount: number
  belowObjectiveCount: number
  coverageRate: number
  totalCost: number
  totalListPrice: number
  totalSellingPrice: number
  totalGrossProfit: number
  grossMargin: number
  minimumGrossMargin: number | null
  maximumGrossMargin: number | null
  products: PriceTierLadderProductResult[]
}

export interface PriceTierLadderFactorSummary {
  commonListFactor: number
  tierCount: number
  fullyFeasibleTierCount: number
  partiallyFeasibleTierCount: number
  notFeasibleTierCount: number
  invalidTierCount: number
  belowObjectiveCount: number
  minimumCoverageRate: number
  averageCoverageRate: number
  fullyFeasibleAcrossAllTiers: boolean
}

export interface PriceTierLadderTierSummary {
  tierId: string
  tierLabel: string
  discountRate: number
  objective: PriceTierObjective
  factorCount: number
  fullyFeasibleFactorCount: number
  partiallyFeasibleFactorCount: number
  notFeasibleFactorCount: number
  minimumCoverageRate: number
  maximumCoverageRate: number
}

export interface PriceTierLadderSummary {
  productCount: number
  tierCount: number
  factorCount: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  belowObjectiveCount: number
  globalMinimumFactor: number | null
  fullyFeasibleFactorCount: number
}

export interface PriceTierLadderIsolationContract {
  mutatesCatalogPrice: false
  createsProductsOrBrands: false
  persistsLadder: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PriceTierLadderResult {
  available: boolean
  methodology: PriceTierLadderMethodology
  executionMode: 'simulation-only'
  isolation: PriceTierLadderIsolationContract
  status: PriceTierLadderStatus
  input: PriceTierLadderInput
  tierMinimums: PriceTierLadderTierMinimum[]
  globalMinimumFactor: number | null
  limitingTierId: string | null
  limitingTierLabel: string | null
  limitingProductId: string | null
  limitingProductLabel: string | null
  cells: PriceTierLadderCell[]
  factorSummaries: PriceTierLadderFactorSummary[]
  tierSummaries: PriceTierLadderTierSummary[]
  summary: PriceTierLadderSummary
  issues: PriceTierLadderIssue[]
  explainability: string[]
}
