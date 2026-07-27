import type { BusinessRepository } from '../../business'
import type { BusinessProductPeriod } from '../../business/entities/productPeriod'
import type {
  ProductDecisionModel,
  ProductLostCustomer,
  ProductPeriodMetrics,
  ProductRiskLevel,
} from './productDecisionTypes'

function toMetrics(item: BusinessProductPeriod): ProductPeriodMetrics {
  return {
    periodId: item.periodId,
    revenue: item.revenue,
    grossProfit: item.grossProfit,
    quantity: item.quantity,
    documents: item.documents,
    customers: item.customers.size,
  }
}

function emptyMetrics(periodId: string): ProductPeriodMetrics {
  return { periodId, revenue: 0, grossProfit: 0, quantity: 0, documents: 0, customers: 0 }
}

function monthsBetween(fromPeriodId: string, toPeriodId: string): number {
  const [fy, fm] = fromPeriodId.split('-').map(Number)
  const [ty, tm] = toPeriodId.split('-').map(Number)
  if (!fy || !fm || !ty || !tm) return 0
  return Math.max(0, ty * 12 + tm - (fy * 12 + fm))
}

function resolveRisk(inactiveMonths: number, currentRevenue: number, previousRevenue: number): {
  level: ProductRiskLevel
  label: string
  probability: number
} {
  if (inactiveMonths >= 3) return { level: 'critical', label: 'Riesgo crítico', probability: 35 }
  if (inactiveMonths >= 2) return { level: 'high', label: 'Riesgo alto', probability: 55 }
  if (inactiveMonths === 1) return { level: 'medium', label: 'Atención', probability: 72 }
  if (previousRevenue > 0 && currentRevenue < previousRevenue * 0.65) {
    return { level: 'medium', label: 'Contracción comercial', probability: 76 }
  }
  return { level: 'low', label: 'Producto activo', probability: 88 }
}

export class ProductDecisionEngine {
  private readonly repository: BusinessRepository

  constructor(repository: BusinessRepository) {
    this.repository = repository
  }

  evaluate(productId: string, currentPeriodId: string): ProductDecisionModel | null {
    const product = this.repository.findProduct(productId)
    if (!product) return null

    const timelineSource = this.repository.product.findTimeline(product.id)
    const timeline = timelineSource.map(toMetrics)
    const currentSource = this.repository.product.findPeriod(product.id, currentPeriodId)
    const current = currentSource ? toMetrics(currentSource) : emptyMetrics(currentPeriodId)
    const previousSource = timelineSource.filter((item) => item.periodId < currentPeriodId).at(-1)
    const previous = previousSource ? toMetrics(previousSource) : null

    const lastActivePeriodId = [...timeline].reverse().find((item) => item.revenue > 0)?.periodId ?? null
    const inactiveMonths = lastActivePeriodId ? monthsBetween(lastActivePeriodId, currentPeriodId) : 0
    const risk = resolveRisk(inactiveMonths, current.revenue, previous?.revenue ?? 0)
    const totalRevenue = timeline.reduce((sum, item) => sum + item.revenue, 0)
    const totalGrossProfit = timeline.reduce((sum, item) => sum + item.grossProfit, 0)

    const activeCustomerIds = [...(currentSource?.customers ?? new Set<string>())]
    const dataPeriodEnd = this.repository.getDataPeriodEnd()
    const completedPeriodIds = this.repository
      .getPeriods()
      .filter((period) => !dataPeriodEnd || period.periodEnd <= dataPeriodEnd)
      .map((period) => period.id)
      .sort((a, b) => a.localeCompare(b))
    const inactivityPeriodIds = completedPeriodIds.slice(-2)
    const basePeriodId = completedPeriodIds.at(-3) ?? null
    const basePeriod = basePeriodId
      ? timelineSource.find((item) => item.periodId === basePeriodId)
      : undefined
    const inactiveCustomers = new Set<string>()
    for (const periodId of inactivityPeriodIds) {
      const period = timelineSource.find((item) => item.periodId === periodId)
      for (const customerId of period?.customers ?? []) inactiveCustomers.add(customerId)
    }
    const estimatedRevenuePerCustomer = basePeriod && basePeriod.customers.size > 0
      ? basePeriod.revenue / basePeriod.customers.size
      : 0

    const lostCustomers: ProductLostCustomer[] = []
    if (basePeriod && inactivityPeriodIds.length === 2) {
      for (const customerId of basePeriod.customers) {
        if (inactiveCustomers.has(customerId)) continue
        const customer = this.repository.findCustomer(customerId)
        const recoveryProbability = inactiveMonths >= 2 ? 55 : 72
        lostCustomers.push({
          customerId,
          customerName: customer?.name ?? customerId,
          estimatedBaseRevenue: estimatedRevenuePerCustomer,
          recoveryProbability,
          expectedImpact: estimatedRevenuePerCustomer * (recoveryProbability / 100),
        })
      }
    }
    lostCustomers.sort((a, b) => b.expectedImpact - a.expectedImpact)

    const recoveryPotential = lostCustomers.reduce((sum, item) => sum + item.expectedImpact, 0)
    const diagnosis = inactiveMonths >= 2
      ? `${product.model} no registra venta durante ${inactiveMonths} meses y requiere una estrategia de reactivación.`
      : current.revenue < (previous?.revenue ?? 0)
        ? `${product.model} presenta contracción frente al periodo anterior y pérdida de clientes activos.`
        : `${product.model} mantiene actividad comercial dentro de ${product.brand}.`
    const recommendedAction = lostCustomers.length > 0
      ? `Priorizar la recuperación de ${lostCustomers.length} clientes que dejaron de comprar este producto.`
      : 'Monitorear venta, margen y penetración por cliente para sostener el ritmo comercial.'

    return {
      id: `product-decision::${product.id}::${currentPeriodId}`,
      generatedAt: new Date().toISOString(),
      productId: product.id,
      productName: product.model,
      brandId: product.brand.trim().toLocaleUpperCase('es-MX'),
      brandName: product.brand,
      currentPeriodId,
      current,
      previous,
      totalRevenue,
      totalGrossProfit,
      grossMargin: totalRevenue > 0 ? totalGrossProfit / totalRevenue : null,
      lastActivePeriodId,
      inactiveMonths,
      riskLevel: risk.level,
      riskLabel: risk.label,
      recoveryProbability: risk.probability,
      recoveryPotential,
      activeCustomerIds,
      lostCustomers: lostCustomers.slice(0, 25),
      timeline,
      diagnosis,
      recommendedAction,
    }
  }
}
