import {
  buildExecutiveHighlights,
} from './executiveHighlights'

import {
  buildExecutiveOpportunities,
} from './executiveOpportunities'

import {
  buildExecutiveRecommendations,
} from './executiveRecommendations'

import {
  buildExecutiveRisks,
} from './executiveRisks'

import {
  formatNarrativePercent,
  joinNarrativeSentences,
} from './languageRules'

import type {
  BusinessExecutiveBrief,
  BusinessNarrativeContext,
} from './narrativeTypes'

function buildSummary(
  context: BusinessNarrativeContext,
): string {
  const { snapshot, healthScore } = context

  if (!snapshot.hasActual && !snapshot.hasTarget) {
    return 'No existen hechos ni objetivos suficientes para elaborar una lectura ejecutiva del periodo.'
  }

  const sentences: string[] = [
    healthScore.score === null
      ? 'La salud comercial no puede evaluarse con la información disponible.'
      : `La marca presenta un estado ${healthScore.classification.label.toLowerCase()} con Health Score de ${healthScore.score}.`,
  ]

  if (snapshot.attainment.revenue.attainment !== null) {
    sentences.push(
      `La venta acumula ${formatNarrativePercent(snapshot.attainment.revenue.attainment)} del objetivo.`,
    )
  }

  const paceStatus =
    snapshot.attainment.revenuePace.status

  if (
    paceStatus === 'ahead-of-plan' ||
    paceStatus === 'achieved'
  ) {
    sentences.push(
      'El ritmo del periodo y la proyección de cierre son favorables.',
    )
  } else if (paceStatus === 'behind-plan') {
    sentences.push(
      'El ritmo actual exige acciones de recuperación para reducir la brecha contra el plan.',
    )
  }

  if (
    snapshot.attainment.grossMargin.attainment !== null &&
    snapshot.attainment.grossMargin.attainment < 1
  ) {
    sentences.push(
      'El margen permanece por debajo del objetivo y requiere atención.',
    )
  }

  return joinNarrativeSentences(sentences)
}

export function buildBusinessExecutiveBrief(
  context: BusinessNarrativeContext,
): BusinessExecutiveBrief {
  return {
    id: `${context.snapshot.id}::executive-brief`,
    snapshotId: context.snapshot.id,
    healthScoreId: context.healthScore.id,
    entityType: 'brand',
    generatedAt: context.snapshot.generatedAt,
    locale: 'es-MX',
    title:
      `${context.snapshot.brand.name} · ${context.snapshot.periodId}`,
    summary: buildSummary(context),
    health: {
      score: context.healthScore.score,
      grade:
        context.healthScore.classification.grade,
      label:
        context.healthScore.classification.label,
    },
    highlights: buildExecutiveHighlights(context),
    risks: buildExecutiveRisks(context),
    opportunities:
      buildExecutiveOpportunities(context),
    recommendations:
      buildExecutiveRecommendations(context),
  }
}
