import type { NormalizationResult } from '../../engine/importPlugin'
import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import {
  parseExcelDate,
  parseNumber,
  parseString,
} from '../../utils/valueParsers'
import type { NormalizedExchangeRateRow } from './exchangeRateTypes'
import type { ExchangeRateValidationResult } from './exchangeRateValidator'

function getValue(
  row: SpreadsheetRow,
  column: string | undefined,
): unknown {
  return column ? row[column] : undefined
}

function normalizeCurrency(
  value: unknown,
  fallback: string,
): string {
  return (
    parseString(value)
      ?.toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ') ?? fallback
  )
}

export function normalizeExchangeRatePeriod(
  value: unknown,
): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`
  }

  const text = parseString(value)

  if (!text) {
    return null
  }

  const directMatch = text.match(/^(\d{4})[-/]?(\d{1,2})$/)

  if (directMatch) {
    const month = Number(directMatch[2])

    if (month >= 1 && month <= 12) {
      return `${directMatch[1]}-${String(month).padStart(2, '0')}`
    }
  }

  const date = parseExcelDate(value)

  return date?.slice(0, 7) ?? null
}

export function normalizeExchangeRateRows(
  rows: SpreadsheetRow[],
  validation: ExchangeRateValidationResult,
): NormalizationResult<NormalizedExchangeRateRow> {
  const rowsByKey = new Map<string, NormalizedExchangeRateRow>()
  let ignoredRows = 0

  for (const row of rows) {
    const periodId = normalizeExchangeRatePeriod(
      getValue(row, validation.columnMap.periodId),
    )
    const rate = parseNumber(
      getValue(row, validation.columnMap.rate),
    )

    if (!periodId || !Number.isFinite(rate) || rate <= 0) {
      ignoredRows += 1
      continue
    }

    const sourceCurrency = normalizeCurrency(
      getValue(row, validation.columnMap.sourceCurrency),
      'USD',
    )
    const targetCurrency = normalizeCurrency(
      getValue(row, validation.columnMap.targetCurrency),
      'MXN',
    )
    const key = `${periodId}::${sourceCurrency}::${targetCurrency}`

    rowsByKey.set(key, {
      periodId,
      sourceCurrency,
      targetCurrency,
      rate,
      sourceReference: parseString(
        getValue(row, validation.columnMap.sourceReference),
      ),
      effectiveDate:
        parseExcelDate(
          getValue(row, validation.columnMap.effectiveDate),
        )?.slice(0, 10) ?? null,
      recordedAt: new Date().toISOString(),
    })
  }

  return {
    rows: [...rowsByKey.values()].sort(
      (left, right) =>
        left.periodId.localeCompare(right.periodId) ||
        left.sourceCurrency.localeCompare(right.sourceCurrency),
    ),
    ignoredRows,
  }
}
