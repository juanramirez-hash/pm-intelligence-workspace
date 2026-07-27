import type {
  BusinessRepository,
} from '../../business'

import type {
  BusinessCustomerPeriod,
} from '../../business/entities/customerPeriod'

import type {
  BusinessCustomerBrandPeriod,
} from '../../business/entities/customerBrandPeriod'

import type {
  CustomerDecisionModel,
  CustomerPeriodMetrics,
  CustomerRiskLevel,
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

function resolveRisk(
  inactiveMonths: number,
): {
  level: CustomerRiskLevel
  label: string
  probability: number
} {
  if (inactiveMonths >= 3) {
    return {
      level: 'critical',
      label: 'Riesgo crítico',
      probability: 35,
    }
  }

  if (inactiveMonths >= 2) {
    return {
      level: 'high',
      label: 'Riesgo alto',
      probability: 55,
    }
  }

  if (inactiveMonths === 1) {
    return {
      level: 'medium',
      label: 'Atención',
      probability: 72,
    }
  }

  return {
    level: 'low',
    label: 'Activo',
    probability: 88,
  }
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

    const risk =
      resolveRisk(inactiveMonths)

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

    const diagnosis =
      inactiveMonths >= 2
        ? `${customer.name} no registra recompra de ${selectedBrandName} durante ${inactiveMonths} meses.`
        : inactiveMonths === 1
          ? `${customer.name} no registra compra en el periodo actual para ${selectedBrandName}.`
          : `${customer.name} mantiene actividad vigente en ${selectedBrandName}.`

    const recommendedAction =
      inactiveMonths >= 2
        ? 'Contactar al cliente, revisar su última mezcla de productos y construir una propuesta de recuperación específica.'
        : inactiveProductIds.length > 0
          ? 'Revisar productos abandonados y preparar una acción de recompra o venta cruzada.'
          : 'Mantener seguimiento comercial y ampliar la penetración de productos dentro de la cuenta.'

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
      current: toMetrics(
        currentSource,
        currentPeriodId,
      ),
      previous: priorPeriodId
        ? toMetrics(
            previousSource,
            priorPeriodId,
          )
        : null,
      totalRevenue,
      totalGrossProfit,
      grossMargin:
        totalRevenue > 0
          ? totalGrossProfit /
            totalRevenue
          : null,
      lastActivePeriodId,
      inactiveMonths,
      riskLevel: risk.level,
      riskLabel: risk.label,
      recoveryProbability:
        risk.probability,
      recoveryPotential:
        averageRecentRevenue * 0.65,
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
