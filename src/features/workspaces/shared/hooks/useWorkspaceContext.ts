import {
  useMemo,
} from 'react'

import {
  useShallow,
} from 'zustand/react/shallow'

import {
  useDataCenterStore,
} from '../../../data-center/store/dataCenterStore'

import {
  buildWorkspaceContext,
} from '../engine/buildWorkspaceContext'

export function useWorkspaceContext() {
  const state =
    useDataCenterStore(
      useShallow(
        (store) => ({
          salesSummary:
            store.salesSummary,

          normalizedSales:
            store.normalizedSales,

          normalizedTargets:
            store.normalizedTargets,

          normalizedProductMaster:
            store.normalizedProductMaster,

          productMasterSummary:
            store.productMasterSummary,

          productMasterLastImportedAt:
            store.productMasterLastImportedAt,

          productMasterLastImportedFile:
            store.productMasterLastImportedFile,

          inventorySummary:
            store.inventorySummary,

          normalizedInventory:
            store.normalizedInventory,

          inventoryLastImportedAt:
            store.inventoryLastImportedAt,

          inventoryLastImportedFile:
            store.inventoryLastImportedFile,

          targetSummary:
            store.targetSummary,

          targetsLastImportedAt:
            store.targetsLastImportedAt,

          targetsLastImportedFile:
            store.targetsLastImportedFile,

          lastImportedAt:
            store.lastImportedAt,

          lastImportedFile:
            store.lastImportedFile,

          importStatus:
            store.importStatus,

          purchaseOrderSummary:
            store.purchaseOrderSummary,

          normalizedPurchaseOrders:
            store.normalizedPurchaseOrders,

          purchaseOrderLastImportedAt:
            store.purchaseOrderLastImportedAt,

          purchaseOrderLastImportedFile:
            store.purchaseOrderLastImportedFile,

          purchaseRequestSummary:
            store.purchaseRequestSummary,

          normalizedPurchaseRequests:
            store.normalizedPurchaseRequests,

          purchaseRequestLastImportedAt:
            store.purchaseRequestLastImportedAt,

          purchaseRequestLastImportedFile:
            store.purchaseRequestLastImportedFile,

          projectsSummary:
            store.projectsSummary,

          normalizedProjects:
            store.normalizedProjects,

          projectsLastImportedAt:
            store.projectsLastImportedAt,

          projectsLastImportedFile:
            store.projectsLastImportedFile,

          projectBillingSummary:
            store.projectBillingSummary,

          normalizedProjectBillings:
            store.normalizedProjectBillings,

          projectBillingLastImportedAt:
            store.projectBillingLastImportedAt,

          projectBillingLastImportedFile:
            store.projectBillingLastImportedFile,

          exchangeRateSummary:
            store.exchangeRateSummary,

          normalizedExchangeRates:
            store.normalizedExchangeRates,

          exchangeRateLastImportedAt:
            store.exchangeRateLastImportedAt,

          exchangeRateLastImportedFile:
            store.exchangeRateLastImportedFile,

          pricingSummary:
            store.pricingSummary,

          normalizedPricing:
            store.normalizedPricing,

          pricingLastImportedAt:
            store.pricingLastImportedAt,

          pricingLastImportedFile:
            store.pricingLastImportedFile,

          customerMasterSummary:
            store.customerMasterSummary,

          normalizedCustomerMaster:
            store.normalizedCustomerMaster,

          customerMasterLastImportedAt:
            store.customerMasterLastImportedAt,

          customerMasterLastImportedFile:
            store.customerMasterLastImportedFile,
        }),
      ),
    )

  return useMemo(
    () =>
      buildWorkspaceContext(
        state,
      ),
    [state],
  )
}