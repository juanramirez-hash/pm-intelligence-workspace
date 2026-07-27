import type {
  BusinessHealthGrade,
  BusinessHealthScore,
} from '../health'

import type {
  BusinessBrandSnapshot,
} from '../snapshots'

export type BusinessNarrativeSeverity =
  | 'positive'
  | 'neutral'
  | 'attention'
  | 'critical'

export type BusinessNarrativeCategory =
  | 'revenue'
  | 'gross-profit'
  | 'margin'
  | 'forecast'
  | 'pace'
  | 'customers'
  | 'products'
  | 'trend'
  | 'data-quality'
  | 'general'

export interface BusinessNarrativeItem {
  code: string
  category: BusinessNarrativeCategory
  severity: BusinessNarrativeSeverity
  title: string
  description: string
}

export interface BusinessExecutiveBrief {
  id: string
  snapshotId: string
  healthScoreId: string
  entityType: 'brand'
  generatedAt: string
  locale: 'es-MX'
  title: string
  summary: string
  health: {
    score: number | null
    grade: BusinessHealthGrade
    label: string
  }
  highlights: readonly BusinessNarrativeItem[]
  risks: readonly BusinessNarrativeItem[]
  opportunities: readonly BusinessNarrativeItem[]
  recommendations: readonly BusinessNarrativeItem[]
}

export interface BusinessNarrativeContext {
  snapshot: BusinessBrandSnapshot
  healthScore: BusinessHealthScore
}
