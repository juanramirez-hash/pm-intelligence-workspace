import type {
  BrandIntelligenceSummary,
} from '../../analytics/brands'

import {
  buildExecutiveBrief,
} from './executiveBriefBuilder'

import type {
  ExecutiveBrief,
} from './executiveBriefTypes'

function assertValidSummary(
  summary: BrandIntelligenceSummary,
): void {
  if (summary.currentPeriodId.trim().length === 0) {
    throw new Error(
      'Executive Brief requires a valid current period.',
    )
  }

  if (summary.totalBrands < 0) {
    throw new Error(
      'Executive Brief received an invalid brand count.',
    )
  }

  if (summary.activeBrands > summary.totalBrands) {
    throw new Error(
      'Executive Brief received inconsistent brand coverage.',
    )
  }
}

/**
 * Deterministic workspace narrative facade.
 *
 * It consumes the public Brand Intelligence contract and does not read
 * raw import rows, UI state or Repository indexes directly.
 */
export class ExecutiveBriefEngine {
  buildForBrandWorkspace(
    summary: BrandIntelligenceSummary,
    generatedAt?: string,
  ): ExecutiveBrief {
    assertValidSummary(summary)

    return buildExecutiveBrief({
      brandIntelligence: summary,
      generatedAt,
    })
  }
}
