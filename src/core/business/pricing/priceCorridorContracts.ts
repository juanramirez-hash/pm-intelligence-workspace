import type {
  PriceBatchProductInput,
} from './priceBatchDesignContracts'

export const PRICE_CORRIDOR_METHODOLOGY =
  'price-corridor-margin-floor-v1' as const

export type PriceCorridorMethodology =
  typeof PRICE_CORRIDOR_METHODOLOGY

export type PriceCorridorCostBasis =
  | 'reference_purchase_cost'
  | 'reference_landed_cost'

export interface PriceCorridorProductInput extends PriceBatchProductInput {
  quantity: number
  explicitLandedCost: number | null
}

export interface PriceCorridorScenarioInput {
  id: string
  label: string
  costChangeRate: number
  exchangeRate: number
  notes?: string | null
}

export interface PriceCorridorTierInput {
  id: string
  label: string
  discountRate: number
  minimumGrossMargin: number | null
  minimumGrossProfit: number | null
  notes?: string | null
}

export interface PriceCorridorInput {
  id: string
  sourceBatchId: string
  brandName: string | null
  sourceCostCurrency: string
  reportingCurrency: string
  referenceExchangeRate: number
  costBasis: PriceCorridorCostBasis
  products: PriceCorridorProductInput[]
  scenarios: PriceCorridorScenarioInput[]
  tiers: PriceCorridorTierInput[]
  commonListFactors: number[]
  notes?: string | null
}

export interface PriceCorridorOptions {
  moneyPrecision?: number
  ratePrecision?: number
  quantityPrecision?: number
}

export type PriceCorridorStatus =
  | 'valid'
  | 'warning'
  | 'invalid'

export type PriceCorridorFeasibility =
  | 'fully_feasible'
  | 'partially_feasible'
  | 'not_feasible'
  | 'invalid'

export type PriceCorridorExposure =
  | 'safe'
  | 'at_floor'
  | 'below_floor'
  | 'invalid'

export type PriceCorridorIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PriceCorridorIssueCode =
  | 'PRICE_CORRIDOR_INVALID_IDENTIFIER'
  | 'PRICE_CORRIDOR_INVALID_SOURCE_BATCH'
  | 'PRICE_CORRIDOR_INVALID_CURRENCY'
  | 'PRICE_CORRIDOR_INVALID_REFERENCE_EXCHANGE_RATE'
  | 'PRICE_CORRIDOR_EMPTY_PRODUCTS'
  | 'PRICE_CORRIDOR_INVALID_PRODUCT'
  | 'PRICE_CORRIDOR_DUPLICATE_PRODUCT_ID'
  | 'PRICE_CORRIDOR_NO_POSITIVE_QUANTITY'
  | 'PRICE_CORRIDOR_MISSING_LANDED_COST'
  | 'PRICE_CORRIDOR_EMPTY_SCENARIOS'
  | 'PRICE_CORRIDOR_INVALID_SCENARIO'
  | 'PRICE_CORRIDOR_DUPLICATE_SCENARIO_ID'
  | 'PRICE_CORRIDOR_EMPTY_TIERS'
  | 'PRICE_CORRIDOR_INVALID_TIER'
  | 'PRICE_CORRIDOR_DUPLICATE_TIER_ID'
  | 'PRICE_CORRIDOR_EMPTY_FACTORS'
  | 'PRICE_CORRIDOR_INVALID_FACTOR'
  | 'PRICE_CORRIDOR_DUPLICATE_FACTOR'
  | 'PRICE_CORRIDOR_BELOW_FLOOR'
  | 'PRICE_CORRIDOR_AT_FLOOR'
  | 'PRICE_CORRIDOR_NO_CALCULABLE_ROWS'

export interface PriceCorridorIssue {
  code: PriceCorridorIssueCode
  severity: PriceCorridorIssueSeverity
  message: string
  scenarioId: string | null
  tierId: string | null
  productId: string | null
  commonListFactor: number | null
}

export interface PriceCorridorProductResult {
  key: string
  product: PriceCorridorProductInput
  quantity: number
  referenceUnitCost: number
  stressedUnitCost: number
  costDelta: number
  costChangeRate: number | null
  candidateListPrice: number
  candidateNetPrice: number
  floorFromGrossMargin: number | null
  floorFromGrossProfit: number | null
  priceFloor: number
  maximumDiscountRate: number
  corridorWidth: number
  corridorWidthRate: number | null
  safetyAmount: number
  safetyRateOnFloor: number | null
  requiredListFactor: number
  factorGap: number
  grossProfit: number
  grossMargin: number
  exposure: PriceCorridorExposure
  meetsFloor: boolean
  referenceCostTotal: number
  stressedCostTotal: number
  listPriceTotal: number
  sellingPriceTotal: number
  floorTotal: number
  grossProfitTotal: number
  safetyTotal: number
}

export interface PriceCorridorCell {
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
  minimumGrossMargin: number | null
  minimumGrossProfit: number | null
  costBasis: PriceCorridorCostBasis
  minimumRequiredFactor: number | null
  factorGapToMinimum: number | null
  supportedMaximumDiscountRate: number | null
  minimumCorridorWidth: number | null
  minimumSafetyAmount: number | null
  minimumSafetyRateOnFloor: number | null
  feasibility: PriceCorridorFeasibility
  totalUnits: number
  productCount: number
  calculableProductCount: number
  meetsFloorProductCount: number
  belowFloorProductCount: number
  atFloorProductCount: number
  volumeCoverageRate: number
  referenceCostTotal: number
  stressedCostTotal: number
  totalListPrice: number
  totalSellingPrice: number
  totalPriceFloor: number
  totalGrossProfit: number
  grossMargin: number
  totalSafetyAmount: number
  limitingProductId: string | null
  limitingProductLabel: string | null
  products: PriceCorridorProductResult[]
}

export interface PriceCorridorScenarioSummary {
  scenarioId: string
  scenarioLabel: string
  costChangeRate: number
  exchangeRate: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  maximumRequiredFactor: number | null
  minimumSupportedMaximumDiscountRate: number | null
  minimumSafetyAmount: number | null
  minimumGrossMargin: number | null
  minimumTotalGrossProfit: number | null
  criticalTierId: string | null
  criticalTierLabel: string | null
  criticalProductId: string | null
  criticalProductLabel: string | null
}

export interface PriceCorridorFactorSummary {
  commonListFactor: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  minimumVolumeCoverageRate: number
  minimumSupportedMaximumDiscountRate: number | null
  minimumSafetyAmount: number | null
  minimumGrossMargin: number | null
  fullyFeasibleAcrossAllScenariosAndTiers: boolean
}

export interface PriceCorridorSummary {
  productCount: number
  scenarioCount: number
  tierCount: number
  factorCount: number
  cellCount: number
  fullyFeasibleCellCount: number
  partiallyFeasibleCellCount: number
  notFeasibleCellCount: number
  invalidCellCount: number
  belowFloorProductCount: number
  atFloorProductCount: number
  fullyFeasibleFactorCount: number
  globalMaximumRequiredFactor: number | null
  globalMinimumSupportedDiscountRate: number | null
  globalMinimumSafetyAmount: number | null
}

export interface PriceCorridorIsolationContract {
  mutatesCatalogPrice: false
  mutatesSourceCost: false
  persistsCorridor: false
  fetchesLiveExchangeRate: false
  approvesDiscount: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PriceCorridorResult {
  available: boolean
  methodology: PriceCorridorMethodology
  executionMode: 'simulation-only'
  isolation: PriceCorridorIsolationContract
  status: PriceCorridorStatus
  input: PriceCorridorInput
  cells: PriceCorridorCell[]
  scenarioSummaries: PriceCorridorScenarioSummary[]
  factorSummaries: PriceCorridorFactorSummary[]
  summary: PriceCorridorSummary
  criticalScenarioId: string | null
  criticalScenarioLabel: string | null
  issues: PriceCorridorIssue[]
  explainability: string[]
}
