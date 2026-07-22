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
  BusinessIntelligenceModel,
} from './businessIntelligenceModel'

import {
  buildBusinessDataModel,
} from './builders'

import {
  BusinessRepository,
} from './repository'

import {
  buildBusinessMetrics,
} from './metrics'

export function buildBusinessIntelligence(
  rows: NormalizedSalesRow[],
): BusinessIntelligenceModel {
  // 1. Construye el modelo central de datos.
  const data =
    buildBusinessDataModel(
      rows,
    )

  // 2. Crea una única instancia del repositorio.
  const repository =
    new BusinessRepository(
      data,
    )

  // 3. Construye las métricas utilizando
  // el repositorio.
  const metrics =
    buildBusinessMetrics(
      repository,
    )

  // 4. Temporalmente Customer Intelligence
  // continúa trabajando con las filas normalizadas.
  const customers =
    buildCustomerIntelligence(
      rows,
    )

  // 5. Brand Intelligence ya utiliza
  // directamente el modelo central.
  const brands =
    buildBrandIntelligence(
      data,
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