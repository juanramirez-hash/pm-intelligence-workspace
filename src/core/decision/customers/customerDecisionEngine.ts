import type {
  BusinessRepository,
} from '../../business'

import type {
  BusinessCustomerPeriod,
} from '../../business/entities/customerPeriod'

import type {
  BusinessCustomerBrandPeriod,
} from '../../business/entities/customerBrandPeriod'

import {
  buildCustomerHealthScore,
  buildCustomerOpportunities,
  buildCustomerRecommendedActions,
  buildCustomerRisks,
  resolveCustomerRisk,
} from './customerDecisionRules'

import type {
  CustomerDecisionExplanation,
  CustomerDecisionModel,
  CustomerPeriodMetrics,
} from './customerDecisionTypes'

function emptyMetrics(
  periodId: string,
): CustomerPeriodMetrics {
  return {
    periodId,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    products: 0,
    brands: 0,
    locations: 0,
  }
}

function toMetrics(
  item:
    | BusinessCustomerPeriod
    | BusinessCustomerBrandPeriod
    | undefined,
  periodId: string,
): CustomerPeriodMetrics {
  if (!item) {
    return emptyMetrics(periodId)
  }

  return {
    periodId,
    revenue: item.revenue,
    grossProfit: item.grossProfit,
    quantity: item.quantity,
    documents: item.documents,
    products: item.products.size,
    brands:
      'brands' in item
        ? item.brands.size
        : 1,
    locations:
      'locations' in item
        ? item.locations.size
        : 0,
  }
}

function previousPeriodId(
  periodId: string,
): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(
    periodId,
  )

  if (!match) {
    return null
  }

  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 2,
      1,
    ),
  )

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, '0')}`
}

function monthsBetween(
  fromPeriodId: string,
  toPeriodId: string,
): number {
  const [fromYear, fromMonth] =
    fromPeriodId.split('-').map(Number)

  const [toYear, toMonth] =
    toPeriodId.split('-').map(Number)

  if (
    !fromYear ||
    !fromMonth ||
    !toYear ||
    !toMonth
  ) {
    return 0
  }

  return Math.max(
    0,
    (
      toYear * 12 + toMonth
    ) - (
      fromYear * 12 + fromMonth
    ),
  )
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

function getProductRetention(
  currentProducts: ReadonlySet<string>,
  previousProducts: ReadonlySet<string>,
): number | null {
  if (previousProducts.size === 0) {
    return null
  }

  let retainedProducts = 0

  for (const productId of previousProducts) {
    if (currentProducts.has(productId)) {
      retainedProducts += 1
    }
  }

  return retainedProducts /
    previousProducts.size
}

function getDecisionConfidence(
  timelinePeriods: number,
  hasPreviousPeriod: boolean,
  historicalProducts: number,
): number {
  const timelineScore = Math.min(
    55,
    timelinePeriods * 9,
  )

  const comparisonScore =
    hasPreviousPeriod ? 25 : 5

  const portfolioScore = Math.min(
    20,
    historicalProducts * 4,
  )

  return Math.min(
    100,
    timelineScore +
      comparisonScore +
      portfolioScore,
  )
}

export class CustomerDecisionEngine {
  private readonly repository:
    BusinessRepository

  constructor(
    repository: BusinessRepository,
  ) {
    this.repository = repository
  }

  evaluate(
    customerId: string,
    currentPeriodId: string,
    brandId?: string | null,
  ): CustomerDecisionModel | null {
    const customer =
      this.repository.findCustomer(
        customerId,
      )

    if (!customer) {
      return null
    }

    const normalizedBrandId =
      brandId?.trim().toLocaleUpperCase(
        'es-MX',
      ) || null

    const timelineSource =
      normalizedBrandId
        ? this.repository.customerBrand
            .findTimeline(
              customer.id,
              normalizedBrandId,
            )
        : this.repository.customer
            .findPeriodsByCustomerId(
              customer.id,
            )

    const currentSource =
      normalizedBrandId
        ? this.repository.customerBrand
            .findPeriod(
              customer.id,
              normalizedBrandId,
              currentPeriodId,
            )
        : this.repository.customer.findPeriod(
            customer.id,
            currentPeriodId,
          )

    const priorPeriodId =
      previousPeriodId(
        currentPeriodId,
      )

    const previousSource =
      priorPeriodId
        ? normalizedBrandId
          ? this.repository.customerBrand
              .findPeriod(
                customer.id,
                normalizedBrandId,
                priorPeriodId,
              )
          : this.repository.customer.findPeriod(
              customer.id,
              priorPeriodId,
            )
        : undefined

    const timeline = timelineSource.map(
      (item) =>
        toMetrics(
          item,
          item.periodId,
        ),
    )

    const current = toMetrics(
      currentSource,
      currentPeriodId,
    )

    const previous = priorPeriodId
      ? toMetrics(
          previousSource,
          priorPeriodId,
        )
      : null

    const totalRevenue = timeline.reduce(
      (total, item) =>
        total + item.revenue,
      0,
    )

    const totalGrossProfit = timeline.reduce(
      (total, item) =>
        total + item.grossProfit,
      0,
    )

    const lastActivePeriodId =
      [...timeline]
        .reverse()
        .find(
          (item) => item.revenue > 0,
        )?.periodId ?? null

    const inactiveMonths =
      lastActivePeriodId
        ? monthsBetween(
            lastActivePeriodId,
            currentPeriodId,
          )
        : 0

    const recentActiveRevenue =
      timeline
        .filter(
          (item) => item.revenue > 0,
        )
        .slice(-3)
        .map(
          (item) => item.revenue,
        )

    const averageRecentRevenue =
      recentActiveRevenue.length > 0
        ? recentActiveRevenue.reduce(
            (total, value) => total + value,
            0,
          ) / recentActiveRevenue.length
        : 0

    const recentProductIds =
      new Set<string>()

    const historicalProductIds =
      new Set<string>()

    for (const item of timelineSource) {
      for (const productId of item.products) {
        historicalProductIds.add(productId)

        if (
          monthsBetween(
            item.periodId,
            currentPeriodId,
          ) <= 1
        ) {
          recentProductIds.add(productId)
        }
      }
    }

    const inactiveProductIds = [
      ...historicalProductIds,
    ].filter(
      (productId) =>
        !recentProductIds.has(productId),
    )

    const availableBrands =
      this.repository.customerBrand
        .getBrandIdsForCustomer(
          customer.id,
        )
        .map((id) => ({
          id,
          name:
            this.repository.findBrand(id)
              ?.name ?? id,
        }))

    const selectedBrandName =
      normalizedBrandId
        ? this.repository.findBrand(
            normalizedBrandId,
          )?.name ?? normalizedBrandId
        : 'Todas las marcas'

    const currentProducts =
      currentSource?.products ??
      new Set<string>()

    const previousProducts =
      previousSource?.products ??
      new Set<string>()

    const revenueVariation = getVariation(
      current.revenue,
      previous?.revenue ?? 0,
    )

    const documentVariation = getVariation(
      current.documents,
      previous?.documents ?? 0,
    )

    const productRetention =
      getProductRetention(
        currentProducts,
        previousProducts,
      )

    const activePeriods = timeline.filter(
      (item) => item.revenue > 0,
    ).length

    const activePeriodRate =
      timeline.length > 0
        ? activePeriods / timeline.length
        : 0

    const recoveryPotential =
      averageRecentRevenue * 0.65

    const signals = {
      customerName: customer.name,
      selectedBrandName,
      inactiveMonths,
      currentRevenue: current.revenue,
      previousRevenue:
        previous?.revenue ?? 0,
      revenueVariation,
      currentDocuments:
        current.documents,
      previousDocuments:
        previous?.documents ?? 0,
      documentVariation,
      currentProducts:
        current.products,
      previousProducts:
        previous?.products ?? 0,
      productRetention,
      currentBrands:
        current.brands,
      historicalBrands:
        normalizedBrandId
          ? 1
          : customer.brands.size,
      activePeriodRate,
      timelinePeriods:
        timeline.length,
      activePeriods,
      recoveryPotential,
      inactiveProducts:
        inactiveProductIds.length,
    }

    const healthScore =
      buildCustomerHealthScore(
        signals,
      )

    const risks = buildCustomerRisks(
      signals,
    )

    const opportunities =
      buildCustomerOpportunities(
        signals,
      )

    const recommendedActions =
      buildCustomerRecommendedActions(
        risks,
        opportunities,
      )

    const risk = resolveCustomerRisk(
      risks,
      inactiveMonths,
    )

    const explanations:
      CustomerDecisionExplanation[] = [
      ...risks,
      ...opportunities,
    ].map((insight) => ({
      ruleId: insight.ruleId,
      rationale: insight.rationale,
      evidence: insight.evidence,
    }))

    const primaryAction =
      recommendedActions[0]

    const diagnosis =
      risks[0]?.description ??
      opportunities[0]?.description ??
      `${customer.name} mantiene una relación comercial estable en ${selectedBrandName}.`

    const recommendedAction =
      primaryAction
        ? `${primaryAction.title}. ${primaryAction.description}`
        : 'Mantener seguimiento comercial.'

    return {
      id: `${customer.id}::${normalizedBrandId ?? 'ALL'}::${currentPeriodId}`,
      generatedAt:
        new Date().toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      scope: normalizedBrandId
        ? 'brand'
        : 'all-brands',
      selectedBrandId:
        normalizedBrandId,
      selectedBrandName,
      currentPeriodId,
      previousPeriodId:
        priorPeriodId,
      current,
      previous,
      totalRevenue,
      totalGrossProfit,
      grossMargin:
        totalRevenue > 0
          ? totalGrossProfit /
            totalRevenue
          : null,
      revenueVariation,
      documentVariation,
      productRetention,
      activePeriodRate,
      lastActivePeriodId,
      inactiveMonths,
      riskLevel: risk.level,
      riskLabel: risk.label,
      recoveryProbability:
        risk.probability,
      recoveryPotential,
      healthScore,
      risks,
      opportunities,
      recommendedActions,
      explanations,
      decisionConfidence:
        getDecisionConfidence(
          timeline.length,
          Boolean(previousSource),
          historicalProductIds.size,
        ),
      activeProductIds: [
        ...recentProductIds,
      ],
      inactiveProductIds,
      timeline,
      availableBrands,
      diagnosis,
      recommendedAction,
    }
  }
}
