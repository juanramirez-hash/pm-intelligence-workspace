import type {
  BusinessNarrativeContext,
  BusinessNarrativeItem,
} from './narrativeTypes'

import {
  formatNarrativePercent,
} from './languageRules'

export function buildExecutiveHighlights(
  context: BusinessNarrativeContext,
): readonly BusinessNarrativeItem[] {
  const { snapshot, healthScore } = context
  const highlights: BusinessNarrativeItem[] = []

  if (
    healthScore.score !== null &&
    healthScore.score >= 70
  ) {
    highlights.push({
      code: 'brief.health.healthy',
      category: 'general',
      severity: 'positive',
      title: 'Salud comercial favorable',
      description:
        `La marca registra un Health Score de ${healthScore.score} (${healthScore.classification.label}).`,
    })
  }

  if (
    snapshot.attainment.revenuePace
      .projectedPeriodEnd !== null &&
    snapshot.target.revenue !== null &&
    snapshot.attainment.revenuePace
      .projectedPeriodEnd >= snapshot.target.revenue
  ) {
    highlights.push({
      code: 'brief.forecast.target-reached',
      category: 'forecast',
      severity: 'positive',
      title: 'Forecast sobre objetivo',
      description:
        'La proyección lineal de cierre alcanza o supera el objetivo mensual de venta.',
    })
  }

  if (
    snapshot.attainment.grossMargin.attainment !== null &&
    snapshot.attainment.grossMargin.attainment >= 1
  ) {
    highlights.push({
      code: 'brief.margin.on-target',
      category: 'margin',
      severity: 'positive',
      title: 'Margen protegido',
      description:
        `El margen actual cumple ${formatNarrativePercent(snapshot.attainment.grossMargin.attainment)} del objetivo declarado.`,
    })
  }

  if (
    snapshot.attainment.revenuePace.attainmentToPlan !== null &&
    snapshot.attainment.revenuePace.attainmentToPlan >= 1
  ) {
    highlights.push({
      code: 'brief.pace.ahead',
      category: 'pace',
      severity: 'positive',
      title: 'Ritmo comercial suficiente',
      description:
        'La venta acumulada se mantiene al nivel o por encima del avance esperado para el periodo.',
    })
  }

  return highlights
}
