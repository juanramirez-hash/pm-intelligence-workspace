import type {
  BusinessNarrativeContext,
  BusinessNarrativeItem,
} from './narrativeTypes'

export function buildExecutiveOpportunities(
  context: BusinessNarrativeContext,
): readonly BusinessNarrativeItem[] {
  const { snapshot } = context
  const opportunities: BusinessNarrativeItem[] = []

  if (
    snapshot.attainment.revenuePace
      .projectedPeriodEnd !== null &&
    snapshot.target.revenue !== null &&
    snapshot.attainment.revenuePace
      .projectedPeriodEnd > snapshot.target.revenue
  ) {
    opportunities.push({
      code: 'brief.opportunity.inventory-readiness',
      category: 'forecast',
      severity: 'positive',
      title: 'Preparar capacidad para capturar el cierre',
      description:
        'El forecast superior a la meta permite revisar inventario, disponibilidad y continuidad de abastecimiento.',
    })
  }

  if (
    snapshot.actuals.customers > 0 &&
    snapshot.actuals.products > 0
  ) {
    opportunities.push({
      code: 'brief.opportunity.cross-sell',
      category: 'products',
      severity: 'neutral',
      title: 'Profundizar venta cruzada',
      description:
        'La base activa de clientes y productos permite buscar mayor penetración por cuenta mediante venta cruzada.',
    })
  }

  if (
    snapshot.attainment.grossMargin.attainment !== null &&
    snapshot.attainment.grossMargin.attainment >= 1 &&
    snapshot.attainment.revenue.attainment !== null &&
    snapshot.attainment.revenue.attainment < 1
  ) {
    opportunities.push({
      code: 'brief.opportunity.volume-with-margin',
      category: 'margin',
      severity: 'positive',
      title: 'Acelerar volumen sin sacrificar margen',
      description:
        'El margen se mantiene protegido, por lo que existe espacio para impulsar volumen con disciplina comercial.',
    })
  }

  return opportunities
}
