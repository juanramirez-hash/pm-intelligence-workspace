import type {
  BrandIntelligenceItem,
  BrandIntelligenceSummary,
} from '../../analytics/brands'

export type OpportunityType =
  | 'recovery'
  | 'growth'
  | 'coverage'
  | 'portfolio'

export type OpportunityPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export interface OpportunityEvidence {
  label: string
  value: string
}

export interface OpportunityExplanation {
  ruleId: string
  rationale: string
  evidence: readonly OpportunityEvidence[]
}

export interface OpportunityScoreInput {
  impact: number
  urgency: number
  probability: number
  coverage: number
  risk: number
}

export interface BusinessOpportunity {
  id: string
  entityType: 'brand'
  entityId: string
  entityName: string
  type: OpportunityType
  priority: OpportunityPriority
  title: string
  description: string
  impact: number
  confidence: number
  effort: number
  score: number
  explanation: OpportunityExplanation
}

export interface OpportunityRadar {
  id: string
  entityType: 'brand-workspace'
  periodId: string
  generatedAt: string
  opportunities: readonly BusinessOpportunity[]
  totalImpact: number
  criticalCount: number
  highCount: number
}

export interface OpportunityRadarContext {
  brandIntelligence: BrandIntelligenceSummary
  generatedAt?: string
}

export interface OpportunityRuleContext {
  summary: BrandIntelligenceSummary
  brand: BrandIntelligenceItem
}
