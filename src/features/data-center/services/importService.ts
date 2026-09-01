import type { ImportEngineResult } from '../types/importPipelineTypes'
import type {
  ReportType,
  SalesDatasetSummary,
} from '../types/reportTypes'
import type { SpreadsheetRow } from '../parsers/spreadsheetParser'
import type { NormalizedSalesRow } from '../importers/sales/salesTypes'
import type { SalesBusinessModel } from '../importers/sales/salesBusinessModel'
import type { TargetBusinessModel } from '../importers/targets/targetBusinessModel'
import type { ProductMasterBusinessModel } from '../importers/products/productMasterBusinessModel'
import type { InventoryBusinessModel } from '../importers/inventory/inventoryBusinessModel'
import type {
  NormalizedTargetRow,
  TargetDatasetSummary,
} from '../importers/targets/targetTypes'
import type {
  NormalizedProductMasterRow,
  ProductMasterDatasetSummary,
} from '../importers/products/productMasterTypes'

import type {
  NormalizedCustomerMasterRow,
  CustomerMasterDatasetSummary,
} from '../importers/customers/customerMasterTypes'

import type {
  CustomerMasterBusinessModel,
} from '../importers/customers/customerMasterBusinessModel'

import type {
  NormalizedInventoryRow,
  InventoryDatasetSummary,
} from '../importers/inventory/inventoryTypes'

import type {
  NormalizedPurchaseOrderRow,
  PurchaseOrderDatasetSummary,
} from '../importers/purchases/purchaseOrderTypes'
import type {
  PurchaseOrderBusinessModel,
} from '../importers/purchases/purchaseOrderBusinessModel'
import type {
  NormalizedPurchaseRequestRow,
  PurchaseRequestDatasetSummary,
} from '../importers/purchase-requests/purchaseRequestTypes'
import type {
  PurchaseRequestBusinessModel,
} from '../importers/purchase-requests/purchaseRequestBusinessModel'

import type {
  NormalizedProjectRow,
  ProjectDatasetSummary,
} from '../importers/projects/projectTypes'
import type { ProjectBusinessModel } from '../importers/projects/projectBusinessModel'
import type {
  NormalizedProjectBillingRow,
  ProjectBillingDatasetSummary,
} from '../importers/project-billings/projectBillingTypes'
import type { ProjectBillingBusinessModel } from '../importers/project-billings/projectBillingBusinessModel'
import type {
  ExchangeRateDatasetSummary,
  NormalizedExchangeRateRow,
} from '../importers/exchange-rates/exchangeRateTypes'
import type { ExchangeRateBusinessModel } from '../importers/exchange-rates/exchangeRateBusinessModel'
import type { PricingBusinessModel } from '../importers/pricing/pricingBusinessModel'
import type {
  NormalizedPricingRow,
  PricingDatasetSummary,
} from '../importers/pricing/pricingTypes'
import { salesImportPlugin } from '../importers/sales/salesPlugin'
import { targetImportPlugin } from '../importers/targets/targetPlugin'
import { productMasterImportPlugin } from '../importers/products/productMasterPlugin'
import { customerMasterImportPlugin } from '../importers/customers/customerMasterPlugin'
import { inventoryImportPlugin } from '../importers/inventory/inventoryPlugin'

import {
  purchaseOrderImportPlugin,
} from '../importers/purchases/purchaseOrderPlugin'
import {
  purchaseRequestImportPlugin,
} from '../importers/purchase-requests/purchaseRequestPlugin'

import { projectImportPlugin } from '../importers/projects/projectPlugin'
import { projectBillingImportPlugin } from '../importers/project-billings/projectBillingPlugin'
import { exchangeRateImportPlugin } from '../importers/exchange-rates/exchangeRatePlugin'
import { pricingImportPlugin } from '../importers/pricing/pricingPlugin'

import { runImportEngine } from '../engine/importEngine'
import { importPluginRegistry } from '../engine/importPluginRegistry'
import { detectReportType } from './reportDetector'

export type SalesImportResult = ImportEngineResult<
  SalesDatasetSummary,
  NormalizedSalesRow,
  SalesBusinessModel
> & { reportType: 'sales' }

export type TargetImportResult = ImportEngineResult<
  TargetDatasetSummary,
  NormalizedTargetRow,
  TargetBusinessModel
> & { reportType: 'quota' }

export type ProductMasterImportResult = ImportEngineResult<
  ProductMasterDatasetSummary,
  NormalizedProductMasterRow,
  ProductMasterBusinessModel
> & { reportType: 'products' }

export type CustomerMasterImportResult = ImportEngineResult<
  CustomerMasterDatasetSummary,
  NormalizedCustomerMasterRow,
  CustomerMasterBusinessModel
> & { reportType: 'customers' }

export type InventoryImportResult = ImportEngineResult<
  InventoryDatasetSummary,
  NormalizedInventoryRow,
  InventoryBusinessModel
> & { reportType: 'inventory' }

export type PurchaseOrderImportResult =
  ImportEngineResult<
    PurchaseOrderDatasetSummary,
    NormalizedPurchaseOrderRow,
    PurchaseOrderBusinessModel
  > & { reportType: 'purchases' }

export type PurchaseRequestImportResult =
  ImportEngineResult<
    PurchaseRequestDatasetSummary,
    NormalizedPurchaseRequestRow,
    PurchaseRequestBusinessModel
  > & { reportType: 'purchase-requests' }

export type ProjectImportResult = ImportEngineResult<
  ProjectDatasetSummary,
  NormalizedProjectRow,
  ProjectBusinessModel
> & { reportType: 'projects' }

export type ProjectBillingImportResult = ImportEngineResult<
  ProjectBillingDatasetSummary,
  NormalizedProjectBillingRow,
  ProjectBillingBusinessModel
> & { reportType: 'project-billing' }

export type ExchangeRateImportResult = ImportEngineResult<
  ExchangeRateDatasetSummary,
  NormalizedExchangeRateRow,
  ExchangeRateBusinessModel
> & { reportType: 'exchange-rates' }

export type PricingImportResult = ImportEngineResult<
  PricingDatasetSummary,
  NormalizedPricingRow,
  PricingBusinessModel
> & { reportType: 'pricing' }

export type DataCenterImportResult =
  | SalesImportResult
  | TargetImportResult
  | ProductMasterImportResult
  | CustomerMasterImportResult
  | InventoryImportResult
  | PurchaseOrderImportResult
  | PurchaseRequestImportResult
  | ProjectImportResult
  | ProjectBillingImportResult
  | ExchangeRateImportResult
  | PricingImportResult

function extractSpreadsheetHeaders(
  rows: SpreadsheetRow[],
): string[] {
  const headers = new Set<string>()

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim()

      if (cleanKey) {
        headers.add(cleanKey)
      }
    }
  }

  return [...headers]
}

export function isSupportedReportType(
  reportType: ReportType,
): boolean {
  return importPluginRegistry.some(
    (plugin) => plugin.reportType === reportType,
  )
}

function resolveReportType(
  headers: string[],
  selectedReportType?: ReportType,
): ReportType {
  if (selectedReportType) {
    if (!isSupportedReportType(selectedReportType)) {
      throw new Error(
        `El destino "${selectedReportType}" no tiene un importador registrado.`,
      )
    }

    return selectedReportType
  }

  const detection = detectReportType(headers)

  if (detection.detectedReportType) {
    return detection.detectedReportType
  }

  const bestCandidate = detection.candidates[0]

  if (bestCandidate) {
    const missingFields =
      bestCandidate.missingRequiredFields

    const missingFieldsText =
      missingFields.length > 0
        ? ` Faltan las columnas obligatorias: ${missingFields.join(', ')}.`
        : ''

    throw new Error(
      `No fue posible identificar automáticamente el tipo de reporte. La mejor coincidencia fue "${bestCandidate.reportType}" con ${bestCandidate.confidence}% de confianza.${missingFieldsText}`,
    )
  }

  throw new Error(
    'No fue posible identificar automáticamente el tipo de reporte porque el archivo no coincide con ningún importador registrado.',
  )
}

export function runDataCenterImport(
  rows: SpreadsheetRow[],
  selectedReportType?: ReportType,
): DataCenterImportResult {
  if (rows.length === 0) {
    throw new Error(
      'El archivo seleccionado no contiene filas para importar.',
    )
  }

  const headers = extractSpreadsheetHeaders(rows)

  if (headers.length === 0) {
    throw new Error(
      'No fue posible identificar columnas válidas en el archivo seleccionado.',
    )
  }

  const reportType = resolveReportType(
    headers,
    selectedReportType,
  )

  switch (reportType) {
    case 'sales':
      return runImportEngine(
        salesImportPlugin,
        rows,
        headers,
      ) as SalesImportResult

    case 'quota':
      return runImportEngine(
        targetImportPlugin,
        rows,
        headers,
      ) as TargetImportResult

    case 'products':
      return runImportEngine(
        productMasterImportPlugin,
        rows,
        headers,
      ) as ProductMasterImportResult

    case 'customers':
      return runImportEngine(
        customerMasterImportPlugin,
        rows,
        headers,
      ) as CustomerMasterImportResult

    case 'inventory':
      return runImportEngine(
        inventoryImportPlugin,
        rows,
        headers,
      ) as InventoryImportResult

    case 'purchases':
      return runImportEngine(
        purchaseOrderImportPlugin,
        rows,
        headers,
      ) as PurchaseOrderImportResult

    case 'purchase-requests':
      return runImportEngine(
        purchaseRequestImportPlugin,
        rows,
        headers,
      ) as PurchaseRequestImportResult

    case 'projects':
      return runImportEngine(
        projectImportPlugin,
        rows,
        headers,
      ) as ProjectImportResult

    case 'project-billing':
      return runImportEngine(
        projectBillingImportPlugin,
        rows,
        headers,
      ) as ProjectBillingImportResult

    case 'exchange-rates':
      return runImportEngine(
        exchangeRateImportPlugin,
        rows,
        headers,
      ) as ExchangeRateImportResult

    case 'pricing':
      return runImportEngine(
        pricingImportPlugin,
        rows,
        headers,
      ) as PricingImportResult

    default:
      throw new Error(
        `El reporte "${reportType}" no tiene un plugin registrado para procesarlo.`,
      )
  }
}