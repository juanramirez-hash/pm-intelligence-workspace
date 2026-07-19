import { runImportEngine } from '../../engine/importEngine'
import type { ImportPipelineResult } from '../../types/importPipelineTypes'
import type { SalesDatasetSummary } from '../../types/reportTypes'
import type { RawSalesRow } from './salesNormalizer'
import { salesImportPlugin } from './salesPlugin'

export function runSalesPipeline(
  rawRows: RawSalesRow[],
): ImportPipelineResult<SalesDatasetSummary> {
  return runImportEngine(
    salesImportPlugin,
    rawRows,
  )
}