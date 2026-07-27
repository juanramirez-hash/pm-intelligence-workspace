import type {
  BusinessNarrativeContext,
  BusinessNarrativeItem,
} from './narrativeTypes'

const recommendationTitles: Record<string, string> = {
  revenue: 'Activar plan de recuperación de venta',
  grossProfit: 'Priorizar operaciones con mayor contribución',
  margin: 'Revisar descuentos, costo y mezcla',
  forecast: 'Cerrar la brecha proyectada',
  pace: 'Recuperar el ritmo del periodo',
  customers: 'Reactivar y ampliar clientes compradores',
  products: 'Incrementar productos con venta efectiva',
  trend: 'Atender la tendencia negativa',
}

export function buildExecutiveRecommendations(
  context: BusinessNarrativeContext,
): readonly BusinessNarrativeItem[] {
  const recommendations =
    context.healthScore.recommendations.map(
      (recommendation): BusinessNarrativeItem => ({
        code: `brief.recommendation.${recommendation.componentId}`,
        category:
          recommendation.componentId === 'grossProfit'
            ? 'gross-profit'
            : recommendation.componentId,
        severity:
          recommendation.severity === 'critical'
            ? 'critical'
            : 'attention',
        title:
          recommendationTitles[
            recommendation.componentId
          ] ?? 'Revisar indicador',
        description: recommendation.message,
      }),
    )

  if (recommendations.length === 0) {
    return [{
      code: 'brief.recommendation.maintain',
      category: 'general',
      severity: 'positive',
      title: 'Mantener disciplina comercial',
      description:
        'Conservar el ritmo actual y monitorear semanalmente venta, GP, margen y forecast.',
    }]
  }

  return recommendations
}
