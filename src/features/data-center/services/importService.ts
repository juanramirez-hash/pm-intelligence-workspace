import type { ImportEngineResult } from '../types/importPipelineTypes'
import type {
  ReportType,
  SalesDatasetSummary,
} from '../types/reportTypes'
import type { SpreadsheetRow } from '../parsers/spreadsheetParser'
import type { NormalizedSalesRow } from '../importers/sales/salesTypes'
import type { SalesBusinessModel } from '../importers/sales/salesBusinessModel'
import type { TargetBusinessModel } from '../importers/targets/targetBusinessModel'
import type { NormalizedTargetRow, TargetDatasetSummary } from '../importers/targets/targetTypes'
import type { NormalizedProductMasterRow, ProductMasterDatasetSummary } from '../importers/products/productMasterTypes'
import type { ProductMasterBusinessModel } from '../importers/products/productMasterBusinessModel'
import { salesImportPlugin } from '../importers/sales/salesPlugin'
import { targetImportPlugin } from '../importers/targets/targetPlugin'
import { productMasterImportPlugin } from '../importers/products/productMasterPlugin'

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

export type DataCenterImportResult =
  | SalesImportResult
  | TargetImportResult
  | ProductMasterImportResult

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
    (plugin) =>
      plugin.reportType === reportType,
  )
}

export function runDataCenterImport(
  rows: SpreadsheetRow[],
): DataCenterImportResult {
  if (rows.length === 0) {
    throw new Error(
      'El archivo seleccionado no contiene filas para importar.',
    )
  }

  const headers =
    extractSpreadsheetHeaders(rows)

  if (headers.length === 0) {
    throw new Error(
      'No fue posible identificar columnas válidas en el archivo seleccionado.',
    )
  }

  const detection =
    detectReportType(headers)

  if (!detection.detectedReportType) {
    const bestCandidate =
      detection.candidates[0]

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

  switch (detection.detectedReportType) {
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

    default:
      throw new Error(
        `El reporte "${detection.detectedReportType}" fue detectado, pero no existe un plugin registrado para procesarlo.`,
      )
  }
}