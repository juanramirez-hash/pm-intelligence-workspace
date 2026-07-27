import {
  buildBusinessIntelligence,
} from '../../../../core/business/buildBusinessIntelligence'

import {
  buildDatasetRegistry,
} from '../../../../core/registry/buildDatasetRegistry'

import {
  ExecutiveBriefEngine,
} from '../../../../core/business/executiveBrief'

import type {
  DataCenterState,
} from '../../../data-center/store/dataCenterStore'

import type {
  WorkspaceContextModel,
} from '../types/workspaceContextTypes'

type WorkspaceContextState =
  Pick<
    DataCenterState,
    | 'salesSummary'
    | 'normalizedSales'
    | 'normalizedTargets'
    | 'targetSummary'
    | 'targetsLastImportedAt'
    | 'targetsLastImportedFile'
    | 'lastImportedAt'
    | 'lastImportedFile'
    | 'importStatus'
  >

function resolveCurrentPeriodId(
  business:
    | ReturnType<
        typeof buildBusinessIntelligence
      >
    | null,
): string | null {
  if (!business) {
    return null
  }

  return business.repository
    .getPeriods()
    .sort(
      (periodA, periodB) =>
        periodA.year - periodB.year ||
        periodA.month - periodB.month,
    )
    .at(-1)?.id ?? null
}

export function buildWorkspaceContext(
  state: WorkspaceContextState,
): WorkspaceContextModel {
  const datasets =
    buildDatasetRegistry({
      salesSummary: state.salesSummary,
      salesLastImportedAt: state.lastImportedAt,
      salesLastImportedFile: state.lastImportedFile,
      targetSummary: state.targetSummary,
      targetsLastImportedAt: state.targetsLastImportedAt,
      targetsLastImportedFile: state.targetsLastImportedFile,
    })

  const business =
    state.normalizedSales.length > 0
      ? buildBusinessIntelligence(
          state.normalizedSales,
          {
            brandTargets: state.normalizedTargets,
          },
        )
      : null

  const currentPeriodId =
    resolveCurrentPeriodId(business)

  const executiveBrief =
    business?.brands
      ? new ExecutiveBriefEngine()
          .buildForBrandWorkspace(
            business.brands,
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

    repository:
      business?.repository ?? null,

    currentPeriodId,

    customers:
      business?.customers ?? null,

    brands:
      business?.brands ?? null,

    insights:
      business?.insights ?? [],

    executiveBrief,

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