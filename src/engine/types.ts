import type { PulseRecommendation } from '../features/pulse/rules/pulseRules'
import type {
  BusinessOpportunity,
  OpportunityBusinessData,
} from '../features/pulse/rules/opportunityRules'

export type PulseAlertSeverity = 'critical' | 'high' | 'medium'

export type PulseAlert = {
  id: string
  brand: string
  category: string
  title: string
  detail: string
  impact: string
  priorityScore: number
  severity: PulseAlertSeverity
  dueLabel?: string
}

export type PulseEngineInput = {
  userName: string
  healthScore: number
  healthChange: string

  forecastAchievement: number
  inventoryCoverageDays: number
  inventoryHealth: number
  grossProfit: number
  salesGrowth: number
  inactiveCustomers: number
  excessInventoryValue: number

  alerts: PulseAlert[]
  opportunitySources: OpportunityBusinessData[]
}

export type ExecutiveBriefResult = {
  title: string
  summary: string
  recommendation: string
}

export type BusinessHealthResult = {
  score: number
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  change: string
  description: string
}

export type PulseEngineResult = {
  executiveBrief: ExecutiveBriefResult
  businessHealth: BusinessHealthResult
  alerts: PulseAlert[]
  recommendations: PulseRecommendation[]
  opportunities: BusinessOpportunity[]
}