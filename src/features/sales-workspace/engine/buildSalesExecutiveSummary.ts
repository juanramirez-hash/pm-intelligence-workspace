import type {
  SalesCommercialOpportunitySummary,
  SalesExecutiveFinding,
  SalesExecutiveSummary,
  SalesVarianceContributionAnalysis,
  SalesWorkspaceActiveFilter,
  SalesWorkspaceComparison,
  SalesWorkspacePerformance,
  SalesWorkspaceReconciliation,
  SalesWorkspaceSnapshot,
} from '../types'

interface BuildSalesExecutiveSummaryInput {
  available: boolean
  selectedPeriodLabel: string
  current: SalesWorkspaceSnapshot | null
  comparison: SalesWorkspaceComparison
  performance: SalesWorkspacePerformance
  varianceContribution: SalesVarianceContributionAnalysis
  commercialOpportunities: SalesCommercialOpportunitySummary
  reconciliation: SalesWorkspaceReconciliation
  activeFilters: SalesWorkspaceActiveFilter[]
}

const currencyFormatter =
  new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    },
  )

const percentageFormatter =
  new Intl.NumberFormat(
    'es-MX',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )

function formatCurrency(
  value: number,
): string {
  return currencyFormatter.format(value)
}

function formatPercentage(
  value: number,
): string {
  return `${percentageFormatter.format(value)}%`
}

function formatSignedPercentage(
  value: number,
): string {
  const prefix = value > 0 ? '+' : ''

  return `${prefix}${formatPercentage(value)}`
}

function buildComparisonSentence(
  comparison: SalesWorkspaceComparison,
): string {
  if (
    comparison.revenueVariation === null ||
    comparison.previousPeriodLabel === null
  ) {
    return 'No existe un periodo comparable suficiente para medir la variación de venta.'
  }

  const variation =
    comparison.revenueVariation

  if (variation > 0) {
    return `La venta creció ${formatSignedPercentage(variation)} frente a ${comparison.previousPeriodLabel}.`
  }

  if (variation < 0) {
    return `La venta retrocedió ${formatSignedPercentage(variation)} frente a ${comparison.previousPeriodLabel}.`
  }

  return `La venta se mantuvo estable frente a ${comparison.previousPeriodLabel}.`
}

function buildRunRateSentence(
  performance: SalesWorkspacePerformance,
): string | null {
  const projectedAttainment =
    performance.pace.projectedAttainment

  const projectedPeriodEnd =
    performance.pace.projectedPeriodEnd

  if (
    projectedAttainment === null ||
    projectedPeriodEnd === null
  ) {
    return null
  }

  return `El cierre por ritmo actual apunta a ${formatCurrency(projectedPeriodEnd)}, equivalente a ${formatPercentage(projectedAttainment)} de la cuota mensual.`
}

function buildOutlook(
  performance: SalesWorkspacePerformance,
): string {
  if (!performance.available) {
    return performance.unavailableReason ??
      'El desempeño contra cuota no está disponible para el segmento seleccionado.'
  }

  const forecast =
    performance.forecast

  const runRateSentence =
    buildRunRateSentence(performance)

  if (
    forecast.officialAvailable &&
    forecast.expectedRevenue !== null
  ) {
    const attainmentSentence =
      forecast.expectedAttainment === null
        ? ''
        : `, equivalente a ${formatPercentage(forecast.expectedAttainment)} de la cuota mensual`

    const forecastSentence =
      `El Forecast esperado es ${formatCurrency(forecast.expectedRevenue)}${attainmentSentence}.`

    return runRateSentence
      ? `${forecastSentence} ${runRateSentence}`
      : forecastSentence
  }

  if (
    forecast.available &&
    !forecast.officialAvailable
  ) {
    const forecastStatusSentence =
      `El Forecast Project-Aware está en estado ${forecast.status} y no está disponible como forecast oficial.`

    return runRateSentence
      ? `${forecastStatusSentence} ${runRateSentence}`
      : forecastStatusSentence
  }

  if (runRateSentence) {
    return runRateSentence
  }

  return 'La cuota está disponible, pero aún no existe información suficiente para estimar el cierre mensual.'
}

function buildFilterContext(
  activeFilters: SalesWorkspaceActiveFilter[],
): string {
  if (activeFilters.length === 0) {
    return 'Vista consolidada sin segmentación adicional.'
  }

  return `Segmento activo: ${activeFilters
    .map((filter) => filter.label)
    .join(' · ')}.`
}

function buildPerformanceFinding(
  performance: SalesWorkspacePerformance,
): SalesExecutiveFinding | null {
  if (!performance.available) {
    return null
  }

  const attainment =
    performance.revenue.attainment

  if (attainment === null) {
    return null
  }

  const forecastAttainment =
    performance.forecast.officialAvailable
      ? performance.forecast.expectedAttainment
      : null

  const runRateAttainment =
    performance.pace.projectedAttainment

  const referenceAttainment =
    forecastAttainment ??
    runRateAttainment

  const detail =
    forecastAttainment !== null
      ? `Forecast esperado en ${formatPercentage(forecastAttainment)} de la cuota.`
      : runRateAttainment !== null
        ? `Cierre por ritmo actual en ${formatPercentage(runRateAttainment)}.`
        : 'Sin estimación de cierre disponible.'

  return {
    id: 'performance',
    label: 'Cumplimiento de cuota',
    value: formatPercentage(attainment),
    detail,
    tone:
      attainment >= 100
        ? 'positive'
        : referenceAttainment !== null &&
            referenceAttainment >= 100
          ? 'attention'
          : 'critical',
  }
}

function buildVarianceFindings(
  analysis: SalesVarianceContributionAnalysis,
): SalesExecutiveFinding[] {
  if (!analysis.available) {
    return []
  }

  const findings: SalesExecutiveFinding[] = []

  const positive = analysis.brands.positive[0]
  const negative = analysis.brands.negative[0]

  if (positive) {
    findings.push({
      id: 'positive-driver',
      label: 'Principal impulsor',
      value: positive.label,
      detail: `Aporta ${formatCurrency(positive.revenueVariation)} a la variación de venta.`,
      tone: 'positive',
    })
  }

  if (negative) {
    findings.push({
      id: 'negative-driver',
      label: 'Principal deterioro',
      value: negative.label,
      detail: `Resta ${formatCurrency(Math.abs(negative.revenueVariation))} a la variación de venta.`,
      tone: 'critical',
    })
  }

  return findings
}

function buildOpportunityFinding(
  summary: SalesCommercialOpportunitySummary,
): SalesExecutiveFinding | null {
  const opportunity =
    summary.opportunities[0]

  if (!summary.available || !opportunity) {
    return null
  }

  return {
    id: 'top-opportunity',
    label: 'Prioridad comercial',
    value: opportunity.entityLabel,
    detail: `${opportunity.title}. Impacto estimado: ${formatCurrency(opportunity.impact)}.`,
    tone:
      opportunity.priority === 'critical'
        ? 'critical'
        : opportunity.priority === 'high'
          ? 'attention'
          : 'neutral',
  }
}

function buildReconciliationFinding(
  reconciliation: SalesWorkspaceReconciliation,
): SalesExecutiveFinding | null {
  if (reconciliation.totalRows === 0) {
    return null
  }

  return {
    id: 'reconciliation',
    label: 'Conciliación Product Master',
    value: formatPercentage(reconciliation.matchRate),
    detail: `${reconciliation.unmatchedRows} filas sin correspondencia y ${reconciliation.ambiguousRows} ambiguas.`,
    tone:
      reconciliation.matchRate >= 95
        ? 'positive'
        : reconciliation.matchRate >= 80
          ? 'attention'
          : 'critical',
  }
}

export function buildSalesExecutiveSummary({
  available,
  selectedPeriodLabel,
  current,
  comparison,
  performance,
  varianceContribution,
  commercialOpportunities,
  reconciliation,
  activeFilters,
}: BuildSalesExecutiveSummaryInput): SalesExecutiveSummary {
  if (!available || !current) {
    return {
      available: false,
      title: 'Resumen ejecutivo no disponible',
      overview: 'Importa información de ventas para generar una lectura ejecutiva del periodo.',
      outlook: 'Sin datos suficientes para calcular desempeño, Forecast y prioridades.',
      filterContext: buildFilterContext(activeFilters),
      findings: [],
    }
  }

  const findings: SalesExecutiveFinding[] = []

  const performanceFinding =
    buildPerformanceFinding(performance)

  const opportunityFinding =
    buildOpportunityFinding(
      commercialOpportunities,
    )

  const reconciliationFinding =
    buildReconciliationFinding(
      reconciliation,
    )

  if (performanceFinding) {
    findings.push(performanceFinding)
  }

  findings.push(
    ...buildVarianceFindings(
      varianceContribution,
    ),
  )

  if (opportunityFinding) {
    findings.push(opportunityFinding)
  }

  if (
    reconciliationFinding &&
    findings.length < 4
  ) {
    findings.push(reconciliationFinding)
  }

  return {
    available: true,
    title: `Resumen ejecutivo · ${selectedPeriodLabel}`,
    overview: `La venta del periodo fue ${formatCurrency(current.revenue)}, con Gross Profit de ${formatCurrency(current.grossProfit)} y margen de ${formatPercentage(current.grossMargin)}. ${buildComparisonSentence(comparison)}`,
    outlook: buildOutlook(performance),
    filterContext: buildFilterContext(activeFilters),
    findings: findings.slice(0, 4),
  }
}