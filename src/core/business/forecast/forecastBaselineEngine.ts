import type {
  BusinessBrandTarget,
} from '../entities/brandTarget'

import type {
  BusinessDataModel,
} from '../models'

import {
  normalizeBusinessIdentifier,
} from '../targets'

import type {
  ForecastDataFoundation,
  ForecastObservation,
  ForecastScenarioId,
  ForecastSeries,
} from './forecastContracts'

import {
  countWeekdaysThroughDate,
  previousYearPeriodId,
} from './forecastCalendar'

import {
  averageMetricValues,
  calculateTrendRate,
  clampForecastValue,
  coefficientOfVariation,
  floorAtActual,
  grossMarginFromValues,
  multiplyMetricValues,
  projectMetricTrend,
  roundForecastRatio,
  roundForecastValue,
} from './forecastBaselineMath'

import type {
  ForecastBaselineProjection,
  ForecastConfidenceLevel,
  ForecastConfidenceProfile,
  ForecastHistoricalBaseline,
  ForecastMethodProjection,
  ForecastMetricValues,
  ForecastPeriodStatus,
  ForecastProjectionGranularity,
  ForecastProjectionStatus,
  ForecastScenarioProjection,
  ForecastTargetContext,
  ForecastTargetStatus,
  ForecastTimingProfile,
} from './forecastProjectionContracts'

const HISTORICAL_LOOKBACK_PERIODS = 6
const TREND_LOOKBACK_PERIODS = 4

const METHOD_WEIGHTS = {
  'run-rate': 0.5,
  'historical-average': 0.25,
  'recent-trend': 0.15,
  'seasonal-reference': 0.1,
} as const

const EMPTY_VALUES: ForecastMetricValues = {
  revenue: 0,
  grossProfit: 0,
  quantity: 0,
}

interface ForecastTargetResolution {
  targetRevenue: number | null
  workingDays: number | null
  notes: string[]
}

function cloneValues(
  values: ForecastMetricValues,
): ForecastMetricValues {
  return { ...values }
}

function observationValues(
  observation: ForecastObservation | undefined,
): ForecastMetricValues {
  if (!observation) {
    return cloneValues(EMPTY_VALUES)
  }

  return {
    revenue: observation.revenue,
    grossProfit: observation.grossProfit,
    quantity: observation.quantity,
  }
}

function resolveProductBrandId(
  model: BusinessDataModel,
  productId: string,
): string | null {
  const product = model.products.get(productId)

  return normalizeBusinessIdentifier(
    product?.brandId ?? product?.brand ?? '',
  )
}

function resolvePortfolioTarget(
  targets: readonly BusinessBrandTarget[],
): ForecastTargetResolution {
  const revenueTargets = targets.filter(
    (target) => target.targetRevenue !== null,
  )

  const targetRevenue = revenueTargets.length > 0
    ? revenueTargets.reduce(
        (total, target) => total + (target.targetRevenue ?? 0),
        0,
      )
    : null

  const workingDaysValues = revenueTargets.map(
    (target) => target.workingDays,
  )

  const completeWorkingDays =
    workingDaysValues.length > 0 &&
    workingDaysValues.every(
      (workingDays): workingDays is number => workingDays !== null,
    )

  const uniqueWorkingDays = new Set(
    workingDaysValues.filter(
      (workingDays): workingDays is number => workingDays !== null,
    ),
  )

  const workingDays =
    completeWorkingDays && uniqueWorkingDays.size === 1
      ? [...uniqueWorkingDays][0] ?? null
      : null

  const notes: string[] = []

  if (
    revenueTargets.length > 0 &&
    workingDays === null
  ) {
    notes.push(
      'El portafolio no tiene un único calendario laboral completo y consistente entre marcas.',
    )
  }

  return {
    targetRevenue,
    workingDays,
    notes,
  }
}

function resolveTarget(
  model: BusinessDataModel,
  series: ForecastSeries,
  currentPeriodId: string,
): ForecastTargetResolution {
  const periodTargets = [...model.brandTargets.values()].filter(
    (target) => target.periodId === currentPeriodId,
  )

  if (series.granularity === 'portfolio') {
    return resolvePortfolioTarget(periodTargets)
  }

  if (series.granularity === 'brand') {
    const target = periodTargets.find(
      (candidate) => candidate.brandId === series.entityId,
    )

    return {
      targetRevenue: target?.targetRevenue ?? null,
      workingDays: target?.workingDays ?? null,
      notes: [],
    }
  }

  if (
    series.granularity === 'product' &&
    series.entityId
  ) {
    const brandId = resolveProductBrandId(
      model,
      series.entityId,
    )

    const target = brandId
      ? periodTargets.find(
          (candidate) => candidate.brandId === brandId,
        )
      : undefined

    return {
      targetRevenue: null,
      workingDays: target?.workingDays ?? null,
      notes: [
        'No existe objetivo comercial por producto; el objetivo solo se evalúa en portafolio y marca.',
      ],
    }
  }

  return {
    targetRevenue: null,
    workingDays: null,
    notes: [],
  }
}

function resolvePeriodStatus(
  totalWorkingDays: number | null,
  elapsedWorkingDays: number | null,
): ForecastPeriodStatus {
  if (
    totalWorkingDays === null ||
    elapsedWorkingDays === null
  ) {
    return 'unknown'
  }

  if (elapsedWorkingDays === 0) {
    return 'not-started'
  }

  if (elapsedWorkingDays >= totalWorkingDays) {
    return 'closed'
  }

  return 'in-progress'
}

function buildTiming(
  currentPeriodId: string,
  dataCutoff: string | null,
  workingDays: number | null,
): ForecastTimingProfile {
  const elapsedWorkingDays = countWeekdaysThroughDate(
    currentPeriodId,
    dataCutoff,
    workingDays,
  ) ?? null

  const remainingWorkingDays =
    workingDays !== null && elapsedWorkingDays !== null
      ? Math.max(0, workingDays - elapsedWorkingDays)
      : null

  const progress =
    workingDays !== null &&
    elapsedWorkingDays !== null &&
    workingDays > 0
      ? roundForecastRatio(elapsedWorkingDays / workingDays)
      : null

  return {
    periodStatus: resolvePeriodStatus(
      workingDays,
      elapsedWorkingDays,
    ),
    totalWorkingDays: workingDays,
    elapsedWorkingDays,
    remainingWorkingDays,
    progress,
  }
}

function valuesByPeriod(
  series: ForecastSeries,
): Map<string, ForecastMetricValues> {
  return new Map(
    series.observations.map((observation) => [
      observation.periodId,
      observationValues(observation),
    ]),
  )
}

function buildHistoricalBaseline(
  foundation: ForecastDataFoundation,
  currentPeriodId: string,
  seriesValuesByPeriod: Map<string, ForecastMetricValues>,
): ForecastHistoricalBaseline {
  const periodIds = [...foundation.history.baselinePeriodIds]
  const lookbackPeriodIds = periodIds.slice(
    -HISTORICAL_LOOKBACK_PERIODS,
  )
  const lookbackValues = lookbackPeriodIds.map(
    (periodId) => seriesValuesByPeriod.get(periodId) ?? cloneValues(EMPTY_VALUES),
  )
  const trendValues = lookbackValues.slice(
    -TREND_LOOKBACK_PERIODS,
  )
  const average = averageMetricValues(lookbackValues)
  const trendProjection = projectMetricTrend(trendValues)
  const latestRevenue = trendValues.at(-1)?.revenue ?? null
  const recentTrendRate = calculateTrendRate(
    latestRevenue,
    trendProjection?.revenue ?? null,
    average?.revenue ?? null,
  )
  const seasonalReferencePeriodId = previousYearPeriodId(
    currentPeriodId,
  )
  const seasonalReference = seasonalReferencePeriodId
    ? seriesValuesByPeriod.get(seasonalReferencePeriodId) ?? null
    : null

  return {
    periodIds,
    lookbackPeriodIds,
    average,
    recentTrendRate,
    seasonalReferencePeriodId:
      seasonalReference ? seasonalReferencePeriodId : null,
    seasonalReference:
      seasonalReference ? cloneValues(seasonalReference) : null,
    revenueCoefficientOfVariation: coefficientOfVariation(
      lookbackValues.map((values) => values.revenue),
    ),
  }
}

function buildRunRateValues(
  actual: ForecastMetricValues,
  timing: ForecastTimingProfile,
): ForecastMetricValues | null {
  if (
    timing.totalWorkingDays === null ||
    timing.elapsedWorkingDays === null ||
    timing.elapsedWorkingDays <= 0
  ) {
    return null
  }

  return multiplyMetricValues(
    actual,
    timing.totalWorkingDays / timing.elapsedWorkingDays,
  )
}

function buildTrendValues(
  historical: ForecastHistoricalBaseline,
  seriesValuesByPeriod: Map<string, ForecastMetricValues>,
): ForecastMetricValues | null {
  const values = historical.lookbackPeriodIds
    .slice(-TREND_LOOKBACK_PERIODS)
    .map(
      (periodId) => seriesValuesByPeriod.get(periodId) ?? cloneValues(EMPTY_VALUES),
    )

  return projectMetricTrend(values)
}

function buildMethods(
  actual: ForecastMetricValues,
  timing: ForecastTimingProfile,
  historical: ForecastHistoricalBaseline,
  seriesValuesByPeriod: Map<string, ForecastMetricValues>,
): ForecastMethodProjection[] {
  const runRate = buildRunRateValues(actual, timing)
  const recentTrend = buildTrendValues(
    historical,
    seriesValuesByPeriod,
  )

  return [
    {
      id: 'run-rate',
      label: 'Ritmo del periodo',
      available: runRate !== null,
      baseWeight: METHOD_WEIGHTS['run-rate'],
      normalizedWeight: 0,
      values: runRate,
      explanation: runRate
        ? `Extrapola el acumulado de ${timing.elapsedWorkingDays ?? 0} a ${timing.totalWorkingDays ?? 0} días laborales.`
        : 'No se calcula porque falta un calendario laboral utilizable o todavía no transcurre un día laboral.',
    },
    {
      id: 'historical-average',
      label: 'Promedio histórico',
      available: historical.average !== null,
      baseWeight: METHOD_WEIGHTS['historical-average'],
      normalizedWeight: 0,
      values: historical.average
        ? cloneValues(historical.average)
        : null,
      explanation: historical.average
        ? `Promedio de ${historical.lookbackPeriodIds.length} periodos cerrados, incluyendo ceros cuando la entidad no tuvo actividad.`
        : 'No existe historia cerrada suficiente para calcular un promedio.',
    },
    {
      id: 'recent-trend',
      label: 'Tendencia reciente',
      available: recentTrend !== null,
      baseWeight: METHOD_WEIGHTS['recent-trend'],
      normalizedWeight: 0,
      values: recentTrend,
      explanation: recentTrend
        ? `Proyección lineal sobre los últimos ${Math.min(TREND_LOOKBACK_PERIODS, historical.lookbackPeriodIds.length)} periodos cerrados.`
        : 'Se requieren al menos dos periodos cerrados para calcular tendencia.',
    },
    {
      id: 'seasonal-reference',
      label: 'Referencia estacional',
      available: historical.seasonalReference !== null,
      baseWeight: METHOD_WEIGHTS['seasonal-reference'],
      normalizedWeight: 0,
      values: historical.seasonalReference
        ? cloneValues(historical.seasonalReference)
        : null,
      explanation: historical.seasonalReference
        ? `Utiliza el mismo mes del año anterior (${historical.seasonalReferencePeriodId}).`
        : 'No existe observación para el mismo mes del año anterior.',
    },
  ]
}

function normalizeMethodWeights(
  methods: ForecastMethodProjection[],
  periodStatus: ForecastPeriodStatus,
): ForecastMethodProjection[] {
  if (periodStatus === 'closed') {
    return methods.map((method) => ({
      ...method,
      normalizedWeight:
        method.id === 'run-rate' && method.available
          ? 1
          : 0,
    }))
  }

  const availableWeight = methods.reduce(
    (total, method) =>
      total + (method.available ? method.baseWeight : 0),
    0,
  )

  return methods.map((method) => ({
    ...method,
    normalizedWeight:
      method.available && availableWeight > 0
        ? roundForecastRatio(method.baseWeight / availableWeight)
        : 0,
  }))
}

function blendMethods(
  methods: readonly ForecastMethodProjection[],
  actual: ForecastMetricValues,
  periodStatus: ForecastPeriodStatus,
): ForecastMetricValues {
  if (periodStatus === 'closed') {
    return cloneValues(actual)
  }

  const blended = methods.reduce<ForecastMetricValues>(
    (result, method) => {
      if (!method.values || method.normalizedWeight <= 0) {
        return result
      }

      return {
        revenue:
          result.revenue +
          method.values.revenue * method.normalizedWeight,
        grossProfit:
          result.grossProfit +
          method.values.grossProfit * method.normalizedWeight,
        quantity:
          result.quantity +
          method.values.quantity * method.normalizedWeight,
      }
    },
    cloneValues(EMPTY_VALUES),
  )

  return floorAtActual(
    {
      revenue: roundForecastValue(blended.revenue),
      grossProfit: roundForecastValue(blended.grossProfit),
      quantity: roundForecastValue(blended.quantity),
    },
    actual,
  )
}

function resolveConfidenceLevel(
  score: number,
): ForecastConfidenceLevel {
  if (score >= 75) {
    return 'high'
  }

  if (score >= 50) {
    return 'medium'
  }

  return 'low'
}

function buildConfidence(
  foundation: ForecastDataFoundation,
  timing: ForecastTimingProfile,
  historical: ForecastHistoricalBaseline,
  methods: readonly ForecastMethodProjection[],
  targetResolution: ForecastTargetResolution,
): ForecastConfidenceProfile {
  const signals: string[] = []
  const limitations = [...targetResolution.notes]

  const historyScore = Math.min(
    30,
    historical.lookbackPeriodIds.length * 5,
  )
  let score = historyScore

  if (historical.lookbackPeriodIds.length > 0) {
    signals.push(
      `${historical.lookbackPeriodIds.length} periodos cerrados alimentan el baseline.`,
    )
  }

  if (foundation.history.consecutive) {
    score += 10
    signals.push('La historia mensual disponible es consecutiva.')
  } else {
    limitations.push('La historia contiene periodos mensuales faltantes.')
  }

  const runRateAvailable = methods.some(
    (method) => method.id === 'run-rate' && method.available,
  )

  if (runRateAvailable) {
    score += 20
    signals.push('El periodo dispone de ritmo por días laborales.')
    limitations.push(
      'Los días transcurridos consideran lunes a viernes; todavía no existe un calendario de feriados por fecha.',
    )
  } else {
    limitations.push(
      'No existe ritmo por días laborales para esta proyección.',
    )
  }

  if (timing.progress !== null) {
    score += Math.min(15, timing.progress * 15)
    signals.push(
      `El periodo presenta ${(timing.progress * 100).toFixed(1)}% de avance laboral.`,
    )
  }

  if (historical.seasonalReference) {
    score += 10
    signals.push('Existe referencia del mismo mes del año anterior.')
  } else {
    limitations.push('No existe referencia estacional anual.')
  }

  if (historical.revenueCoefficientOfVariation !== null) {
    const stability = 1 - Math.min(
      1,
      historical.revenueCoefficientOfVariation,
    )
    score += stability * 15

    if (historical.revenueCoefficientOfVariation <= 0.25) {
      signals.push('La variación histórica de venta es relativamente estable.')
    } else {
      limitations.push('La venta histórica presenta volatilidad relevante.')
    }
  }

  if (historical.lookbackPeriodIds.length < 3) {
    limitations.push(
      'El baseline tiene menos de tres periodos cerrados.',
    )
  }

  const normalizedScore = roundForecastValue(
    clampForecastValue(score, 0, 100),
  )

  return {
    score: normalizedScore,
    level: resolveConfidenceLevel(normalizedScore),
    signals,
    limitations: [...new Set(limitations)],
  }
}

function resolveProjectionStatus(
  methods: readonly ForecastMethodProjection[],
  confidence: ForecastConfidenceProfile,
): ForecastProjectionStatus {
  if (!methods.some((method) => method.available)) {
    return 'unavailable'
  }

  return confidence.level === 'low'
    ? 'partial'
    : 'ready'
}

function scenarioSpread(
  confidence: ForecastConfidenceProfile,
  historical: ForecastHistoricalBaseline,
  timing: ForecastTimingProfile,
): number {
  if (timing.periodStatus === 'closed') {
    return 0
  }

  const confidenceBase = confidence.level === 'high'
    ? 0.05
    : confidence.level === 'medium'
      ? 0.1
      : 0.15

  const volatilityAdjustment = Math.min(
    0.05,
    (historical.revenueCoefficientOfVariation ?? 0.1) * 0.15,
  )

  return roundForecastRatio(
    clampForecastValue(
      confidenceBase + volatilityAdjustment,
      0.05,
      0.2,
    ),
  )
}

function scenarioLabel(
  id: ForecastScenarioId,
): string {
  if (id === 'conservative') {
    return 'Conservador'
  }

  if (id === 'accelerated') {
    return 'Acelerado'
  }

  return 'Esperado'
}

function buildScenarios(
  expected: ForecastMetricValues,
  actual: ForecastMetricValues,
  targetRevenue: number | null,
  confidence: ForecastConfidenceProfile,
  historical: ForecastHistoricalBaseline,
  timing: ForecastTimingProfile,
): ForecastScenarioProjection[] {
  const spread = scenarioSpread(
    confidence,
    historical,
    timing,
  )

  return (
    [
      ['conservative', 1 - spread],
      ['expected', 1],
      ['accelerated', 1 + spread],
    ] as const
  ).map(([id, factor]) => {
    const values = floorAtActual(
      multiplyMetricValues(expected, factor),
      actual,
    )

    return {
      id,
      label: scenarioLabel(id),
      factor: roundForecastRatio(factor),
      spread: id === 'expected' ? 0 : spread,
      values,
      grossMargin: grossMarginFromValues(values),
      targetAttainment:
        targetRevenue !== null && targetRevenue > 0
          ? roundForecastRatio(values.revenue / targetRevenue)
          : null,
    }
  })
}

function resolveTargetStatus(
  actualRevenue: number,
  targetRevenue: number | null,
  expectedAttainment: number | null,
): ForecastTargetStatus {
  if (
    targetRevenue === null ||
    expectedAttainment === null
  ) {
    return 'unavailable'
  }

  if (actualRevenue >= targetRevenue) {
    return 'achieved'
  }

  if (expectedAttainment >= 1.05) {
    return 'ahead'
  }

  if (expectedAttainment >= 0.98) {
    return 'on-track'
  }

  return 'behind'
}

function buildTargetContext(
  actual: ForecastMetricValues,
  expected: ForecastMetricValues,
  timing: ForecastTimingProfile,
  targetRevenue: number | null,
): ForecastTargetContext {
  const expectedAttainment =
    targetRevenue !== null && targetRevenue > 0
      ? roundForecastRatio(expected.revenue / targetRevenue)
      : null

  const revenueGap = targetRevenue !== null
    ? roundForecastValue(
        Math.max(0, targetRevenue - actual.revenue),
      )
    : null

  const requiredDailyRevenue =
    revenueGap !== null &&
    timing.remainingWorkingDays !== null &&
    timing.remainingWorkingDays > 0
      ? roundForecastValue(
          revenueGap / timing.remainingWorkingDays,
        )
      : revenueGap === 0
        ? 0
        : null

  return {
    revenue: targetRevenue,
    expectedAttainment,
    revenueGap,
    requiredDailyRevenue,
    status: resolveTargetStatus(
      actual.revenue,
      targetRevenue,
      expectedAttainment,
    ),
  }
}

function buildExplainability(
  methods: readonly ForecastMethodProjection[],
  timing: ForecastTimingProfile,
  confidence: ForecastConfidenceProfile,
  historical: ForecastHistoricalBaseline,
): string[] {
  const activeMethods = methods
    .filter(
      (method) =>
        method.available &&
        method.normalizedWeight > 0,
    )
    .map(
      (method) =>
        `${method.label} ${(method.normalizedWeight * 100).toFixed(2)}%`,
    )

  const explanation = activeMethods.length > 0
    ? `La proyección esperada combina ${activeMethods.join(', ')}.`
    : 'No existen métodos disponibles para construir una proyección esperada.'

  const result = [explanation]

  if (timing.periodStatus === 'closed') {
    result.push(
      'El periodo está cerrado; la proyección converge al valor real acumulado.',
    )
  }

  if (historical.recentTrendRate !== null) {
    result.push(
      `La tendencia lineal reciente de venta implica una variación de ${(historical.recentTrendRate * 100).toFixed(1)}% contra el último periodo cerrado.`,
    )
  }

  result.push(
    `La confianza ${confidence.level} (${confidence.score}/100) mide suficiencia y estabilidad de datos; no representa probabilidad estadística de cumplimiento.`,
  )

  return result
}

export class ForecastBaselineEngine {
  private readonly model: BusinessDataModel

  private readonly foundation: ForecastDataFoundation

  constructor(
    model: BusinessDataModel,
    foundation: ForecastDataFoundation,
  ) {
    this.model = model
    this.foundation = foundation
  }

  project(
    series: ForecastSeries,
  ): ForecastBaselineProjection | undefined {
    if (
      series.granularity === 'customer' ||
      !this.foundation.currentPeriodId
    ) {
      return undefined
    }

    const granularity =
      series.granularity as ForecastProjectionGranularity
    const currentPeriodId = this.foundation.currentPeriodId
    const seriesValues = valuesByPeriod(series)
    const actual = observationValues(
      series.observations.find(
        (observation) => observation.periodId === currentPeriodId,
      ),
    )
    const targetResolution = resolveTarget(
      this.model,
      series,
      currentPeriodId,
    )
    const timing = buildTiming(
      currentPeriodId,
      this.foundation.dataCutoff,
      targetResolution.workingDays,
    )
    const historical = buildHistoricalBaseline(
      this.foundation,
      currentPeriodId,
      seriesValues,
    )
    const methods = normalizeMethodWeights(
      buildMethods(
        actual,
        timing,
        historical,
        seriesValues,
      ),
      timing.periodStatus,
    )
    const expected = blendMethods(
      methods,
      actual,
      timing.periodStatus,
    )
    const confidence = buildConfidence(
      this.foundation,
      timing,
      historical,
      methods,
      targetResolution,
    )
    const target = buildTargetContext(
      actual,
      expected,
      timing,
      targetResolution.targetRevenue,
    )

    return {
      id: `baseline-v1::${series.id}::${currentPeriodId}`,
      methodologyVersion: 'baseline-v1',
      status: resolveProjectionStatus(methods, confidence),
      granularity,
      entityId: series.entityId,
      entityLabel: series.entityLabel,
      currentPeriodId,
      dataCutoff: this.foundation.dataCutoff,
      metrics: [...this.foundation.metrics],
      actual,
      timing,
      historical,
      methods,
      expected,
      expectedGrossMargin: grossMarginFromValues(expected),
      scenarios: buildScenarios(
        expected,
        actual,
        targetResolution.targetRevenue,
        confidence,
        historical,
        timing,
      ),
      target,
      confidence,
      explainability: buildExplainability(
        methods,
        timing,
        confidence,
        historical,
      ),
    }
  }
}
