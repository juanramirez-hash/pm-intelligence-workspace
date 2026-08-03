import type {
  PriceBatchProductInput,
} from './priceBatchDesignContracts'

import type {
  PriceDesignMetrics,
  PriceDesignObjective,
  PriceDesignResult,
} from './priceDesignContracts'

export const PRICE_PORTFOLIO_MIX_METHODOLOGY =
  'price-portfolio-mix-v1' as const

export type PricePortfolioMixMethodology =
  typeof PRICE_PORTFOLIO_MIX_METHODOLOGY

export interface PricePortfolioMixQuantityInput {
  productId: string
  quantity: number
}

export interface PricePortfolioMixScenarioInput {
  id: string
  label: string
  quantities: PricePortfolioMixQuantityInput[]
  notes?: string | null
}

export interface PricePortfolioMixInput {
  id: string
  sourceBatchId: string
  brandName: string | null
  currency: string
  products: PriceBatchProductInput[]
  discountRates: number[]
  objective: PriceDesignObjective
  commonListFactors: number[]
  mixes: PricePortfolioMixScenarioInput[]
  notes?: string | null
}

export interface PricePortfolioMixOptions {
  moneyPrecision?: number
  ratePrecision?: number
  quantityPrecision?: number
}

export type PricePortfolioMixStatus =
  | 'valid'
  | 'warning'
  | 'invalid'

export type PricePortfolioMixFeasibility =
  | 'fully_feasible'
  | 'partially_feasible'
  | 'not_feasible'
  | 'invalid'

export type PricePortfolioMixIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PricePortfolioMixIssueCode =
  | 'PRICE_PORTFOLIO_MIX_INVALID_IDENTIFIER'
  | 'PRICE_PORTFOLIO_MIX_INVALID_SOURCE_BATCH'
  | 'PRICE_PORTFOLIO_MIX_INVALID_CURRENCY'
  | 'PRICE_PORTFOLIO_MIX_EMPTY_PRODUCTS'
  | 'PRICE_PORTFOLIO_MIX_INVALID_PRODUCT'
  | 'PRICE_PORTFOLIO_MIX_DUPLICATE_PRODUCT_ID'
  | 'PRICE_PORTFOLIO_MIX_INVALID_OBJECTIVE'
  | 'PRICE_PORTFOLIO_MIX_EMPTY_DISCOUNTS'
  | 'PRICE_PORTFOLIO_MIX_INVALID_DISCOUNT'
  | 'PRICE_PORTFOLIO_MIX_DUPLICATE_DISCOUNT'
  | 'PRICE_PORTFOLIO_MIX_EMPTY_FACTORS'
  | 'PRICE_PORTFOLIO_MIX_INVALID_FACTOR'
  | 'PRICE_PORTFOLIO_MIX_DUPLICATE_FACTOR'
  | 'PRICE_PORTFOLIO_MIX_EMPTY_MIXES'
  | 'PRICE_PORTFOLIO_MIX_INVALID_MIX'
  | 'PRICE_PORTFOLIO_MIX_DUPLICATE_MIX_ID'
  | 'PRICE_PORTFOLIO_MIX_UNKNOWN_PRODUCT'
  | 'PRICE_PORTFOLIO_MIX_DUPLICATE_QUANTITY_PRODUCT'
  | 'PRICE_PORTFOLIO_MIX_INVALID_QUANTITY'
  | 'PRICE_PORTFOLIO_MIX_ZERO_VOLUME'
  | 'PRICE_PORTFOLIO_MIX_NO_CALCULABLE_ROWS'
  | 'PRICE_PORTFOLIO_MIX_BELOW_OBJECTIVE'

export interface PricePortfolioMixIssue {
  code: PricePortfolioMixIssueCode
  severity: PricePortfolioMixIssueSeverity
  message: string
  mixId: string | null
  productId: string | null
  commonListFactor: number | null
  discountRate: number | null
}

export interface PricePortfolioMixProductResult {
  key: string
  product: PriceBatchProductInput
  quantity: number
  commonListFactor: number
  discountRate: number
  requiredListFactor: number | null
  factorGap: number | null
  design: PriceDesignResult
  metrics: PriceDesignMetrics | null
  meetsObjective: boolean | null
  totalCost: number
  totalListPrice: number
  totalSellingPrice: number
  totalGrossProfit: number
  salesShare: number
  grossProfitShare: number
}

export interface PricePortfolioMixCell {
  key: string
  order: number
  mixId: string
  mixLabel: string
  mixOrder: number
  commonListFactor: number
  factorOrder: number
  discountRate: number
  discountOrder: number
  feasibility: PricePortfolioMixFeasibility
  totalUnits: number
  activeProductCount: number
  calculableProductCount: number
  meetsObjectiveProductCount: number
  belowObjectiveProductCount: number
  volumeCoverageRate: number
  totalCost: number
  totalListPrice: number
  totalSellingPrice: number
  totalGrossProfit: number
  grossMargin: number
  weightedNetFactor: number
  averageSellingPrice: number
  minimumGrossMargin: number | null
  maximumGrossMargin: number | null
  topSalesProductId: string | null
  topSalesProductLabel: string | null
  topSalesShare: number
  topGrossProfitProductId: string | null
  topGrossProfitProductLabel: string | null
  topGrossProfitShare: number
  products: PricePortfolioMixProductResult[]
}

export interface PricePortfolioMixScenarioSummary {
  mixId: string
  mixLabel: string
  totalUnits: number
  activeProductCount: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  minimumGrossMargin: number | null
  maximumGrossMargin: number | null
  minimumTotalGrossProfit: number | null
  maximumTotalGrossProfit: number | null
}

export interface PricePortfolioMixFactorSummary {
  commonListFactor: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  minimumVolumeCoverageRate: number
  averageVolumeCoverageRate: number
  minimumGrossMargin: number | null
  maximumGrossMargin: number | null
  fullyFeasibleAcrossAllMixesAndDiscounts: boolean
}

export interface PricePortfolioMixSummary {
  productCount: number
  activeProductCount: number
  mixCount: number
  discountCount: number
  factorCount: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  belowObjectiveProductCount: number
  totalAssumedUnitsAcrossMixes: number
  fullyFeasibleFactorCount: number
}

export interface PricePortfolioMixIsolationContract {
  mutatesCatalogPrice: false
  createsProductsOrBrands: false
  persistsPortfolioMix: false
  writesForecast: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PricePortfolioMixResult {
  available: boolean
  methodology: PricePortfolioMixMethodology
  executionMode: 'simulation-only'
  isolation: PricePortfolioMixIsolationContract
  status: PricePortfolioMixStatus
  input: PricePortfolioMixInput
  cells: PricePortfolioMixCell[]
  mixSummaries: PricePortfolioMixScenarioSummary[]
  factorSummaries: PricePortfolioMixFactorSummary[]
  summary: PricePortfolioMixSummary
  issues: PricePortfolioMixIssue[]
  explainability: string[]
}
