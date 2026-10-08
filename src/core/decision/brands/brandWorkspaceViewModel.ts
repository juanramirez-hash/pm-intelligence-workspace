import type {
  BrandCommercialComparison,
  BrandCommercialWindow,
} from './brandCommercialComparison'

import {
  formatBusinessCurrency,
  formatBusinessNumber,
  formatBusinessPercent,
} from '../../business'

import type {
  BrandDecisionInsight,
  BrandDecisionModel,
  BrandRecommendedAction,
  CommercialPriorityLevel,
} from './brandDecisionTypes'

import type {
  BrandExecutiveScoreComponent,
  BrandPrioritizedAction,
} from './brandCommercialIntelligence'

export interface BrandWorkspaceCard {
  id: string
  label: string
  value: string
  helper: string
  status: 'positive' | 'neutral' | 'attention' | 'critical'
}

export interface BrandWorkspaceChartPoint {
  isCurrent: boolean
  periodId: string
  revenue: number
  revenueLabel: string
  revenueWidth: number
  grossProfit: number
  grossProfitLabel: string
  grossProfitWidth: number
  grossMargin: number | null
  grossMarginLabel: string
  customers: number
  customersLabel: string
  products: number
  productsLabel: string
  revenueChangeLabel: string | null
  grossProfitChangeLabel: string | null
  customersChangeLabel: string | null
  productsChangeLabel: string | null
}

export interface BrandWorkspaceCommercialWindow {
  year: number
  periodId: string

  dateFrom: string
  dateTo: string
  workingDays: number
  rangeLabel: string

  revenue: number
  revenueLabel: string

  grossProfit: number
  grossProfitLabel: string

  grossMargin: number | null
  grossMarginLabel: string

  customers: number
  customersLabel: string

  products: number
  productsLabel: string
}

export interface BrandWorkspaceCommercialDelta {
  revenueAmount: number
  revenueAmountLabel: string
  revenuePercent: number | null
  revenuePercentLabel: string | null

  grossProfitAmount: number
  grossProfitAmountLabel: string
  grossProfitPercent: number | null
  grossProfitPercentLabel: string | null

  grossMarginPoints: number | null
  grossMarginPointsLabel: string | null

  customersChange: number
  customersChangeLabel: string | null

  productsChange: number
  productsChangeLabel: string | null
}

export interface BrandWorkspaceCommercialComparisonSet {
  current: BrandWorkspaceCommercialWindow | null
  previousYear: BrandWorkspaceCommercialWindow | null
  twoYearsBack: BrandWorkspaceCommercialWindow | null

  vsPreviousYear: BrandWorkspaceCommercialDelta | null
  vsTwoYearsBack: BrandWorkspaceCommercialDelta | null
}

export interface BrandWorkspaceAnnualProjection {
  year: number

  revenue: number
  revenueLabel: string

  grossProfit: number | null
  grossProfitLabel: string

  grossMargin: number | null
  grossMarginLabel: string

  historicalRevenueCompletionRatio: number
  historicalRevenueCompletionRatioLabel: string

  historicalGrossProfitCompletionRatio: number | null
  historicalGrossProfitCompletionRatioLabel: string

  historicalYearsUsed: readonly number[]
  historicalYearsLabel: string
}

export interface BrandWorkspaceAnnualComparison {
  projection: BrandWorkspaceAnnualProjection | null

  previousYear: BrandWorkspaceCommercialWindow | null
  twoYearsBack: BrandWorkspaceCommercialWindow | null

  vsPreviousYear: BrandWorkspaceCommercialDelta | null
  vsTwoYearsBack: BrandWorkspaceCommercialDelta | null
}

export interface BrandWorkspaceInsight extends BrandDecisionInsight {
  severityLabel: string
}

export interface BrandWorkspaceLostCustomerRow {
  id: string
  customerName: string
  previousRevenue: string
  previousGrossProfit: string
  previousQuantity: string
  previousDocuments: string
}

export interface BrandWorkspaceLostProductRow {
  id: string
  productModel: string
}

export interface BrandWorkspaceViewModel {
  id: string
  generatedAt: string
  header: {
    brandId: string
    brandName: string
    currentPeriodId: string
    previousPeriodId: string
    healthLabel: string
  }
  cards: readonly BrandWorkspaceCard[]
  lossEvaluation?: BrandDecisionModel['lossEvaluation']
  charts: {
    comparisonDescription?: string
    comparisonRanges?: Record<string, string>
    comparison: readonly BrandWorkspaceChartPoint[]
  }
    commercialComparison: {
    currentYear: number | null
    description: string

    monthly: BrandWorkspaceCommercialComparisonSet
    ytd: BrandWorkspaceCommercialComparisonSet
    annual: BrandWorkspaceAnnualComparison
  }
  actionCenter: {
    status: 'ready' | 'limited'
    revenueGapLabel: string
    recoverableCustomerRevenueLabel: string
    expectedCustomerRecoveryLabel: string
    coverageOfGapLabel: string
    customersAvailableLabel: string
    productsAvailableLabel: string
    dailyBrief: {
      greeting: string
      headline: string
      situation: string
      objective: string
      recommendation: string
      closing: string
    }
    agenda: readonly {
      rank: number
      type: 'customer' | 'product' | 'commercial'
      typeLabel: string
      entityId: string | null
      entityName: string
      evidence?: readonly string[]
      title: string
      description: string
      urgencyLabel: string
      probabilityLabel: string
      estimatedRevenueImpactLabel: string | null
      impactScoreLabel: string
    }[]
  }
  forecast: {
    status: string
    statusLabel: string
    confidenceLabel: string
    workingDaysLabel: string
    elapsedWorkingDaysLabel: string
    remainingWorkingDaysLabel: string
    expectedProgressLabel: string
    actualProgressLabel: string
    paceIndexLabel: string
    revenueTargetLabel: string
    actualRevenueLabel: string
    expectedRevenueToDateLabel: string
    revenueVarianceToPaceLabel: string
    projectedRevenueLabel: string
    projectedAttainmentLabel: string
    revenueGapLabel: string
    requiredDailyRevenueLabel: string
    currentDailyRevenueLabel: string
    achievementProbabilityLabel: string
  }
  executiveIntelligence: {
    score: number
    label: string
    grade: string
    confidence: number
    confidenceLabel: string
    components: readonly BrandExecutiveScoreComponent[]
    headline: string
    diagnosis: string
    primaryFocus: string
    nextStep: string
  }
  brief: {
    title: string
    summary: string
    highlights: readonly BrandDecisionInsight[]
  }
  why: readonly string[]
  risks: readonly BrandWorkspaceInsight[]
  opportunities: readonly BrandWorkspaceInsight[]
  priority: {
    score: number
    level: CommercialPriorityLevel
    label: string
    reasons: readonly {
      code: string
      message: string
      impact: number
    }[]
  }
  recommendedActions: readonly BrandRecommendedAction[]
  prioritizedActions: readonly (BrandPrioritizedAction & {
    estimatedRevenueImpactLabel: string | null
    probabilityLabel: string
    urgencyLabel: string
  })[]
  tables: {
    lostCustomers: readonly BrandWorkspaceLostCustomerRow[]
    lostProducts: readonly BrandWorkspaceLostProductRow[]
  }
}


function forecastStatusLabel(
  status: BrandDecisionModel['forecast']['status'],
): string {
  return {
    'not-evaluable': 'No evaluable',
    critical: 'Crítico',
    'at-risk': 'En riesgo',
    'on-track': 'En ruta',
    ahead: 'Adelantado',
    achieved: 'Cumplido',
  }[status]
}

function formatNullableCurrency(value: number | null): string {
  return value === null ? 'Sin dato' : formatBusinessCurrency(value)
}

function formatNullablePercent(value: number | null): string {
  return value === null ? 'Sin dato' : formatBusinessPercent(value)
}

function formatNullableNumber(value: number | null): string {
  return value === null ? 'Sin dato' : formatBusinessNumber(value)
}

function resolveStatus(
  attainment: number | null,
): BrandWorkspaceCard['status'] {
  if (attainment === null) {
    return 'neutral'
  }

  if (attainment >= 1) {
    return 'positive'
  }

  if (attainment >= 0.85) {
    return 'attention'
  }

  return 'critical'
}

function priorityLabel(
  level: CommercialPriorityLevel,
): string {
  const labels: Record<
    CommercialPriorityLevel,
    string
  > = {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  }

  return labels[level]
}

function formatChange(
  currentValue: number,
  previousValue: number,
): string | null {
  if (previousValue === 0) {
    return currentValue === 0
      ? 'Sin cambio'
      : null
  }

  const variation =
    (currentValue - previousValue) /
    previousValue
  const prefix = variation > 0 ? '↑ ' : variation < 0 ? '↓ ' : ''

  return `${prefix}${formatBusinessPercent(Math.abs(variation))}`
}

function severityLabel(
  severity: BrandDecisionInsight['severity'],
): string {
  return {
    positive: 'Positiva',
    neutral: 'Informativa',
    attention: 'Atención',
    critical: 'Crítica',
  }[severity]
}

function toChartPoint(
  snapshot: BrandDecisionModel['currentSnapshot'],
  maximumRevenue: number,
  maximumGrossProfit: number,
  previousSnapshot: BrandDecisionModel['previousSnapshot'],
  isCurrent: boolean,
): BrandWorkspaceChartPoint {
  const revenue = snapshot.actuals.revenue
  const grossProfit = snapshot.actuals.grossProfit

  return {
    isCurrent,
    periodId: snapshot.periodId,
    revenue,
    revenueLabel: formatBusinessCurrency(revenue),
    revenueWidth:
      maximumRevenue > 0
        ? Math.round((revenue / maximumRevenue) * 100)
        : 0,
    grossProfit,
    grossProfitLabel: formatBusinessCurrency(grossProfit),
    grossProfitWidth:
      maximumGrossProfit > 0
        ? Math.round((grossProfit / maximumGrossProfit) * 100)
        : 0,
    grossMargin: snapshot.actuals.grossMargin,
    grossMarginLabel: formatBusinessPercent(
      snapshot.actuals.grossMargin,
    ),
    customers: snapshot.actuals.customers,
    customersLabel: formatBusinessNumber(
      snapshot.actuals.customers,
    ),
    products: snapshot.actuals.products,
    productsLabel: formatBusinessNumber(
      snapshot.actuals.products,
    ),
    revenueChangeLabel:
      isCurrent && previousSnapshot
        ? formatChange(revenue, previousSnapshot.actuals.revenue)
        : null,
    grossProfitChangeLabel:
      isCurrent && previousSnapshot
        ? formatChange(grossProfit, previousSnapshot.actuals.grossProfit)
        : null,
    customersChangeLabel:
      isCurrent && previousSnapshot
        ? formatChange(snapshot.actuals.customers, previousSnapshot.actuals.customers)
        : null,
    productsChangeLabel:
      isCurrent && previousSnapshot
        ? formatChange(snapshot.actuals.products, previousSnapshot.actuals.products)
        : null,
  }
}
function toCommercialWindow(
  window: BrandCommercialWindow | null,
): BrandWorkspaceCommercialWindow | null {
  if (!window) {
    return null
  }

  return {
    year:
      window.year,

    periodId:
      window.periodId,

    dateFrom:
      window.dateFrom,

    dateTo:
      window.dateTo,

    workingDays:
      window.workingDays,

    rangeLabel:
      `${window.dateFrom} al ${window.dateTo} · ${window.workingDays} días laborables`,

    revenue:
      window.revenue,

    revenueLabel:
      formatBusinessCurrency(
        window.revenue,
      ),

    grossProfit:
      window.grossProfit,

    grossProfitLabel:
      formatBusinessCurrency(
        window.grossProfit,
      ),

    grossMargin:
      window.grossMargin,

    grossMarginLabel:
      window.grossMargin === null
        ? 'Sin dato'
        : formatBusinessPercent(
            window.grossMargin,
          ),

    customers:
      window.customers,

    customersLabel:
      formatBusinessNumber(
        window.customers,
      ),

    products:
      window.products,

    productsLabel:
      formatBusinessNumber(
        window.products,
      ),
  }
}

function resolvePercentChange(
  currentValue: number,
  referenceValue: number,
): number | null {
  if (referenceValue === 0) {
    return null
  }

  return (
    currentValue -
    referenceValue
  ) / referenceValue
}

function formatSignedCurrency(
  value: number,
): string {
  if (value === 0) {
    return formatBusinessCurrency(0)
  }

  const formatted =
    formatBusinessCurrency(
      Math.abs(value),
    )

  return value > 0
    ? `+${formatted}`
    : `-${formatted}`
}

function formatSignedPercent(
  value: number | null,
): string | null {
  if (value === null) {
    return null
  }

  if (value === 0) {
    return formatBusinessPercent(0)
  }

  const formatted =
    formatBusinessPercent(
      Math.abs(value),
    )

  return value > 0
    ? `+${formatted}`
    : `-${formatted}`
}

function formatPercentagePoints(
  value: number | null,
): string | null {
  if (value === null) {
    return null
  }

  const points =
    value * 100

  if (points === 0) {
    return '0.0 pp'
  }

  return `${points > 0 ? '+' : '-'}${Math.abs(points).toFixed(1)} pp`
}

function buildCommercialDelta(
  current: BrandCommercialWindow | null,
  reference: BrandCommercialWindow | null,
): BrandWorkspaceCommercialDelta | null {
  if (
    !current ||
    !reference
  ) {
    return null
  }

  const revenueAmount =
    current.revenue -
    reference.revenue

  const grossProfitAmount =
    current.grossProfit -
    reference.grossProfit

  const grossMarginPoints =
    current.grossMargin !== null &&
    reference.grossMargin !== null
      ? current.grossMargin -
        reference.grossMargin
      : null

  const customersChange =
    current.customers -
    reference.customers

  const productsChange =
    current.products -
    reference.products

  const revenuePercent =
    resolvePercentChange(
      current.revenue,
      reference.revenue,
    )

  const grossProfitPercent =
    resolvePercentChange(
      current.grossProfit,
      reference.grossProfit,
    )

  return {
    revenueAmount,
    revenueAmountLabel:
      formatSignedCurrency(
        revenueAmount,
      ),

    revenuePercent,
    revenuePercentLabel:
      formatSignedPercent(
        revenuePercent,
      ),

    grossProfitAmount,
    grossProfitAmountLabel:
      formatSignedCurrency(
        grossProfitAmount,
      ),

    grossProfitPercent,
    grossProfitPercentLabel:
      formatSignedPercent(
        grossProfitPercent,
      ),

    grossMarginPoints,
    grossMarginPointsLabel:
      formatPercentagePoints(
        grossMarginPoints,
      ),

    customersChange,

    customersChangeLabel:
      formatSignedNumber(
        customersChange,
      ),

    productsChange,

    productsChangeLabel:
      formatSignedNumber(
        productsChange,
      ),
  }
}

function formatSignedNumber(
  value: number,
): string {
  if (value === 0) {
    return '0'
  }

  const formatted =
    formatBusinessNumber(
      Math.abs(value),
    )

  return value > 0
    ? `+${formatted}`
    : `-${formatted}`
}

function buildCommercialComparisonSet(
  comparison:
    BrandCommercialComparison['monthly'],
): BrandWorkspaceCommercialComparisonSet {
  return {
    current:
      toCommercialWindow(
        comparison.current,
      ),

    previousYear:
      toCommercialWindow(
        comparison.previousYear,
      ),

    twoYearsBack:
      toCommercialWindow(
        comparison.twoYearsBack,
      ),

    vsPreviousYear:
      buildCommercialDelta(
        comparison.current,
        comparison.previousYear,
      ),

    vsTwoYearsBack:
      buildCommercialDelta(
        comparison.current,
        comparison.twoYearsBack,
      ),
  }
}
export function buildBrandWorkspaceViewModel(
  decision: BrandDecisionModel,
  commercialComparison?: BrandCommercialComparison,
): BrandWorkspaceViewModel {
  const revenueAttainment =
    decision.currentSnapshot.attainment
      .revenue.attainment
  const grossProfitAttainment =
    decision.currentSnapshot.attainment
      .grossProfit.attainment
  const grossMarginAttainment =
    decision.currentSnapshot.attainment
      .grossMargin.attainment

  const comparisonSnapshots = commercialComparison?.snapshots ?? [
    decision.previousSnapshot,
    decision.currentSnapshot,
  ].filter(
    (snapshot): snapshot is NonNullable<typeof snapshot> =>
      snapshot !== null,
  )

  const maximumRevenue = Math.max(
    0,
    ...comparisonSnapshots.map(
      (snapshot) => snapshot.actuals.revenue,
    ),
  )

  const maximumGrossProfit = Math.max(
    0,
    ...comparisonSnapshots.map(
      (snapshot) => snapshot.actuals.grossProfit,
    ),
  )

  const comparison = comparisonSnapshots.map(
    (snapshot) =>
      toChartPoint(
        snapshot,
        maximumRevenue,
        maximumGrossProfit,
        comparisonSnapshots.find((point) => point.periodId === decision.previousPeriodId) ?? null,
        snapshot.periodId === decision.currentPeriodId,
      ),
  )

  return {
    id: `${decision.id}::workspace`,
    generatedAt: decision.generatedAt,
    header: {
      brandId: decision.brandId,
      brandName: decision.brandName,
      currentPeriodId:
        decision.currentPeriodId,
      previousPeriodId:
        decision.previousPeriodId,
      healthLabel:
        decision.executiveBrief.health.label,
    },
    cards: [
      {
        id: 'revenue',
        label: 'Venta',
        value: formatBusinessCurrency(
          decision.currentSnapshot.actuals
            .revenue,
        ),
        helper: `Cumplimiento ${formatBusinessPercent(revenueAttainment)}`,
        status: resolveStatus(
          revenueAttainment,
        ),
      },
      {
        id: 'gross-profit',
        label: 'GP',
        value: formatBusinessCurrency(
          decision.currentSnapshot.actuals
            .grossProfit,
        ),
        helper: `Cumplimiento ${formatBusinessPercent(grossProfitAttainment)}`,
        status: resolveStatus(
          grossProfitAttainment,
        ),
      },
      {
        id: 'gross-margin',
        label: 'Margen',
        value: formatBusinessPercent(
          decision.currentSnapshot.actuals
            .grossMargin,
        ),
        helper: `Cumplimiento ${formatBusinessPercent(grossMarginAttainment)}`,
        status: resolveStatus(
          grossMarginAttainment,
        ),
      },
      {
        id: 'customers',
        label: 'Clientes activos',
        value: formatBusinessNumber(
          decision.currentSnapshot.actuals
            .customers,
        ),
        helper: `${decision.lostCustomers.length} perdidos · 2 meses completos`,
        status:
          decision.lostCustomers.length > 0
            ? 'attention'
            : 'positive',
      },
      {
        id: 'products',
        label: 'Productos activos',
        value: formatBusinessNumber(
          decision.currentSnapshot.actuals
            .products,
        ),
        helper: `${decision.lostProducts.length} perdidos · 2 meses completos`,
        status:
          decision.lostProducts.length > 0
            ? 'attention'
            : 'positive',
      },
    ],
    lossEvaluation: decision.lossEvaluation,
    charts: {
      comparisonDescription: commercialComparison?.description,
      comparisonRanges: commercialComparison?.ranges,
      comparison,
    },
        commercialComparison: {
      currentYear:
        commercialComparison
          ?.currentYear ?? null,

      description:
        commercialComparison
          ?.multiYearDescription ??
        'No hay información suficiente para construir el comparativo multi-año.',

      monthly:
        commercialComparison
          ? buildCommercialComparisonSet(
              commercialComparison.monthly,
            )
          : {
              current: null,
              previousYear: null,
              twoYearsBack: null,
              vsPreviousYear: null,
              vsTwoYearsBack: null,
            },

      ytd:
        commercialComparison
          ? buildCommercialComparisonSet(
              commercialComparison.ytd,
            )
          : {
              current: null,
              previousYear: null,
              twoYearsBack: null,
              vsPreviousYear: null,
              vsTwoYearsBack: null,
            },

      annual: {
        projection:
          commercialComparison
            ?.annual.projection
            ? {
                year:
                  commercialComparison
                    .annual
                    .projection
                    .year,

                revenue:
                  commercialComparison
                    .annual
                    .projection
                    .revenue,

                revenueLabel:
                  formatBusinessCurrency(
                    commercialComparison
                      .annual
                      .projection
                      .revenue,
                  ),

                grossProfit:
                  commercialComparison
                    .annual
                    .projection
                    .grossProfit,

                grossProfitLabel:
                  commercialComparison
                      .annual
                      .projection
                      .grossProfit === null
                    ? 'Sin dato'
                    : formatBusinessCurrency(
                        commercialComparison
                          .annual
                          .projection
                          .grossProfit,
                      ),

                grossMargin:
                  commercialComparison
                    .annual
                    .projection
                    .grossMargin,

                grossMarginLabel:
                  commercialComparison
                      .annual
                      .projection
                      .grossMargin === null
                    ? 'Sin dato'
                    : formatBusinessPercent(
                        commercialComparison
                          .annual
                          .projection
                          .grossMargin,
                      ),

                historicalRevenueCompletionRatio:
                  commercialComparison
                    .annual
                    .projection
                    .historicalRevenueCompletionRatio,

                historicalRevenueCompletionRatioLabel:
                  formatBusinessPercent(
                    commercialComparison
                      .annual
                      .projection
                      .historicalRevenueCompletionRatio,
                  ),

                historicalGrossProfitCompletionRatio:
                  commercialComparison
                    .annual
                    .projection
                    .historicalGrossProfitCompletionRatio,

                historicalGrossProfitCompletionRatioLabel:
                  commercialComparison
                      .annual
                      .projection
                      .historicalGrossProfitCompletionRatio === null
                    ? 'Sin dato'
                    : formatBusinessPercent(
                        commercialComparison
                          .annual
                          .projection
                          .historicalGrossProfitCompletionRatio,
                      ),

                historicalYearsUsed:
                  commercialComparison
                    .annual
                    .projection
                    .historicalYearsUsed,

                historicalYearsLabel:
                  commercialComparison
                    .annual
                    .projection
                    .historicalYearsUsed
                    .join(' / '),
              }
            : null,

        previousYear:
          toCommercialWindow(
            commercialComparison
              ?.annual
              .previousYear ?? null,
          ),

        twoYearsBack:
          toCommercialWindow(
            commercialComparison
              ?.annual
              .twoYearsBack ?? null,
          ),

        vsPreviousYear:
          commercialComparison
            ?.annual.projection &&
          commercialComparison
            .annual.previousYear
            ? buildCommercialDelta(
                {
                  year:
                    commercialComparison
                      .annual
                      .projection
                      .year,

                  periodId:
                    `${commercialComparison.annual.projection.year}-FY-PROJECTION`,

                  dateFrom:
                    `${commercialComparison.annual.projection.year}-01-01`,

                  dateTo:
                    `${commercialComparison.annual.projection.year}-12-31`,

                  workingDays: 0,

                  revenue:
                    commercialComparison
                      .annual
                      .projection
                      .revenue,

                  grossProfit:
                    commercialComparison
                      .annual
                      .projection
                      .grossProfit ?? 0,

                  grossMargin:
                    commercialComparison
                      .annual
                      .projection
                      .grossMargin,

                  quantity: 0,
                  documents: 0,
                  customers: 0,
                  products: 0,
                  rowCount: 0,
                },

                commercialComparison
                  .annual
                  .previousYear,
              )
            : null,

        vsTwoYearsBack:
          commercialComparison
            ?.annual.projection &&
          commercialComparison
            .annual.twoYearsBack
            ? buildCommercialDelta(
                {
                  year:
                    commercialComparison
                      .annual
                      .projection
                      .year,

                  periodId:
                    `${commercialComparison.annual.projection.year}-FY-PROJECTION`,

                  dateFrom:
                    `${commercialComparison.annual.projection.year}-01-01`,

                  dateTo:
                    `${commercialComparison.annual.projection.year}-12-31`,

                  workingDays: 0,

                  revenue:
                    commercialComparison
                      .annual
                      .projection
                      .revenue,

                  grossProfit:
                    commercialComparison
                      .annual
                      .projection
                      .grossProfit ?? 0,

                  grossMargin:
                    commercialComparison
                      .annual
                      .projection
                      .grossMargin,

                  quantity: 0,
                  documents: 0,
                  customers: 0,
                  products: 0,
                  rowCount: 0,
                },

                commercialComparison
                  .annual
                  .twoYearsBack,
              )
            : null,
      },
    },
    actionCenter: {
      status: decision.actionCenter.status,
      revenueGapLabel: formatNullableCurrency(
        decision.actionCenter.recovery.revenueGap,
      ),
      recoverableCustomerRevenueLabel: formatBusinessCurrency(
        decision.actionCenter.recovery.recoverableCustomerRevenue,
      ),
      expectedCustomerRecoveryLabel: formatBusinessCurrency(
        decision.actionCenter.recovery.expectedCustomerRecovery,
      ),
      coverageOfGapLabel:
        decision.actionCenter.recovery.coverageOfGap === null
          ? 'Sin dato'
          : formatBusinessPercent(
              decision.actionCenter.recovery.coverageOfGap,
            ),
      customersAvailableLabel: formatBusinessNumber(
        decision.actionCenter.recovery.customersAvailable,
      ),
      productsAvailableLabel: formatBusinessNumber(
        decision.actionCenter.recovery.productsAvailable,
      ),
      dailyBrief: decision.actionCenter.dailyBrief,
      agenda: decision.actionCenter.agenda.map((item) => ({
        rank: item.rank,
        type: item.type,
        typeLabel: {
          customer: 'Cliente',
          product: 'Producto',
          commercial: 'Acción comercial',
        }[item.type],
        entityId: item.entityId,
        entityName: item.entityName,
        evidence: item.evidence,
        title: item.title,
        description: item.description,
        urgencyLabel: {
          immediate: 'Inmediata',
          high: 'Alta',
          medium: 'Media',
          low: 'Baja',
        }[item.urgency],
        probabilityLabel: formatBusinessPercent(
          item.probability / 100,
        ),
        estimatedRevenueImpactLabel:
          item.estimatedRevenueImpact === null
            ? null
            : formatBusinessCurrency(
                item.estimatedRevenueImpact,
              ),
        impactScoreLabel: formatBusinessNumber(
          item.impactScore,
        ),
      })),
    },
    forecast: {
      status: decision.forecast.status,
      statusLabel: forecastStatusLabel(decision.forecast.status),
      confidenceLabel: formatBusinessPercent(decision.forecast.confidence / 100),
      workingDaysLabel: formatNullableNumber(decision.forecast.workingDays),
      elapsedWorkingDaysLabel: formatNullableNumber(decision.forecast.elapsedWorkingDays),
      remainingWorkingDaysLabel: formatNullableNumber(decision.forecast.remainingWorkingDays),
      expectedProgressLabel: formatNullablePercent(decision.forecast.expectedProgress),
      actualProgressLabel: formatNullablePercent(decision.forecast.actualProgress),
      paceIndexLabel: formatNullablePercent(decision.forecast.paceIndex),
      revenueTargetLabel: formatNullableCurrency(decision.forecast.revenueTarget),
      actualRevenueLabel: formatBusinessCurrency(decision.forecast.actualRevenue),
      expectedRevenueToDateLabel: formatNullableCurrency(decision.forecast.expectedRevenueToDate),
      revenueVarianceToPaceLabel: formatNullableCurrency(decision.forecast.revenueVarianceToPace),
      projectedRevenueLabel: formatNullableCurrency(decision.forecast.projectedRevenue),
      projectedAttainmentLabel: formatNullablePercent(decision.forecast.projectedAttainment),
      revenueGapLabel: formatNullableCurrency(decision.forecast.revenueGap),
      requiredDailyRevenueLabel: formatNullableCurrency(decision.forecast.requiredDailyRevenue),
      currentDailyRevenueLabel: formatNullableCurrency(decision.forecast.currentDailyRevenue),
      achievementProbabilityLabel: decision.forecast.achievementProbability === null
        ? 'Sin dato'
        : formatBusinessPercent(decision.forecast.achievementProbability / 100),
    },
    executiveIntelligence: {
      score: decision.executiveScore.score,
      label: decision.executiveScore.label,
      grade: decision.executiveScore.grade,
      confidence: decision.executiveScore.confidence,
      confidenceLabel: formatBusinessPercent(decision.executiveScore.confidence / 100),
      components: decision.executiveScore.components,
      headline: decision.aiSummary.headline,
      diagnosis: decision.aiSummary.diagnosis,
      primaryFocus: decision.aiSummary.primaryFocus,
      nextStep: decision.aiSummary.nextStep,
    },
    brief: {
      title: decision.executiveBrief.title,
      summary:
        decision.executiveBrief.summary,
      highlights:
        decision.executiveBrief.highlights,
    },
    why: decision.why,
    risks: decision.risks.map((risk) => ({
      ...risk,
      severityLabel: severityLabel(risk.severity),
    })),
    opportunities: decision.opportunities.map((opportunity) => ({
      ...opportunity,
      severityLabel: severityLabel(opportunity.severity),
    })),
    priority: {
      score: decision.priority.score,
      level: decision.priority.level,
      label: priorityLabel(
        decision.priority.level,
      ),
      reasons: decision.priority.reasons.map((reason) => ({
        code: reason.code,
        message: reason.message,
        impact: reason.impact,
      })),
    },
    recommendedActions:
      decision.recommendedActions,
    prioritizedActions: decision.prioritizedActions.map((action) => ({
      ...action,
      estimatedRevenueImpactLabel: action.estimatedRevenueImpact === null
        ? null
        : formatBusinessCurrency(action.estimatedRevenueImpact),
      probabilityLabel: formatBusinessPercent(action.probability / 100),
      urgencyLabel: { immediate: 'Inmediata', high: 'Alta', medium: 'Media', low: 'Baja' }[action.urgency],
    })),
    tables: {
      lostCustomers:
        decision.lostCustomers.map(
          (customer) => ({
            id: customer.customerId,
            customerName:
              customer.customerName,
            previousRevenue:
              formatBusinessCurrency(
                customer.previousRevenue,
              ),
            previousGrossProfit:
              formatBusinessCurrency(
                customer.previousGrossProfit,
              ),
            previousQuantity:
              formatBusinessNumber(
                customer.previousQuantity,
              ),
            previousDocuments:
              formatBusinessNumber(
                customer.previousDocuments,
              ),
          }),
        ),
      lostProducts:
        decision.lostProducts.map(
          (product) => ({
            id: product.productId,
            productModel:
              product.productModel,
          }),
        ),
    },
  }
}
