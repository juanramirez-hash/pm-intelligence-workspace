import type {
  ForecastInventoryIntelligenceReport,
  ForecastProductInventoryInsight,
} from '../../forecast'

import type {
  PurchasingInventoryAnalyticsReport,
  PurchasingInventoryItem,
} from '../purchasingInventory'

export type PurchasingForecastSignalType =
  | 'potential-overbuy-review'

export type PurchasingForecastSignalPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export interface PurchasingForecastSignal {
  id: string
  type: PurchasingForecastSignalType
  priority: PurchasingForecastSignalPriority
  score: number
  title: string
  rationale: string
  evidence: Record<
    string,
    string | number | boolean | null
  >
}

export interface PurchasingForecastItem {
  productId: string
  itemCode: string
  productName: string | null
  brandId: string | null

  forecast:
    ForecastProductInventoryInsight

  purchasing:
    PurchasingInventoryItem['purchasing']

  signals:
    PurchasingForecastSignal[]
}

export interface PurchasingForecastSummary {
  forecastProducts: number
  purchasingItems: number
  matchedProducts: number
  potentialOverbuyReviews: number
}

export interface PurchasingForecastQuality {
  purchasingItemsWithoutProductId: number
  purchasingItemsWithoutForecastMatch: number
}

export interface PurchasingForecastAnalyticsReport {
  generatedAt: string
  forecastGeneratedAt: string
  purchasingGeneratedAt: string

  summary: PurchasingForecastSummary
  quality: PurchasingForecastQuality

  items: PurchasingForecastItem[]
}

export interface PurchasingForecastAnalyticsInput {
  forecastInventory:
    ForecastInventoryIntelligenceReport

  purchasingInventory:
    PurchasingInventoryAnalyticsReport
}

function normalizeProductId(
  value: string | null | undefined,
): string | null {
  const normalized =
    value
      ?.trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

  return normalized || null
}

function clampScore(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  )
}

function priorityFromScore(
  score: number,
): PurchasingForecastSignalPriority {
  if (score >= 85) {
    return 'critical'
  }

  if (score >= 65) {
    return 'high'
  }

  if (score >= 40) {
    return 'medium'
  }

  return 'low'
}

function buildPotentialOverbuySignal(
  forecast:
    ForecastProductInventoryInsight,
  purchasing:
    PurchasingInventoryItem,
): PurchasingForecastSignal | null {
  if (
    forecast.coverage
      .availableStatus !==
      'excess' ||
    purchasing.purchasing
      .openPurchaseOrders <= 0
  ) {
    return null
  }

  const coverageMonths =
    forecast.coverage
      .availableMonths

  const excessMonths =
    coverageMonths === null
      ? 0
      : Math.max(
          0,
          coverageMonths - 3,
        )

  const score =
    clampScore(
      60 +
      Math.min(
        15,
        excessMonths * 5,
      ) +
      Math.min(
        10,
        purchasing.purchasing
          .openPurchaseOrders * 2,
      ),
    )

  return {
    id:
      `potential-overbuy-review::${forecast.productId}`,

    type:
      'potential-overbuy-review',

    priority:
      priorityFromScore(score),

    score,

    title:
      'Revisar posible sobreabastecimiento',

    rationale:
      'La disponibilidad actual ya presenta cobertura excedente frente al forecast y existen órdenes de compra abiertas. La cantidad de PO se usa como evidencia nominal y no como saldo pendiente confirmado.',

    evidence: {
      availableCoverageMonths:
        coverageMonths,

      expectedQuantity:
        forecast.demand
          .expectedQuantity,

      available:
        forecast.inventory
          .available,

      inventoryValue:
        forecast.inventory
          .inventoryValue,

      openPurchaseOrders:
        purchasing.purchasing
          .openPurchaseOrders,

      openPurchaseOrderLines:
        purchasing.purchasing
          .openPurchaseOrderLines,

      openPurchaseOrderQuantity:
        purchasing.purchasing
          .openPurchaseOrderQuantity,

      openPurchaseOrderQuantitySemantics:
        'nominal-open-line-quantity',

      overduePurchaseOrders:
        purchasing.purchasing
          .overduePurchaseOrders,

      dueNext7DaysPurchaseOrders:
        purchasing.purchasing
          .dueNext7DaysPurchaseOrders,
    },
  }
}

function cloneForecastInsight(
  insight:
    ForecastProductInventoryInsight,
): ForecastProductInventoryInsight {
  return {
    ...insight,

    demand: {
      ...insight.demand,
    },

    inventory: {
      ...insight.inventory,
    },

    coverage: {
      ...insight.coverage,
    },

    catalog: {
      ...insight.catalog,
    },

    replacement:
      insight.replacement
        ? {
            ...insight.replacement,
          }
        : null,

    signals:
      insight.signals.map(
        (signal) => ({
          ...signal,
          evidence: {
            ...signal.evidence,
          },
        }),
      ),

    explainability: [
      ...insight.explainability,
    ],

    limitations: [
      ...insight.limitations,
    ],
  }
}

function clonePurchasingProfile(
  purchasing:
    PurchasingInventoryItem['purchasing'],
): PurchasingInventoryItem['purchasing'] {
  return {
    ...purchasing,

    suppliers: [
      ...purchasing.suppliers,
    ],

    buyers: [
      ...purchasing.buyers,
    ],
  }
}

export function buildPurchasingForecastAnalytics(
  input:
    PurchasingForecastAnalyticsInput,
): PurchasingForecastAnalyticsReport {
  const forecastByProductId =
    new Map<
      string,
      ForecastProductInventoryInsight
    >()

  for (
    const forecast of
    input.forecastInventory.items
  ) {
    const productId =
      normalizeProductId(
        forecast.productId,
      )

    if (!productId) {
      continue
    }

    forecastByProductId.set(
      productId,
      forecast,
    )
  }

  let purchasingItemsWithoutProductId =
    0

  let purchasingItemsWithoutForecastMatch =
    0

  const items:
    PurchasingForecastItem[] = []

  for (
    const purchasing of
    input.purchasingInventory.items
  ) {
    const productId =
      normalizeProductId(
        purchasing.productId,
      )

    if (!productId) {
      purchasingItemsWithoutProductId +=
        1

      continue
    }

    const forecast =
      forecastByProductId.get(
        productId,
      )

    if (!forecast) {
      purchasingItemsWithoutForecastMatch +=
        1

      continue
    }

    const signals:
      PurchasingForecastSignal[] = []

    const potentialOverbuy =
      buildPotentialOverbuySignal(
        forecast,
        purchasing,
      )

    if (potentialOverbuy) {
      signals.push(
        potentialOverbuy,
      )
    }

    items.push({
      productId,
      itemCode:
        purchasing.itemCode,

      productName:
        purchasing.productName ??
        forecast.productName ??
        null,

      brandId:
        purchasing.brandId ??
        forecast.brandId ??
        null,

      forecast:
        cloneForecastInsight(
          forecast,
        ),

      purchasing:
        clonePurchasingProfile(
          purchasing.purchasing,
        ),

      signals,
    })
  }

  items.sort(
    (left, right) => {
      const leftScore =
        left.signals[0]?.score ??
        0

      const rightScore =
        right.signals[0]?.score ??
        0

      return (
        rightScore -
          leftScore ||
        left.productId.localeCompare(
          right.productId,
        )
      )
    },
  )

  return {
    generatedAt:
      new Date().toISOString(),

    forecastGeneratedAt:
      input.forecastInventory
        .generatedAt,

    purchasingGeneratedAt:
      input.purchasingInventory
        .generatedAt,

    summary: {
      forecastProducts:
        input.forecastInventory
          .items.length,

      purchasingItems:
        input.purchasingInventory
          .items.length,

      matchedProducts:
        items.length,

      potentialOverbuyReviews:
        items.filter(
          (item) =>
            item.signals.some(
              (signal) =>
                signal.type ===
                'potential-overbuy-review',
            ),
        ).length,
    },

    quality: {
      purchasingItemsWithoutProductId,
      purchasingItemsWithoutForecastMatch,
    },

    items,
  }
}