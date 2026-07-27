import type {
  BusinessHealthComponent,
  BusinessHealthRecommendation,
} from './healthScore'

const recommendationMessages = {
  revenue:
    'Revisar el plan comercial para recuperar el cumplimiento de venta.',
  grossProfit:
    'Priorizar mezcla y operaciones que eleven la contribución de GP.',
  margin:
    'Revisar descuentos, costo y mezcla para proteger el margen objetivo.',
  forecast:
    'El cierre proyectado requiere acciones adicionales para alcanzar la meta.',
  pace:
    'El avance está por debajo del ritmo esperado del periodo.',
  customers:
    'Ampliar o reactivar la base de clientes compradores de la marca.',
  products:
    'Incrementar la diversidad de productos con venta efectiva.',
  trend:
    'La tendencia contra el periodo anterior requiere seguimiento.',
} as const

export function buildBusinessHealthRecommendations(
  components: readonly BusinessHealthComponent[],
): readonly BusinessHealthRecommendation[] {
  return components
    .filter((component) =>
      component.status === 'risk' ||
      component.status === 'attention',
    )
    .sort((left, right) =>
      (left.normalizedScore ?? 100) -
      (right.normalizedScore ?? 100),
    )
    .map((component) => ({
      code: `health.${component.id}.${component.status}`,
      componentId: component.id,
      severity:
        component.status === 'risk'
          ? 'critical' as const
          : 'attention' as const,
      message:
        recommendationMessages[component.id],
    }))
}
