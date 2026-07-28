import {
  formatBusinessCurrency,
  formatBusinessNumber,
  formatBusinessPercent,
} from '../../business'

import type {
  CustomerDecisionModel,
} from './customerDecisionTypes'

export interface CustomerWorkspaceViewModel {
  id: string
  header: {
    customerId: string
    customerName: string
    selectedBrandId: string | null
    selectedBrandName: string
    currentPeriodId: string
    scopeLabel: string
  }
  brandOptions: readonly {
    id: string
    label: string
  }[]
  cards: readonly {
    id: string
    label: string
    value: string
    helper: string
    tone:
      | 'slate'
      | 'blue'
      | 'emerald'
      | 'amber'
      | 'rose'
  }[]
  intelligence: {
    riskLevel: string
    riskLabel: string
    diagnosis: string
    recommendedAction: string
    recoveryProbabilityLabel: string
    recoveryPotentialLabel: string
    lastActivePeriodLabel: string
  }
  timeline: readonly {
    periodId: string
    revenueLabel: string
    grossProfitLabel: string
    marginLabel: string
    productsLabel: string
  }[]
  products: {
    active: readonly string[]
    inactive: readonly string[]
  }
  decision: CustomerDecisionModel
}

export function buildCustomerWorkspaceViewModel(
  decision: CustomerDecisionModel,
): CustomerWorkspaceViewModel {
  return {
    id: decision.id,
    header: {
      customerId: decision.customerId,
      customerName: decision.customerName,
      selectedBrandId:
        decision.selectedBrandId,
      selectedBrandName:
        decision.selectedBrandName,
      currentPeriodId:
        decision.currentPeriodId,
      scopeLabel:
        decision.scope === 'brand'
          ? 'Análisis específico por marca'
          : 'Vista consolidada del cliente',
    },
    brandOptions: [
      {
        id: '',
        label: 'Todas las marcas',
      },
      ...decision.availableBrands.map(
        (brand) => ({
          id: brand.id,
          label: brand.name,
        }),
      ),
    ],
    cards: [
      {
        id: 'revenue',
        label: 'Venta del periodo',
        value: formatBusinessCurrency(
          decision.current.revenue,
        ),
        helper: `Histórico ${formatBusinessCurrency(
          decision.totalRevenue,
        )}`,
        tone: 'blue',
      },
      {
        id: 'gross-profit',
        label: 'GP histórico',
        value: formatBusinessCurrency(
          decision.totalGrossProfit,
        ),
        helper: `Margen ${formatBusinessPercent(
          decision.grossMargin,
        )}`,
        tone: 'emerald',
      },
      {
        id: 'risk',
        label: 'Riesgo de abandono',
        value: decision.riskLabel,
        helper: `${decision.inactiveMonths} meses sin recompra`,
        tone:
          decision.riskLevel === 'critical'
            ? 'rose'
            : decision.riskLevel === 'high'
              ? 'amber'
              : 'slate',
      },
      {
        id: 'probability',
        label: 'Probabilidad de recuperación',
        value: `${formatBusinessNumber(
          decision.recoveryProbability,
        )}%`,
        helper: `Potencial ${formatBusinessCurrency(
          decision.recoveryPotential,
        )}`,
        tone: 'emerald',
      },
      {
        id: 'products',
        label: 'Productos activos',
        value: formatBusinessNumber(
          decision.activeProductIds.length,
        ),
        helper: `${decision.inactiveProductIds.length} abandonados`,
        tone: 'amber',
      },
    ],
    intelligence: {
      riskLevel: decision.riskLevel,
      riskLabel: decision.riskLabel,
      diagnosis: decision.diagnosis,
      recommendedAction:
        decision.recommendedAction,
      recoveryProbabilityLabel:
        `${formatBusinessNumber(
          decision.recoveryProbability,
        )}%`,
      recoveryPotentialLabel:
        formatBusinessCurrency(
          decision.recoveryPotential,
        ),
      lastActivePeriodLabel:
        decision.lastActivePeriodId ??
        'Sin actividad registrada',
    },
    timeline: decision.timeline.map(
      (item) => ({
        periodId: item.periodId,
        revenueLabel:
          formatBusinessCurrency(
            item.revenue,
          ),
        grossProfitLabel:
          formatBusinessCurrency(
            item.grossProfit,
          ),
        marginLabel:
          formatBusinessPercent(
            item.revenue > 0
              ? item.grossProfit /
                item.revenue
              : null,
          ),
        productsLabel:
          formatBusinessNumber(
            item.products,
          ),
      }),
    ),
    products: {
      active:
        decision.activeProductIds,
      inactive:
        decision.inactiveProductIds,
    },
    decision,
  }
}
