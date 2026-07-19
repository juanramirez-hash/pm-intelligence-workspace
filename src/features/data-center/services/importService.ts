import type { ImportEngineResult } from '../types/importPipelineTypes'
import type {
  ReportType,
  SalesDatasetSummary,
} from '../types/reportTypes'
import type { SpreadsheetRow } from '../parsers/spreadsheetParser'
import type { NormalizedSalesRow } from '../importers/sales/salesTypes'
import type { SalesBusinessModel } from '../importers/sales/salesBusinessModel'

import { runImportEngine } from '../engine/importEngine'
import { importPluginRegistry } from '../engine/importPluginRegistry'
import { detectReportType } from './reportDetector'

export type DataCenterImportResult =
  ImportEngineResult<
    SalesDatasetSummary,
    NormalizedSalesRow,
    SalesBusinessModel
  >

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

  const plugin =
    importPluginRegistry.find(
      (registeredPlugin) =>
        registeredPlugin.reportType ===
        detection.detectedReportType,
    )

  if (!plugin) {
    throw new Error(
      `El reporte "${detection.detectedReportType}" fue detectado, pero no existe un plugin registrado para procesarlo.`,
    )
  }

  return runImportEngine(
    plugin,
    rows,
    headers,
  )
}