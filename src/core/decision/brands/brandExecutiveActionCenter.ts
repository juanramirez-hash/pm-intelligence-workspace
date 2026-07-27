import type {
  BrandDecisionModel,
} from './brandDecisionTypes'

import type {
  BrandActionUrgency,
  BrandPrioritizedAction,
} from './brandCommercialIntelligence'

export type BrandExecutiveAgendaItemType =
  | 'customer'
  | 'product'
  | 'commercial'

export interface BrandExecutiveAgendaItem {
  rank: number
  type: BrandExecutiveAgendaItemType
  entityId: string | null
  entityName: string
  title: string
  description: string
  urgency: BrandActionUrgency
  probability: number
  estimatedRevenueImpact: number | null
  impactScore: number
  evidence: readonly string[]
}

export interface BrandRecoveryPotential {
  revenueGap: number | null
  recoverableCustomerRevenue: number
  expectedCustomerRecovery: number
  coverageOfGap: number | null
  customersAvailable: number
  productsAvailable: number
}

export interface BrandDailyBrief {
  greeting: string
  headline: string
  situation: string
  objective: string
  recommendation: string
  closing: string
}

export interface BrandExecutiveActionCenter {
  generatedAt: string
  status: 'ready' | 'limited'
  recovery: BrandRecoveryPotential
  dailyBrief: BrandDailyBrief
  agenda: readonly BrandExecutiveAgendaItem[]
  topActions: readonly BrandPrioritizedAction[]
}

type ActionCenterInput = Omit<
  BrandDecisionModel,
  'actionCenter'
>

function clamp(
  value: number,
  minimum = 0,
  maximum = 100,
): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function round(
  value: number,
): number {
  return Math.round(value * 10) / 10
}

function urgencyFromScore(
  score: number,
): BrandActionUrgency {
  if (score >= 90) return 'immediate'
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

function buildCustomerAgenda(
  decision: ActionCenterInput,
): BrandExecutiveAgendaItem[] {
  return decision.lostCustomers
    .slice(0, 5)
    .map((customer, index) => {
      const probability = clamp(
        55 +
          Math.min(25, customer.previousDocuments * 2) +
          Math.min(15, customer.previousRevenue > 0 ? 10 : 0),
      )
      const expectedImpact =
        customer.previousRevenue *
        (probability / 100)
      const impactScore = clamp(
        55 +
          probability * 0.25 +
          Math.min(20, customer.previousRevenue > 0 ? 15 : 0),
      )

      return {
        rank: index + 1,
        type: 'customer' as const,
        entityId: customer.customerId,
        entityName: customer.customerName,
        title: `Recuperar ${customer.customerName}`,
        description:
          `Cliente sin recompra durante dos meses completos. Venta base ${customer.previousRevenue.toFixed(2)}.`,
        urgency: urgencyFromScore(impactScore),
        probability: round(probability),
        estimatedRevenueImpact: round(expectedImpact),
        impactScore: round(impactScore),
        evidence: [
          'lost-customers',
          `base-revenue:${customer.previousRevenue}`,
          `documents:${customer.previousDocuments}`,
        ],
      }
    })
}

function buildProductAgenda(
  decision: ActionCenterInput,
): BrandExecutiveAgendaItem[] {
  return decision.lostProducts
    .slice(0, 3)
    .map((product, index) => {
      const impactScore = 52 - index * 2

      return {
        rank: index + 1,
        type: 'product' as const,
        entityId: product.productId,
        entityName: product.productModel,
        title: `Reactivar ${product.productModel}`,
        description:
          'Producto sin venta durante dos meses completos; revisar inventario, precio, sustitutos y demanda.',
        urgency: urgencyFromScore(impactScore),
        probability: 50,
        estimatedRevenueImpact: null,
        impactScore,
        evidence: [
          'lost-products',
          product.productId,
        ],
      }
    })
}

function buildCommercialAgenda(
  decision: ActionCenterInput,
): BrandExecutiveAgendaItem[] {
  return decision.prioritizedActions
    .slice(0, 3)
    .map((action) => ({
      rank: action.rank,
      type: 'commercial' as const,
      entityId: null,
      entityName: decision.brandName,
      title: action.title,
      description: action.description,
      urgency: action.urgency,
      probability: action.probability,
      estimatedRevenueImpact:
        action.estimatedRevenueImpact,
      impactScore: action.impactScore,
      evidence: action.evidence,
    }))
}

function buildAgenda(
  decision: ActionCenterInput,
): BrandExecutiveAgendaItem[] {
  const candidates = [
    ...buildCustomerAgenda(decision),
    ...buildProductAgenda(decision),
    ...buildCommercialAgenda(decision),
  ]

  return candidates
    .sort(
      (itemA, itemB) =>
        itemB.impactScore - itemA.impactScore ||
        itemB.probability - itemA.probability ||
        itemA.title.localeCompare(itemB.title),
    )
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))
}

function buildRecovery(
  decision: ActionCenterInput,
): BrandRecoveryPotential {
  const revenueGap = decision.forecast.revenueGap
  const recoverableCustomerRevenue =
    decision.lostCustomers.reduce(
      (total, customer) =>
        total + customer.previousRevenue,
      0,
    )
  const expectedCustomerRecovery =
    recoverableCustomerRevenue * 0.65
  const coverageOfGap =
    revenueGap === null
      ? null
      : revenueGap <= 0
        ? 1
        : Math.min(
            1,
            expectedCustomerRecovery / revenueGap,
          )

  return {
    revenueGap,
    recoverableCustomerRevenue:
      round(recoverableCustomerRevenue),
    expectedCustomerRecovery:
      round(expectedCustomerRecovery),
    coverageOfGap:
      coverageOfGap === null
        ? null
        : round(coverageOfGap),
    customersAvailable:
      decision.lostCustomers.length,
    productsAvailable:
      decision.lostProducts.length,
  }
}

function buildDailyBrief(
  decision: ActionCenterInput,
  recovery: BrandRecoveryPotential,
  agenda: readonly BrandExecutiveAgendaItem[],
): BrandDailyBrief {
  const probability =
    decision.forecast.achievementProbability
  const gap = recovery.revenueGap
  const topAgenda = agenda[0]

  return {
    greeting:
      `Briefing ejecutivo de ${decision.brandName}.`,
    headline:
      probability === null
        ? 'La probabilidad de cumplimiento aún no puede evaluarse.'
        : `La probabilidad estimada de cumplir la cuota es ${probability}%.`,
    situation:
      gap === null
        ? decision.aiSummary.diagnosis
        : gap <= 0
          ? 'La marca ya alcanzó el objetivo de venta del periodo.'
          : `La brecha restante de venta requiere acelerar el ritmo comercial durante los días laborables disponibles.`,
    objective:
      recovery.coverageOfGap === null
        ? 'Mantener seguimiento de venta, GP, margen y actividad comercial.'
        : `La recuperación esperada de clientes podría cubrir ${(recovery.coverageOfGap * 100).toFixed(1)}% de la brecha de venta.`,
    recommendation:
      topAgenda
        ? `Prioridad de hoy: ${topAgenda.title}.`
        : decision.aiSummary.nextStep,
    closing:
      `Agenda preparada con ${agenda.length} acciones explicables y auditables.`,
  }
}

export function buildBrandExecutiveActionCenter(
  decision: ActionCenterInput,
): BrandExecutiveActionCenter {
  const recovery = buildRecovery(decision)
  const agenda = buildAgenda(decision)

  return {
    generatedAt: decision.generatedAt,
    status:
      decision.forecast.revenueTarget === null
        ? 'limited'
        : 'ready',
    recovery,
    dailyBrief: buildDailyBrief(
      decision,
      recovery,
      agenda,
    ),
    agenda,
    topActions:
      decision.prioritizedActions.slice(0, 5),
  }
}
