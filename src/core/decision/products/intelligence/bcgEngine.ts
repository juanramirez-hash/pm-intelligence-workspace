import type { ProductBCGModel } from './productIntelligenceTypes'

export function evaluateBCG(input: {
  revenueVariation: number | null
  penetrationScore: number
  recurrenceScore: number
}): ProductBCGModel {
  const growthScore = input.revenueVariation === null
    ? 50
    : Math.max(0, Math.min(100, Math.round(50 + input.revenueVariation * 100)))
  const positionScore = Math.round(input.penetrationScore * 0.7 + input.recurrenceScore * 0.3)
  const highGrowth = growthScore >= 60
  const highPosition = positionScore >= 65
  const classification = highGrowth && highPosition
    ? 'star'
    : !highGrowth && highPosition
      ? 'cash-cow'
      : highGrowth && !highPosition
        ? 'question-mark'
        : 'dog'
  const labels = {
    star: 'Estrella',
    'cash-cow': 'Vaca lechera',
    'question-mark': 'Interrogante',
    dog: 'Baja prioridad',
    unclassified: 'Sin clasificación',
  } as const

  return {
    classification,
    label: labels[classification],
    growthScore,
    penetrationScore: positionScore,
    rationale: `Crecimiento ${growthScore}/100 y posición comercial ${positionScore}/100.`,
    confidence: input.revenueVariation === null ? 62 : 82,
  }
}
