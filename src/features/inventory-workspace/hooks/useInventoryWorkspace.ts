import {
  useMemo,
} from 'react'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import type {
  ProductCommercialStatus,
} from '../../../core/business/entities/product'

import {
  enrichInventoryPositions,
} from '../engine/inventoryCatalogEnrichment'

import type {
  InventoryWorkspaceModel,
} from '../engine/inventoryWorkspaceModel'

const commercialStatusOrder: ProductCommercialStatus[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
]

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
        commercialStatuses: [],
      }
    }

    const analytics = repository.inventoryAnalytics.getReport()
    const riskOpportunity =
      repository.inventoryRiskOpportunity.getReport()
    const latestPositions = enrichInventoryPositions(
      repository.inventory.getLatestPositions(),
      repository.product,
    )

    const brands = [...new Set(
      latestPositions
        .map((position) => position.brandId)
        .filter((brandId): brandId is string => Boolean(brandId)),
    )].sort((left, right) => left.localeCompare(right))

    const locations = [...new Set(
      latestPositions.map((position) => position.locationId),
    )].sort((left, right) => left.localeCompare(right))

    const availableCommercialStatuses = new Set(
      latestPositions
        .map((position) => position.commercialStatus)
        .filter(
          (status): status is ProductCommercialStatus =>
            Boolean(status),
        ),
    )

    const commercialStatuses = commercialStatusOrder.filter(
      (status) => availableCommercialStatuses.has(status),
    )

    return {
      available: latestPositions.length > 0,
      analytics,
      riskOpportunity,
      latestPositions,
      brands,
      locations,
      commercialStatuses,
    }
  }, [workspace.repository])
}
