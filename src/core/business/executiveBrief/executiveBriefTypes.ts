import type {
  BrandIntelligenceSummary,
} from '../../analytics/brands'

export type ExecutiveBriefSeverity =
  | 'positive'
  | 'neutral'
  | 'attention'
  | 'critical'

export type ExecutiveBriefCategory =
  | 'revenue'
  | 'portfolio'
  | 'growth'
  | 'recovery'
  | 'concentration'
  | 'data-quality'
  | 'general'

export interface ExecutiveBriefEvidence {
  label: string
  value: string
}

export interface ExecutiveBriefExplanation {
  ruleId: string
  rationale: string
  evidence: readonly ExecutiveBriefEvidence[]
}

export interface ExecutiveBriefItem {
  id: string
  category: ExecutiveBriefCategory
  severity: ExecutiveBriefSeverity
  title: string
  description: string
  confidence: number
  explanation: ExecutiveBriefExplanation
}

export interface ExecutiveBriefHealth {
  score: number | null
  status: 'available' | 'not-available'
  label: string
}

export interface ExecutiveBrief {
  id: string
  entityType: 'brand-workspace'
  periodId: string
  generatedAt: string
  locale: 'es-MX'
  title: string
  summary: string
  health: ExecutiveBriefHealth
  highlights: readonly ExecutiveBriefItem[]
  risks: readonly ExecutiveBriefItem[]
  opportunities: readonly ExecutiveBriefItem[]
  recommendations: readonly ExecutiveBriefItem[]
}

export interface ExecutiveBriefContext {
  brandIntelligence: BrandIntelligenceSummary
  generatedAt?: string
}
