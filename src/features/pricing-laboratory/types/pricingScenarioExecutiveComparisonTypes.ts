import type {
  PriceEngineeringDelta,
  PriceEngineeringEvaluationStatus,
  PriceEngineeringGuardrail,
  PriceEngineeringIsolationContract,
  PriceEngineeringMetrics,
  PriceEngineeringScenarioBasis,
  PriceEngineeringSignal,
  PricingLaboratoryTemplateIssue,
} from '../../../core/business/pricing'

import type {
  PricingLaboratoryWorkspaceIssue,
  PricingLaboratoryWorkspaceScenarioOrigin,
  PricingLaboratoryWorkspaceSourcePrice,
} from './pricingLaboratoryWorkspaceTypes'

export const PRICING_SCENARIO_EXECUTIVE_COMPARISON_METHODOLOGY =
  'pricing-executive-comparison-v1' as const

export type PricingScenarioExecutiveComparisonMethodology =
  typeof PRICING_SCENARIO_EXECUTIVE_COMPARISON_METHODOLOGY

export type PricingScenarioExecutiveComparisonStatus =
  | 'unavailable'
  | 'empty'
  | 'ready'
  | 'partial'

export type PricingScenarioExecutiveComparisonIssueCode =
  | 'EXECUTIVE_COMPARISON_SOURCE_UNAVAILABLE'
  | 'EXECUTIVE_COMPARISON_SELECTION_EMPTY'
  | 'EXECUTIVE_COMPARISON_SCENARIO_NOT_FOUND'
  | 'EXECUTIVE_COMPARISON_SCENARIO_NOT_CALCULABLE'

export type PricingScenarioExecutiveComparisonIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export interface PricingScenarioExecutiveComparisonIssue {
  code: PricingScenarioExecutiveComparisonIssueCode
  severity: PricingScenarioExecutiveComparisonIssueSeverity
  scenarioKey: string | null
  message: string
}

export interface PricingScenarioExecutiveComparisonGuardrailSummary {
  total: number
  warning: number
  blocking: number
}

export interface PricingScenarioExecutiveComparisonSignalSummary {
  total: number
  info: number
  warning: number
  blocking: number
  invalid: number
}

export interface PricingScenarioExecutiveComparisonRow {
  key: string
  order: number
  origin: PricingLaboratoryWorkspaceScenarioOrigin
  configurationId: string
  name: string
  pricingGroupId: string | null
  evaluationStatus: PriceEngineeringEvaluationStatus
  basis: PriceEngineeringScenarioBasis
  metrics: PriceEngineeringMetrics
  delta: PriceEngineeringDelta
  guardrails: PriceEngineeringGuardrail[]
  guardrailSummary: PricingScenarioExecutiveComparisonGuardrailSummary
  signals: PriceEngineeringSignal[]
  signalSummary: PricingScenarioExecutiveComparisonSignalSummary
  templateIssues: PricingLaboratoryTemplateIssue[]
  explainability: string[]
  sourceReference: string | null
  notes: string | null
}

export interface PricingScenarioExecutiveComparisonSummary {
  requestedRows: number
  selectedRows: number
  validRows: number
  warningRows: number
  blockedRows: number
  invalidSelections: number
  rowsWithGuardrails: number
  rowsWithSignals: number
}

export interface PricingScenarioExecutiveComparisonModel {
  available: boolean
  status: PricingScenarioExecutiveComparisonStatus
  generatedAt: string | null
  methodology: PricingScenarioExecutiveComparisonMethodology
  executionMode: 'simulation-only'
  isolation: PriceEngineeringIsolationContract
  disclaimer: string
  source: PricingLaboratoryWorkspaceSourcePrice | null
  requestedScenarioKeys: string[]
  rows: PricingScenarioExecutiveComparisonRow[]
  summary: PricingScenarioExecutiveComparisonSummary
  issues: PricingScenarioExecutiveComparisonIssue[]
  workspaceIssues: PricingLaboratoryWorkspaceIssue[]
  limitations: string[]
}
