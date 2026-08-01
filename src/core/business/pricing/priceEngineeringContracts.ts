import type {
  BusinessPrice,
  BusinessPriceMarginBand,
  BusinessPriceScenarioKind,
} from '../entities/price'

export const PRICE_ENGINEERING_METHODOLOGY =
  'price-engineering-v1' as const

export const PRICE_ENGINEERING_EXECUTION_MODE =
  'simulation-only' as const

export type PriceEngineeringMethodology =
  typeof PRICE_ENGINEERING_METHODOLOGY

export type PriceEngineeringExecutionMode =
  typeof PRICE_ENGINEERING_EXECUTION_MODE

export type PriceEngineeringAdditionalDiscountBase =
  | 'list_price'
  | 'current_selling_price'

/**
 * Explicit source used to calculate a disposable laboratory scenario.
 * No basis writes back to BusinessPrice or BusinessPriceScenario.
 */
export type PriceEngineeringScenarioBasis =
  | {
    type: 'selling_price'
    sellingPrice: number
  }
  | {
    type: 'discount_rate'
    discountRate: number
  }
  | {
    type: 'target_gross_margin'
    grossMargin: number
  }
  | {
    type: 'target_gross_profit'
    grossProfit: number
  }
  | {
    type: 'selling_price_factor'
    factor: number
  }
  | {
    type: 'additional_discount'
    discountRate: number
    applyTo: PriceEngineeringAdditionalDiscountBase
  }

export type PriceEngineeringGuardrailSeverity =
  | 'warning'
  | 'blocking'

/**
 * Guardrails are supplied by the caller. The engine does not embed hidden
 * commercial policies, pricing-group discounts or approval thresholds.
 */
export type PriceEngineeringGuardrail =
  | {
    type: 'minimum_gross_margin'
    threshold: number
    severity: PriceEngineeringGuardrailSeverity
  }
  | {
    type: 'minimum_gross_profit'
    threshold: number
    severity: PriceEngineeringGuardrailSeverity
  }
  | {
    type: 'minimum_selling_price'
    threshold: number
    severity: PriceEngineeringGuardrailSeverity
  }
  | {
    type: 'maximum_selling_price'
    threshold: number
    severity: PriceEngineeringGuardrailSeverity
  }
  | {
    type: 'maximum_discount_rate'
    threshold: number
    severity: PriceEngineeringGuardrailSeverity
  }

export interface PriceEngineeringScenarioInput {
  id: string
  name: string
  kind: BusinessPriceScenarioKind
  pricingGroupId?: string | null
  basis: PriceEngineeringScenarioBasis
  guardrails?: readonly PriceEngineeringGuardrail[]
}

export interface PriceEngineeringOptions {
  moneyPrecision?: number
  ratePrecision?: number
}

export interface PriceEngineeringMetrics {
  currency: string
  cost: number
  listPrice: number
  sellingPrice: number
  discountRate: number
  grossProfit: number
  grossMargin: number
  listPriceFactor: number | null
  sellingPriceFactor: number | null
  marginBand: BusinessPriceMarginBand
}

export interface PriceEngineeringDelta {
  sellingPrice: number
  sellingPriceRate: number | null
  discountRate: number
  grossProfit: number
  grossProfitRate: number | null
  grossMargin: number
}

export type PriceEngineeringSignalSeverity =
  | 'info'
  | 'warning'
  | 'blocking'
  | 'invalid'

export type PriceEngineeringSignalCode =
  | 'INVALID_SOURCE_PRICE'
  | 'INVALID_SCENARIO_IDENTIFIER'
  | 'INVALID_SCENARIO_BASIS'
  | 'INVALID_GUARDRAIL'
  | 'NEGATIVE_GROSS_PROFIT'
  | 'SELLING_PRICE_ABOVE_LIST'
  | 'MINIMUM_GROSS_MARGIN_NOT_MET'
  | 'MINIMUM_GROSS_PROFIT_NOT_MET'
  | 'MINIMUM_SELLING_PRICE_NOT_MET'
  | 'MAXIMUM_SELLING_PRICE_EXCEEDED'
  | 'MAXIMUM_DISCOUNT_RATE_EXCEEDED'

export interface PriceEngineeringSignal {
  code: PriceEngineeringSignalCode
  severity: PriceEngineeringSignalSeverity
  message: string
  actual: number | null
  threshold: number | null
}

export type PriceEngineeringEvaluationStatus =
  | 'valid'
  | 'warning'
  | 'blocked'
  | 'invalid'

export interface PriceEngineeringScenarioEvaluation {
  scenarioId: string
  name: string
  kind: BusinessPriceScenarioKind
  pricingGroupId: string | null
  basis: PriceEngineeringScenarioBasis
  status: PriceEngineeringEvaluationStatus
  metrics: PriceEngineeringMetrics | null
  delta: PriceEngineeringDelta | null
  signals: PriceEngineeringSignal[]
  explainability: string[]
}

export interface PriceEngineeringLaboratorySummary {
  totalScenarios: number
  validScenarios: number
  warningScenarios: number
  blockedScenarios: number
  invalidScenarios: number
}

export interface PriceEngineeringIsolationContract {
  mutatesSourcePrice: false
  persistsScenarioResults: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PriceEngineeringLaboratoryInput {
  price: Readonly<BusinessPrice>
  scenarios: readonly PriceEngineeringScenarioInput[]
  defaultGuardrails?: readonly PriceEngineeringGuardrail[]
  options?: PriceEngineeringOptions
}

export interface PriceEngineeringLaboratoryResult {
  available: boolean
  methodology: PriceEngineeringMethodology
  executionMode: PriceEngineeringExecutionMode
  isolation: PriceEngineeringIsolationContract
  sourcePrice: BusinessPrice
  base: PriceEngineeringMetrics | null
  scenarios: PriceEngineeringScenarioEvaluation[]
  summary: PriceEngineeringLaboratorySummary
  signals: PriceEngineeringSignal[]
}
