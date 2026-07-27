import type {
  BusinessBrandSnapshot,
} from '../snapshots'

import {
  buildBusinessHealthComponents,
} from './healthComponents'

import {
  classifyBusinessHealthScore,
} from './healthClassification'

import {
  buildBusinessHealthRecommendations,
} from './healthRecommendations'

import type {
  BusinessHealthScore,
} from './healthScore'

import type {
  BusinessHealthScoreOptions,
} from './healthScoreOptions'

import {
  defaultBusinessHealthWeights,
  validateBusinessHealthWeights,
} from './healthWeights'

import type {
  BusinessHealthWeights,
} from './healthWeights'

function resolveWeights(
  options: BusinessHealthScoreOptions,
): BusinessHealthWeights {
  const weights: BusinessHealthWeights = {
    ...defaultBusinessHealthWeights,
    ...options.weights,
  }

  validateBusinessHealthWeights(weights)

  return Object.freeze(weights)
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10
}

export class BusinessHealthScoreEngine {
  calculate(
    snapshot: BusinessBrandSnapshot,
    options: BusinessHealthScoreOptions = {},
  ): BusinessHealthScore {
    const weights = resolveWeights(options)
    const components =
      buildBusinessHealthComponents(
        snapshot,
        weights,
        options.benchmarks,
      )

    const evaluated = components.filter(
      (component) =>
        component.normalizedScore !== null &&
        component.weight > 0,
    )

    const evaluatedWeight = evaluated.reduce(
      (sum, component) =>
        sum + component.weight,
      0,
    )

    const totalConfiguredWeight =
      Object.values(weights).reduce(
        (sum, weight) => sum + weight,
        0,
      )

    const weightedScore = evaluated.reduce(
      (sum, component) =>
        sum +
        (component.normalizedScore ?? 0) *
          component.weight,
      0,
    )

    const score =
      evaluatedWeight === 0
        ? null
        : roundScore(
            weightedScore / evaluatedWeight,
          )

    return {
      id: `${snapshot.id}::health`,
      snapshotId: snapshot.id,
      entityType: 'brand',
      generatedAt: snapshot.generatedAt,
      score,
      evaluatedWeight,
      totalConfiguredWeight,
      classification:
        classifyBusinessHealthScore(score),
      components,
      recommendations:
        buildBusinessHealthRecommendations(
          components,
        ),
      weights,
    }
  }
}
