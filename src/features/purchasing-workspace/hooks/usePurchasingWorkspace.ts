import {
  useMemo,
} from 'react'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import {
  buildPurchasingWorkspaceModel,
} from '../engine/purchasingWorkspaceModel'

import type {
  PurchasingWorkspaceModel,
} from '../engine/purchasingWorkspaceModel'

export function usePurchasingWorkspace():
  PurchasingWorkspaceModel {
  const workspace =
    useWorkspaceContext()

  return useMemo(() => {
    const repository =
      workspace.repository

    if (!repository) {
      return {
        available: false,
        analytics: null,
        orders: [],
        lines: [],
        requests: [],
        suppliers: [],
        buyers: [],
        brands: [],
        items: [],
        statuses: [],
      }
    }

    const orders =
      repository.purchaseOrders.getAll()

    const lines =
      repository.purchaseOrders.getAllLines()

    const requests =
      repository.purchaseRequests.getAll()

    return buildPurchasingWorkspaceModel(
      orders,
      lines,
      requests,
    )
  }, [workspace.repository])
}