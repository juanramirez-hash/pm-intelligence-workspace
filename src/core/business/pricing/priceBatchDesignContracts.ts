import type {
  PriceDesignObjective,
  PriceDesignResult,
} from './priceDesignContracts'

export const PRICE_BATCH_DESIGN_METHODOLOGY =
  'price-batch-design-v1' as const

export type PriceBatchDesignMethodology =
  typeof PRICE_BATCH_DESIGN_METHODOLOGY

export type PriceBatchCommonFactorStrategy =
  | 'protect_all'
  | 'average_required'
  | 'explicit'

export interface PriceBatchProductInput {
  id: string
  model: string | null
  sku: string | null
  cost: number
  notes?: string | null
}

export interface PriceBatchCommonFactorInput {
  strategy: PriceBatchCommonFactorStrategy
  factor?: number | null
}

export interface PriceBatchDesignInput {
  id: string
  brandName: string | null
  currency: string
  products: PriceBatchProductInput[]
  discountRates: number[]
  objective: PriceDesignObjective
  commonFactor: PriceBatchCommonFactorInput
  notes?: string | null
}

export interface PriceBatchDesignOptions {
  moneyPrecision?: number
  ratePrecision?: number
}

export type PriceBatchDesignStatus =
  | 'valid'
  | 'warning'
  | 'invalid'

export type PriceBatchRowCompliance =
  | 'meets_objective'
  | 'below_objective'
  | 'invalid'

export type PriceBatchDesignIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PriceBatchDesignIssueCode =
  | 'PRICE_BATCH_INVALID_IDENTIFIER'
  | 'PRICE_BATCH_INVALID_CURRENCY'
  | 'PRICE_BATCH_EMPTY_PRODUCTS'
  | 'PRICE_BATCH_DUPLICATE_PRODUCT_ID'
  | 'PRICE_BATCH_INVALID_PRODUCT'
  | 'PRICE_BATCH_INVALID_OBJECTIVE'
  | 'PRICE_BATCH_EMPTY_DISCOUNTS'
  | 'PRICE_BATCH_INVALID_DISCOUNT'
  | 'PRICE_BATCH_DUPLICATE_DISCOUNT'
  | 'PRICE_BATCH_INVALID_COMMON_FACTOR'
  | 'PRICE_BATCH_NO_CALCULABLE_ROWS'
  | 'PRICE_BATCH_BELOW_OBJECTIVE'

export interface PriceBatchDesignIssue {
  code: PriceBatchDesignIssueCode
  severity: PriceBatchDesignIssueSeverity
  message: string
  productId: string | null
  discountRate: number | null
}

export interface PriceBatchDesignRow {
  key: string
  order: number
  product: PriceBatchProductInput
  discountRate: number
  requiredDesign: PriceDesignResult
  commonFactorDesign: PriceDesignResult | null
  requiredListFactor: number | null
  commonListFactor: number | null
  factorDelta: number | null
  compliance: PriceBatchRowCompliance
}

export interface PriceBatchDiscountSummary {
  discountRate: number
  productCount: number
  calculableCount: number
  belowObjectiveCount: number
  totalCost: number
  totalListPrice: number
  totalSellingPrice: number
  totalGrossProfit: number
  grossMargin: number
}

export interface PriceBatchDesignSummary {
  productCount: number
  discountCount: number
  matrixRowCount: number
  calculableRowCount: number
  warningRowCount: number
  invalidRowCount: number
  meetsObjectiveCount: number
  belowObjectiveCount: number
  commonListFactor: number | null
}

export interface PriceBatchDesignIsolationContract {
  mutatesCatalogPrice: false
  createsProductsOrBrands: false
  persistsBatch: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PriceBatchDesignResult {
  available: boolean
  methodology: PriceBatchDesignMethodology
  executionMode: 'simulation-only'
  isolation: PriceBatchDesignIsolationContract
  status: PriceBatchDesignStatus
  input: PriceBatchDesignInput
  commonListFactor: number | null
  rows: PriceBatchDesignRow[]
  discountSummaries: PriceBatchDiscountSummary[]
  summary: PriceBatchDesignSummary
  issues: PriceBatchDesignIssue[]
  explainability: string[]
}
