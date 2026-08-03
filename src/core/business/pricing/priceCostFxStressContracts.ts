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

export const PRICE_COST_FX_STRESS_METHODOLOGY =
  'price-cost-fx-stress-v1' as const

export type PriceCostFxStressMethodology =
  typeof PRICE_COST_FX_STRESS_METHODOLOGY

export interface PriceCostFxStressProductInput extends PriceBatchProductInput {
  quantity: number
}

export interface PriceCostFxStressScenarioInput {
  id: string
  label: string
  costChangeRate: number
  exchangeRate: number
  notes?: string | null
}

export interface PriceCostFxStressInput {
  id: string
  sourceBatchId: string
  brandName: string | null
  sourceCostCurrency: string
  reportingCurrency: string
  referenceExchangeRate: number
  products: PriceCostFxStressProductInput[]
  scenarios: PriceCostFxStressScenarioInput[]
  tiers: PriceTierLadderTierInput[]
  commonListFactors: number[]
  notes?: string | null
}

export interface PriceCostFxStressOptions {
  moneyPrecision?: number
  ratePrecision?: number
  quantityPrecision?: number
}

export type PriceCostFxStressStatus =
  | 'valid'
  | 'warning'
  | 'invalid'

export type PriceCostFxStressFeasibility =
  | 'fully_feasible'
  | 'partially_feasible'
  | 'not_feasible'
  | 'invalid'

export type PriceCostFxStressIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PriceCostFxStressIssueCode =
  | 'PRICE_COST_FX_STRESS_INVALID_IDENTIFIER'
  | 'PRICE_COST_FX_STRESS_INVALID_SOURCE_BATCH'
  | 'PRICE_COST_FX_STRESS_INVALID_CURRENCY'
  | 'PRICE_COST_FX_STRESS_EMPTY_PRODUCTS'
  | 'PRICE_COST_FX_STRESS_INVALID_PRODUCT'
  | 'PRICE_COST_FX_STRESS_DUPLICATE_PRODUCT_ID'
  | 'PRICE_COST_FX_STRESS_EMPTY_SCENARIOS'
  | 'PRICE_COST_FX_STRESS_INVALID_SCENARIO'
  | 'PRICE_COST_FX_STRESS_DUPLICATE_SCENARIO_ID'
  | 'PRICE_COST_FX_STRESS_EMPTY_TIERS'
  | 'PRICE_COST_FX_STRESS_INVALID_TIER'
  | 'PRICE_COST_FX_STRESS_DUPLICATE_TIER_ID'
  | 'PRICE_COST_FX_STRESS_EMPTY_FACTORS'
  | 'PRICE_COST_FX_STRESS_INVALID_FACTOR'
  | 'PRICE_COST_FX_STRESS_DUPLICATE_FACTOR'
  | 'PRICE_COST_FX_STRESS_BELOW_OBJECTIVE'
  | 'PRICE_COST_FX_STRESS_NO_CALCULABLE_ROWS'

export interface PriceCostFxStressIssue {
  code: PriceCostFxStressIssueCode
  severity: PriceCostFxStressIssueSeverity
  message: string
  scenarioId: string | null
  tierId: string | null
  productId: string | null
  commonListFactor: number | null
}

export interface PriceCostFxStressProductResult {
  key: string
  product: PriceCostFxStressProductInput
  quantity: number
  baseCostInSourceCurrency: number
  adjustedCostInSourceCurrency: number
  convertedBaseCost: number
  stressedUnitCost: number
  requiredListFactor: number | null
  factorGap: number | null
  design: PriceDesignResult
  metrics: PriceDesignMetrics | null
  meetsObjective: boolean | null
  baseCostTotal: number
  stressedCostTotal: number
  totalListPrice: number
  totalSellingPrice: number
  totalGrossProfit: number
}

export interface PriceCostFxStressCell {
  key: string
  order: number
  scenarioId: string
  scenarioLabel: string
  scenarioOrder: number
  costChangeRate: number
  exchangeRate: number
  referenceExchangeRate: number
  commonListFactor: number
  factorOrder: number
  tierId: string
  tierLabel: string
  tierOrder: number
  discountRate: number
  objective: PriceTierObjective
  minimumRequiredFactor: number | null
  factorGapToMinimum: number | null
  feasibility: PriceCostFxStressFeasibility
  totalUnits: number
  productCount: number
  calculableProductCount: number
  meetsObjectiveProductCount: number
  belowObjectiveProductCount: number
  volumeCoverageRate: number
  convertedBaseCostTotal: number
  stressedCostTotal: number
  costImpact: number
  totalListPrice: number
  totalSellingPrice: number
  totalGrossProfit: number
  grossMargin: number
  weightedNetFactor: number
  minimumGrossMargin: number | null
  maximumGrossMargin: number | null
  limitingProductId: string | null
  limitingProductLabel: string | null
  products: PriceCostFxStressProductResult[]
}

export interface PriceCostFxStressScenarioSummary {
  scenarioId: string
  scenarioLabel: string
  costChangeRate: number
  exchangeRate: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  minimumGrossMargin: number | null
  minimumTotalGrossProfit: number | null
  maximumRequiredFactor: number | null
  criticalTierId: string | null
  criticalTierLabel: string | null
  criticalProductId: string | null
  criticalProductLabel: string | null
}

export interface PriceCostFxStressFactorSummary {
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

export interface PriceCostFxStressSummary {
  productCount: number
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
}

export interface PriceCostFxStressIsolationContract {
  mutatesCatalogPrice: false
  mutatesSourceCost: false
  persistsStressTest: false
  fetchesLiveExchangeRate: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PriceCostFxStressResult {
  available: boolean
  methodology: PriceCostFxStressMethodology
  executionMode: 'simulation-only'
  isolation: PriceCostFxStressIsolationContract
  status: PriceCostFxStressStatus
  input: PriceCostFxStressInput
  cells: PriceCostFxStressCell[]
  scenarioSummaries: PriceCostFxStressScenarioSummary[]
  factorSummaries: PriceCostFxStressFactorSummary[]
  summary: PriceCostFxStressSummary
  criticalScenarioId: string | null
  criticalScenarioLabel: string | null
  issues: PriceCostFxStressIssue[]
  explainability: string[]
}
