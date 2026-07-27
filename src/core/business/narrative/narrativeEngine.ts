import type {
  BusinessHealthScore,
} from '../health'

import type {
  BusinessBrandSnapshot,
} from '../snapshots'

import {
  buildBusinessExecutiveBrief,
} from './executiveBriefBuilder'

import type {
  BusinessExecutiveBrief,
} from './narrativeTypes'

function assertMatchingContext(
  snapshot: BusinessBrandSnapshot,
  healthScore: BusinessHealthScore,
): void {
  if (healthScore.snapshotId !== snapshot.id) {
    throw new Error(
      'Narrative context mismatch: Health Score does not belong to the supplied Snapshot.',
    )
  }

  if (healthScore.entityType !== snapshot.entityType) {
    throw new Error(
      'Narrative context mismatch: entity types are different.',
    )
  }
}

/**
 * Deterministic narrative facade for business consumers.
 *
 * It receives derived business contracts and never reads raw rows,
 * Repository indexes or UI state.
 */
export class BusinessNarrativeEngine {
  buildExecutiveBrief(
    snapshot: BusinessBrandSnapshot,
    healthScore: BusinessHealthScore,
  ): BusinessExecutiveBrief {
    assertMatchingContext(snapshot, healthScore)

    return buildBusinessExecutiveBrief({
      snapshot,
      healthScore,
    })
  }
}
