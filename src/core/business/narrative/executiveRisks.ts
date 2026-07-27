import type {
  BusinessHealthComponentId,
} from '../health'

import type {
  BusinessNarrativeContext,
  BusinessNarrativeItem,
} from './narrativeTypes'

const riskCopy: Record<
  BusinessHealthComponentId,
  { title: string; description: string }
> = {
  revenue: {
    title: 'Cumplimiento de venta insuficiente',
    description:
      'La venta acumulada permanece por debajo del objetivo comercial declarado.',
  },
  grossProfit: {
    title: 'Contribución de GP bajo presión',
    description:
      'El GP acumulado no alcanza el nivel requerido para el periodo.',
  },
  margin: {
    title: 'Margen por debajo del objetivo',
    description:
      'El margen actual requiere revisión de descuentos, costo o mezcla de producto.',
  },
  forecast: {
    title: 'Cierre proyectado por debajo de meta',
    description:
      'La proyección lineal indica riesgo de incumplimiento al cierre del periodo.',
  },
  pace: {
    title: 'Ritmo comercial rezagado',
    description:
      'El avance acumulado es menor al esperado conforme a los días laborales transcurridos.',
  },
  customers: {
    title: 'Cobertura de clientes limitada',
    description:
      'La base activa de compradores se encuentra por debajo del benchmark configurado.',
  },
  products: {
    title: 'Diversidad de productos limitada',
    description:
      'La cantidad de productos con venta efectiva está por debajo del benchmark configurado.',
  },
  trend: {
    title: 'Tendencia desfavorable',
    description:
      'La evolución de ventas contra el periodo de referencia requiere seguimiento.',
  },
}

export function buildExecutiveRisks(
  context: BusinessNarrativeContext,
): readonly BusinessNarrativeItem[] {
  const risks = context.healthScore.components
    .filter((component) =>
      component.status === 'risk' ||
      component.status === 'attention',
    )
    .map((component): BusinessNarrativeItem => ({
      code: `brief.risk.${component.id}.${component.status}`,
      category:
        component.id === 'grossProfit'
          ? 'gross-profit'
          : component.id,
      severity:
        component.status === 'risk'
          ? 'critical'
          : 'attention',
      ...riskCopy[component.id],
    }))

  if (!context.snapshot.hasTarget) {
    risks.push({
      code: 'brief.risk.missing-target',
      category: 'data-quality',
      severity: 'attention',
      title: 'Objetivo comercial no disponible',
      description:
        'El periodo no cuenta con un objetivo declarado; cumplimiento, ritmo y forecast pueden quedar sin evaluación.',
    })
  }

  return risks
}
