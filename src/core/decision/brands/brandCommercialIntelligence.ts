import type {
  BrandDecisionModel,
  BrandRecommendedAction,
  CommercialPriorityLevel,
} from './brandDecisionTypes'

export type BrandDecisionIntelligenceInput = Omit<
  BrandDecisionModel,
  'executiveScore' | 'aiSummary' | 'prioritizedActions' | 'forecast' | 'actionCenter'
>

export type BrandExecutiveScoreGrade =
  | 'excellent'
  | 'healthy'
  | 'attention'
  | 'risk'
  | 'critical'

export interface BrandExecutiveScoreComponent {
  id: 'business-health' | 'target-performance' | 'customer-retention' | 'portfolio-continuity'
  label: string
  score: number
  weight: number
  weightedScore: number
  evidence: string
}

export interface BrandExecutiveScore {
  score: number
  grade: BrandExecutiveScoreGrade
  label: string
  confidence: number
  components: readonly BrandExecutiveScoreComponent[]
}

export interface BrandAICommercialSummary {
  headline: string
  diagnosis: string
  primaryFocus: string
  nextStep: string
}

export type BrandActionUrgency = 'immediate' | 'high' | 'medium' | 'low'

export interface BrandPrioritizedAction extends BrandRecommendedAction {
  rank: number
  urgency: BrandActionUrgency
  impactScore: number
  estimatedRevenueImpact: number | null
  probability: number
  evidence: readonly string[]
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function attainmentScore(value: number | null): number | null {
  return value === null ? null : clamp(value * 100)
}

function classify(score: number): Pick<BrandExecutiveScore, 'grade' | 'label'> {
  if (score >= 85) return { grade: 'excellent', label: 'Excelente' }
  if (score >= 70) return { grade: 'healthy', label: 'Saludable' }
  if (score >= 55) return { grade: 'attention', label: 'Atención' }
  if (score >= 40) return { grade: 'risk', label: 'Riesgo' }
  return { grade: 'critical', label: 'Crítico' }
}

export function buildBrandExecutiveScore(
  decision: BrandDecisionIntelligenceInput,
): BrandExecutiveScore {
  const health = decision.healthScore.score ?? 50
  const attainments = [
    attainmentScore(decision.currentSnapshot.attainment.revenue.attainment),
    attainmentScore(decision.currentSnapshot.attainment.grossProfit.attainment),
    attainmentScore(decision.currentSnapshot.attainment.grossMargin.attainment),
  ].filter((value): value is number => value !== null)
  const targetPerformance = attainments.length > 0
    ? attainments.reduce((sum, value) => sum + value, 0) / attainments.length
    : 50

  const previousCustomers = decision.previousSnapshot?.actuals.customers ?? 0
  const customerRetention = previousCustomers > 0
    ? clamp(((previousCustomers - decision.lostCustomers.length) / previousCustomers) * 100)
    : 100

  const previousProducts = decision.previousSnapshot?.actuals.products ?? 0
  const portfolioContinuity = previousProducts > 0
    ? clamp(((previousProducts - decision.lostProducts.length) / previousProducts) * 100)
    : 100

  const rawComponents = [
    {
      id: 'business-health' as const,
      label: 'Salud del negocio',
      score: health,
      weight: 40,
      evidence: `Health Score: ${round(health)} de 100.`,
    },
    {
      id: 'target-performance' as const,
      label: 'Cumplimiento de objetivos',
      score: targetPerformance,
      weight: 30,
      evidence: `${attainments.length} indicadores de objetivo evaluados.`,
    },
    {
      id: 'customer-retention' as const,
      label: 'Retención de clientes',
      score: customerRetention,
      weight: 20,
      evidence: `${decision.lostCustomers.length} clientes perdidos frente al periodo anterior.`,
    },
    {
      id: 'portfolio-continuity' as const,
      label: 'Continuidad del portafolio',
      score: portfolioContinuity,
      weight: 10,
      evidence: `${decision.lostProducts.length} productos sin actividad frente al periodo anterior.`,
    },
  ]

  const components = rawComponents.map((component) => ({
    ...component,
    score: round(component.score),
    weightedScore: round((component.score * component.weight) / 100),
  }))
  const score = round(components.reduce((sum, component) => sum + component.weightedScore, 0))
  const classification = classify(score)
  const confidence = round(
    60 +
      (decision.previousSnapshot ? 15 : 0) +
      (attainments.length / 3) * 25,
  )

  return {
    score,
    ...classification,
    confidence: clamp(confidence),
    components,
  }
}

function priorityWeight(level: CommercialPriorityLevel): number {
  return { critical: 100, high: 80, medium: 55, low: 30 }[level]
}

export function buildBrandPrioritizedActions(
  decision: BrandDecisionIntelligenceInput,
): BrandPrioritizedAction[] {
  const recoverableRevenue = decision.lostCustomers.reduce(
    (sum, customer) => sum + customer.previousRevenue,
    0,
  )
  const revenueTarget = decision.currentSnapshot.target.revenue
  const revenueGap = revenueTarget === null
    ? null
    : Math.max(0, revenueTarget - decision.currentSnapshot.actuals.revenue)

  return decision.recommendedActions
    .map((action) => {
      const isCustomerRecovery = action.reasonCodes.includes('lost-customers')
      const isRevenueGap = action.reasonCodes.includes('revenue-below-target')
      const estimatedRevenueImpact = isCustomerRecovery
        ? recoverableRevenue
        : isRevenueGap
          ? revenueGap
          : null
      const probability = isCustomerRecovery ? 65 : isRevenueGap ? 55 : 50
      const impactScore = clamp(
        priorityWeight(action.priority) +
          (estimatedRevenueImpact !== null && estimatedRevenueImpact > 0 ? 10 : 0),
      )
      const urgency: BrandActionUrgency = impactScore >= 90
        ? 'immediate'
        : impactScore >= 75
          ? 'high'
          : impactScore >= 50
            ? 'medium'
            : 'low'

      return {
        ...action,
        rank: 0,
        urgency,
        impactScore,
        estimatedRevenueImpact,
        probability,
        evidence: action.reasonCodes,
      }
    })
    .sort((a, b) => b.impactScore - a.impactScore || a.title.localeCompare(b.title))
    .slice(0, 5)
    .map((action, index) => ({ ...action, rank: index + 1 }))
}

export function buildBrandAICommercialSummary(
  decision: BrandDecisionIntelligenceInput,
  executiveScore: BrandExecutiveScore,
  actions: readonly BrandPrioritizedAction[],
): BrandAICommercialSummary {
  const topRisk = decision.risks[0]
  const topOpportunity = decision.opportunities[0]
  const topAction = actions[0]

  return {
    headline: `${decision.brandName}: estado ${executiveScore.label.toLowerCase()} con score ${executiveScore.score}/100.`,
    diagnosis: topRisk
      ? `${topRisk.title}. ${topRisk.description}`
      : 'No se detectaron riesgos comerciales relevantes para el periodo evaluado.',
    primaryFocus: topOpportunity
      ? `${topOpportunity.title}. ${topOpportunity.description}`
      : 'Mantener el cumplimiento de objetivos y la continuidad comercial de la marca.',
    nextStep: topAction
      ? `${topAction.title}: ${topAction.description}`
      : 'Mantener seguimiento periódico sin acciones extraordinarias.',
  }
}
