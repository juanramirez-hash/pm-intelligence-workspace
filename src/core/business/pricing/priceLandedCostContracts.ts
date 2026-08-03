import type {
  PriceBatchProductInput,
} from './priceBatchDesignContracts'

import type {
  PriceDesignMetrics,
  PriceDesignResult,
} from './priceDesignContracts'

import type {
  PriceTierLadderTierInput,
  PriceTierObjective,
} from './priceTierLadderContracts'

export const PRICE_LANDED_COST_METHODOLOGY =
  'price-landed-cost-waterfall-v1' as const

export type PriceLandedCostMethodology =
  typeof PRICE_LANDED_COST_METHODOLOGY

export type PriceLandedCostComponentCategory =
  | 'freight'
  | 'insurance'
  | 'tariff'
  | 'customs'
  | 'handling'
  | 'domestic_logistics'
  | 'financing'
  | 'rebate'
  | 'other'

export type PriceLandedCostComponentDirection =
  | 'add'
  | 'subtract'

export type PriceLandedCostComponentCalculation =
  | {
    type: 'percentage_of_purchase_cost'
    rate: number
  }
  | {
    type: 'percentage_of_current_subtotal'
    rate: number
  }
  | {
    type: 'fixed_per_unit'
    amount: number
  }
  | {
    type: 'fixed_total_by_quantity'
    amount: number
  }
  | {
    type: 'fixed_total_by_purchase_cost'
    amount: number
  }

export type PriceLandedCostComponentCalculationType =
  PriceLandedCostComponentCalculation['type']

export interface PriceLandedCostComponentInput {
  id: string
  label: string
  category: PriceLandedCostComponentCategory
  direction: PriceLandedCostComponentDirection
  calculation: PriceLandedCostComponentCalculation
  productIds: string[] | null
  notes?: string | null
}

export interface PriceLandedCostProductInput extends PriceBatchProductInput {
  quantity: number
}

export interface PriceLandedCostScenarioInput {
  id: string
  label: string
  purchaseCostChangeRate: number
  exchangeRate: number
  componentChangeRate: number
  notes?: string | null
}

export type PriceLandedCostListPriceBasis =
  | 'reference_purchase_cost'
  | 'reference_landed_cost'

export interface PriceLandedCostInput {
  id: string
  sourceBatchId: string
  brandName: string | null
  sourceCostCurrency: string
  reportingCurrency: string
  referenceExchangeRate: number
  listPriceBasis: PriceLandedCostListPriceBasis
  products: PriceLandedCostProductInput[]
  components: PriceLandedCostComponentInput[]
  scenarios: PriceLandedCostScenarioInput[]
  tiers: PriceTierLadderTierInput[]
  commonListFactors: number[]
  notes?: string | null
}

export interface PriceLandedCostOptions {
  moneyPrecision?: number
  ratePrecision?: number
  quantityPrecision?: number
}

export type PriceLandedCostStatus =
  | 'valid'
  | 'warning'
  | 'invalid'

export type PriceLandedCostFeasibility =
  | 'fully_feasible'
  | 'partially_feasible'
  | 'not_feasible'
  | 'invalid'

export type PriceLandedCostIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PriceLandedCostIssueCode =
  | 'PRICE_LANDED_COST_INVALID_IDENTIFIER'
  | 'PRICE_LANDED_COST_INVALID_SOURCE_BATCH'
  | 'PRICE_LANDED_COST_INVALID_CURRENCY'
  | 'PRICE_LANDED_COST_INVALID_REFERENCE_EXCHANGE_RATE'
  | 'PRICE_LANDED_COST_EMPTY_PRODUCTS'
  | 'PRICE_LANDED_COST_INVALID_PRODUCT'
  | 'PRICE_LANDED_COST_DUPLICATE_PRODUCT_ID'
  | 'PRICE_LANDED_COST_INVALID_COMPONENT'
  | 'PRICE_LANDED_COST_DUPLICATE_COMPONENT_ID'
  | 'PRICE_LANDED_COST_UNKNOWN_COMPONENT_PRODUCT'
  | 'PRICE_LANDED_COST_EMPTY_SCENARIOS'
  | 'PRICE_LANDED_COST_INVALID_SCENARIO'
  | 'PRICE_LANDED_COST_DUPLICATE_SCENARIO_ID'
  | 'PRICE_LANDED_COST_EMPTY_TIERS'
  | 'PRICE_LANDED_COST_INVALID_TIER'
  | 'PRICE_LANDED_COST_DUPLICATE_TIER_ID'
  | 'PRICE_LANDED_COST_EMPTY_FACTORS'
  | 'PRICE_LANDED_COST_INVALID_FACTOR'
  | 'PRICE_LANDED_COST_DUPLICATE_FACTOR'
  | 'PRICE_LANDED_COST_NON_POSITIVE_WATERFALL'
  | 'PRICE_LANDED_COST_ALLOCATION_UNAVAILABLE'
  | 'PRICE_LANDED_COST_BELOW_OBJECTIVE'
  | 'PRICE_LANDED_COST_NO_CALCULABLE_ROWS'

export interface PriceLandedCostIssue {
  code: PriceLandedCostIssueCode
  severity: PriceLandedCostIssueSeverity
  message: string
  scenarioId: string | null
  tierId: string | null
  productId: string | null
  componentId: string | null
  commonListFactor: number | null
}

export interface PriceLandedCostWaterfallStep {
  order: number
  componentId: string
  componentLabel: string
  category: PriceLandedCostComponentCategory
  direction: PriceLandedCostComponentDirection
  calculationType: PriceLandedCostComponentCalculationType
  basisAmount: number
  effectiveRateOrAmount: number
  allocationWeight: number | null
  openingSubtotal: number
  unitImpact: number
  totalImpact: number
  closingSubtotal: number
  grossProfitImpact: number
  grossMarginImpact: number | null
  shareOfLandedCost: number | null
}

export interface PriceLandedCostProductResult {
  key: string
  product: PriceLandedCostProductInput
  quantity: number
  baseCostInSourceCurrency: number
  adjustedCostInSourceCurrency: number
  referencePurchaseCost: number
  stressedPurchaseCost: number
  referenceLandedCost: number
  landedCost: number
  landedCostDelta: number
  landedCostUpliftRate: number | null
  listPriceBasisAmount: number
  candidateListPrice: number
  requiredListFactor: number | null
  factorGap: number | null
  design: PriceDesignResult
  metrics: PriceDesignMetrics | null
  meetsObjective: boolean | null
  purchaseCostTotal: number
  landedCostTotal: number
  totalListPrice: number
  totalSellingPrice: number
  totalGrossProfit: number
  waterfall: PriceLandedCostWaterfallStep[]
}

export interface PriceLandedCostComponentSummary {
  componentId: string
  componentLabel: string
  category: PriceLandedCostComponentCategory
  direction: PriceLandedCostComponentDirection
  totalImpact: number
  grossProfitImpact: number
  grossMarginImpact: number | null
  shareOfLandedCost: number | null
}

export interface PriceLandedCostCell {
  key: string
  order: number
  scenarioId: string
  scenarioLabel: string
  scenarioOrder: number
  purchaseCostChangeRate: number
  exchangeRate: number
  componentChangeRate: number
  referenceExchangeRate: number
  commonListFactor: number
  factorOrder: number
  tierId: string
  tierLabel: string
  tierOrder: number
  discountRate: number
  objective: PriceTierObjective
  listPriceBasis: PriceLandedCostListPriceBasis
  minimumRequiredFactor: number | null
  factorGapToMinimum: number | null
  feasibility: PriceLandedCostFeasibility
  totalUnits: number
  productCount: number
  calculableProductCount: number
  meetsObjectiveProductCount: number
  belowObjectiveProductCount: number
  volumeCoverageRate: number
  referencePurchaseCostTotal: number
  stressedPurchaseCostTotal: number
  referenceLandedCostTotal: number
  landedCostTotal: number
  landedCostImpact: number
  landedCostUpliftRate: number | null
  totalListPrice: number
  totalSellingPrice: number
  totalGrossProfit: number
  grossMargin: number
  weightedNetFactorOnLandedCost: number
  minimumGrossMargin: number | null
  maximumGrossMargin: number | null
  limitingProductId: string | null
  limitingProductLabel: string | null
  products: PriceLandedCostProductResult[]
  componentSummaries: PriceLandedCostComponentSummary[]
}

export interface PriceLandedCostScenarioSummary {
  scenarioId: string
  scenarioLabel: string
  purchaseCostChangeRate: number
  exchangeRate: number
  componentChangeRate: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  minimumGrossMargin: number | null
  minimumTotalGrossProfit: number | null
  maximumRequiredFactor: number | null
  maximumLandedCostTotal: number | null
  maximumLandedCostUpliftRate: number | null
  criticalTierId: string | null
  criticalTierLabel: string | null
  criticalProductId: string | null
  criticalProductLabel: string | null
  largestCostComponentId: string | null
  largestCostComponentLabel: string | null
}

export interface PriceLandedCostFactorSummary {
  commonListFactor: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  minimumVolumeCoverageRate: number
  minimumGrossMargin: number | null
  minimumTotalGrossProfit: number | null
  fullyFeasibleAcrossAllScenariosAndTiers: boolean
}

export interface PriceLandedCostSummary {
  productCount: number
  componentCount: number
  scenarioCount: number
  tierCount: number
  factorCount: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  belowObjectiveProductCount: number
  fullyFeasibleFactorCount: number
  globalMaximumRequiredFactor: number | null
  maximumLandedCostUpliftRate: number | null
}

export interface PriceLandedCostIsolationContract {
  mutatesCatalogPrice: false
  mutatesSourceCost: false
  persistsLandedCost: false
  fetchesLiveExchangeRate: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PriceLandedCostResult {
  available: boolean
  methodology: PriceLandedCostMethodology
  executionMode: 'simulation-only'
  isolation: PriceLandedCostIsolationContract
  status: PriceLandedCostStatus
  input: PriceLandedCostInput
  cells: PriceLandedCostCell[]
  scenarioSummaries: PriceLandedCostScenarioSummary[]
  factorSummaries: PriceLandedCostFactorSummary[]
  summary: PriceLandedCostSummary
  criticalScenarioId: string | null
  criticalScenarioLabel: string | null
  issues: PriceLandedCostIssue[]
  explainability: string[]
}
