import type {
  PriceBatchProductInput,
} from './priceBatchDesignContracts'

import type {
  PriceDesignMetrics,
  PriceDesignObjective,
  PriceDesignResult,
} from './priceDesignContracts'

export const PRICE_BATCH_SENSITIVITY_METHODOLOGY =
  'price-batch-sensitivity-v1' as const

export type PriceBatchSensitivityMethodology =
  typeof PRICE_BATCH_SENSITIVITY_METHODOLOGY

export interface PriceBatchSensitivityInput {
  id: string
  sourceBatchId: string
  brandName: string | null
  currency: string
  products: PriceBatchProductInput[]
  discountRates: number[]
  objective: PriceDesignObjective
  commonListFactors: number[]
  notes?: string | null
}

export interface PriceBatchSensitivityOptions {
  moneyPrecision?: number
  ratePrecision?: number
}

export type PriceBatchSensitivityStatus =
  | 'valid'
  | 'warning'
  | 'invalid'

export type PriceBatchSensitivityFeasibility =
  | 'fully_feasible'
  | 'partially_feasible'
  | 'not_feasible'
  | 'invalid'

export type PriceBatchSensitivityBand =
  | 'below_minimum'
  | 'minimum_threshold'
  | 'above_minimum'
  | 'unavailable'

export type PriceBatchSensitivityIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PriceBatchSensitivityIssueCode =
  | 'PRICE_SENSITIVITY_INVALID_IDENTIFIER'
  | 'PRICE_SENSITIVITY_INVALID_SOURCE_BATCH'
  | 'PRICE_SENSITIVITY_INVALID_CURRENCY'
  | 'PRICE_SENSITIVITY_EMPTY_PRODUCTS'
  | 'PRICE_SENSITIVITY_INVALID_PRODUCT'
  | 'PRICE_SENSITIVITY_DUPLICATE_PRODUCT_ID'
  | 'PRICE_SENSITIVITY_INVALID_OBJECTIVE'
  | 'PRICE_SENSITIVITY_EMPTY_DISCOUNTS'
  | 'PRICE_SENSITIVITY_INVALID_DISCOUNT'
  | 'PRICE_SENSITIVITY_DUPLICATE_DISCOUNT'
  | 'PRICE_SENSITIVITY_EMPTY_FACTORS'
  | 'PRICE_SENSITIVITY_INVALID_FACTOR'
  | 'PRICE_SENSITIVITY_DUPLICATE_FACTOR'
  | 'PRICE_SENSITIVITY_NO_CALCULABLE_ROWS'
  | 'PRICE_SENSITIVITY_NO_FULLY_FEASIBLE_FACTOR'

export interface PriceBatchSensitivityIssue {
  code: PriceBatchSensitivityIssueCode
  severity: PriceBatchSensitivityIssueSeverity
  message: string
  commonListFactor: number | null
  discountRate: number | null
  productId: string | null
}

export interface PriceBatchSensitivityProductResult {
  key: string
  product: PriceBatchProductInput
  commonListFactor: number
  discountRate: number
  requiredListFactor: number | null
  factorGap: number | null
  design: PriceDesignResult
  metrics: PriceDesignMetrics | null
  meetsObjective: boolean | null
}

export interface PriceBatchSensitivityCell {
  key: string
  order: number
  commonListFactor: number
  discountRate: number
  minimumRequiredFactor: number | null
  factorGapToMinimum: number | null
  band: PriceBatchSensitivityBand
  feasibility: PriceBatchSensitivityFeasibility
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
  products: PriceBatchSensitivityProductResult[]
}

export interface PriceBatchSensitivityDiscountMinimum {
  discountRate: number
  minimumRequiredFactor: number | null
  limitingProductId: string | null
  limitingProductLabel: string | null
  calculableProductCount: number
}

export interface PriceBatchSensitivityFactorSummary {
  commonListFactor: number
  discountCount: number
  fullyFeasibleDiscountCount: number
  partiallyFeasibleDiscountCount: number
  notFeasibleDiscountCount: number
  invalidDiscountCount: number
  belowObjectiveCount: number
  minimumCoverageRate: number
  averageCoverageRate: number
  fullyFeasibleAcrossAllDiscounts: boolean
}

export interface PriceBatchSensitivitySummary {
  productCount: number
  discountCount: number
  factorCount: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  belowObjectiveCount: number
  globalMinimumFactor: number | null
  fullyFeasibleFactorCount: number
  maximumCoverageRate: number
  minimumCoverageRate: number
}

export interface PriceBatchSensitivityIsolationContract {
  mutatesCatalogPrice: false
  createsProductsOrBrands: false
  persistsSensitivity: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PriceBatchSensitivityResult {
  available: boolean
  methodology: PriceBatchSensitivityMethodology
  executionMode: 'simulation-only'
  isolation: PriceBatchSensitivityIsolationContract
  status: PriceBatchSensitivityStatus
  input: PriceBatchSensitivityInput
  discountMinimums: PriceBatchSensitivityDiscountMinimum[]
  globalMinimumFactor: number | null
  cells: PriceBatchSensitivityCell[]
  factorSummaries: PriceBatchSensitivityFactorSummary[]
  summary: PriceBatchSensitivitySummary
  issues: PriceBatchSensitivityIssue[]
  explainability: string[]
}
