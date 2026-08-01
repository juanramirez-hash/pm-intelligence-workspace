import type {
  BusinessDataModel,
} from '../models'

import type {
  ProjectBillingReconciliationReport,
} from '../reconciliation/projectBillingReconciliation'

import type {
  ForecastObservation,
  ForecastSeries,
} from './forecastContracts'

function zeroObservation(
  periodId: string,
): ForecastObservation {
  return {
    periodId,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
  }
}

function portfolioSeries(
  model: BusinessDataModel,
  reconciliation: ProjectBillingReconciliationReport,
): ForecastSeries[] {
  const byPeriod = new Map(
    reconciliation.periods.map((period) => [
      period.periodId,
      period.transactional,
    ]),
  )

  const observations = [...model.periods.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((period) => {
      const transactional = byPeriod.get(period.id)

      return transactional
        ? {
            periodId: period.id,
            revenue: transactional.revenue,
            grossProfit: transactional.grossProfit,
            quantity: transactional.quantity,
            documents: transactional.documents,
          }
        : {
            periodId: period.id,
            revenue: period.revenue,
            grossProfit: period.grossProfit,
            quantity: period.quantity,
            documents: period.documents,
          }
    })

  return observations.length > 0
    ? [
        {
          id: 'forecast::transactional::portfolio',
          granularity: 'portfolio',
          entityId: null,
          entityLabel: 'Portafolio transaccional',
          observations,
        },
      ]
    : []
}

function brandSeries(
  model: BusinessDataModel,
  reconciliation: ProjectBillingReconciliationReport,
): ForecastSeries[] {
  const periodIds = [...model.periods.keys()].sort()
  const brandIds = new Set<string>([
    ...model.brands.keys(),
    ...[...model.brandPeriods.values()].map((period) => period.brandId),
    ...reconciliation.brandPeriods.map((period) => period.brandId),
  ])

  const reconciled = new Map(
    reconciliation.brandPeriods.map((period) => [
      `${period.periodId}::${period.brandId}`,
      period.transactional,
    ]),
  )

  return [...brandIds]
    .sort()
    .map((brandId) => {
      const observations = periodIds.map((periodId) => {
        const metrics = reconciled.get(`${periodId}::${brandId}`)
        const fallback = model.brandPeriods.get(`${periodId}::${brandId}`)

        if (metrics) {
          return {
            periodId,
            revenue: metrics.revenue,
            grossProfit: metrics.grossProfit,
            quantity: metrics.quantity,
            documents: metrics.documents,
          }
        }

        if (fallback) {
          return {
            periodId,
            revenue: fallback.revenue,
            grossProfit: fallback.grossProfit,
            quantity: fallback.quantity,
            documents: fallback.documents,
          }
        }

        return zeroObservation(periodId)
      })

      return {
        id: `forecast::transactional::brand::${brandId}`,
        granularity: 'brand' as const,
        entityId: brandId,
        entityLabel: model.brands.get(brandId)?.name ?? brandId,
        observations,
      }
    })
}

export function buildTransactionalForecastSeries(
  model: BusinessDataModel,
  reconciliation: ProjectBillingReconciliationReport,
  granularity: 'portfolio' | 'brand',
): ForecastSeries[] {
  return granularity === 'portfolio'
    ? portfolioSeries(model, reconciliation)
    : brandSeries(model, reconciliation)
}
