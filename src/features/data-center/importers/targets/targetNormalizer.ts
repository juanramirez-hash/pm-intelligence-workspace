import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import {
  parseCurrency,
  parseIdentifier,
  parseNumber,
  parsePercentage,
} from '../../utils/valueParsers'
import type { NormalizationResult } from '../../engine/importPlugin'
import type { TargetValidationResult } from './targetValidator'
import type { NormalizedTargetRow } from './targetTypes'

function normalizePeriodId(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`
  }

  if (typeof value === 'number' && Number.isInteger(value)) {
    const text = String(value)

    if (/^\d{6}$/.test(text)) {
      return `${text.slice(0, 4)}-${text.slice(4)}`
    }
  }

  const text = parseIdentifier(value)

  if (!text) {
    return null
  }

  const normalized = text.trim()
  const directMatch = normalized.match(/^(\d{4})[-/]?(\d{1,2})$/)

  if (directMatch) {
    const month = Number(directMatch[2])

    if (month >= 1 && month <= 12) {
      return `${directMatch[1]}-${String(month).padStart(2, '0')}`
    }
  }

  const parsedDate = new Date(normalized)

  if (!Number.isNaN(parsedDate.getTime())) {
    return `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, '0')}`
  }

  return null
}

function getValue(
  row: SpreadsheetRow,
  column: string | undefined,
): unknown {
  return column ? row[column] : undefined
}

export function normalizeTargetRows(
  rows: SpreadsheetRow[],
  validation: TargetValidationResult,
): NormalizationResult<NormalizedTargetRow> {
  const normalizedRows: NormalizedTargetRow[] = []
  let ignoredRows = 0

  for (const row of rows) {
    const brandId = parseIdentifier(
      getValue(row, validation.columnMap.brandId),
    )
    const periodId = normalizePeriodId(
      getValue(row, validation.columnMap.periodId),
    )

    if (!brandId || !periodId) {
      ignoredRows += 1
      continue
    }

    const rawRevenue = getValue(row, validation.columnMap.targetRevenue)
    const rawGrossProfit = getValue(row, validation.columnMap.targetGrossProfit)
    const rawGrossMargin = getValue(row, validation.columnMap.targetGrossMargin)
    const rawWorkingDays = getValue(row, validation.columnMap.workingDays)

    const hasRevenue = rawRevenue !== null && rawRevenue !== undefined && String(rawRevenue).trim() !== ''
    const hasGrossProfit = rawGrossProfit !== null && rawGrossProfit !== undefined && String(rawGrossProfit).trim() !== ''
    const hasGrossMargin = rawGrossMargin !== null && rawGrossMargin !== undefined && String(rawGrossMargin).trim() !== ''

    if (!hasRevenue && !hasGrossProfit && !hasGrossMargin) {
      ignoredRows += 1
      continue
    }

    normalizedRows.push({
      brandId,
      periodId,
      targetRevenue: hasRevenue ? parseCurrency(rawRevenue) : null,
      targetGrossProfit: hasGrossProfit ? parseCurrency(rawGrossProfit) : null,
      targetGrossMargin: hasGrossMargin ? parsePercentage(rawGrossMargin) : null,
      workingDays:
        rawWorkingDays === null || rawWorkingDays === undefined || String(rawWorkingDays).trim() === ''
          ? null
          : Math.round(parseNumber(rawWorkingDays)),
    })
  }

  return {
    rows: normalizedRows,
    ignoredRows,
  }
}
