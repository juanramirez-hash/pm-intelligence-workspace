import {
  formatBusinessCurrency,
  formatBusinessNumber,
  formatBusinessPercent,
} from '../../business'
import type { ProductDecisionModel } from './productDecisionTypes'

export interface ProductWorkspaceViewModel {
  id: string
  decision: ProductDecisionModel
  header: {
    productId: string
    productName: string
    brandId: string
    brandName: string
    currentPeriodId: string
  }
  comparison: {
    basePeriodId: string | null
    revenueVariation: number | null
    grossMarginVariation: number | null
    customerDelta: number | null
    quantityVariation: number | null
    healthVariation: number | null
  }
  cards: readonly {
    id: string
    label: string
    value: string
    helper: string
    tone: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose'
  }[]
  intelligence: {
    riskLabel: string
    diagnosis: string
    recommendedAction: string
    lastActivePeriodLabel: string
    recoveryProbabilityLabel: string
    recoveryPotentialLabel: string
  }
  timeline: readonly {
    periodId: string
    revenueLabel: string
    grossProfitLabel: string
    marginLabel: string
    quantityLabel: string
    customersLabel: string
  }[]
  activeCustomers: readonly {
    customerId: string
    customerName: string
  }[]
  lostCustomers: readonly {
    customerId: string
    customerName: string
    estimatedBaseRevenueLabel: string
    probabilityLabel: string
    expectedImpactLabel: string
  }[]
}

export function buildProductWorkspaceViewModel(
  decision: ProductDecisionModel,
  customerNames: ReadonlyMap<string, string>,
): ProductWorkspaceViewModel {
  return {
    id: decision.id,
    decision,
    header: {
      productId: decision.productId,
      productName: decision.productName,
      brandId: decision.brandId,
      brandName: decision.brandName,
      currentPeriodId: decision.currentPeriodId,
    },
    comparison: {
      basePeriodId: decision.previous?.periodId ?? null,
      revenueVariation: decision.revenueVariation,
      grossMarginVariation: decision.grossMarginVariation,
      customerDelta: decision.customerDelta,
      quantityVariation: decision.quantityVariation,
      healthVariation: decision.healthVariation,
    },
    cards: [
      {
        id: 'revenue', label: 'Venta del periodo',
        value: formatBusinessCurrency(decision.current.revenue),
        helper: `Histórico ${formatBusinessCurrency(decision.totalRevenue)}`, tone: 'blue',
      },
      {
        id: 'gross-profit', label: 'GP del periodo',
        value: formatBusinessCurrency(decision.current.grossProfit),
        helper: `Margen ${formatBusinessPercent(decision.current.revenue > 0 ? decision.current.grossProfit / decision.current.revenue : null)}`, tone: 'emerald',
      },
      {
        id: 'customers', label: 'Clientes activos',
        value: formatBusinessNumber(decision.activeCustomerIds.length),
        helper: `${decision.lostCustomers.length} por recuperar`, tone: 'amber',
      },
      {
        id: 'risk', label: 'Riesgo comercial',
        value: decision.riskLabel,
        helper: `${decision.inactiveMonths} meses sin venta`,
        tone: decision.riskLevel === 'critical' ? 'rose' : decision.riskLevel === 'high' ? 'amber' : 'slate',
      },
      {
        id: 'recovery', label: 'Potencial de recuperación',
        value: formatBusinessCurrency(decision.recoveryPotential),
        helper: `Probabilidad ${formatBusinessNumber(decision.recoveryProbability)}%`, tone: 'emerald',
      },
    ],
    intelligence: {
      riskLabel: decision.riskLabel,
      diagnosis: decision.diagnosis,
      recommendedAction: decision.recommendedAction,
      lastActivePeriodLabel: decision.lastActivePeriodId ?? 'Sin actividad registrada',
      recoveryProbabilityLabel: `${formatBusinessNumber(decision.recoveryProbability)}%`,
      recoveryPotentialLabel: formatBusinessCurrency(decision.recoveryPotential),
    },
    timeline: decision.timeline.map((item) => ({
      periodId: item.periodId,
      revenueLabel: formatBusinessCurrency(item.revenue),
      grossProfitLabel: formatBusinessCurrency(item.grossProfit),
      marginLabel: formatBusinessPercent(item.revenue > 0 ? item.grossProfit / item.revenue : null),
      quantityLabel: formatBusinessNumber(item.quantity),
      customersLabel: formatBusinessNumber(item.customers),
    })),
    activeCustomers: decision.activeCustomerIds.map((customerId) => ({
      customerId,
      customerName: customerNames.get(customerId) ?? customerId,
    })),
    lostCustomers: decision.lostCustomers.map((item) => ({
      customerId: item.customerId,
      customerName: item.customerName,
      estimatedBaseRevenueLabel: formatBusinessCurrency(item.estimatedBaseRevenue),
      probabilityLabel: `${formatBusinessNumber(item.recoveryProbability)}%`,
      expectedImpactLabel: formatBusinessCurrency(item.expectedImpact),
    })),
  }
}
