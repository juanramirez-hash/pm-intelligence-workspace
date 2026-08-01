import type {
  BusinessProject,
} from '../entities/project'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildProjectBillingReconciliation,
} from '../reconciliation/projectBillingReconciliation'

import type {
  ProjectBillingReconciliationBrandPeriod,
  ProjectBillingReconciliationMetrics,
  ProjectBillingReconciliationPeriod,
  ProjectBillingReconciliationReport,
} from '../reconciliation/projectBillingReconciliation'

import {
  buildTransactionalForecastSeries,
} from './buildTransactionalForecastSeries'

import type {
  ForecastDataFoundation,
  ForecastScenarioId,
} from './forecastContracts'

import {
  ForecastBaselineEngine,
} from './forecastBaselineEngine'

import type {
  ForecastBaselineProjection,
  ForecastConfidenceLevel,
  ForecastConfidenceProfile,
  ForecastMetricValues,
  ForecastTargetContext,
  ForecastTargetStatus,
} from './forecastProjectionContracts'

import type {
  ProjectAwareForecastComponentMetrics,
  ProjectAwareForecastContributionStatus,
  ProjectAwareForecastConversionStatus,
  ProjectAwareForecastMarginSource,
  ProjectAwareForecastPipelineSummary,
  ProjectAwareForecastProjectContribution,
  ProjectAwareForecastProjection,
  ProjectAwareForecastQualityIssue,
  ProjectAwareForecastQualityProfile,
  ProjectAwareForecastReport,
  ProjectAwareForecastScenarioProjection,
  ProjectAwareForecastStatus,
} from './projectAwareForecastContracts'

const EMPTY_VALUES: ForecastMetricValues = {
  revenue: 0,
  grossProfit: 0,
  quantity: 0,
}

interface MarginReference {
  margin: number | null
  source: ProjectAwareForecastMarginSource
}

interface MarginReferences {
  projectByBrand: Map<string, number>
  projectPortfolio: number | null
  businessByBrand: Map<string, number>
  businessPortfolio: number | null
}

interface ContributionBuildResult {
  contributions: ProjectAwareForecastProjectContribution[]
  issues: ProjectAwareForecastQualityIssue[]
}

function roundValue(
  value: number,
  decimals = 2,
): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function roundRatio(
  value: number,
): number {
  return roundValue(value, 4)
}

function safeRatio(
  numerator: number,
  denominator: number,
): number {
  return denominator === 0
    ? 0
    : numerator / denominator
}

function normalizeIdentifier(
  value: string | null | undefined,
): string | null {
  const normalized = value
    ?.trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')

  return normalized || null
}

function addValues(
  ...values: readonly ForecastMetricValues[]
): ForecastMetricValues {
  return values.reduce<ForecastMetricValues>(
    (total, current) => ({
      revenue: total.revenue + current.revenue,
      grossProfit: total.grossProfit + current.grossProfit,
      quantity: total.quantity + current.quantity,
    }),
    { ...EMPTY_VALUES },
  )
}

function grossMargin(
  values: ForecastMetricValues,
): number | null {
  return values.revenue === 0
    ? null
    : roundRatio(values.grossProfit / values.revenue)
}

function metricMargin(
  revenue: number,
  grossProfit: number,
): number | null {
  if (!Number.isFinite(revenue) || revenue <= 0) {
    return null
  }

  const margin = grossProfit / revenue

  return Number.isFinite(margin)
    ? roundRatio(margin)
    : null
}

function toComponentMetrics(
  metrics: ProjectBillingReconciliationMetrics | undefined,
): ProjectAwareForecastComponentMetrics {
  return {
    revenue: metrics?.revenue ?? 0,
    grossProfit: metrics?.grossProfit ?? 0,
    quantity: metrics?.quantity ?? 0,
    documents: metrics?.documents ?? 0,
  }
}

function valuesFromComponent(
  metrics: ProjectAwareForecastComponentMetrics,
): ForecastMetricValues {
  return {
    revenue: metrics.revenue,
    grossProfit: metrics.grossProfit,
    quantity: metrics.quantity,
  }
}

function addIssue(
  issues: ProjectAwareForecastQualityIssue[],
  issue: ProjectAwareForecastQualityIssue,
): void {
  const key = [
    issue.code,
    issue.periodId ?? '',
    issue.projectId ?? '',
    issue.documentNumber ?? '',
    issue.brandId ?? '',
  ].join('::')

  const exists = issues.some((candidate) => [
    candidate.code,
    candidate.periodId ?? '',
    candidate.projectId ?? '',
    candidate.documentNumber ?? '',
    candidate.brandId ?? '',
  ].join('::') === key)

  if (!exists) {
    issues.push(issue)
  }
}

function issue(
  code: string,
  severity: ProjectAwareForecastQualityIssue['severity'],
  message: string,
  context: Partial<ProjectAwareForecastQualityIssue> = {},
): ProjectAwareForecastQualityIssue {
  return {
    code,
    severity,
    message,
    periodId: context.periodId ?? null,
    projectId: context.projectId ?? null,
    documentNumber: context.documentNumber ?? null,
    brandId: context.brandId ?? null,
  }
}

function sumMetrics(
  rows: readonly {
    revenue: number
    grossProfit: number
  }[],
): {
  revenue: number
  grossProfit: number
} {
  return rows.reduce(
    (total, row) => ({
      revenue: total.revenue + row.revenue,
      grossProfit: total.grossProfit + row.grossProfit,
    }),
    {
      revenue: 0,
      grossProfit: 0,
    },
  )
}

function buildMarginReferences(
  model: BusinessDataModel,
  reconciliation: ProjectBillingReconciliationReport,
  baselinePeriodIds: readonly string[],
): MarginReferences {
  const baselinePeriods = new Set(baselinePeriodIds)
  const projectByBrandRows = new Map<
    string,
    Array<{ revenue: number; grossProfit: number }>
  >()

  for (const period of reconciliation.brandPeriods) {
    if (!baselinePeriods.has(period.periodId)) {
      continue
    }

    const rows = projectByBrandRows.get(period.brandId) ?? []
    rows.push(period.project)
    projectByBrandRows.set(period.brandId, rows)
  }

  const projectByBrand = new Map<string, number>()

  for (const [brandId, rows] of projectByBrandRows) {
    const total = sumMetrics(rows)
    const margin = metricMargin(total.revenue, total.grossProfit)

    if (margin !== null) {
      projectByBrand.set(brandId, margin)
    }
  }

  const projectPortfolioMetrics = sumMetrics(
    reconciliation.periods
      .filter((period) => baselinePeriods.has(period.periodId))
      .map((period) => period.project),
  )

  const businessByBrandRows = new Map<
    string,
    Array<{ revenue: number; grossProfit: number }>
  >()

  for (const period of model.brandPeriods.values()) {
    if (!baselinePeriods.has(period.periodId)) {
      continue
    }

    const rows = businessByBrandRows.get(period.brandId) ?? []
    rows.push(period)
    businessByBrandRows.set(period.brandId, rows)
  }

  const businessByBrand = new Map<string, number>()

  for (const [brandId, rows] of businessByBrandRows) {
    const total = sumMetrics(rows)
    const margin = metricMargin(total.revenue, total.grossProfit)

    if (margin !== null) {
      businessByBrand.set(brandId, margin)
    }
  }

  const businessPortfolioMetrics = sumMetrics(
    [...model.periods.values()]
      .filter((period) => baselinePeriods.has(period.id)),
  )

  return {
    projectByBrand,
    projectPortfolio: metricMargin(
      projectPortfolioMetrics.revenue,
      projectPortfolioMetrics.grossProfit,
    ),
    businessByBrand,
    businessPortfolio: metricMargin(
      businessPortfolioMetrics.revenue,
      businessPortfolioMetrics.grossProfit,
    ),
  }
}

function resolveMarginReference(
  brandId: string | null,
  references: MarginReferences,
): MarginReference {
  if (brandId) {
    const projectBrand = references.projectByBrand.get(brandId)

    if (projectBrand !== undefined) {
      return {
        margin: projectBrand,
        source: 'historical-project-brand',
      }
    }
  }

  if (references.projectPortfolio !== null) {
    return {
      margin: references.projectPortfolio,
      source: 'historical-project-portfolio',
    }
  }

  if (brandId) {
    const businessBrand = references.businessByBrand.get(brandId)

    if (businessBrand !== undefined) {
      return {
        margin: businessBrand,
        source: 'historical-brand',
      }
    }
  }

  if (references.businessPortfolio !== null) {
    return {
      margin: references.businessPortfolio,
      source: 'historical-portfolio',
    }
  }

  return {
    margin: null,
    source: 'unavailable',
  }
}

function findExchangeRate(
  model: BusinessDataModel,
  periodId: string,
  sourceCurrency: string,
): number | null {
  const source = normalizeIdentifier(sourceCurrency)

  if (!source) {
    return null
  }

  if (source === 'MXN') {
    return 1
  }

  const rate = [...(model.exchangeRates?.values() ?? [])]
    .find(
      (candidate) =>
        candidate.periodId === periodId &&
        normalizeIdentifier(candidate.sourceCurrency) === source &&
        normalizeIdentifier(candidate.targetCurrency) === 'MXN' &&
        Number.isFinite(candidate.rate) &&
        candidate.rate > 0,
    )

  return rate?.rate ?? null
}

function contributionStatusFor(
  project: BusinessProject,
  blocked: boolean,
): ProjectAwareForecastContributionStatus {
  if (blocked) {
    return project.forecastStage === 'mature'
      ? 'blocked'
      : 'excluded'
  }

  return project.forecastStage === 'mature'
    ? 'included'
    : 'upside'
}

function conversionStatusFor(
  sourceCurrency: string | null,
  amount: number | null,
  rate: number | null,
): ProjectAwareForecastConversionStatus {
  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return 'invalid-amount'
  }

  if (!sourceCurrency) {
    return 'missing-currency'
  }

  if (sourceCurrency === 'MXN') {
    return 'same-currency'
  }

  return rate === null
    ? 'missing-rate'
    : 'converted'
}

function buildProjectContributions(
  model: BusinessDataModel,
  currentPeriodId: string,
  references: MarginReferences,
): ContributionBuildResult {
  const contributions: ProjectAwareForecastProjectContribution[] = []
  const issues: ProjectAwareForecastQualityIssue[] = []

  const projects = [...(model.projects?.values() ?? [])]
    .filter(
      (project) =>
        project.forecastStage === 'mature' ||
        project.forecastStage === 'potential',
    )

  for (const project of projects) {
    const isMature = project.forecastStage === 'mature'
    const belongsToCurrentPeriod =
      project.estimatedBillingPeriodId === currentPeriodId
    const missingMaturePeriod =
      isMature && !project.estimatedBillingPeriodId

    if (!belongsToCurrentPeriod && !missingMaturePeriod) {
      continue
    }

    const brandId = normalizeIdentifier(project.primaryBrandId)
    const sourceCurrency = normalizeIdentifier(project.currency)
    const sourceAmount = project.amountToClose
    const issueCodes: string[] = []
    let blocked = false

    const registerProjectIssue = (
      code: string,
      severity: ProjectAwareForecastQualityIssue['severity'],
      message: string,
    ) => {
      issueCodes.push(code)
      addIssue(
        issues,
        issue(code, severity, message, {
          periodId: project.estimatedBillingPeriodId,
          projectId: project.projectId,
          brandId,
        }),
      )
    }

    if (project.isDuplicate) {
      blocked = true
      registerProjectIssue(
        'DUPLICATE_PROJECT',
        isMature ? 'blocking' : 'warning',
        `El proyecto ${project.projectId} está marcado como repetido y no puede contribuir al forecast.`,
      )
    }

    if (!project.estimatedBillingDate) {
      blocked = true
      registerProjectIssue(
        'PROJECT_BILLING_DATE_MISSING',
        isMature ? 'blocking' : 'warning',
        `El proyecto ${project.projectId} no tiene fecha estimada de facturación.`,
      )
    }

    if (
      sourceAmount === null ||
      !Number.isFinite(sourceAmount) ||
      sourceAmount <= 0
    ) {
      blocked = true
      registerProjectIssue(
        'PROJECT_AMOUNT_TO_CLOSE_INVALID',
        isMature ? 'blocking' : 'warning',
        `El proyecto ${project.projectId} no tiene un Monto por cerrar válido.`,
      )
    }

    if (!sourceCurrency) {
      blocked = true
      registerProjectIssue(
        'PROJECT_CURRENCY_MISSING',
        isMature ? 'blocking' : 'warning',
        `El proyecto ${project.projectId} no tiene moneda declarada.`,
      )
    }

    if (!brandId) {
      registerProjectIssue(
        'PROJECT_PRIMARY_BRAND_MISSING',
        'warning',
        `El proyecto ${project.projectId} no tiene Marca principal; solo podrá verse a nivel portafolio.`,
      )
    }

    const rate =
      project.estimatedBillingPeriodId && sourceCurrency
        ? findExchangeRate(
            model,
            project.estimatedBillingPeriodId,
            sourceCurrency,
          )
        : null

    const conversionStatus = conversionStatusFor(
      sourceCurrency,
      sourceAmount,
      rate,
    )

    if (conversionStatus === 'missing-rate') {
      blocked = true
      registerProjectIssue(
        'EXCHANGE_RATE_MISSING',
        isMature ? 'blocking' : 'warning',
        `Falta el tipo de cambio ${sourceCurrency}→MXN para ${project.estimatedBillingPeriodId}.`,
      )
    }

    const convertedAmountMxn =
      !blocked && sourceAmount !== null && rate !== null
        ? roundValue(sourceAmount * rate)
        : null

    const probability = project.closingProbability === null
      ? null
      : Math.max(0, Math.min(1, project.closingProbability))

    if (
      project.forecastStage === 'potential' &&
      probability === null
    ) {
      registerProjectIssue(
        'PROJECT_CLOSING_PROBABILITY_MISSING',
        'warning',
        `El proyecto potencial ${project.projectId} no tiene Probabilidad de cierre; no se calcula upside ponderado.`,
      )
    }

    const marginReference = resolveMarginReference(
      brandId,
      references,
    )

    const estimatedGrossProfitMxn =
      convertedAmountMxn !== null &&
      marginReference.margin !== null
        ? roundValue(
            convertedAmountMxn * marginReference.margin,
          )
        : null

    if (
      convertedAmountMxn !== null &&
      marginReference.margin === null
    ) {
      registerProjectIssue(
        'PROJECT_MARGIN_REFERENCE_UNAVAILABLE',
        'warning',
        `No existe margen histórico utilizable para estimar GP del proyecto ${project.projectId}.`,
      )
    }

    contributions.push({
      id: `project-aware::${project.projectId}::${currentPeriodId}`,
      projectId: project.projectId,
      projectName: project.name,
      brandId,
      statusCode: project.statusCode,
      statusLabel: project.statusLabel,
      forecastStage: project.forecastStage,
      contributionStatus: contributionStatusFor(project, blocked),
      estimatedBillingDate: project.estimatedBillingDate,
      periodId: project.estimatedBillingPeriodId,
      closingProbability: probability,
      sourceCurrency,
      sourceAmount,
      exchangeRate: rate,
      convertedAmountMxn,
      weightedAmountMxn:
        convertedAmountMxn !== null && probability !== null
          ? roundValue(convertedAmountMxn * probability)
          : null,
      conversionStatus,
      estimatedGrossMargin: marginReference.margin,
      estimatedGrossProfitMxn,
      marginSource: marginReference.source,
      issueCodes: [...new Set(issueCodes)],
    })
  }

  return {
    contributions: contributions.sort(
      (left, right) =>
        (right.convertedAmountMxn ?? 0) -
          (left.convertedAmountMxn ?? 0) ||
        left.projectId.localeCompare(right.projectId),
    ),
    issues,
  }
}

function relevantReconciliationIssues(
  model: BusinessDataModel,
  foundation: ForecastDataFoundation,
  reconciliation: ProjectBillingReconciliationReport,
): ProjectAwareForecastQualityIssue[] {
  const issues: ProjectAwareForecastQualityIssue[] = []
  const relevantPeriods = new Set([
    ...foundation.history.baselinePeriodIds,
    ...(foundation.currentPeriodId
      ? [foundation.currentPeriodId]
      : []),
  ])

  if (!model.salesTransactionLines || model.salesTransactionLines.size === 0) {
    addIssue(
      issues,
      issue(
        'SALES_TRANSACTIONS_NOT_AVAILABLE',
        'blocking',
        'No existen líneas transaccionales de ventas para separar facturación de proyectos.',
      ),
    )
  }

  if (!model.projectBillings || model.projectBillings.size === 0) {
    addIssue(
      issues,
      issue(
        'PROJECT_BILLINGS_NOT_AVAILABLE',
        'blocking',
        'No existe facturación de proyectos para limpiar la serie transaccional.',
      ),
    )
  }

  if (!model.projects || model.projects.size === 0) {
    addIssue(
      issues,
      issue(
        'PROJECT_PIPELINE_NOT_AVAILABLE',
        'blocking',
        'No existe snapshot de proyectos para incorporar pipeline pendiente.',
      ),
    )
  }

  for (const document of reconciliation.documents) {
    const relevant =
      relevantPeriods.has(document.projectBillingPeriodId) ||
      document.salesPeriodIds.some((periodId) => relevantPeriods.has(periodId))

    if (!relevant) {
      continue
    }

    if (document.status === 'missing_sales_document') {
      addIssue(
        issues,
        issue(
          'PROJECT_BILLING_NOT_RECONCILED',
          'blocking',
          `El documento ${document.documentNumber} de facturación de proyectos no existe en Ventas.`,
          {
            periodId: document.projectBillingPeriodId,
            projectId: document.projectId,
            documentNumber: document.documentNumber,
            brandId: document.brandIds[0] ?? null,
          },
        ),
      )
    }

    if (document.status === 'conflict') {
      addIssue(
        issues,
        issue(
          'PROJECT_BILLING_DOCUMENT_CONFLICT',
          'blocking',
          `El documento ${document.documentNumber} está asociado a más de un proyecto activo.`,
          {
            periodId: document.projectBillingPeriodId,
            projectId: document.projectId,
            documentNumber: document.documentNumber,
            brandId: document.brandIds[0] ?? null,
          },
        ),
      )
    }

    if (
      document.status === 'voided' &&
      reconciliation.quality.voidedDocumentsPresentInSales.includes(
        document.documentNumber,
      )
    ) {
      addIssue(
        issues,
        issue(
          'VOIDED_PROJECT_DOCUMENT_PRESENT_IN_SALES',
          'blocking',
          `El documento anulado ${document.documentNumber} continúa presente en Ventas.`,
          {
            periodId: document.projectBillingPeriodId,
            projectId: document.projectId,
            documentNumber: document.documentNumber,
          },
        ),
      )
    }

    if (document.creditNoteSignAnomaly) {
      addIssue(
        issues,
        issue(
          'PROJECT_CREDIT_NOTE_SIGN_ANOMALY',
          'blocking',
          `La nota de crédito ${document.documentNumber} tiene Revenue positivo en Ventas.`,
          {
            periodId: document.projectBillingPeriodId,
            projectId: document.projectId,
            documentNumber: document.documentNumber,
          },
        ),
      )
    }

    if (document.periodMismatch) {
      addIssue(
        issues,
        issue(
          'PROJECT_BILLING_PERIOD_MISMATCH',
          'warning',
          `El documento ${document.documentNumber} difiere entre periodo de facturación y periodo de Ventas.`,
          {
            periodId: document.projectBillingPeriodId,
            projectId: document.projectId,
            documentNumber: document.documentNumber,
          },
        ),
      )
    }

    if (document.customerMismatch) {
      addIssue(
        issues,
        issue(
          'PROJECT_BILLING_CUSTOMER_MISMATCH',
          'warning',
          `El documento ${document.documentNumber} presenta una diferencia de cliente.`,
          {
            periodId: document.projectBillingPeriodId,
            projectId: document.projectId,
            documentNumber: document.documentNumber,
          },
        ),
      )
    }

    if (document.orphanProject) {
      addIssue(
        issues,
        issue(
          'PROJECT_BILLING_ORPHAN_PROJECT',
          'warning',
          `El proyecto ${document.projectId} tiene facturación histórica sin registro maestro vigente.`,
          {
            periodId: document.projectBillingPeriodId,
            projectId: document.projectId,
            documentNumber: document.documentNumber,
          },
        ),
      )
    }
  }

  return issues
}

function filterContributions(
  contributions: readonly ProjectAwareForecastProjectContribution[],
  brandId: string | null,
): ProjectAwareForecastProjectContribution[] {
  return brandId === null
    ? [...contributions]
    : contributions.filter(
        (contribution) => contribution.brandId === brandId,
      )
}

function buildPipelineSummary(
  contributions: readonly ProjectAwareForecastProjectContribution[],
): ProjectAwareForecastPipelineSummary {
  const mature = contributions.filter(
    (contribution) => contribution.forecastStage === 'mature',
  )
  const matureIncluded = mature.filter(
    (contribution) => contribution.contributionStatus === 'included',
  )
  const potential = contributions.filter(
    (contribution) => contribution.forecastStage === 'potential',
  )
  const potentialAvailable = potential.filter(
    (contribution) => contribution.contributionStatus === 'upside',
  )

  const matureWithGrossProfit = matureIncluded.filter(
    (contribution) => contribution.estimatedGrossProfitMxn !== null,
  )

  return {
    matureProjects: mature.length,
    matureIncludedProjects: matureIncluded.length,
    matureBlockedProjects: mature.filter(
      (contribution) => contribution.contributionStatus === 'blocked',
    ).length,
    matureRevenueMxn: roundValue(
      matureIncluded.reduce(
        (total, contribution) =>
          total + (contribution.convertedAmountMxn ?? 0),
        0,
      ),
    ),
    matureEstimatedGrossProfitMxn: roundValue(
      matureWithGrossProfit.reduce(
        (total, contribution) =>
          total + (contribution.estimatedGrossProfitMxn ?? 0),
        0,
      ),
    ),
    potentialProjects: potential.length,
    potentialAvailableProjects: potentialAvailable.length,
    potentialRevenueMxn: roundValue(
      potentialAvailable.reduce(
        (total, contribution) =>
          total + (contribution.convertedAmountMxn ?? 0),
        0,
      ),
    ),
    potentialWeightedRevenueMxn: roundValue(
      potentialAvailable.reduce(
        (total, contribution) =>
          total + (contribution.weightedAmountMxn ?? 0),
        0,
      ),
    ),
    potentialEstimatedGrossProfitMxn: roundValue(
      potentialAvailable.reduce(
        (total, contribution) =>
          total + (contribution.estimatedGrossProfitMxn ?? 0),
        0,
      ),
    ),
    missingExchangeRates: contributions.filter(
      (contribution) => contribution.conversionStatus === 'missing-rate',
    ).length,
    grossProfitEstimateCoverage: safeRatio(
      matureWithGrossProfit.length,
      matureIncluded.length,
    ),
    quantityAvailable: false,
  }
}

function buildQualityProfile(
  issues: readonly ProjectAwareForecastQualityIssue[],
  contributions: readonly ProjectAwareForecastProjectContribution[],
  reconciliationCoverage: number,
): ProjectAwareForecastQualityProfile {
  const pipeline = buildPipelineSummary(contributions)

  return {
    issues: issues.map((candidate) => ({ ...candidate })),
    blockingIssues: issues.filter(
      (candidate) => candidate.severity === 'blocking',
    ).length,
    warnings: issues.filter(
      (candidate) => candidate.severity === 'warning',
    ).length,
    information: issues.filter(
      (candidate) => candidate.severity === 'information',
    ).length,
    reconciliationCoverage,
    matureProjectsEvaluated: pipeline.matureProjects,
    matureProjectsIncluded: pipeline.matureIncludedProjects,
    matureProjectsBlocked: pipeline.matureBlockedProjects,
    potentialProjectsEvaluated: pipeline.potentialProjects,
    potentialProjectsAvailable: pipeline.potentialAvailableProjects,
    missingExchangeRates: pipeline.missingExchangeRates,
    grossProfitEstimateCoverage: pipeline.grossProfitEstimateCoverage,
  }
}

function resolveTargetStatus(
  actualRevenue: number,
  targetRevenue: number | null,
  expectedAttainment: number | null,
): ForecastTargetStatus {
  if (targetRevenue === null || expectedAttainment === null) {
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

function buildTarget(
  baseline: ForecastBaselineProjection,
  actualTotal: ProjectAwareForecastComponentMetrics,
  expected: ForecastMetricValues,
): ForecastTargetContext {
  const targetRevenue = baseline.target.revenue
  const expectedAttainment =
    targetRevenue !== null && targetRevenue > 0
      ? roundRatio(expected.revenue / targetRevenue)
      : null
  const revenueGap = targetRevenue === null
    ? null
    : roundValue(Math.max(0, targetRevenue - actualTotal.revenue))
  const remainingDays = baseline.timing.remainingWorkingDays
  const requiredDailyRevenue =
    revenueGap !== null &&
    remainingDays !== null &&
    remainingDays > 0
      ? roundValue(revenueGap / remainingDays)
      : revenueGap === 0
        ? 0
        : null

  return {
    revenue: targetRevenue,
    expectedAttainment,
    revenueGap,
    requiredDailyRevenue,
    status: resolveTargetStatus(
      actualTotal.revenue,
      targetRevenue,
      expectedAttainment,
    ),
  }
}

function confidenceLevel(
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
  baseline: ForecastBaselineProjection,
  quality: ProjectAwareForecastQualityProfile,
  pipeline: ProjectAwareForecastPipelineSummary,
): ForecastConfidenceProfile {
  let score = baseline.confidence.score
  const signals = [...baseline.confidence.signals]
  const limitations = [...baseline.confidence.limitations]

  if (quality.reconciliationCoverage >= 0.9999) {
    score += 8
    signals.push('La facturación de proyectos relevante está conciliada al 100% contra Ventas.')
  } else {
    score -= Math.min(
      20,
      (1 - quality.reconciliationCoverage) * 30,
    )
    limitations.push(
      `La cobertura documental de facturación de proyectos es ${(quality.reconciliationCoverage * 100).toFixed(1)}%.`,
    )
  }

  if (pipeline.matureIncludedProjects > 0) {
    score += 5
    signals.push(
      `${pipeline.matureIncludedProjects} proyectos maduros respaldan el cierre pendiente.`,
    )
  }

  if (quality.blockingIssues > 0) {
    score -= 30
    limitations.push(
      `${quality.blockingIssues} incidencias bloqueantes impiden considerar oficial el forecast combinado.`,
    )
  }

  if (
    pipeline.matureIncludedProjects > 0 &&
    pipeline.grossProfitEstimateCoverage < 1
  ) {
    score -= 5
    limitations.push(
      'El GP del pipeline maduro no cuenta con referencia de margen para todos los proyectos.',
    )
  }

  const normalized = roundValue(
    Math.max(0, Math.min(100, score)),
  )

  return {
    score: normalized,
    level: confidenceLevel(normalized),
    signals: [...new Set(signals)],
    limitations: [...new Set(limitations)],
  }
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
  baseline: ForecastBaselineProjection,
  actualProjectBilling: ProjectAwareForecastComponentMetrics,
  pipeline: ProjectAwareForecastPipelineSummary,
  official: boolean,
): ProjectAwareForecastScenarioProjection[] {
  const billingValues = valuesFromComponent(actualProjectBilling)
  const pipelineValues: ForecastMetricValues = {
    revenue: pipeline.matureRevenueMxn,
    grossProfit: pipeline.matureEstimatedGrossProfitMxn,
    quantity: 0,
  }

  return baseline.scenarios.map((scenario) => {
    const values = addValues(
      scenario.values,
      billingValues,
      pipelineValues,
    )
    const targetRevenue = baseline.target.revenue

    return {
      id: scenario.id,
      label: scenarioLabel(scenario.id),
      transactional: { ...scenario.values },
      projectBillingActual: billingValues,
      maturePipeline: pipelineValues,
      values: {
        revenue: roundValue(values.revenue),
        grossProfit: roundValue(values.grossProfit),
        quantity: roundValue(values.quantity),
      },
      grossMargin: grossMargin(values),
      targetAttainment:
        targetRevenue !== null && targetRevenue > 0
          ? roundRatio(values.revenue / targetRevenue)
          : null,
      official,
    }
  })
}

function resolveStatus(
  baseline: ForecastBaselineProjection,
  quality: ProjectAwareForecastQualityProfile,
): ProjectAwareForecastStatus {
  if (baseline.status === 'unavailable') {
    return 'unavailable'
  }

  if (quality.blockingIssues > 0) {
    return 'blocked'
  }

  if (
    baseline.status === 'partial' ||
    quality.warnings > 0 ||
    quality.grossProfitEstimateCoverage < 1
  ) {
    return 'partial'
  }

  return 'ready'
}

function buildProjection(
  baseline: ForecastBaselineProjection,
  granularity: 'portfolio' | 'brand',
  entityId: string | null,
  entityLabel: string,
  period: ProjectBillingReconciliationPeriod | undefined,
  brandPeriod: ProjectBillingReconciliationBrandPeriod | undefined,
  contributions: readonly ProjectAwareForecastProjectContribution[],
  globalIssues: readonly ProjectAwareForecastQualityIssue[],
  reconciliationCoverage: number,
): ProjectAwareForecastProjection {
  const selectedContributions = filterContributions(
    contributions,
    entityId,
  )
  const pipeline = buildPipelineSummary(selectedContributions)
  const actualTotal = toComponentMetrics(
    granularity === 'portfolio'
      ? period?.total
      : brandPeriod?.total,
  )
  const actualTransactional = toComponentMetrics(
    granularity === 'portfolio'
      ? period?.transactional
      : brandPeriod?.transactional,
  )
  const actualProjectBilling = toComponentMetrics(
    granularity === 'portfolio'
      ? period?.project
      : brandPeriod?.project,
  )

  const relevantIssues = globalIssues.filter(
    (candidate) =>
      entityId === null ||
      candidate.brandId === null ||
      candidate.brandId === entityId,
  )
  const quality = buildQualityProfile(
    relevantIssues,
    selectedContributions,
    reconciliationCoverage,
  )
  const status = resolveStatus(baseline, quality)
  const officialAvailable = status === 'ready' || status === 'partial'
  const scenarios = buildScenarios(
    baseline,
    actualProjectBilling,
    pipeline,
    officialAvailable,
  )
  const expected = scenarios.find(
    (scenario) => scenario.id === 'expected',
  )?.values ?? { ...EMPTY_VALUES }
  const target = buildTarget(baseline, actualTotal, expected)
  const confidence = buildConfidence(baseline, quality, pipeline)

  const explainability = [
    'Forecast total = baseline transaccional + facturación real de proyectos + pipeline maduro pendiente.',
    'El baseline transaccional se calcula después de restar documentos de proyectos conciliados de la historia y del mes actual.',
    'Los proyectos 05 Esperando OC y 06 Surtido parcialmente se incluyen al 100% usando Monto por cerrar y Fecha estimada de facturación.',
    'Los proyectos 03 y 04 se muestran como upside ponderado y no forman parte del forecast oficial.',
    'La facturación real de proyectos usa Revenue y GP de Ventas en MXN; el importe del reporte de proyectos solo se conserva como evidencia.',
    `El escenario esperado contiene ${roundValue(expected.revenue)} MXN: ${roundValue(baseline.expected.revenue)} transaccional, ${roundValue(actualProjectBilling.revenue)} facturado por proyectos y ${roundValue(pipeline.matureRevenueMxn)} de pipeline maduro.`,
  ]

  const limitations = [
    ...confidence.limitations,
    'El pipeline abierto no contiene detalle confiable de SKU o cantidad; su contribución a unidades es cero y no modifica cobertura por producto.',
    'El pipeline pendiente se asigna a Marca principal; la facturación real se asigna a la marca efectiva de cada artículo vendido.',
    'El GP del pipeline es una estimación basada en margen histórico y no un GP contractual confirmado.',
    'FW-009 publica el motor y los contratos; la interfaz y exportación definitivas se actualizarán en FW-010.',
  ]

  return {
    id: `project-aware-v1::${granularity}::${entityId ?? 'portfolio'}::${baseline.currentPeriodId}`,
    methodologyVersion: 'project-aware-v1',
    status,
    officialAvailable,
    granularity,
    entityId,
    entityLabel,
    currentPeriodId: baseline.currentPeriodId,
    dataCutoff: baseline.dataCutoff,
    transactionalBaseline: baseline,
    actualTotal,
    actualTransactional,
    actualProjectBilling,
    pipeline,
    expected,
    expectedGrossMargin: grossMargin(expected),
    scenarios,
    target,
    confidence,
    quality,
    projectContributions: selectedContributions.map((contribution) => ({
      ...contribution,
      issueCodes: [...contribution.issueCodes],
    })),
    explainability,
    limitations: [...new Set(limitations)],
  }
}

function emptyQuality(
  issues: readonly ProjectAwareForecastQualityIssue[],
): ProjectAwareForecastQualityProfile {
  return buildQualityProfile(issues, [], 0)
}

export class ProjectAwareForecastEngine {
  private readonly model: BusinessDataModel

  private readonly foundation: ForecastDataFoundation

  constructor(
    model: BusinessDataModel,
    foundation: ForecastDataFoundation,
  ) {
    this.model = model
    this.foundation = foundation
  }

  build(): ProjectAwareForecastReport {
    const currentPeriodId = this.foundation.currentPeriodId
    const baseIssues: ProjectAwareForecastQualityIssue[] = []

    if (!currentPeriodId) {
      addIssue(
        baseIssues,
        issue(
          'FORECAST_CURRENT_PERIOD_UNAVAILABLE',
          'blocking',
          'No existe un periodo actual para construir Project-Aware Forecast.',
        ),
      )

      return {
        generatedAt: new Date().toISOString(),
        methodologyVersion: 'project-aware-v1',
        status: 'unavailable',
        officialAvailable: false,
        currentPeriodId: null,
        dataCutoff: this.foundation.dataCutoff,
        portfolio: null,
        brands: [],
        quality: emptyQuality(baseIssues),
        explainability: [],
        limitations: [
          'Project-Aware Forecast requiere un periodo actual de ventas.',
        ],
      }
    }

    const reconciliation = buildProjectBillingReconciliation(this.model)
    const reconciliationIssues = relevantReconciliationIssues(
      this.model,
      this.foundation,
      reconciliation,
    )
    const marginReferences = buildMarginReferences(
      this.model,
      reconciliation,
      this.foundation.history.baselinePeriodIds,
    )
    const contributionResult = buildProjectContributions(
      this.model,
      currentPeriodId,
      marginReferences,
    )
    const issues = [
      ...reconciliationIssues,
      ...contributionResult.issues,
    ]
    const currentReconciliation = reconciliation.periods.find(
      (period) => period.periodId === currentPeriodId,
    )
    const relevantCoveragePeriods = reconciliation.periods.filter(
      (period) =>
        this.foundation.history.baselinePeriodIds.includes(period.periodId) ||
        period.periodId === currentPeriodId,
    )
    const relevantMatchedDocuments = relevantCoveragePeriods.reduce(
      (total, period) => total + period.matchedBillingDocuments,
      0,
    )
    const relevantActiveDocuments = relevantCoveragePeriods.reduce(
      (total, period) =>
        total +
        period.matchedBillingDocuments +
        period.missingBillingDocuments,
      0,
    )
    const reconciliationCoverage = relevantActiveDocuments === 0
      ? 1
      : relevantMatchedDocuments / relevantActiveDocuments

    const baselineEngine = new ForecastBaselineEngine(
      this.model,
      this.foundation,
    )
    const portfolioSeries = buildTransactionalForecastSeries(
      this.model,
      reconciliation,
      'portfolio',
    )[0]
    const portfolioBaseline = portfolioSeries
      ? baselineEngine.project(portfolioSeries)
      : undefined

    if (!portfolioBaseline) {
      addIssue(
        issues,
        issue(
          'TRANSACTIONAL_BASELINE_UNAVAILABLE',
          'blocking',
          'No fue posible construir el baseline transaccional del portafolio.',
          { periodId: currentPeriodId },
        ),
      )

      return {
        generatedAt: new Date().toISOString(),
        methodologyVersion: 'project-aware-v1',
        status: 'unavailable',
        officialAvailable: false,
        currentPeriodId,
        dataCutoff: this.foundation.dataCutoff,
        portfolio: null,
        brands: [],
        quality: emptyQuality(issues),
        explainability: [],
        limitations: [
          'No existe un baseline transaccional utilizable.',
        ],
      }
    }

    const portfolio = buildProjection(
      portfolioBaseline,
      'portfolio',
      null,
      'Portafolio',
      currentReconciliation,
      undefined,
      contributionResult.contributions,
      issues,
      reconciliationCoverage,
    )

    const brandPeriods = new Map(
      reconciliation.brandPeriods
        .filter((period) => period.periodId === currentPeriodId)
        .map((period) => [period.brandId, period]),
    )

    const brands = buildTransactionalForecastSeries(
      this.model,
      reconciliation,
      'brand',
    )
      .map((series) => {
        const baseline = baselineEngine.project(series)
        const brandId = series.entityId

        if (!baseline || !brandId) {
          return null
        }

        return buildProjection(
          baseline,
          'brand',
          brandId,
          series.entityLabel,
          undefined,
          brandPeriods.get(brandId),
          contributionResult.contributions,
          issues,
          reconciliationCoverage,
        )
      })
      .filter(
        (projection): projection is ProjectAwareForecastProjection =>
          projection !== null,
      )
      .sort(
        (left, right) =>
          right.expected.revenue - left.expected.revenue ||
          left.entityLabel.localeCompare(right.entityLabel, 'es-MX'),
      )

    return {
      generatedAt: new Date().toISOString(),
      methodologyVersion: 'project-aware-v1',
      status: portfolio.status,
      officialAvailable: portfolio.officialAvailable,
      currentPeriodId,
      dataCutoff: this.foundation.dataCutoff,
      portfolio,
      brands,
      quality: portfolio.quality,
      explainability: [...portfolio.explainability],
      limitations: [...portfolio.limitations],
    }
  }
}
