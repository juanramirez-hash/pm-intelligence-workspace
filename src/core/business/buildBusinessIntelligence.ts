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

import type { BusinessBrandTargetInput } from './targets'

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
  projects?: readonly NormalizedProjectRow[]
  projectBillings?: readonly NormalizedProjectBillingRow[]
  exchangeRates?: readonly NormalizedExchangeRateRow[]
  prices?: readonly NormalizedPricingRow[]
}

export function buildBusinessIntelligence(
  rows: NormalizedSalesRow[],
  options: BuildBusinessIntelligenceOptions = {},
): BusinessIntelligenceModel {
  // 1. Construye el modelo central
  // de datos.
  const data =
    buildBusinessDataModel(
      rows,
      {
        brandTargets: options.brandTargets,
        productMaster: options.productMaster,
        inventory: options.inventory,
        projects: options.projects,
        projectBillings: options.projectBillings,
        exchangeRates: options.exchangeRates,
        prices: options.prices,
      },
    )

  // 2. Crea una única instancia
  // del repositorio.
  const repository =
    new BusinessRepository(
      data,
    )

  // 3. Construye las métricas
  // utilizando el repositorio.
  const metrics =
    buildBusinessMetrics(
      repository,
    )

  // 4. Customer Intelligence
  // consume el BusinessRepository.
  const customers =
    buildCustomerIntelligence(
      repository,
      data.periodEnd,
    )

  // 5. Brand Intelligence
  // consume el BusinessRepository.
  const brands =
    buildBrandIntelligence(
      repository,
    )

  // 6. Genera los insights actuales.
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