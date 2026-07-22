import {
  buildBusinessIntelligence,
} from '../../../core/business/buildBusinessIntelligence'

import {
  buildDatasetRegistry,
} from '../../../core/registry/buildDatasetRegistry'

import type {
  DataCenterState,
} from '../../data-center/store/dataCenterStore'

import type {
  ExecutiveWorkspaceModel,
} from '../types/executiveWorkspaceTypes'

export function buildExecutiveWorkspace(
  state: Pick<
    DataCenterState,
    | 'salesSummary'
    | 'normalizedSales'
    | 'lastImportedAt'
    | 'lastImportedFile'
    | 'importStatus'
  >,
): ExecutiveWorkspaceModel {
  const datasets =
    buildDatasetRegistry({
      salesSummary:
        state.salesSummary,

      lastImportedAt:
        state.lastImportedAt,

      lastImportedFile:
        state.lastImportedFile,
    })

  const business =
    state.normalizedSales.length > 0
      ? buildBusinessIntelligence(
          state.normalizedSales,
        )
      : null

  const readyDatasets =
    datasets.filter(
      (dataset) =>
        dataset.status === 'active',
    ).length

  const totalDatasets =
    datasets.length

  const coveragePercentage =
    totalDatasets > 0
      ? Math.round(
          (
            readyDatasets /
            totalDatasets
          ) * 100,
        )
      : 0

  const systemReady =
    state.importStatus ===
      'completed' &&
    state.salesSummary !== null

  return {
    sales:
      state.salesSummary,

    metrics:
      business?.metrics ?? null,

    customers:
      business?.customers ?? null,

    brands:
      business?.brands ?? null,

    insights:
      business?.insights ?? [],

    datasets,

    health: {
      readyDatasets,

      totalDatasets,

      coveragePercentage,

      systemReady,

      importStatus:
        state.importStatus,

      lastImportedAt:
        state.lastImportedAt,
    },
  }
}