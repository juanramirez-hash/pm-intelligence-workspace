import {
  useMemo,
} from 'react'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import type {
  InventoryWorkspaceModel,
} from '../engine/inventoryWorkspaceModel'

export function useInventoryWorkspace(): InventoryWorkspaceModel {
  const workspace = useWorkspaceContext()

  return useMemo(() => {
    const repository = workspace.repository

    if (!repository) {
      return {
        available: false,
        analytics: null,
        riskOpportunity: null,
        latestPositions: [],
        brands: [],
        locations: [],
      }
    }

    const analytics = repository.inventoryAnalytics.getReport()
    const riskOpportunity =
      repository.inventoryRiskOpportunity.getReport()
    const latestPositions =
      repository.inventory.getLatestPositions()

    const brands = [...new Set(
      latestPositions
        .map((position) => position.brandId)
        .filter((brandId): brandId is string => Boolean(brandId)),
    )].sort((left, right) => left.localeCompare(right))

    const locations = [...new Set(
      latestPositions.map((position) => position.locationId),
    )].sort((left, right) => left.localeCompare(right))

    return {
      available: latestPositions.length > 0,
      analytics,
      riskOpportunity,
      latestPositions,
      brands,
      locations,
    }
  }, [workspace.repository])
}
