import type { BusinessProductPeriod } from '../../../business/entities/productPeriod'
import type { ProductCustomerConcentration } from './productIntelligenceTypes'

export function evaluateCustomerConcentration(periods: readonly BusinessProductPeriod[]): ProductCustomerConcentration {
  const revenueByCustomer = new Map<string, number>()
  for (const period of periods) {
    const customers = [...period.customers]
    if (customers.length === 0 || period.revenue <= 0) continue
    const estimatedRevenue = period.revenue / customers.length
    for (const customerId of customers) {
      revenueByCustomer.set(customerId, (revenueByCustomer.get(customerId) ?? 0) + estimatedRevenue)
    }
  }

  const values = [...revenueByCustomer.values()].sort((a, b) => b - a)
  const total = values.reduce((sum, value) => sum + value, 0)
  const topCustomerShare = total > 0 ? values[0] / total : null
  const topFiveShare = total > 0 ? values.slice(0, 5).reduce((sum, value) => sum + value, 0) / total : null
  const top = topCustomerShare ?? 0
  const risk = total <= 0
    ? 'unknown'
    : top >= 0.70
      ? 'critical'
      : top >= 0.50
        ? 'high'
        : top >= 0.30
          ? 'medium'
          : 'low'

  const labels = {
    critical: 'Dependencia crítica',
    high: 'Dependencia alta',
    medium: 'Concentración moderada',
    low: 'Base diversificada',
    unknown: 'Sin datos suficientes',
  } as const

  return {
    topCustomerShare,
    topFiveShare,
    customerCount: revenueByCustomer.size,
    risk,
    label: labels[risk],
    confidence: total > 0 ? 76 : 35,
    evidence: [
      `Clientes acumulados: ${revenueByCustomer.size}`,
      `Participación estimada del principal cliente: ${topCustomerShare === null ? 'sin dato' : `${(topCustomerShare * 100).toFixed(1)}%`}`,
      `Participación estimada Top 5: ${topFiveShare === null ? 'sin dato' : `${(topFiveShare * 100).toFixed(1)}%`}`,
    ],
  }
}
