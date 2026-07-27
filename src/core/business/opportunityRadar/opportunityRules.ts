import type {
  BrandIntelligenceItem,
  BrandIntelligenceSummary,
} from '../../analytics/brands'

import {
  calculateOpportunityScore,
  classifyOpportunityPriority,
} from './opportunityScore'

import {
  createOpportunityExplanation,
} from './opportunityExplanation'

import type {
  BusinessOpportunity,
} from './opportunityTypes'

function formatCurrency(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function normalizeImpact(
  impact: number,
  summary: BrandIntelligenceSummary,
): number {
  if (summary.previousPeriodRevenue <= 0) {
    return impact > 0 ? 60 : 0
  }

  return clamp(
    (impact / summary.previousPeriodRevenue) * 500,
  )
}

function buildOpportunity(
  brand: BrandIntelligenceItem,
  definition: Omit<BusinessOpportunity, 'id' | 'entityType' | 'entityId' | 'entityName' | 'priority' | 'score'> & {
    scoreInput: {
      impact: number
      urgency: number
      probability: number
      coverage: number
      risk: number
    }
  },
): BusinessOpportunity {
  const score = calculateOpportunityScore(definition.scoreInput)

  return {
    id: `opportunity.${definition.type}.${brand.brandId}`,
    entityType: 'brand',
    entityId: brand.brandId,
    entityName: brand.brandName,
    type: definition.type,
    priority: classifyOpportunityPriority(score),
    title: definition.title,
    description: definition.description,
    impact: definition.impact,
    confidence: clamp(definition.confidence),
    effort: clamp(definition.effort),
    score,
    explanation: definition.explanation,
  }
}

export function buildRecoveryOpportunity(
  brand: BrandIntelligenceItem,
  summary: BrandIntelligenceSummary,
): BusinessOpportunity | null {
  if (
    brand.trendStatus !== 'declining' ||
    brand.revenueVariation >= 0
  ) {
    return null
  }

  const impact = Math.abs(brand.revenueVariation)
  const impactScore = normalizeImpact(impact, summary)
  const confidence = brand.previousPeriod.revenue > 0 ? 94 : 70

  return buildOpportunity(brand, {
    type: 'recovery',
    title: `Recuperar venta de ${brand.brandName}`,
    description:
      `La marca perdió ${formatCurrency(impact)} frente al periodo anterior y requiere una intervención comercial priorizada.`,
    impact,
    confidence,
    effort: 55,
    explanation: createOpportunityExplanation(
      'OP-R-001',
      'La marca presenta una variación negativa frente al periodo comparable y conserva una base histórica cuantificable para priorizar su recuperación.',
      [
        {
          label: 'Pérdida absoluta',
          value: formatCurrency(impact),
        },
        {
          label: 'Venta del periodo anterior',
          value: formatCurrency(brand.previousPeriod.revenue),
        },
        {
          label: 'Clientes actuales',
          value: brand.currentPeriod.customers.toLocaleString('es-MX'),
        },
      ],
    ),
    scoreInput: {
      impact: impactScore,
      urgency: 90,
      probability: confidence,
      coverage: clamp(brand.currentPeriod.customers * 4),
      risk: 85,
    },
  })
}

export function buildGrowthOpportunity(
  brand: BrandIntelligenceItem,
  summary: BrandIntelligenceSummary,
): BusinessOpportunity | null {
  if (
    brand.trendStatus !== 'growing' ||
    brand.revenueVariation <= 0
  ) {
    return null
  }

  const impact = brand.revenueVariation
  const impactScore = normalizeImpact(impact, summary)
  const confidence = brand.previousPeriod.revenue > 0 ? 91 : 72

  return buildOpportunity(brand, {
    type: 'growth',
    title: `Escalar crecimiento de ${brand.brandName}`,
    description:
      `La marca incrementó ${formatCurrency(impact)} y puede absorber acciones de continuidad comercial.`,
    impact,
    confidence,
    effort: 45,
    explanation: createOpportunityExplanation(
      'OP-G-001',
      'La marca mantiene una variación positiva y dispone de tracción observable frente al periodo comparable.',
      [
        {
          label: 'Crecimiento absoluto',
          value: formatCurrency(impact),
        },
        {
          label: 'Clientes actuales',
          value: brand.currentPeriod.customers.toLocaleString('es-MX'),
        },
        {
          label: 'Productos activos',
          value: brand.currentPeriod.products.toLocaleString('es-MX'),
        },
      ],
    ),
    scoreInput: {
      impact: impactScore,
      urgency: 60,
      probability: confidence,
      coverage: clamp(brand.currentPeriod.customers * 4),
      risk: 35,
    },
  })
}

export function buildCoverageOpportunity(
  brand: BrandIntelligenceItem,
  summary: BrandIntelligenceSummary,
): BusinessOpportunity | null {
  if (
    brand.lifecycleStatus !== 'inactive' &&
    brand.lifecycleStatus !== 'lost'
  ) {
    return null
  }

  const impact = Math.max(0, brand.historicalRevenue)
  const impactScore = normalizeImpact(impact, summary)

  return buildOpportunity(brand, {
    type: 'coverage',
    title: `Reactivar cobertura de ${brand.brandName}`,
    description:
      'La marca no registra venta actual, pero conserva actividad histórica que permite evaluar una reactivación.',
    impact,
    confidence: impact > 0 ? 82 : 60,
    effort: 70,
    explanation: createOpportunityExplanation(
      'OP-C-001',
      'La ausencia de actividad actual contrasta con el historial comercial disponible para la marca.',
      [
        {
          label: 'Venta histórica',
          value: formatCurrency(brand.historicalRevenue),
        },
        {
          label: 'Clientes históricos',
          value: brand.historicalCustomers.toLocaleString('es-MX'),
        },
        {
          label: 'Estado',
          value: brand.lifecycleStatus,
        },
      ],
    ),
    scoreInput: {
      impact: impactScore,
      urgency: brand.lifecycleStatus === 'lost' ? 80 : 60,
      probability: impact > 0 ? 82 : 60,
      coverage: clamp(brand.historicalCustomers * 4),
      risk: 65,
    },
  })
}

export function buildPortfolioOpportunity(
  brand: BrandIntelligenceItem,
  summary: BrandIntelligenceSummary,
): BusinessOpportunity | null {
  if (
    brand.revenueParticipation < 0.1 ||
    brand.trendStatus === 'declining'
  ) {
    return null
  }

  const impact = brand.currentPeriod.revenue
  const impactScore = normalizeImpact(impact, summary)

  return buildOpportunity(brand, {
    type: 'portfolio',
    title: `Proteger contribución de ${brand.brandName}`,
    description:
      'La marca concentra una participación relevante de venta y requiere continuidad operativa para proteger el resultado.',
    impact,
    confidence: 90,
    effort: 40,
    explanation: createOpportunityExplanation(
      'OP-P-001',
      'La participación de la marca en el ingreso consolidado supera el umbral de relevancia del portafolio.',
      [
        {
          label: 'Venta actual',
          value: formatCurrency(brand.currentPeriod.revenue),
        },
        {
          label: 'Participación',
          value: brand.revenueParticipation.toLocaleString('es-MX', {
            style: 'percent',
            maximumFractionDigits: 1,
          }),
        },
      ],
    ),
    scoreInput: {
      impact: impactScore,
      urgency: 70,
      probability: 90,
      coverage: clamp(brand.currentPeriod.customers * 4),
      risk: 70,
    },
  })
}
