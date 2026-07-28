import type { BusinessRepository } from '../../../business'
import type { ProductDecisionSignal, ProductHealthComponent, ProductPeriodMetrics } from '../productDecisionTypes'
import { evaluateBCG } from './bcgEngine'
import { evaluateCommercialPenetration } from './commercialPenetrationEngine'
import { evaluateCustomerConcentration } from './customerConcentrationEngine'
import { evaluateProductAdoption } from './productAdoptionEngine'
import type { BusinessProductDNA } from './productIntelligenceTypes'
import { evaluateProductLifecycle } from './productLifecycleEngine'
import { buildProductRadar } from './productRadarEngine'

export function buildBusinessProductDNA(input: {
  repository: BusinessRepository
  productId: string
  inactiveMonths: number
  revenueVariation: number | null
  healthScore: number
  healthLabel: string
  healthComponents: readonly ProductHealthComponent[]
  timeline: readonly ProductPeriodMetrics[]
  risks: readonly ProductDecisionSignal[]
  opportunities: readonly ProductDecisionSignal[]
  recommendations: readonly ProductDecisionSignal[]
}): BusinessProductDNA | null {
  const product = input.repository.findProduct(input.productId)
  if (!product) return null

  const commercialStatus = product.commercialStatus ?? 'unclassified'
  const penetration = evaluateCommercialPenetration(commercialStatus)
  const lifecycle = evaluateProductLifecycle({
    commercialStatus,
    inactiveMonths: input.inactiveMonths,
    revenueVariation: input.revenueVariation,
    activePeriods: product.activePeriods.size,
  })
  const periods = input.repository.product.findTimeline(product.id)
  const concentration = evaluateCustomerConcentration(periods)
  const adoption = evaluateProductAdoption(product, input.repository.getDataPeriodEnd())
  const recurrenceComponent = input.healthComponents.find((item) => item.id === 'recurrence')
  const bcg = evaluateBCG({
    revenueVariation: input.revenueVariation,
    penetrationScore: penetration.score,
    recurrenceScore: recurrenceComponent?.score ?? 0,
  })
  const radar = buildProductRadar({
    isNewProduct: penetration.isNewProduct,
    inactiveMonths: input.inactiveMonths,
    revenueVariation: input.revenueVariation,
    concentrationRisk: concentration.risk,
    commercialStatus,
  })

  return {
    productId: product.id,
    generatedAt: new Date().toISOString(),
    lifecycle,
    penetration,
    concentration,
    adoption,
    bcg,
    health: {
      score: input.healthScore,
      label: input.healthLabel,
      components: input.healthComponents,
    },
    radar,
    risks: input.risks,
    opportunities: input.opportunities,
    recommendations: input.recommendations,
    timeline: input.timeline,
    explainability: [
      ...lifecycle.evidence,
      ...concentration.evidence,
      `BCG: ${bcg.label}`,
      `Health: ${input.healthScore}/100`,
    ],
  }
}
