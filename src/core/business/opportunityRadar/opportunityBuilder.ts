import type {
  BrandIntelligenceSummary,
} from '../../analytics/brands'

import {
  buildCoverageOpportunity,
  buildGrowthOpportunity,
  buildPortfolioOpportunity,
  buildRecoveryOpportunity,
} from './opportunityRules'

import type {
  BusinessOpportunity,
  OpportunityRadar,
  OpportunityRadarContext,
} from './opportunityTypes'

function compareOpportunities(
  left: BusinessOpportunity,
  right: BusinessOpportunity,
): number {
  if (right.score !== left.score) {
    return right.score - left.score
  }

  if (right.impact !== left.impact) {
    return right.impact - left.impact
  }

  return left.entityName.localeCompare(
    right.entityName,
    'es-MX',
  )
}

function buildBrandOpportunities(
  summary: BrandIntelligenceSummary,
): BusinessOpportunity[] {
  return summary.brands.flatMap((brand) => {
    const opportunities = [
      buildRecoveryOpportunity(brand, summary),
      buildGrowthOpportunity(brand, summary),
      buildCoverageOpportunity(brand, summary),
      buildPortfolioOpportunity(brand, summary),
    ]

    return opportunities.filter(
      (opportunity): opportunity is BusinessOpportunity =>
        opportunity !== null,
    )
  })
}

export function buildOpportunityRadar(
  context: OpportunityRadarContext,
): OpportunityRadar {
  const opportunities = buildBrandOpportunities(
    context.brandIntelligence,
  ).sort(compareOpportunities)

  return {
    id: `opportunity-radar.brand-workspace.${context.brandIntelligence.currentPeriodId}`,
    entityType: 'brand-workspace',
    periodId: context.brandIntelligence.currentPeriodId,
    generatedAt:
      context.generatedAt ??
      context.brandIntelligence.analysisDate,
    opportunities,
    totalImpact: opportunities.reduce(
      (total, opportunity) => total + opportunity.impact,
      0,
    ),
    criticalCount: opportunities.filter(
      (opportunity) => opportunity.priority === 'critical',
    ).length,
    highCount: opportunities.filter(
      (opportunity) => opportunity.priority === 'high',
    ).length,
  }
}
