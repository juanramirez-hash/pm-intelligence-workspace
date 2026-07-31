import type {
  BusinessDataModel,
} from '../models'

import type {
  ForecastGranularity,
  ForecastObservation,
  ForecastSeries,
} from './forecastContracts'

interface MutableSeries {
  id: string
  granularity: ForecastGranularity
  entityId: string | null
  entityLabel: string
  observations: ForecastObservation[]
}

function sortObservations(
  observations: ForecastObservation[],
): ForecastObservation[] {
  return observations.sort(
    (left, right) => left.periodId.localeCompare(right.periodId),
  )
}

function finalizeSeries(
  series: MutableSeries,
): ForecastSeries {
  return {
    ...series,
    observations: sortObservations(series.observations),
  }
}

function portfolioSeries(
  model: BusinessDataModel,
): ForecastSeries[] {
  if (model.periods.size === 0) {
    return []
  }

  return [
    finalizeSeries({
      id: 'portfolio::all',
      granularity: 'portfolio',
      entityId: null,
      entityLabel: 'Portafolio',
      observations: [...model.periods.values()].map((period) => ({
        periodId: period.id,
        revenue: period.revenue,
        grossProfit: period.grossProfit,
        quantity: period.quantity,
        documents: period.documents,
      })),
    }),
  ]
}

function brandSeries(
  model: BusinessDataModel,
): ForecastSeries[] {
  const series = new Map<string, MutableSeries>()

  for (const period of model.brandPeriods.values()) {
    const brand = model.brands.get(period.brandId)
    const current = series.get(period.brandId) ?? {
      id: `brand::${period.brandId}`,
      granularity: 'brand' as const,
      entityId: period.brandId,
      entityLabel: brand?.name ?? period.brandId,
      observations: [],
    }

    current.observations.push({
      periodId: period.periodId,
      revenue: period.revenue,
      grossProfit: period.grossProfit,
      quantity: period.quantity,
      documents: period.documents,
    })
    series.set(period.brandId, current)
  }

  return [...series.values()]
    .map(finalizeSeries)
    .sort((left, right) => left.entityLabel.localeCompare(right.entityLabel))
}

function productSeries(
  model: BusinessDataModel,
): ForecastSeries[] {
  const series = new Map<string, MutableSeries>()

  for (const period of model.productPeriods.values()) {
    const product = model.products.get(period.productId)
    const current = series.get(period.productId) ?? {
      id: `product::${period.productId}`,
      granularity: 'product' as const,
      entityId: period.productId,
      entityLabel:
        product?.name ??
        product?.model ??
        period.productId,
      observations: [],
    }

    current.observations.push({
      periodId: period.periodId,
      revenue: period.revenue,
      grossProfit: period.grossProfit,
      quantity: period.quantity,
      documents: period.documents,
    })
    series.set(period.productId, current)
  }

  return [...series.values()]
    .map(finalizeSeries)
    .sort((left, right) => left.entityLabel.localeCompare(right.entityLabel))
}

function customerSeries(
  model: BusinessDataModel,
): ForecastSeries[] {
  const series = new Map<string, MutableSeries>()

  for (const period of model.customerPeriods.values()) {
    const customer = model.customers.get(period.customerId)
    const current = series.get(period.customerId) ?? {
      id: `customer::${period.customerId}`,
      granularity: 'customer' as const,
      entityId: period.customerId,
      entityLabel: customer?.name ?? period.customerId,
      observations: [],
    }

    current.observations.push({
      periodId: period.periodId,
      revenue: period.revenue,
      grossProfit: period.grossProfit,
      quantity: period.quantity,
      documents: period.documents,
    })
    series.set(period.customerId, current)
  }

  return [...series.values()]
    .map(finalizeSeries)
    .sort((left, right) => left.entityLabel.localeCompare(right.entityLabel))
}

export function buildForecastSeries(
  model: BusinessDataModel,
  granularity: ForecastGranularity,
): ForecastSeries[] {
  if (granularity === 'portfolio') {
    return portfolioSeries(model)
  }

  if (granularity === 'brand') {
    return brandSeries(model)
  }

  if (granularity === 'product') {
    return productSeries(model)
  }

  return customerSeries(model)
}
