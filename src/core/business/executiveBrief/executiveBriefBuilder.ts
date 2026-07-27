import type {
  BrandIntelligenceSummary,
} from '../../analytics/brands'

import {
  buildExecutiveBriefHighlights,
  buildExecutiveBriefOpportunities,
  buildExecutiveBriefRecommendations,
  buildExecutiveBriefRisks,
} from './executiveBriefRules'

import type {
  ExecutiveBrief,
  ExecutiveBriefContext,
} from './executiveBriefTypes'

function formatCurrency(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return 'sin comparación porcentual disponible'
  }

  return value.toLocaleString('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function buildSummary(
  summary: BrandIntelligenceSummary,
): string {
  if (summary.totalBrands === 0) {
    return 'No existen marcas suficientes para elaborar una lectura ejecutiva del periodo.'
  }

  const movement = summary.revenueVariationPercentage === null
    ? 'sin una base porcentual comparable'
    : summary.revenueVariationPercentage >= 0
      ? `con crecimiento de ${formatPercent(summary.revenueVariationPercentage)}`
      : `con disminución de ${formatPercent(Math.abs(summary.revenueVariationPercentage))}`

  const portfolioCondition = summary.decliningBrands > summary.growingBrands
    ? `El portafolio presenta presión extendida: ${summary.decliningBrands} marcas están en descenso y ${summary.growingBrands} en crecimiento.`
    : `El portafolio registra ${summary.growingBrands} marcas en crecimiento frente a ${summary.decliningBrands} en descenso.`

  return [
    `La venta consolidada del periodo fue de ${formatCurrency(summary.currentPeriodRevenue)}, ${movement} frente al periodo anterior.`,
    portfolioCondition,
    `${summary.brandsRequiringAttention} marcas requieren atención comercial priorizada.`,
  ].join(' ')
}

export function buildExecutiveBrief(
  context: ExecutiveBriefContext,
): ExecutiveBrief {
  const summary = context.brandIntelligence

  return {
    id: `${summary.currentPeriodId}::brand-workspace::executive-brief`,
    entityType: 'brand-workspace',
    periodId: summary.currentPeriodId,
    generatedAt:
      context.generatedAt ?? summary.analysisDate,
    locale: 'es-MX',
    title: `Resumen ejecutivo · ${summary.currentPeriodId}`,
    summary: buildSummary(summary),
    health: {
      score: null,
      status: 'not-available',
      label: 'Pendiente de modelo consolidado',
    },
    highlights: buildExecutiveBriefHighlights(summary),
    risks: buildExecutiveBriefRisks(summary),
    opportunities: buildExecutiveBriefOpportunities(summary),
    recommendations: buildExecutiveBriefRecommendations(summary),
  }
}
