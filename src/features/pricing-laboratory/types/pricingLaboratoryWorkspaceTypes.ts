import type {
  BusinessPriceMarginBand,
  BusinessPriceScenarioKind,
  BusinessPriceSource,
} from '../../../core/business/entities/price'

import type {
  PriceEngineeringDelta,
  PriceEngineeringEvaluationStatus,
  PriceEngineeringGuardrail,
  PriceEngineeringIsolationContract,
  PriceEngineeringMetrics,
  PriceEngineeringOptions,
  PriceEngineeringScenarioBasis,
  PriceEngineeringSignal,
  PricingLaboratoryGuardrailProfileInput,
  PricingLaboratoryTemplateInput,
  PricingLaboratoryTemplateIssue,
  PricingLaboratoryTemplateResolutionStatus,
  StandardPricingLaboratoryTemplateId,
} from '../../../core/business/pricing'

export const PRICING_LABORATORY_WORKSPACE_METHODOLOGY =
  'pricing-workspace-v1' as const

export type PricingLaboratoryWorkspaceMethodology =
  typeof PRICING_LABORATORY_WORKSPACE_METHODOLOGY

export type PricingLaboratoryWorkspaceStatus =
  | 'unavailable'
  | 'awaiting_selection'
  | 'ready'
  | 'partial'

export type PricingLaboratoryWorkspaceUnavailableReason =
  | 'repository_unavailable'
  | 'pricing_data_unavailable'
  | 'product_selection_required'
  | 'currency_selection_required'
  | 'price_not_found'
  | 'source_price_invalid'

export type PricingLaboratoryWorkspaceIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PricingLaboratoryWorkspaceIssueCode =
  | 'WORKSPACE_REPOSITORY_UNAVAILABLE'
  | 'WORKSPACE_PRICING_DATA_UNAVAILABLE'
  | 'WORKSPACE_PRODUCT_SELECTION_REQUIRED'
  | 'WORKSPACE_CURRENCY_SELECTION_REQUIRED'
  | 'WORKSPACE_PRICE_NOT_FOUND'
  | 'WORKSPACE_PRODUCT_METADATA_NOT_FOUND'
  | 'WORKSPACE_SELECTED_SCENARIO_NOT_FOUND'
  | 'WORKSPACE_SOURCE_PRICE_INVALID'

export interface PricingLaboratoryWorkspaceIssue {
  code: PricingLaboratoryWorkspaceIssueCode
  severity: PricingLaboratoryWorkspaceIssueSeverity
  message: string
}

export interface PricingLaboratoryWorkspaceRequest {
  productId: string
  currency: string | null
  templates: readonly PricingLaboratoryTemplateInput[]
  guardrailProfiles: readonly PricingLaboratoryGuardrailProfileInput[]
  defaultGuardrails: readonly PriceEngineeringGuardrail[]
  options?: PriceEngineeringOptions
  includeStoredScenarios: boolean
  selectedScenarioKey: string | null
}

export interface PricingLaboratoryProductOption {
  productId: string
  label: string
  model: string | null
  sku: string | null
  brandId: string
  currencies: string[]
  priceCount: number
}

export interface PricingLaboratoryCurrencyOption {
  currency: string
  priceId: string
  effectiveDate: string | null
  sellingPrice: number
  grossMargin: number
  marginBand: BusinessPriceMarginBand
}

export interface PricingLaboratoryWorkspaceSelection {
  requestedProductId: string
  requestedCurrency: string | null
  selectedProductId: string | null
  selectedCurrency: string | null
  products: PricingLaboratoryProductOption[]
  currencies: PricingLaboratoryCurrencyOption[]
}

export interface PricingLaboratoryWorkspaceSourcePrice {
  priceId: string
  productId: string
  productName: string
  model: string | null
  sku: string | null
  brandId: string
  brandName: string
  currency: string
  effectiveDate: string | null
  source: BusinessPriceSource
  sourceReference: string | null
  metrics: PriceEngineeringMetrics
}

export type PricingLaboratoryWorkspaceScenarioOrigin =
  | 'template'
  | 'stored'

export interface PricingLaboratoryWorkspaceScenarioRow {
  key: string
  origin: PricingLaboratoryWorkspaceScenarioOrigin
  configurationId: string
  templateId: StandardPricingLaboratoryTemplateId | null
  storedScenarioId: string | null
  name: string
  kind: BusinessPriceScenarioKind
  pricingGroupId: string | null
  orchestrationStatus: PricingLaboratoryTemplateResolutionStatus
  evaluationStatus: PriceEngineeringEvaluationStatus | null
  basis: PriceEngineeringScenarioBasis | null
  metrics: PriceEngineeringMetrics | null
  delta: PriceEngineeringDelta | null
  resolvedGuardrails: PriceEngineeringGuardrail[]
  signals: PriceEngineeringSignal[]
  issues: PricingLaboratoryTemplateIssue[]
  explainability: string[]
  sourceReference: string | null
  notes: string | null
  selected: boolean
}

export interface PricingLaboratoryWorkspaceSummary {
  totalRows: number
  templateRows: number
  storedRows: number
  evaluatedRows: number
  disabledRows: number
  notApplicableRows: number
  validEvaluations: number
  warningEvaluations: number
  blockedEvaluations: number
  invalidEvaluations: number
  rowsWithMetrics: number
  templateIssueCount: number
  selectedScenarioKey: string | null
}

export interface PricingLaboratoryWorkspaceModel {
  available: boolean
  status: PricingLaboratoryWorkspaceStatus
  unavailableReason: PricingLaboratoryWorkspaceUnavailableReason | null
  generatedAt: string | null
  methodology: {
    workspace: PricingLaboratoryWorkspaceMethodology
    templates: 'pricing-template-v1'
    engineering: 'price-engineering-v1'
  }
  executionMode: 'simulation-only'
  isolation: PriceEngineeringIsolationContract
  selection: PricingLaboratoryWorkspaceSelection
  source: PricingLaboratoryWorkspaceSourcePrice | null
  scenarios: PricingLaboratoryWorkspaceScenarioRow[]
  selectedScenario: PricingLaboratoryWorkspaceScenarioRow | null
  summary: PricingLaboratoryWorkspaceSummary
  issues: PricingLaboratoryWorkspaceIssue[]
  templateIssues: PricingLaboratoryTemplateIssue[]
  explainability: string[]
  limitations: string[]
}

export const DEFAULT_PRICING_LABORATORY_WORKSPACE_REQUEST:
PricingLaboratoryWorkspaceRequest = {
  productId: '',
  currency: null,
  templates: [],
  guardrailProfiles: [],
  defaultGuardrails: [],
  includeStoredScenarios: true,
  selectedScenarioKey: null,
}
