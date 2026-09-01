import {
  buildBusinessIntelligence,
} from '../../../../core/business/buildBusinessIntelligence'

import {
  buildDatasetRegistry,
} from '../../../../core/registry/buildDatasetRegistry'

import {
  ExecutiveBriefEngine,
} from '../../../../core/business/executiveBrief'

import {
  OpportunityEngine,
} from '../../../../core/business/opportunityRadar'

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
    | 'normalizedProductMaster'
    | 'productMasterSummary'
    | 'productMasterLastImportedAt'
    | 'productMasterLastImportedFile'
    | 'inventorySummary'
    | 'normalizedInventory'
    | 'inventoryLastImportedAt'
    | 'inventoryLastImportedFile'
    | 'targetSummary'
    | 'targetsLastImportedAt'
    | 'targetsLastImportedFile'
    | 'lastImportedAt'
    | 'lastImportedFile'
    | 'importStatus'
  > &
  Partial<
    Pick<
      DataCenterState,
      | 'purchaseOrderSummary'
      | 'normalizedPurchaseOrders'
      | 'purchaseOrderLastImportedAt'
      | 'purchaseOrderLastImportedFile'
      | 'purchaseRequestSummary'
      | 'normalizedPurchaseRequests'
      | 'purchaseRequestLastImportedAt'
      | 'purchaseRequestLastImportedFile'
      | 'projectsSummary'
      | 'normalizedProjects'
      | 'projectsLastImportedAt'
      | 'projectsLastImportedFile'
      | 'projectBillingSummary'
      | 'normalizedProjectBillings'
      | 'projectBillingLastImportedAt'
      | 'projectBillingLastImportedFile'
      | 'exchangeRateSummary'
      | 'normalizedExchangeRates'
      | 'exchangeRateLastImportedAt'
      | 'exchangeRateLastImportedFile'
      | 'pricingSummary'
      | 'normalizedPricing'
      | 'pricingLastImportedAt'
      | 'pricingLastImportedFile'
      | 'customerMasterSummary'
      | 'normalizedCustomerMaster'
      | 'customerMasterLastImportedAt'
      | 'customerMasterLastImportedFile'
    >
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
      salesSummary:
        state.salesSummary,
      salesLastImportedAt:
        state.lastImportedAt,
      salesLastImportedFile:
        state.lastImportedFile,
      targetSummary:
        state.targetSummary,
      targetsLastImportedAt:
        state.targetsLastImportedAt,
      targetsLastImportedFile:
        state.targetsLastImportedFile,
      productMasterSummary:
        state.productMasterSummary,
      productMasterLastImportedAt:
        state.productMasterLastImportedAt,
      productMasterLastImportedFile:
        state.productMasterLastImportedFile,
      inventorySummary:
        state.inventorySummary,
      inventoryLastImportedAt:
        state.inventoryLastImportedAt,
      inventoryLastImportedFile:
        state.inventoryLastImportedFile,
      purchaseOrderSummary:
        state.purchaseOrderSummary ?? null,
      purchaseOrderLastImportedAt:
        state.purchaseOrderLastImportedAt ?? null,
      purchaseOrderLastImportedFile:
        state.purchaseOrderLastImportedFile ?? null,
      purchaseRequestSummary:
        state.purchaseRequestSummary ?? null,
      purchaseRequestLastImportedAt:
        state.purchaseRequestLastImportedAt ?? null,
      purchaseRequestLastImportedFile:
        state.purchaseRequestLastImportedFile ?? null,
      projectsSummary:
        state.projectsSummary ?? null,
      projectsLastImportedAt:
        state.projectsLastImportedAt ?? null,
      projectsLastImportedFile:
        state.projectsLastImportedFile ?? null,
      projectBillingSummary:
        state.projectBillingSummary ?? null,
      projectBillingLastImportedAt:
        state.projectBillingLastImportedAt ?? null,
      projectBillingLastImportedFile:
        state.projectBillingLastImportedFile ?? null,
      exchangeRateSummary:
        state.exchangeRateSummary ?? null,
      exchangeRateLastImportedAt:
        state.exchangeRateLastImportedAt ?? null,
      exchangeRateLastImportedFile:
        state.exchangeRateLastImportedFile ?? null,
      pricingSummary:
        state.pricingSummary ?? null,
      pricingLastImportedAt:
        state.pricingLastImportedAt ?? null,
      pricingLastImportedFile:
        state.pricingLastImportedFile ?? null,
      customerMasterSummary:
        state.customerMasterSummary ?? null,

      customerMasterLastImportedAt:
        state.customerMasterLastImportedAt ?? null,

      customerMasterLastImportedFile:
        state.customerMasterLastImportedFile ?? null,
    })

  const hasBusinessData =
    state.normalizedSales.length > 0 ||
    (state.normalizedCustomerMaster?.length ?? 0) > 0 ||
    (state.normalizedPurchaseOrders?.length ?? 0) > 0 ||
    (state.normalizedPurchaseRequests?.length ?? 0) > 0 ||
    (state.normalizedProjects?.length ?? 0) > 0 ||
    (state.normalizedProjectBillings?.length ?? 0) > 0 ||
    (state.normalizedExchangeRates?.length ?? 0) > 0 ||
    (state.normalizedPricing?.length ?? 0) > 0

  const business =
    hasBusinessData
      ? buildBusinessIntelligence(
          state.normalizedSales,
          {
            brandTargets:
              state.normalizedTargets,
            productMaster:
              state.normalizedProductMaster,
            customerMaster:
              state.normalizedCustomerMaster ?? [],
            inventory:
              state.normalizedInventory,
            purchaseOrders:
              state.normalizedPurchaseOrders ?? [],
            purchaseRequests:
              state.normalizedPurchaseRequests ?? [],
            projects:
              state.normalizedProjects ?? [],
            projectBillings:
              state.normalizedProjectBillings ?? [],
            exchangeRates:
              state.normalizedExchangeRates ?? [],
            prices:
              state.normalizedPricing ?? [],
          },
        )
      : null

  const currentPeriodId =
    resolveCurrentPeriodId(
      business,
    )

  const executiveBrief =
    business?.brands
      ? new ExecutiveBriefEngine()
          .buildForBrandWorkspace(
            business.brands,
          )
      : null

  const opportunityRadar =
    business?.brands
      ? new OpportunityEngine()
          .buildForBrandWorkspace(
            business.brands,
          )
      : null

  const readyDatasets =
    datasets.filter(
      (dataset) =>
        dataset.status ===
        'active',
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

    opportunityRadar,

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