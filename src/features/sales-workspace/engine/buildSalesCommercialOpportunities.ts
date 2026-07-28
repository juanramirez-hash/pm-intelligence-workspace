import {
  calculateOpportunityScore,
  classifyOpportunityPriority,
} from '../../../core/business/opportunityRadar'

import type {
  BusinessRepository,
  SalesSegmentationDimension,
  SalesSegmentationFilter,
} from '../../../core/business/repository'

import type {
  SalesCommercialOpportunity,
  SalesCommercialOpportunitySummary,
  SalesWorkspaceBrandPerformanceItem,
  SalesWorkspaceFilters,
  SalesWorkspacePerformance,
} from '../types'

interface BuildSalesCommercialOpportunitiesInput {
  repository: BusinessRepository
  filters: SalesWorkspaceFilters
  currentPeriodId: string
  comparisonPeriodId: string | null
  currentRevenue: number
  performance: SalesWorkspacePerformance
  brandPerformance: SalesWorkspaceBrandPerformanceItem[]
}

interface DimensionVariance {
  id: string
  label: string
  currentRevenue: number
  comparisonRevenue: number
  variance: number
  variancePercentage: number | null
}

function clamp(
  value: number,
): number {
  return Math.min(
    100,
    Math.max(0, value),
  )
}

function calculateVariation(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return null
  }

  return (
    (current - previous) /
    Math.abs(previous)
  ) * 100
}

function formatCurrency(
  value: number,
): string {
  return value.toLocaleString(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    },
  )
}

function formatPercentage(
  value: number | null,
  signed = false,
): string {
  if (value === null) {
    return 'No calculable'
  }

  return `${value.toLocaleString('es-MX', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    signDisplay:
      signed ? 'always' : 'auto',
  })}%`
}

function buildSegmentationFilter(
  filters: SalesWorkspaceFilters,
  periodId: string,
): SalesSegmentationFilter {
  return {
    periodIds: [periodId],
    brandIds: filters.brandIds,
    customerIds: filters.customerIds,
    productIds: filters.productIds,
    locationIds: filters.locationIds,
    salesRepresentativeIds:
      filters.salesRepresentativeIds,
    searchTerm:
      filters.searchTerm ?? null,
  }
}

function buildDimensionVariances(
  repository: BusinessRepository,
  dimension: Extract<
    SalesSegmentationDimension,
    'customer' | 'product'
  >,
  filters: SalesWorkspaceFilters,
  currentPeriodId: string,
  comparisonPeriodId: string,
): DimensionVariance[] {
  const currentGroups =
    repository.salesSegmentation.groupBy(
      dimension,
      buildSegmentationFilter(
        filters,
        currentPeriodId,
      ),
    )

  const comparisonGroups =
    repository.salesSegmentation.groupBy(
      dimension,
      buildSegmentationFilter(
        filters,
        comparisonPeriodId,
      ),
    )

  const currentById =
    new Map(
      currentGroups.map(
        (group) => [group.id, group],
      ),
    )

  const comparisonById =
    new Map(
      comparisonGroups.map(
        (group) => [group.id, group],
      ),
    )

  const ids =
    new Set([
      ...currentById.keys(),
      ...comparisonById.keys(),
    ])

  return [...ids].map((id) => {
    const current =
      currentById.get(id)

    const comparison =
      comparisonById.get(id)

    const currentRevenue =
      current?.revenue ?? 0

    const comparisonRevenue =
      comparison?.revenue ?? 0

    return {
      id,
      label:
        current?.label ??
        comparison?.label ??
        id,
      currentRevenue,
      comparisonRevenue,
      variance:
        currentRevenue -
        comparisonRevenue,
      variancePercentage:
        calculateVariation(
          currentRevenue,
          comparisonRevenue,
        ),
    }
  })
}

function normalizeImpact(
  impact: number,
  referenceRevenue: number,
): number {
  if (impact <= 0) {
    return 0
  }

  if (referenceRevenue <= 0) {
    return 60
  }

  return clamp(
    (impact / referenceRevenue) * 500,
  )
}

function buildOpportunity(
  opportunity: Omit<
    SalesCommercialOpportunity,
    'priority' | 'score'
  >,
  referenceRevenue: number,
  scoreFactors: {
    urgency: number
    probability: number
    coverage: number
    risk: number
  },
): SalesCommercialOpportunity {
  const score =
    calculateOpportunityScore({
      impact: normalizeImpact(
        opportunity.impact,
        referenceRevenue,
      ),
      urgency:
        scoreFactors.urgency,
      probability:
        scoreFactors.probability,
      coverage:
        scoreFactors.coverage,
      risk:
        scoreFactors.risk,
    })

  return {
    ...opportunity,
    score,
    priority:
      classifyOpportunityPriority(
        score,
      ),
  }
}

function buildTargetGapOpportunities(
  items: SalesWorkspaceBrandPerformanceItem[],
  performance: SalesWorkspacePerformance,
  referenceRevenue: number,
): SalesCommercialOpportunity[] {
  const remainingWorkingDays =
    performance.pace.remainingWorkingDays

  return items
    .filter(
      (item) =>
        item.targetRevenue !== null &&
        item.targetRevenue > 0 &&
        item.projectedAttainment !== null &&
        item.projectedAttainment < 100,
    )
    .map((item) => {
      const projectedRevenue =
        item.projectedRevenue ??
        item.actualRevenue

      const impact =
        Math.max(
          (item.targetRevenue ?? 0) -
            projectedRevenue,
          0,
        )

      const dailyRevenueRequired =
        remainingWorkingDays !== null &&
        remainingWorkingDays > 0
          ? Math.max(
              (item.targetRevenue ?? 0) -
                item.actualRevenue,
              0,
            ) /
            remainingWorkingDays
          : null

      return buildOpportunity(
        {
          id: `sales-opportunity.target-gap.${item.brandId}`,
          type: 'target-gap',
          entityType: 'brand',
          entityId: item.brandId,
          entityLabel: item.brandName,
          title: `Cerrar brecha de ${item.brandName}`,
          description:
            `La proyección actual quedaría en ${formatPercentage(item.projectedAttainment)} de la cuota mensual.`,
          recommendedAction:
            dailyRevenueRequired === null
              ? 'Priorizar cartera, proyectos abiertos y productos de mayor contribución para recuperar la cuota.'
              : `Activar un plan de cierre que genere al menos ${formatCurrency(dailyRevenueRequired)} por día laboral restante.`,
          impact,
          confidence: 92,
          effort: 68,
          currentRevenue:
            item.actualRevenue,
          comparisonRevenue: null,
          variance:
            item.varianceToPlan,
          variancePercentage:
            item.attainment === null
              ? null
              : item.attainment - 100,
          dailyRevenueRequired,
          evidence: [
            {
              label: 'Venta actual',
              value:
                formatCurrency(
                  item.actualRevenue,
                ),
            },
            {
              label: 'Objetivo',
              value:
                formatCurrency(
                  item.targetRevenue ?? 0,
                ),
            },
            {
              label: 'Proyección',
              value:
                formatCurrency(
                  projectedRevenue,
                ),
            },
          ],
        },
        referenceRevenue,
        {
          urgency: 94,
          probability: 86,
          coverage: 72,
          risk: 90,
        },
      )
    })
    .filter(
      (opportunity) =>
        opportunity.impact > 0,
    )
    .sort(
      (left, right) =>
        right.impact - left.impact,
    )
    .slice(0, 4)
}

function buildMarginProtectionOpportunities(
  items: SalesWorkspaceBrandPerformanceItem[],
  referenceRevenue: number,
): SalesCommercialOpportunity[] {
  return items
    .filter(
      (item) =>
        item.actualRevenue > 0 &&
        item.targetGrossMargin !== null &&
        item.marginVariancePoints !== null &&
        item.marginVariancePoints < -1,
    )
    .map((item) => {
      const marginGap =
        Math.abs(
          item.marginVariancePoints ?? 0,
        )

      const impact =
        item.actualRevenue *
        (marginGap / 100)

      return buildOpportunity(
        {
          id: `sales-opportunity.margin-protection.${item.brandId}`,
          type: 'margin-protection',
          entityType: 'brand',
          entityId: item.brandId,
          entityLabel: item.brandName,
          title: `Proteger margen de ${item.brandName}`,
          description:
            `El margen está ${formatPercentage(item.marginVariancePoints, true)} por debajo del objetivo y expone Gross Profit recuperable.`,
          recommendedAction:
            'Revisar descuentos, mezcla de producto y operaciones con margen inferior al objetivo antes de autorizar nuevas condiciones.',
          impact,
          confidence: 90,
          effort: 52,
          currentRevenue:
            item.actualRevenue,
          comparisonRevenue: null,
          variance:
            item.marginVariancePoints,
          variancePercentage: null,
          dailyRevenueRequired: null,
          evidence: [
            {
              label: 'Margen actual',
              value:
                formatPercentage(
                  item.currentGrossMargin,
                ),
            },
            {
              label: 'Margen objetivo',
              value:
                formatPercentage(
                  item.targetGrossMargin,
                ),
            },
            {
              label: 'GP recuperable',
              value:
                formatCurrency(impact),
            },
          ],
        },
        referenceRevenue,
        {
          urgency: 82,
          probability: 88,
          coverage: 62,
          risk: 84,
        },
      )
    })
    .sort(
      (left, right) =>
        right.impact - left.impact,
    )
    .slice(0, 3)
}

function buildRecoveryOpportunities(
  variances: DimensionVariance[],
  referenceRevenue: number,
): SalesCommercialOpportunity[] {
  const minimumImpact =
    Math.max(
      referenceRevenue * 0.0025,
      1,
    )

  return variances
    .filter(
      (item) =>
        item.variance < 0 &&
        Math.abs(item.variance) >=
          minimumImpact &&
        (
          item.variancePercentage === null ||
          item.variancePercentage <= -10
        ),
    )
    .map((item) => {
      const impact =
        Math.abs(item.variance)

      const inactive =
        item.currentRevenue === 0

      return buildOpportunity(
        {
          id: `sales-opportunity.customer-recovery.${item.id}`,
          type: 'customer-recovery',
          entityType: 'customer',
          entityId: item.id,
          entityLabel: item.label,
          title: inactive
            ? `Reactivar a ${item.label}`
            : `Recuperar compra de ${item.label}`,
          description:
            inactive
              ? `El cliente no registra venta en el periodo actual después de comprar ${formatCurrency(item.comparisonRevenue)} en el periodo comparable.`
              : `El cliente redujo su compra en ${formatCurrency(impact)} frente al periodo comparable.`,
          recommendedAction:
            inactive
              ? 'Asignar contacto inmediato, validar causa de inactividad y preparar una propuesta basada en su compra anterior.'
              : 'Revisar productos dejados de comprar, cotizaciones abiertas y condiciones comerciales para recuperar la brecha.',
          impact,
          confidence:
            inactive ? 88 : 92,
          effort:
            inactive ? 64 : 52,
          currentRevenue:
            item.currentRevenue,
          comparisonRevenue:
            item.comparisonRevenue,
          variance:
            item.variance,
          variancePercentage:
            item.variancePercentage,
          dailyRevenueRequired: null,
          evidence: [
            {
              label: 'Venta actual',
              value:
                formatCurrency(
                  item.currentRevenue,
                ),
            },
            {
              label: 'Periodo comparable',
              value:
                formatCurrency(
                  item.comparisonRevenue,
                ),
            },
            {
              label: 'Variación',
              value:
                formatPercentage(
                  item.variancePercentage,
                  true,
                ),
            },
          ],
        },
        referenceRevenue,
        {
          urgency:
            inactive ? 94 : 86,
          probability:
            inactive ? 78 : 88,
          coverage:
            inactive ? 60 : 74,
          risk:
            inactive ? 92 : 82,
        },
      )
    })
    .sort(
      (left, right) =>
        right.impact - left.impact,
    )
    .slice(0, 4)
}

function buildGrowthOpportunities(
  variances: DimensionVariance[],
  entityType: 'customer' | 'product',
  referenceRevenue: number,
): SalesCommercialOpportunity[] {
  const minimumImpact =
    Math.max(
      referenceRevenue * 0.0025,
      1,
    )

  return variances
    .filter(
      (item) =>
        item.variance > 0 &&
        item.variance >= minimumImpact &&
        (
          item.variancePercentage === null ||
          item.variancePercentage >= 15
        ),
    )
    .map((item) => {
      const isCustomer =
        entityType === 'customer'

      return buildOpportunity(
        {
          id: `sales-opportunity.${isCustomer ? 'customer-growth' : 'product-growth'}.${item.id}`,
          type:
            isCustomer
              ? 'customer-growth'
              : 'product-growth',
          entityType,
          entityId: item.id,
          entityLabel: item.label,
          title: isCustomer
            ? `Escalar crecimiento de ${item.label}`
            : `Acelerar rotación de ${item.label}`,
          description:
            `${isCustomer ? 'El cliente' : 'El producto'} creció ${formatCurrency(item.variance)} frente al periodo comparable y muestra tracción comercial aprovechable.`,
          recommendedAction:
            isCustomer
              ? 'Identificar la siguiente compra probable, ampliar el portafolio vendido y asegurar seguimiento antes de que termine el periodo.'
              : 'Asegurar disponibilidad, revisar productos complementarios y activar comunicación comercial sobre la demanda observada.',
          impact:
            item.variance,
          confidence: 86,
          effort: 44,
          currentRevenue:
            item.currentRevenue,
          comparisonRevenue:
            item.comparisonRevenue,
          variance:
            item.variance,
          variancePercentage:
            item.variancePercentage,
          dailyRevenueRequired: null,
          evidence: [
            {
              label: 'Venta actual',
              value:
                formatCurrency(
                  item.currentRevenue,
                ),
            },
            {
              label: 'Crecimiento',
              value:
                formatCurrency(
                  item.variance,
                ),
            },
            {
              label: 'Variación',
              value:
                formatPercentage(
                  item.variancePercentage,
                  true,
                ),
            },
          ],
        },
        referenceRevenue,
        {
          urgency: 58,
          probability: 86,
          coverage: 66,
          risk: 34,
        },
      )
    })
    .sort(
      (left, right) =>
        right.impact - left.impact,
    )
    .slice(0, 3)
}

function compareOpportunities(
  left: SalesCommercialOpportunity,
  right: SalesCommercialOpportunity,
): number {
  return (
    right.score - left.score ||
    right.impact - left.impact ||
    left.entityLabel.localeCompare(
      right.entityLabel,
      'es-MX',
    )
  )
}

export function buildSalesCommercialOpportunities({
  repository,
  filters,
  currentPeriodId,
  comparisonPeriodId,
  currentRevenue,
  performance,
  brandPerformance,
}: BuildSalesCommercialOpportunitiesInput): SalesCommercialOpportunitySummary {
  const targetGap =
    buildTargetGapOpportunities(
      brandPerformance,
      performance,
      currentRevenue,
    )

  const marginProtection =
    buildMarginProtectionOpportunities(
      brandPerformance,
      currentRevenue,
    )

  let customerRecovery:
    SalesCommercialOpportunity[] = []

  let customerGrowth:
    SalesCommercialOpportunity[] = []

  let productGrowth:
    SalesCommercialOpportunity[] = []

  if (comparisonPeriodId) {
    const customerVariances =
      buildDimensionVariances(
        repository,
        'customer',
        filters,
        currentPeriodId,
        comparisonPeriodId,
      )

    const productVariances =
      buildDimensionVariances(
        repository,
        'product',
        filters,
        currentPeriodId,
        comparisonPeriodId,
      )

    customerRecovery =
      buildRecoveryOpportunities(
        customerVariances,
        currentRevenue,
      )

    customerGrowth =
      buildGrowthOpportunities(
        customerVariances,
        'customer',
        currentRevenue,
      )

    productGrowth =
      buildGrowthOpportunities(
        productVariances,
        'product',
        currentRevenue,
      )
  }

  const opportunities = [
    ...targetGap,
    ...customerRecovery,
    ...marginProtection,
    ...customerGrowth,
    ...productGrowth,
  ]
    .sort(compareOpportunities)
    .slice(0, 12)

  return {
    available:
      opportunities.length > 0,
    unavailableReason:
      opportunities.length > 0
        ? null
        : comparisonPeriodId
          ? 'No se detectaron brechas o señales comerciales que superen los umbrales de oportunidad para el segmento seleccionado.'
          : 'No existe un periodo comparable y tampoco hay objetivos evaluables para construir oportunidades comerciales.',
    totalImpact:
      opportunities.reduce(
        (total, opportunity) =>
          total + opportunity.impact,
        0,
      ),
    totalCount:
      opportunities.length,
    criticalCount:
      opportunities.filter(
        (opportunity) =>
          opportunity.priority ===
          'critical',
      ).length,
    highCount:
      opportunities.filter(
        (opportunity) =>
          opportunity.priority ===
          'high',
      ).length,
    requiredDailyRevenue:
      performance.pace
        .requiredDailyRevenue,
    opportunities,
  }
}
