import type {
  BrandIntelligenceSummary,
} from '../../analytics/brands'

import {
  buildOpportunityRadar,
} from './opportunityBuilder'

import type {
  OpportunityRadar,
} from './opportunityTypes'

function assertValidSummary(
  summary: BrandIntelligenceSummary,
): void {
  if (summary.currentPeriodId.trim().length === 0) {
    throw new Error(
      'Opportunity Radar requires a valid current period.',
    )
  }

  if (summary.totalBrands < 0) {
    throw new Error(
      'Opportunity Radar received an invalid brand count.',
    )
  }

  if (summary.brands.length > summary.totalBrands) {
    throw new Error(
      'Opportunity Radar received inconsistent brand coverage.',
    )
  }
}

export class OpportunityEngine {
  buildForBrandWorkspace(
    summary: BrandIntelligenceSummary,
    generatedAt?: string,
  ): OpportunityRadar {
    assertValidSummary(summary)

    return buildOpportunityRadar({
      brandIntelligence: summary,
      generatedAt,
    })
  }
}
