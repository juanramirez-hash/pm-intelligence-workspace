export type OpportunityConfidence = 'high' | 'medium' | 'low'

export type OpportunityCategory =
  | 'sales'
  | 'customers'
  | 'inventory'
  | 'margin'
  | 'forecast'

export type OpportunityBusinessData = {
  brand: string
  salesGrowth: number
  inactiveCustomers: number
  recoverableCustomerValue: number
  excessInventoryValue: number
  forecastGapValue: number
  marginRecoveryValue: number
}

export type BusinessOpportunity = {
  id: string
  brand: string
  category: OpportunityCategory
  title: string
  description: string
  estimatedValue: number
  confidence: OpportunityConfidence
  probability: number
  priorityScore: number
  action: string
  destination: string
}

type OpportunityRule = {
  id: string
  condition: (data: OpportunityBusinessData) => boolean
  createOpportunity: (
    data: OpportunityBusinessData,
  ) => BusinessOpportunity
}

const opportunityRules: OpportunityRule[] = [
  {
    id: 'recover-inactive-customers',
    condition: (data) =>
      data.inactiveCustomers >= 5 &&
      data.recoverableCustomerValue > 0,
    createOpportunity: (data) => ({
      id: `${data.brand}-customer-recovery`,
      brand: data.brand,
      category: 'customers',
      title: 'Recuperación de clientes inactivos',
      description: `${data.inactiveCustomers} clientes presentan potencial de reactivación comercial.`,
      estimatedValue: data.recoverableCustomerValue,
      confidence: 'high',
      probability: 82,
      priorityScore: 94,
      action:
        'Prioriza los clientes por venta histórica, margen y probabilidad de recuperación.',
      destination: '/brands',
    }),
  },
  {
    id: 'activate-excess-inventory',
    condition: (data) => data.excessInventoryValue >= 250000,
    createOpportunity: (data) => ({
      id: `${data.brand}-inventory-activation`,
      brand: data.brand,
      category: 'inventory',
      title: 'Activación de inventario disponible',
      description:
        'El inventario excedente puede convertirse en venta mediante promociones y paquetes comerciales.',
      estimatedValue: data.excessInventoryValue * 0.3,
      confidence: 'medium',
      probability: 68,
      priorityScore: 88,
      action:
        'Construye bundles y promociones para los productos con mejor probabilidad de desplazamiento.',
      destination: '/inventory',
    }),
  },
  {
    id: 'forecast-recovery-opportunity',
    condition: (data) => data.forecastGapValue > 0,
    createOpportunity: (data) => ({
      id: `${data.brand}-forecast-recovery`,
      brand: data.brand,
      category: 'forecast',
      title: 'Recuperación de brecha del forecast',
      description:
        'La brecha puede reducirse concentrando esfuerzos en clientes y productos de alta conversión.',
      estimatedValue: data.forecastGapValue,
      confidence: 'high',
      probability: 76,
      priorityScore: 91,
      action:
        'Identifica las cuentas con mayor capacidad de compra antes del cierre mensual.',
      destination: '/forecast',
    }),
  },
  {
    id: 'margin-recovery-opportunity',
    condition: (data) => data.marginRecoveryValue >= 100000,
    createOpportunity: (data) => ({
      id: `${data.brand}-margin-recovery`,
      brand: data.brand,
      category: 'margin',
      title: 'Recuperación potencial de margen',
      description:
        'Existen operaciones y productos cuyo margen puede mejorar mediante ajustes controlados.',
      estimatedValue: data.marginRecoveryValue,
      confidence: 'medium',
      probability: 64,
      priorityScore: 84,
      action:
        'Revisa descuentos, costos de compra y mezcla comercial antes de modificar precios.',
      destination: '/pricing',
    }),
  },
  {
    id: 'accelerate-positive-growth',
    condition: (data) => data.salesGrowth >= 8,
    createOpportunity: (data) => ({
      id: `${data.brand}-growth-acceleration`,
      brand: data.brand,
      category: 'sales',
      title: 'Acelerar crecimiento comercial',
      description: `${data.brand} registra un crecimiento de ${data.salesGrowth}% y puede ampliar su contribución al cierre.`,
      estimatedValue: Math.max(
        data.recoverableCustomerValue * 0.2,
        150000,
      ),
      confidence: 'high',
      probability: 79,
      priorityScore: 86,
      action:
        'Replica la combinación de productos, clientes y promociones responsables del crecimiento.',
      destination: '/analytics',
    }),
  },
]

export function evaluateOpportunityRules(
  data: OpportunityBusinessData[],
): BusinessOpportunity[] {
  return data
    .flatMap((item) =>
      opportunityRules
        .filter((rule) => rule.condition(item))
        .map((rule) => rule.createOpportunity(item)),
    )
    .sort(
      (firstOpportunity, secondOpportunity) =>
        secondOpportunity.priorityScore -
        firstOpportunity.priorityScore,
    )
}