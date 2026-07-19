export type RecommendationSeverity = 'critical' | 'high' | 'medium' | 'low'

export type RecommendationCategory =
  | 'forecast'
  | 'inventory'
  | 'pricing'
  | 'sales'
  | 'customers'

export type PulseBusinessData = {
  forecastAchievement: number
  inventoryCoverageDays: number
  grossProfit: number
  salesGrowth: number
  inactiveCustomers: number
  excessInventoryValue: number
}

export type PulseRecommendation = {
  id: string
  category: RecommendationCategory
  severity: RecommendationSeverity
  priorityScore: number
  title: string
  description: string
  action: string
  expectedImpact: string
  destination?: string
}

type Rule = {
  id: string
  condition: (data: PulseBusinessData) => boolean
  createRecommendation: (
    data: PulseBusinessData,
  ) => PulseRecommendation
}

const pulseRules: Rule[] = [
  {
    id: 'forecast-below-90',
    condition: (data) => data.forecastAchievement < 90,
    createRecommendation: (data) => ({
      id: 'forecast-recovery-plan',
      category: 'forecast',
      severity: 'critical',
      priorityScore: 96,
      title: 'Activar plan de recuperación del forecast',
      description: `El cumplimiento proyectado es de ${data.forecastAchievement}%, por debajo del nivel mínimo esperado de 90%.`,
      action:
        'Identifica marcas, clientes y productos con capacidad de cerrar la brecha antes del final del mes.',
      expectedImpact: 'Recuperar entre 5 y 9 puntos de cumplimiento',
      destination: '/forecast',
    }),
  },
  {
    id: 'inventory-over-150-days',
    condition: (data) => data.inventoryCoverageDays > 150,
    createRecommendation: (data) => ({
      id: 'inventory-activation-plan',
      category: 'inventory',
      severity: 'high',
      priorityScore: 92,
      title: 'Ejecutar estrategia de activación de inventario',
      description: `La cobertura promedio alcanzó ${data.inventoryCoverageDays} días, superando el límite recomendado de 150 días.`,
      action:
        'Define promociones, bundles, transferencias o descuentos controlados para los SKUs con menor rotación.',
      expectedImpact: `Liberar inventario por ${formatCurrency(
        data.excessInventoryValue,
      )}`,
      destination: '/inventory',
    }),
  },
  {
    id: 'gross-profit-below-25',
    condition: (data) => data.grossProfit < 25,
    createRecommendation: (data) => ({
      id: 'margin-recovery-plan',
      category: 'pricing',
      severity: 'high',
      priorityScore: 89,
      title: 'Revisar productos con margen debajo del objetivo',
      description: `El Gross Profit actual es de ${data.grossProfit}%, por debajo del objetivo mínimo de 25%.`,
      action:
        'Revisa descuentos, precios especiales, costo de compra y mezcla de productos antes de autorizar nuevas operaciones.',
      expectedImpact: 'Recuperar al menos 2 puntos de margen',
      destination: '/pricing',
    }),
  },
  {
    id: 'negative-sales-growth',
    condition: (data) => data.salesGrowth < 0,
    createRecommendation: (data) => ({
      id: 'sales-recovery-plan',
      category: 'sales',
      severity: 'high',
      priorityScore: 86,
      title: 'Investigar la caída de ventas',
      description: `Las ventas presentan una variación de ${data.salesGrowth}% respecto al periodo comparable.`,
      action:
        'Analiza las marcas, clientes y categorías que explican la contracción y genera un plan de recuperación.',
      expectedImpact: 'Detener la tendencia negativa de ventas',
      destination: '/analytics',
    }),
  },
  {
    id: 'inactive-customers-over-10',
    condition: (data) => data.inactiveCustomers >= 10,
    createRecommendation: (data) => ({
      id: 'customer-reactivation-plan',
      category: 'customers',
      severity: 'medium',
      priorityScore: 78,
      title: 'Activar campaña de recuperación de clientes',
      description: `${data.inactiveCustomers} clientes relevantes dejaron de comprar durante el periodo evaluado.`,
      action:
        'Prioriza clientes por venta perdida, margen histórico y probabilidad de recuperación.',
      expectedImpact: `Recuperar hasta ${Math.ceil(
        data.inactiveCustomers * 0.25,
      )} clientes`,
      destination: '/brands',
    }),
  },
  {
    id: 'positive-sales-growth',
    condition: (data) => data.salesGrowth >= 8,
    createRecommendation: (data) => ({
      id: 'growth-opportunity',
      category: 'sales',
      severity: 'low',
      priorityScore: 62,
      title: 'Acelerar las líneas con mayor crecimiento',
      description: `Las ventas crecen ${data.salesGrowth}% respecto al periodo comparable.`,
      action:
        'Identifica productos y clientes responsables del crecimiento para replicar la estrategia.',
      expectedImpact: 'Sostener el crecimiento durante el cierre mensual',
      destination: '/analytics',
    }),
  },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function evaluatePulseRules(
  data: PulseBusinessData,
): PulseRecommendation[] {
  return pulseRules
    .filter((rule) => rule.condition(data))
    .map((rule) => rule.createRecommendation(data))
    .sort(
      (firstRecommendation, secondRecommendation) =>
        secondRecommendation.priorityScore -
        firstRecommendation.priorityScore,
    )
}