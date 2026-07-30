import {
  buildWorkspaceContext,
} from '../../workspaces/shared/engine/buildWorkspaceContext'

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
    | 'lastImportedAt'
    | 'lastImportedFile'
    | 'importStatus'
  >,
): ExecutiveWorkspaceModel {
  return buildWorkspaceContext(
    state,
  )
}
