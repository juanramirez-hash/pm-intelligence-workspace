import type { BusinessRepository } from '../../business'
import type { BusinessProductPeriod } from '../../business/entities/productPeriod'
import { buildBusinessProductDNA } from './intelligence'
import {
  commercialStatusLabel,
  lifecycleLabel,
  penetrationInterpretation,
  penetrationScore,
  resolveLifecycle,
} from './productDecisionRules'
import type {
  ProductCommercialStatus,
  ProductDecisionModel,
  ProductDecisionSignal,
  ProductHealthComponent,
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

function variation(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 1 : null
  return (current - previous) / Math.abs(previous)
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function resolveRisk(
  isNewProduct: boolean,
  inactiveMonths: number,
  revenueVariation: number | null,
): { level: ProductRiskLevel; label: string; probability: number } {
  if (isNewProduct) return { level: 'low', label: 'Producto en lanzamiento', probability: 82 }
  if (inactiveMonths >= 3) return { level: 'critical', label: 'Riesgo crítico', probability: 35 }
  if (inactiveMonths >= 2) return { level: 'high', label: 'Riesgo alto', probability: 55 }
  if (inactiveMonths === 1) return { level: 'medium', label: 'Atención', probability: 72 }
  if (revenueVariation !== null && revenueVariation <= -0.35) {
    return { level: 'medium', label: 'Contracción comercial', probability: 76 }
  }
  return { level: 'low', label: 'Producto activo', probability: 88 }
}

function healthLabel(score: number, isNewProduct: boolean): string {
  if (isNewProduct) return 'En desarrollo'
  if (score >= 80) return 'Sólido'
  if (score >= 65) return 'Estable'
  if (score >= 45) return 'Atención'
  return 'Crítico'
}

function buildHealthComponents(input: {
  inactiveMonths: number
  revenueVariation: number | null
  commercialStatus: ProductCommercialStatus
  activePeriods: number
  totalPeriods: number
  grossMargin: number | null
}): ProductHealthComponent[] {
  const activityScore = input.inactiveMonths === 0 ? 100 : input.inactiveMonths === 1 ? 65 : input.inactiveMonths === 2 ? 35 : 10
  const trendScore = input.revenueVariation === null
    ? 55
    : clamp(55 + input.revenueVariation * 100)
  const recurrenceScore = input.totalPeriods > 0
    ? clamp((input.activePeriods / input.totalPeriods) * 100)
    : 0
  const marginScore = input.grossMargin === null
    ? 50
    : clamp((input.grossMargin / 0.30) * 100)

  return [
    { id: 'activity', label: 'Actividad reciente', score: activityScore, weight: 0.25, explanation: input.inactiveMonths === 0 ? 'Registra venta en el periodo actual.' : `Acumula ${input.inactiveMonths} meses sin venta.` },
    { id: 'trend', label: 'Tendencia', score: trendScore, weight: 0.25, explanation: input.revenueVariation === null ? 'No existe base comparable suficiente.' : `Variación de venta de ${(input.revenueVariation * 100).toFixed(1)}%.` },
    { id: 'penetration', label: 'Penetración', score: penetrationScore(input.commercialStatus), weight: 0.20, explanation: penetrationInterpretation(input.commercialStatus) },
    { id: 'recurrence', label: 'Recurrencia', score: recurrenceScore, weight: 0.15, explanation: `Activo en ${input.activePeriods} de ${input.totalPeriods} periodos analizados.` },
    { id: 'margin', label: 'Margen', score: marginScore, weight: 0.15, explanation: input.grossMargin === null ? 'Sin margen calculable.' : `Margen acumulado de ${(input.grossMargin * 100).toFixed(1)}%.` },
  ]
}

function signal(input: ProductDecisionSignal): ProductDecisionSignal {
  return input
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
    const revenueVariation = variation(current.revenue, previous?.revenue ?? 0)
    const quantityVariation = variation(current.quantity, previous?.quantity ?? 0)
    const customerVariation = variation(current.customers, previous?.customers ?? 0)
    const customerDelta = previous ? current.customers - previous.customers : null
    const currentGrossMargin = current.revenue > 0 ? current.grossProfit / current.revenue : null
    const previousGrossMargin = previous && previous.revenue > 0
      ? previous.grossProfit / previous.revenue
      : null
    const grossMarginVariation = currentGrossMargin !== null && previousGrossMargin !== null
      ? currentGrossMargin - previousGrossMargin
      : null

    const lastActivePeriodId = [...timeline].reverse().find((item) => item.revenue > 0)?.periodId ?? null
    const inactiveMonths = lastActivePeriodId ? monthsBetween(lastActivePeriodId, currentPeriodId) : 0
    const totalRevenue = timeline.reduce((sum, item) => sum + item.revenue, 0)
    const totalGrossProfit = timeline.reduce((sum, item) => sum + item.grossProfit, 0)
    const grossMargin = totalRevenue > 0 ? totalGrossProfit / totalRevenue : null
    const commercialStatus: ProductCommercialStatus = product.commercialStatus ?? 'unclassified'
    const isNewProduct = commercialStatus === 'E'
    const lifecycleStage = resolveLifecycle(commercialStatus, inactiveMonths, revenueVariation)
    const risk = resolveRisk(isNewProduct, inactiveMonths, revenueVariation)

    const healthComponents = buildHealthComponents({
      inactiveMonths,
      revenueVariation,
      commercialStatus,
      activePeriods: product.activePeriods.size,
      totalPeriods: Math.max(1, this.repository.getPeriods().length),
      grossMargin,
    })
    const healthScore = clamp(healthComponents.reduce((sum, item) => sum + item.score * item.weight, 0))

    const previousPreviousSource = previousSource
      ? timelineSource.filter((item) => item.periodId < previousSource.periodId).at(-1)
      : undefined
    const previousRevenueVariation = previousSource
      ? variation(previousSource.revenue, previousPreviousSource?.revenue ?? 0)
      : null
    const previousLastActivePeriodId = previousSource
      ? [...timelineSource]
          .filter((item) => item.periodId <= previousSource.periodId)
          .reverse()
          .find((item) => item.revenue > 0)?.periodId ?? null
      : null
    const previousInactiveMonths = previousSource && previousLastActivePeriodId
      ? monthsBetween(previousLastActivePeriodId, previousSource.periodId)
      : 0
    const previousTimeline = previousSource
      ? timelineSource.filter((item) => item.periodId <= previousSource.periodId)
      : []
    const previousTotalRevenue = previousTimeline.reduce((sum, item) => sum + item.revenue, 0)
    const previousTotalGrossProfit = previousTimeline.reduce((sum, item) => sum + item.grossProfit, 0)
    const previousCumulativeMargin = previousTotalRevenue > 0
      ? previousTotalGrossProfit / previousTotalRevenue
      : null
    const previousActivePeriods = previousTimeline.filter((item) => item.revenue > 0).length
    const previousHealthComponents = previousSource
      ? buildHealthComponents({
          inactiveMonths: previousInactiveMonths,
          revenueVariation: previousRevenueVariation,
          commercialStatus,
          activePeriods: previousActivePeriods,
          totalPeriods: Math.max(1, previousTimeline.length),
          grossMargin: previousCumulativeMargin,
        })
      : []
    const previousHealthScore = previousSource
      ? clamp(previousHealthComponents.reduce((sum, item) => sum + item.score * item.weight, 0))
      : null
    const healthVariation = previousHealthScore === null ? null : healthScore - previousHealthScore

    const activeCustomerIds = [...(currentSource?.customers ?? new Set<string>())]
    const dataPeriodEnd = this.repository.getDataPeriodEnd()
    const completedPeriodIds = this.repository
      .getPeriods()
      .filter((period) => !dataPeriodEnd || period.periodEnd <= dataPeriodEnd)
      .map((period) => period.id)
      .sort((a, b) => a.localeCompare(b))
    const inactivityPeriodIds = completedPeriodIds.slice(-2)
    const basePeriodId = completedPeriodIds.at(-3) ?? null
    const basePeriod = basePeriodId ? timelineSource.find((item) => item.periodId === basePeriodId) : undefined
    const recentCustomers = new Set<string>()
    for (const periodId of inactivityPeriodIds) {
      const period = timelineSource.find((item) => item.periodId === periodId)
      for (const customerId of period?.customers ?? []) recentCustomers.add(customerId)
    }

    const estimatedRevenuePerCustomer = basePeriod && basePeriod.customers.size > 0
      ? basePeriod.revenue / basePeriod.customers.size
      : 0
    const lostCustomers: ProductLostCustomer[] = []
    if (basePeriod && inactivityPeriodIds.length === 2) {
      for (const customerId of basePeriod.customers) {
        if (recentCustomers.has(customerId)) continue
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

    const risks: ProductDecisionSignal[] = []
    const opportunities: ProductDecisionSignal[] = []
    const recommendations: ProductDecisionSignal[] = []

    if (!isNewProduct && inactiveMonths >= 2) {
      risks.push(signal({ id: 'product-inactivity', category: 'risk', severity: inactiveMonths >= 3 ? 'critical' : 'high', title: 'Inactividad comercial', description: `El SKU acumula ${inactiveMonths} meses sin venta.`, recommendedAction: 'Revisar continuidad, inventario, sustitución y plan de reactivación.', score: clamp(inactiveMonths * 25), expectedImpact: recoveryPotential, confidence: 92, evidence: [`Última venta: ${lastActivePeriodId ?? 'sin dato'}`, `Estatus: ${commercialStatus}`], ruleId: 'P-RISK-001' }))
    }
    if (!isNewProduct && revenueVariation !== null && revenueVariation <= -0.25) {
      risks.push(signal({ id: 'product-decline', category: 'risk', severity: revenueVariation <= -0.5 ? 'high' : 'medium', title: 'Caída de demanda', description: `La venta disminuyó ${Math.abs(revenueVariation * 100).toFixed(1)}% frente al periodo anterior.`, recommendedAction: 'Identificar clientes perdidos, competencia interna y posibles reemplazos.', score: clamp(Math.abs(revenueVariation) * 100), expectedImpact: Math.max(0, (previous?.revenue ?? 0) - current.revenue), confidence: 88, evidence: [`Venta actual: ${current.revenue}`, `Venta anterior: ${previous?.revenue ?? 0}`], ruleId: 'P-RISK-002' }))
    }
    if (!isNewProduct && (commercialStatus === 'C' || commercialStatus === 'D')) {
      opportunities.push(signal({ id: 'penetration-development', category: 'opportunity', severity: commercialStatus === 'D' ? 'high' : 'medium', title: 'Desarrollo de penetración', description: penetrationInterpretation(commercialStatus), recommendedAction: 'Definir clientes objetivo, capacitación, bundles y campaña de adopción.', score: commercialStatus === 'D' ? 82 : 65, expectedImpact: totalRevenue * (commercialStatus === 'D' ? 0.20 : 0.12), confidence: 86, evidence: [`Estatus ABCDE: ${commercialStatus}`, `Clientes activos actuales: ${current.customers}`], ruleId: 'P-OPP-001' }))
    }
    if (commercialStatus === 'B' && revenueVariation !== null && revenueVariation >= 0) {
      opportunities.push(signal({ id: 'move-b-to-a', category: 'opportunity', severity: 'medium', title: 'Potencial de avanzar a A', description: 'El producto tiene buena penetración y comportamiento estable o creciente.', recommendedAction: 'Expandir cobertura en clientes similares y asegurar disponibilidad.', score: 72, expectedImpact: current.revenue * 0.10, confidence: 82, evidence: ['Estatus ABCDE: B', `Variación de venta: ${(revenueVariation * 100).toFixed(1)}%`], ruleId: 'P-OPP-002' }))
    }
    if (isNewProduct) {
      opportunities.push(signal({ id: 'new-product-adoption', category: 'opportunity', severity: 'high', title: 'Acelerar adopción del producto nuevo', description: 'El estatus E identifica un SKU nuevo; la baja penetración inicial no representa deterioro.', recommendedAction: 'Medir primeros clientes, recompra, cobertura por sucursal y velocidad de avance hacia D.', score: 85, expectedImpact: current.revenue * 0.25, confidence: 96, evidence: ['Estatus ABCDE: E', `Periodos activos: ${product.activePeriods.size}`, `Clientes acumulados: ${product.customers.size}`], ruleId: 'P-OPP-003' }))
    }
    if (lostCustomers.length > 0) {
      opportunities.push(signal({ id: 'recover-lost-customers', category: 'opportunity', severity: lostCustomers.length >= 5 ? 'high' : 'medium', title: 'Recuperación de clientes', description: `${lostCustomers.length} clientes dejaron de comprar el producto.`, recommendedAction: 'Priorizar contacto con clientes por impacto esperado y validar sustitución o pérdida competitiva.', score: clamp(50 + lostCustomers.length * 5), expectedImpact: recoveryPotential, confidence: 84, evidence: [`Clientes recuperables: ${lostCustomers.length}`, `Impacto esperado: ${recoveryPotential.toFixed(2)}`], ruleId: 'P-OPP-004' }))
    }

    recommendations.push(...opportunities.map((item) => ({ ...item, id: `recommend-${item.id}`, category: 'recommendation' as const })))
    if (commercialStatus === 'A') {
      recommendations.push(signal({ id: 'protect-a-product', category: 'recommendation', severity: 'high', title: 'Proteger producto de alta penetración', description: 'Una interrupción afectaría a una base amplia de clientes.', recommendedAction: 'Mantener disponibilidad, precio competitivo y seguimiento de forecast.', score: 90, expectedImpact: current.revenue, confidence: 92, evidence: ['Estatus ABCDE: A', `Clientes acumulados: ${product.customers.size}`], ruleId: 'P-REC-001' }))
    }

    const allDecisions = [...risks, ...opportunities, ...recommendations]
      .sort((a, b) => b.score - a.score || b.expectedImpact - a.expectedImpact)
    const topDecision = allDecisions[0] ?? null
    const confidence = clamp(55 + Math.min(30, timeline.length * 4) + (commercialStatus !== 'unclassified' ? 10 : 0))

    const diagnosis = isNewProduct
      ? `${product.model} es un producto nuevo en etapa de lanzamiento; debe evaluarse por adopción y velocidad de desarrollo, no como un SKU de bajo desempeño.`
      : inactiveMonths >= 2
        ? `${product.model} no registra venta durante ${inactiveMonths} meses y requiere una estrategia de reactivación o continuidad.`
        : revenueVariation !== null && revenueVariation < 0
          ? `${product.model} presenta contracción frente al periodo anterior con estatus ${commercialStatus}.`
          : `${product.model} mantiene actividad comercial con estatus ${commercialStatus}.`
    const recommendedAction = topDecision?.recommendedAction
      ?? 'Monitorear venta, margen, recurrencia y penetración por cliente.'

    const dna = buildBusinessProductDNA({
      repository: this.repository,
      productId: product.id,
      inactiveMonths,
      revenueVariation,
      healthScore,
      healthLabel: healthLabel(healthScore, isNewProduct),
      healthComponents,
      timeline,
      risks,
      opportunities,
      recommendations,
    })

    if (!dna) return null

    return {
      id: `product-decision::${product.id}::${currentPeriodId}`,
      generatedAt: new Date().toISOString(),
      productId: product.id,
      productName: product.model,
      sku: product.sku,
      brandId: product.brand.trim().toLocaleUpperCase('es-MX'),
      brandName: product.brand,
      currentPeriodId,
      current,
      previous,
      totalRevenue,
      totalGrossProfit,
      grossMargin,
      revenueVariation,
      grossMarginVariation,
      quantityVariation,
      customerVariation,
      customerDelta,
      previousHealthScore,
      healthVariation,
      lastActivePeriodId,
      inactiveMonths,
      commercialStatus,
      commercialStatusLabel: commercialStatusLabel(commercialStatus),
      penetrationInterpretation: penetrationInterpretation(commercialStatus),
      lifecycleStage,
      lifecycleLabel: lifecycleLabel(lifecycleStage),
      isNewProduct,
      healthScore,
      healthLabel: healthLabel(healthScore, isNewProduct),
      healthComponents,
      riskLevel: risk.level,
      riskLabel: risk.label,
      recoveryProbability: risk.probability,
      recoveryPotential,
      activeCustomerIds,
      lostCustomers: lostCustomers.slice(0, 25),
      risks,
      opportunities,
      recommendations,
      topDecision,
      confidence,
      timeline,
      diagnosis,
      recommendedAction,
      dna,
    }
  }
}
