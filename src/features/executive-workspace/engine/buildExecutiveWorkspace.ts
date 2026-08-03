import {
  buildWorkspaceContext,
} from '../../workspaces/shared/engine/buildWorkspaceContext'

import type {
  DataCenterState,
} from '../../data-center/store/dataCenterStore'

import {
  buildExecutiveDomainHealth,
  buildExecutiveDomainRegistry,
} from './executiveDomainReadiness'

import type {
  ExecutiveDomainReadinessOptions,
} from './executiveDomainReadiness'

import type {
  ExecutiveWorkspaceModel,
} from '../types/executiveWorkspaceTypes'

export type ExecutiveWorkspaceState =
  Pick<
    DataCenterState,
    | 'salesSummary'
    | 'normalizedSales'
    | 'targetSummary'
    | 'normalizedTargets'
    | 'targetsLastImportedFile'
    | 'targetsLastImportedAt'
    | 'productMasterSummary'
    | 'normalizedProductMaster'
    | 'productMasterLastImportedFile'
    | 'productMasterLastImportedAt'
    | 'inventorySummary'
    | 'normalizedInventory'
    | 'inventoryLastImportedFile'
    | 'inventoryLastImportedAt'
    | 'projectsSummary'
    | 'normalizedProjects'
    | 'projectsLastImportedFile'
    | 'projectsLastImportedAt'
    | 'projectBillingSummary'
    | 'normalizedProjectBillings'
    | 'projectBillingLastImportedFile'
    | 'projectBillingLastImportedAt'
    | 'exchangeRateSummary'
    | 'normalizedExchangeRates'
    | 'exchangeRateLastImportedFile'
    | 'exchangeRateLastImportedAt'
    | 'pricingSummary'
    | 'normalizedPricing'
    | 'pricingLastImportedFile'
    | 'pricingLastImportedAt'
    | 'lastImportedAt'
    | 'lastImportedFile'
    | 'importStatus'
  >

export type BuildExecutiveWorkspaceOptions =
  ExecutiveDomainReadinessOptions

function normalizeReferenceDate(
  value: Date | string | undefined,
): Date {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date()
}

export function buildExecutiveWorkspace(
  state: ExecutiveWorkspaceState,
  options: BuildExecutiveWorkspaceOptions = {},
): ExecutiveWorkspaceModel {
  const workspace =
    buildWorkspaceContext(state)

  const referenceDate =
    normalizeReferenceDate(
      options.referenceDate,
    )

  const domains =
    buildExecutiveDomainRegistry(
      workspace.datasets,
      {
        referenceDate,
      },
    )

  return {
    ...workspace,

    health:
      buildExecutiveDomainHealth(
        workspace.health,
        domains,
      ),

    domains,

    purchasingReadiness:
      domains.purchasing,

    generatedAt:
      referenceDate.toISOString(),

    methodology:
      'executive-workspace-v1',
  }
}
