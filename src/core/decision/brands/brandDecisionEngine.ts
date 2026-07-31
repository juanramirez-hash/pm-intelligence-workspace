import {
  BusinessHealthScoreEngine,
  BusinessNarrativeEngine,
  BusinessSnapshotEngine,
} from '../../business'

import type {
  BusinessBrandPeriod,
} from '../../business/entities/brandPeriod'

import {
  countWeekdaysThroughDate,
} from '../../business/forecast'

import type {
  BusinessRepository,
} from '../../business/repository'

import {
  buildBrandAICommercialSummary,
  buildBrandExecutiveScore,
  buildBrandPrioritizedActions,
} from './brandCommercialIntelligence'

import {
  buildBrandForecastIntelligence,
} from './brandForecastIntelligence'

import {
  buildBrandExecutiveActionCenter,
} from './brandExecutiveActionCenter'

import {
  buildBrandOpportunities,
  buildBrandRecommendedActions,
  buildBrandRisks,
} from './brandDecisionBuilders'

import type {
  BrandCommercialPriority,
  BrandDecisionModel,
  BrandDecisionOptions,
  BrandDecisionReason,
  BrandLostCustomer,
  BrandLostProduct,
  CommercialPriorityLevel,
} from './brandDecisionTypes'

const MAX_PRIORITY_SCORE = 100

function roundScore(
  value: number,
): number {
  return Math.round(value * 10) / 10
}

function clampScore(
  value: number,
): number {
  return Math.min(
    MAX_PRIORITY_SCORE,
    Math.max(0, value),
  )
}

function getPreviousPeriodId(
  periodId: string,
): string {
  const match = /^(\d{4})-(\d{2})$/.exec(
    periodId.trim(),
  )

  if (!match) {
    throw new Error(
      `Invalid business period id: ${periodId}`,
    )
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      `Invalid business period id: ${periodId}`,
    )
  }

  const previousDate = new Date(
    Date.UTC(year, month - 2, 1),
  )

  return [
    previousDate.getUTCFullYear(),
    String(
      previousDate.getUTCMonth() + 1,
    ).padStart(2, '0'),
  ].join('-')
}

function getVariation(
  currentValue: number,
  previousValue: number,
): number | null {
  if (previousValue === 0) {
    return currentValue === 0
      ? 0
      : null
  }

  return (
    currentValue - previousValue
  ) / previousValue
}

function getCompletedPeriodIds(
  repository: BusinessRepository,
): string[] {
  const dataPeriodEnd =
    repository.getDataPeriodEnd()

  if (!dataPeriodEnd) {
    return []
  }

  return repository
    .getPeriods()
    .filter(
      (period) =>
        period.periodEnd <= dataPeriodEnd,
    )
    .sort(
      (periodA, periodB) =>
        periodA.year - periodB.year ||
        periodA.month - periodB.month,
    )
    .map((period) => period.id)
}

function getLossEvaluationWindow(
  repository: BusinessRepository,
): {
  basePeriodId: string | null
  inactivityPeriodIds: readonly string[]
}
{
  const completedPeriodIds =
    getCompletedPeriodIds(repository)

  if (completedPeriodIds.length < 3) {
    return {
      basePeriodId: null,
      inactivityPeriodIds: [],
    }
  }

  return {
    basePeriodId:
      completedPeriodIds.at(-3) ?? null,
    inactivityPeriodIds:
      completedPeriodIds.slice(-2),
  }
}

function getLostCustomers(
  repository: BusinessRepository,
  brandId: string,
  basePeriodId: string | null,
  inactivityPeriodIds: readonly string[],
): BrandLostCustomer[] {
  if (
    !basePeriodId ||
    inactivityPeriodIds.length !== 2
  ) {
    return []
  }

  const basePeriod =
    repository.brand.findPeriod(
      brandId,
      basePeriodId,
    )

  if (!basePeriod) {
    return []
  }

  const inactiveCustomerSets =
    inactivityPeriodIds.map(
      (periodId) =>
        repository.brand.findPeriod(
          brandId,
          periodId,
        )?.customers ?? new Set<string>(),
    )

  return [...basePeriod.customers]
    .filter(
      (customerId) =>
        inactiveCustomerSets.every(
          (customers) =>
            !customers.has(customerId),
        ),
    )
    .map((customerId) => {
      const customerPeriod =
        repository.customer.findPeriod(
          customerId,
          basePeriodId,
        )

      return {
        customerId,
        customerName:
          repository.findCustomer(customerId)
            ?.name ?? customerId,
        previousRevenue:
          customerPeriod?.revenue ?? 0,
        previousGrossProfit:
          customerPeriod?.grossProfit ?? 0,
        previousQuantity:
          customerPeriod?.quantity ?? 0,
        previousDocuments:
          customerPeriod?.documents ?? 0,
      }
    })
    .sort(
      (customerA, customerB) =>
        customerB.previousRevenue -
          customerA.previousRevenue ||
        customerA.customerId.localeCompare(
          customerB.customerId,
        ),
    )
}

function getLostProducts(
  repository: BusinessRepository,
  brandId: string,
  basePeriodId: string | null,
  inactivityPeriodIds: readonly string[],
): BrandLostProduct[] {
  if (
    !basePeriodId ||
    inactivityPeriodIds.length !== 2
  ) {
    return []
  }

  const basePeriod =
    repository.brand.findPeriod(
      brandId,
      basePeriodId,
    )

  if (!basePeriod) {
    return []
  }

  const inactiveProductSets =
    inactivityPeriodIds.map(
      (periodId) =>
        repository.brand.findPeriod(
          brandId,
          periodId,
        )?.products ?? new Set<string>(),
    )

  return [...basePeriod.products]
    .filter(
      (productId) =>
        inactiveProductSets.every(
          (products) =>
            !products.has(productId),
        ),
    )
    .map((productId) => ({
      productId,
      productModel:
        repository.findProduct(productId)
          ?.model ?? productId,
    }))
    .sort(
      (productA, productB) =>
        productA.productModel.localeCompare(
          productB.productModel,
        ),
    )
}

function resolvePriorityLevel(
  score: number,
): CommercialPriorityLevel {
  if (score >= 75) {
    return 'critical'
  }

  if (score >= 50) {
    return 'high'
  }

  if (score >= 25) {
    return 'medium'
  }

  return 'low'
}

function buildPriority(
  currentPeriod:
    BusinessBrandPeriod | undefined,
  previousPeriod:
    BusinessBrandPeriod | undefined,
  revenueAttainment: number | null,
  grossMarginAttainment: number | null,
  lostCustomers: readonly BrandLostCustomer[],
  lostProducts: readonly BrandLostProduct[],
): BrandCommercialPriority {
  const reasons: BrandDecisionReason[] = []

  const currentRevenue =
    currentPeriod?.revenue ?? 0
  const previousRevenue =
    previousPeriod?.revenue ?? 0
  const currentMargin =
    currentRevenue === 0
      ? null
      : (currentPeriod?.grossProfit ?? 0) /
        currentRevenue
  const previousMargin =
    previousRevenue === 0
      ? null
      : (previousPeriod?.grossProfit ?? 0) /
        previousRevenue

  const revenueVariation = getVariation(
    currentRevenue,
    previousRevenue,
  )

  if (
    previousRevenue > 0 &&
    currentRevenue === 0
  ) {
    reasons.push({
      code: 'brand-activity-lost',
      category: 'activity',
      message:
        'La marca perdió toda la actividad comercial frente al periodo anterior.',
      impact: 35,
    })
  } else if (
    revenueVariation !== null &&
    revenueVariation < 0
  ) {
    const decline = Math.abs(
      revenueVariation,
    )

    reasons.push({
      code: 'revenue-decline',
      category: 'revenue',
      message:
        'La venta disminuyó frente al periodo anterior.',
      impact: Math.min(
        25,
        5 + decline * 40,
      ),
    })
  }

  if (
    currentMargin !== null &&
    previousMargin !== null &&
    currentMargin < previousMargin
  ) {
    const deterioration =
      previousMargin - currentMargin

    reasons.push({
      code: 'margin-deterioration',
      category: 'margin',
      message:
        'El margen bruto se deterioró frente al periodo anterior.',
      impact: Math.min(
        15,
        3 + deterioration * 100,
      ),
    })
  }

  if (
    revenueAttainment !== null &&
    revenueAttainment < 1
  ) {
    reasons.push({
      code: 'revenue-below-target',
      category: 'target',
      message:
        'La venta se encuentra por debajo del objetivo del periodo.',
      impact: Math.min(
        20,
        5 + (1 - revenueAttainment) * 20,
      ),
    })
  }

  if (
    grossMarginAttainment !== null &&
    grossMarginAttainment < 1
  ) {
    reasons.push({
      code: 'margin-below-target',
      category: 'target',
      message:
        'El margen bruto se encuentra por debajo del objetivo.',
      impact: Math.min(
        15,
        4 + (1 - grossMarginAttainment) * 15,
      ),
    })
  }

  if (lostCustomers.length > 0) {
    reasons.push({
      code: 'lost-customers',
      category: 'customers',
      message:
        `${lostCustomers.length} ${lostCustomers.length === 1 ? 'cliente dejó' : 'clientes dejaron'} de comprar la marca.`,
      impact: Math.min(
        15,
        3 + lostCustomers.length * 2,
      ),
    })
  }

  if (lostProducts.length > 0) {
    reasons.push({
      code: 'lost-products',
      category: 'products',
      message:
        `${lostProducts.length} ${lostProducts.length === 1 ? 'producto perdió' : 'productos perdieron'} actividad comercial.`,
      impact: Math.min(
        10,
        2 + lostProducts.length,
      ),
    })
  }

  const score = roundScore(
    clampScore(
      reasons.reduce(
        (total, reason) =>
          total + reason.impact,
        0,
      ),
    ),
  )

  return {
    score,
    level: resolvePriorityLevel(score),
    reasons,
  }
}

export class BrandDecisionEngine {
  private readonly repository:
    BusinessRepository

  private readonly snapshotEngine:
    BusinessSnapshotEngine

  private readonly healthScoreEngine:
    BusinessHealthScoreEngine

  private readonly narrativeEngine:
    BusinessNarrativeEngine

  constructor(
    repository: BusinessRepository,
    snapshotEngine =
      new BusinessSnapshotEngine(
        repository,
      ),
    healthScoreEngine =
      new BusinessHealthScoreEngine(),
    narrativeEngine =
      new BusinessNarrativeEngine(),
  ) {
    this.repository = repository
    this.snapshotEngine = snapshotEngine
    this.healthScoreEngine =
      healthScoreEngine
    this.narrativeEngine = narrativeEngine
  }

  evaluate(
    brandId: string,
    currentPeriodId: string,
    options: BrandDecisionOptions = {},
  ): BrandDecisionModel | undefined {
    const previousPeriodId =
      options.previousPeriodId ??
      getPreviousPeriodId(
        currentPeriodId,
      )

    const target =
      this.repository.targets.findBrandTarget(
        brandId,
        currentPeriodId,
      )

    const elapsedWorkingDays =
      options.elapsedWorkingDays ??
      countWeekdaysThroughDate(
        currentPeriodId,
        this.repository.getDataPeriodEnd(),
        target?.workingDays ?? null,
      )

    const currentSnapshot =
      this.snapshotEngine.getBrandSnapshot(
        brandId,
        currentPeriodId,
        {
          elapsedWorkingDays,
        },
      )

    if (!currentSnapshot) {
      return undefined
    }

    const previousSnapshot =
      this.snapshotEngine.getBrandSnapshot(
        brandId,
        previousPeriodId,
      ) ?? null

    const currentPeriod =
      this.repository.brand.findPeriod(
        brandId,
        currentPeriodId,
      )

    const previousPeriod =
      this.repository.brand.findPeriod(
        brandId,
        previousPeriodId,
      )

    const lossEvaluationWindow =
      getLossEvaluationWindow(
        this.repository,
      )

    const lostCustomers =
      getLostCustomers(
        this.repository,
        brandId,
        lossEvaluationWindow.basePeriodId,
        lossEvaluationWindow.inactivityPeriodIds,
      )

    const lostProducts =
      getLostProducts(
        this.repository,
        brandId,
        lossEvaluationWindow.basePeriodId,
        lossEvaluationWindow.inactivityPeriodIds,
      )

    const priority = buildPriority(
      currentPeriod,
      previousPeriod,
      currentSnapshot.attainment.revenue
        .attainment,
      currentSnapshot.attainment
        .grossMargin.attainment,
      lostCustomers,
      lostProducts,
    )

    const healthScore =
      this.healthScoreEngine.calculate(
        currentSnapshot,
      )

    const executiveBrief =
      this.narrativeEngine
        .buildExecutiveBrief(
          currentSnapshot,
          healthScore,
        )

    const risks = buildBrandRisks(
      executiveBrief,
      lostCustomers,
      lostProducts,
    )

    const opportunities =
      buildBrandOpportunities(
        executiveBrief,
        lostCustomers,
        lostProducts,
      )

    const recommendedActions =
      buildBrandRecommendedActions(
        executiveBrief,
        priority,
        lostCustomers,
        lostProducts,
      )

    const baseDecision = {
      id: `${currentSnapshot.id}::decision`,
      generatedAt:
        currentSnapshot.generatedAt,
      brandId: currentSnapshot.brand.id,
      brandName: currentSnapshot.brand.name,
      currentPeriodId:
        currentSnapshot.periodId,
      previousPeriodId,
      currentSnapshot,
      previousSnapshot,
      healthScore,
      executiveBrief,
      priority,
      lostCustomers,
      lostProducts,
      lossEvaluation: {
        ...lossEvaluationWindow,
        completedPeriodsOnly: true as const,
      },
      why: priority.reasons.map(
        (reason) => reason.message,
      ),
      risks,
      opportunities,
      recommendedActions,
    }

    const executiveScore =
      buildBrandExecutiveScore(
        baseDecision,
      )
    const prioritizedActions =
      buildBrandPrioritizedActions(
        baseDecision,
      )
    const aiSummary =
      buildBrandAICommercialSummary(
        baseDecision,
        executiveScore,
        prioritizedActions,
      )

    const decisionWithForecast = {
      ...baseDecision,
      executiveScore,
      aiSummary,
      prioritizedActions,
      forecast: buildBrandForecastIntelligence(currentSnapshot),
    }

    return {
      ...decisionWithForecast,
      actionCenter:
        buildBrandExecutiveActionCenter(
          decisionWithForecast,
        ),
    }
  }
}
