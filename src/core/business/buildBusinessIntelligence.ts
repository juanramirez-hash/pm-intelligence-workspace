import {
  buildCustomerIntelligence,
} from '../analytics/customers'

import {
  buildBrandIntelligence,
} from '../analytics/brands'

import {
  buildInsights,
} from '../insights/buildInsights'

import type {
  NormalizedSalesRow,
} from '../../features/data-center/importers/sales/salesTypes'

import type {
  NormalizedProductMasterRow,
} from '../../features/data-center/importers/products/productMasterTypes'

import type {
  NormalizedInventoryRow,
} from '../../features/data-center/importers/inventory/inventoryTypes'

import type {
  NormalizedPurchaseOrderRow,
} from '../../features/data-center/importers/purchases/purchaseOrderTypes'

import type {
  NormalizedPurchaseRequestRow,
} from '../../features/data-center/importers/purchase-requests/purchaseRequestTypes'

import type {
  NormalizedProjectRow,
} from '../../features/data-center/importers/projects/projectTypes'

import type {
  NormalizedProjectBillingRow,
} from '../../features/data-center/importers/project-billings/projectBillingTypes'

import type {
  NormalizedExchangeRateRow,
} from '../../features/data-center/importers/exchange-rates/exchangeRateTypes'

import type {
  NormalizedPricingRow,
} from '../../features/data-center/importers/pricing/pricingTypes'

import type {
  BusinessIntelligenceModel,
} from './businessIntelligenceModel'

import type {
  BusinessBrandTargetInput,
} from './targets'

import {
  buildBusinessDataModel,
} from './builders'

import {
  BusinessRepository,
} from './repository'

import {
  buildBusinessMetrics,
} from './metrics'

export interface BuildBusinessIntelligenceOptions {
  brandTargets?: readonly BusinessBrandTargetInput[]
  productMaster?: readonly NormalizedProductMasterRow[]
  inventory?: readonly NormalizedInventoryRow[]
  purchaseOrders?: readonly NormalizedPurchaseOrderRow[]
  purchaseRequests?: readonly NormalizedPurchaseRequestRow[]
  projects?: readonly NormalizedProjectRow[]
  projectBillings?: readonly NormalizedProjectBillingRow[]
  exchangeRates?: readonly NormalizedExchangeRateRow[]
  prices?: readonly NormalizedPricingRow[]
}

export function buildBusinessIntelligence(
  rows: NormalizedSalesRow[],
  options: BuildBusinessIntelligenceOptions = {},
): BusinessIntelligenceModel {
  const data =
    buildBusinessDataModel(
      rows,
      {
        brandTargets:
          options.brandTargets,
        productMaster:
          options.productMaster,
        inventory:
          options.inventory,
        purchaseOrders:
          options.purchaseOrders,
        purchaseRequests:
          options.purchaseRequests,
        projects:
          options.projects,
        projectBillings:
          options.projectBillings,
        exchangeRates:
          options.exchangeRates,
        prices:
          options.prices,
      },
    )

  const repository =
    new BusinessRepository(
      data,
    )

  const metrics =
    buildBusinessMetrics(
      repository,
    )

  const customers =
    buildCustomerIntelligence(
      repository,
      data.periodEnd,
    )

  const brands =
    buildBrandIntelligence(
      repository,
    )

  const insights =
    buildInsights(
      customers,
    )

  return {
    generatedAt:
      data.generatedAt,

    data,

    repository,

    metrics,

    customers,

    brands,

    insights,
  }
}