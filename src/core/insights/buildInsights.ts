import type {
  CustomerIntelligenceSummary,
} from '../analytics/customers'

import type {
  BusinessInsight,
} from './insightTypes'

export function buildInsights(
  customers:
    CustomerIntelligenceSummary | null,
): BusinessInsight[] {
  if (!customers) {
    return []
  }

  const insights: BusinessInsight[] =
    []

  if (
    customers.customersRequiringAttention >
    0
  ) {
    insights.push({
      id: 'customers-attention',

      title:
        'Clientes que requieren atención',

      description: `Existen ${customers.customersRequiringAttention.toLocaleString(
        'es-MX',
      )} clientes que requieren seguimiento.`,

      severity: 'warning',

      category: 'customers',

      priority: 1,

      generatedAt:
        new Date().toISOString(),
    })
  }

  if (
    customers.newCustomers >
    0
  ) {
    insights.push({
      id: 'customers-new',

      title:
        'Clientes nuevos',

      description: `Se detectaron ${customers.newCustomers.toLocaleString(
        'es-MX',
      )} clientes nuevos.`,

      severity: 'success',

      category: 'customers',

      priority: 2,

      generatedAt:
        new Date().toISOString(),
    })
  }

  return insights
}