import {
  buildPurchasingForecastAnalytics,
} from '../analytics/purchasingForecast'

import type {
  PurchasingForecastAnalyticsReport,
  PurchasingForecastItem,
} from '../analytics/purchasingForecast'

import type {
  ForecastProductInventoryInsight,
} from '../forecast'

import type {
  PurchasingInventoryItem,
} from '../analytics/purchasingInventory'

import type {
  ForecastInventoryIntelligenceReport,
} from '../forecast'

import type {
  PurchasingInventoryAnalyticsReport,
} from '../analytics/purchasingInventory'

function normalizeProductId(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
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

function cloneItem(
  item:
    PurchasingForecastItem,
): PurchasingForecastItem {
  return {
    ...item,

    forecast:
      cloneForecastInsight(
        item.forecast,
      ),

    purchasing:
      clonePurchasingProfile(
        item.purchasing,
      ),

    signals:
      item.signals.map(
        (signal) => ({
          ...signal,
          evidence: {
            ...signal.evidence,
          },
        }),
      ),
  }
}

export class PurchasingForecastQueries {
  private readonly report:
    PurchasingForecastAnalyticsReport

  constructor(
    forecastInventory:
      ForecastInventoryIntelligenceReport,

    purchasingInventory:
      PurchasingInventoryAnalyticsReport,
  ) {
    this.report =
      buildPurchasingForecastAnalytics({
        forecastInventory,
        purchasingInventory,
      })
  }

  getReport():
  PurchasingForecastAnalyticsReport {
    return {
      ...this.report,

      summary: {
        ...this.report.summary,
      },

      quality: {
        ...this.report.quality,
      },

      items:
        this.report.items.map(
          cloneItem,
        ),
    }
  }

  getItems():
  PurchasingForecastItem[] {
    return this.report.items.map(
      cloneItem,
    )
  }

  getPotentialOverbuyReviews():
  PurchasingForecastItem[] {
    return this.report.items
      .filter(
        (item) =>
          item.signals.some(
            (signal) =>
              signal.type ===
              'potential-overbuy-review',
          ),
      )
      .map(
        cloneItem,
      )
  }

  findByProductId(
    productId: string,
  ):
  PurchasingForecastItem |
  undefined {
    const normalized =
      normalizeProductId(
        productId,
      )

    const item =
      this.report.items.find(
        (candidate) =>
          candidate.productId ===
          normalized,
      )

    return item
      ? cloneItem(item)
      : undefined
  }
}