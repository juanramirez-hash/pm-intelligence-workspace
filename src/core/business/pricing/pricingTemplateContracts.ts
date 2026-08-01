import type {
  BusinessPrice,
  BusinessPriceScenarioKind,
  StandardPricingGroupId,
} from '../entities/price'

import type {
  PriceEngineeringGuardrail,
  PriceEngineeringIsolationContract,
  PriceEngineeringLaboratoryResult,
  PriceEngineeringOptions,
  PriceEngineeringScenarioBasis,
  PriceEngineeringScenarioEvaluation,
} from './priceEngineeringContracts'

export const PRICING_TEMPLATE_METHODOLOGY =
  'pricing-template-v1' as const

export type PricingTemplateMethodology =
  typeof PRICING_TEMPLATE_METHODOLOGY

export const STANDARD_PRICING_LABORATORY_TEMPLATE_IDS = [
  'PROMOTION',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'PROJECT',
  'CUSTOM',
] as const

export type StandardPricingLaboratoryTemplateId =
  typeof STANDARD_PRICING_LABORATORY_TEMPLATE_IDS[number]

export type PriceEngineeringScenarioBasisType =
  PriceEngineeringScenarioBasis['type']

/**
 * Static metadata only. Definitions never contain prices, discounts, margins
 * or approval thresholds. Numeric assumptions must be supplied explicitly by
 * the laboratory caller for every simulation.
 */
export interface PricingLaboratoryTemplateDefinition {
  id: StandardPricingLaboratoryTemplateId
  label: string
  kind: BusinessPriceScenarioKind
  pricingGroupId: StandardPricingGroupId
  description: string
  suggestedBasisTypes: readonly PriceEngineeringScenarioBasisType[]
  numericPolicy: 'explicit-input-only'
}

export interface PricingLaboratoryTemplateScope {
  brandIds?: readonly string[]
  productIds?: readonly string[]
  currencies?: readonly string[]
}

export interface PricingLaboratoryGuardrailProfileInput {
  id: string
  name: string
  guardrails: readonly PriceEngineeringGuardrail[]
  sourceReference?: string | null
  notes?: string | null
}

export interface PricingLaboratoryTemplateInput {
  id: string
  templateId: StandardPricingLaboratoryTemplateId
  name?: string | null
  enabled?: boolean
  basis: PriceEngineeringScenarioBasis
  guardrailProfileId?: string | null
  guardrails?: readonly PriceEngineeringGuardrail[]
  scope?: PricingLaboratoryTemplateScope
  sourceReference?: string | null
  notes?: string | null
}

export interface PricingLaboratoryTemplateSetInput {
  price: Readonly<BusinessPrice>
  templates: readonly PricingLaboratoryTemplateInput[]
  guardrailProfiles?: readonly PricingLaboratoryGuardrailProfileInput[]
  defaultGuardrails?: readonly PriceEngineeringGuardrail[]
  options?: PriceEngineeringOptions
}

export type PricingLaboratoryTemplateResolutionStatus =
  | 'evaluated'
  | 'disabled'
  | 'not_applicable'
  | 'invalid'

export type PricingLaboratoryTemplateIssueSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PricingLaboratoryTemplateIssueCode =
  | 'TEMPLATE_DUPLICATE_ID'
  | 'TEMPLATE_UNKNOWN_DEFINITION'
  | 'TEMPLATE_INVALID_SCOPE'
  | 'TEMPLATE_NOT_APPLICABLE'
  | 'TEMPLATE_PROFILE_NOT_FOUND'
  | 'GUARDRAIL_PROFILE_DUPLICATE_ID'
  | 'GUARDRAIL_PROFILE_INVALID_IDENTIFIER'
  | 'GUARDRAIL_OVERRIDDEN'

export interface PricingLaboratoryTemplateIssue {
  code: PricingLaboratoryTemplateIssueCode
  severity: PricingLaboratoryTemplateIssueSeverity
  message: string
  configurationId: string | null
  profileId: string | null
}

export interface PricingLaboratoryTemplateResolution {
  configurationId: string
  templateId: StandardPricingLaboratoryTemplateId
  name: string
  definition: PricingLaboratoryTemplateDefinition
  status: PricingLaboratoryTemplateResolutionStatus
  scope: PricingLaboratoryTemplateScope | null
  resolvedGuardrails: PriceEngineeringGuardrail[]
  evaluation: PriceEngineeringScenarioEvaluation | null
  issues: PricingLaboratoryTemplateIssue[]
  explainability: string[]
  sourceReference: string | null
  notes: string | null
}

export interface PricingLaboratoryTemplateSummary {
  totalTemplates: number
  evaluatedTemplates: number
  disabledTemplates: number
  notApplicableTemplates: number
  invalidTemplates: number
  guardrailProfiles: number
  totalIssues: number
}

export interface PricingLaboratoryTemplateSetResult {
  available: boolean
  methodology: PricingTemplateMethodology
  executionMode: 'simulation-only'
  isolation: PriceEngineeringIsolationContract
  sourcePrice: BusinessPrice
  templates: PricingLaboratoryTemplateResolution[]
  laboratory: PriceEngineeringLaboratoryResult
  summary: PricingLaboratoryTemplateSummary
  issues: PricingLaboratoryTemplateIssue[]
}
