import type { NormalizationResult } from '../../engine/importPlugin'
import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import {
  parseCurrency,
  parseExcelDate,
  parseNumber,
  parsePercentage,
  parseString,
} from '../../utils/valueParsers'
import type {
  NormalizedProjectRow,
  ProjectForecastStage,
  ProjectStatusCode,
} from './projectTypes'
import type { ProjectValidationResult } from './projectValidator'

function getValue(
  row: SpreadsheetRow,
  column: string | undefined,
): unknown {
  return column ? row[column] : undefined
}

function normalizeIdentifier(
  value: unknown,
): string | null {
  const parsed = parseString(value)

  if (!parsed) {
    return null
  }

  return parsed
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function toDateOnly(value: unknown): string | null {
  return parseExcelDate(value)?.slice(0, 10) ?? null
}

function parseOptionalNumber(value: unknown): number | null {
  const text = parseString(value)

  return text === null
    ? null
    : parseNumber(value)
}

function parseOptionalCurrency(value: unknown): number | null {
  const text = parseString(value)

  return text === null
    ? null
    : parseCurrency(value)
}

function parseCustomer(
  value: unknown,
): {
  customerId: string | null
  customerName: string | null
} {
  const text = parseString(value)

  if (!text) {
    return {
      customerId: null,
      customerName: null,
    }
  }

  const match = text.match(/^(\d{4,8})\s+(.+)$/)

  if (!match) {
    return {
      customerId: null,
      customerName: text,
    }
  }

  return {
    customerId: match[1],
    customerName: match[2].trim() || null,
  }
}

export function parseProjectStatus(
  value: unknown,
): {
  code: ProjectStatusCode
  label: string
  stage: ProjectForecastStage
} {
  const label = parseString(value) ?? 'Sin status'
  const match = label.match(/^\s*(0[1-8])\b/)
  const code = (match?.[1] ?? 'unknown') as ProjectStatusCode

  switch (code) {
    case '01':
    case '02':
      return { code, label, stage: 'early' }

    case '03':
    case '04':
      return { code, label, stage: 'potential' }

    case '05':
    case '06':
      return { code, label, stage: 'mature' }

    case '07':
      return { code, label, stage: 'realized' }

    case '08':
      return { code, label, stage: 'cancelled' }

    default:
      return { code: 'unknown', label, stage: 'unknown' }
  }
}

function parseBoolean(value: unknown): boolean {
  const normalized = parseString(value)
    ?.toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return [
    'si',
    'yes',
    'true',
    '1',
  ].includes(normalized ?? '')
}

export function normalizeProjectRows(
  rows: SpreadsheetRow[],
  validation: ProjectValidationResult,
): NormalizationResult<NormalizedProjectRow> {
  const normalizedRows: NormalizedProjectRow[] = []
  let ignoredRows = 0

  for (const row of rows) {
    const internalId = normalizeIdentifier(
      getValue(row, validation.columnMap.internalId),
    )
    const projectId = normalizeIdentifier(
      getValue(row, validation.columnMap.projectId),
    )

    if (!internalId || !projectId) {
      ignoredRows += 1
      continue
    }

    const status = parseProjectStatus(
      getValue(row, validation.columnMap.status),
    )
    const customer = parseCustomer(
      getValue(row, validation.columnMap.customer),
    )
    const name = parseString(
      getValue(row, validation.columnMap.name),
    ) ?? projectId

    normalizedRows.push({
      internalId,
      projectId,
      name,
      endUser: parseString(
        getValue(row, validation.columnMap.endUser),
      ),
      customerId: customer.customerId,
      customerName: customer.customerName,
      salesExecutive: parseString(
        getValue(row, validation.columnMap.salesExecutive),
      ),
      location: parseString(
        getValue(row, validation.columnMap.location),
      ),
      assignedBusinessDeveloper: parseString(
        getValue(
          row,
          validation.columnMap.assignedBusinessDeveloper,
        ),
      ),
      assignedProductManager: parseString(
        getValue(
          row,
          validation.columnMap.assignedProductManager,
        ),
      ),
      group: parseString(
        getValue(row, validation.columnMap.group),
      ),
      primaryBrand: normalizeIdentifier(
        getValue(row, validation.columnMap.primaryBrand),
      ),
      createdAt: toDateOnly(
        getValue(row, validation.columnMap.createdAt),
      ),
      elapsedDays: parseOptionalNumber(
        getValue(row, validation.columnMap.elapsedDays),
      ),
      currency: normalizeIdentifier(
        getValue(row, validation.columnMap.currency),
      ),
      statusCode: status.code,
      statusLabel: status.label,
      forecastStage: status.stage,
      closingProbability: parsePercentage(
        getValue(row, validation.columnMap.closingProbability),
      ),
      estimatedCloseDate: toDateOnly(
        getValue(row, validation.columnMap.estimatedCloseDate),
      ),
      estimatedBillingDate: toDateOnly(
        getValue(row, validation.columnMap.estimatedBillingDate),
      ),
      amountToClose: parseOptionalCurrency(
        getValue(row, validation.columnMap.amountToClose),
      ),
      observations: parseString(
        getValue(row, validation.columnMap.observations),
      ),
      assignedEngineer: parseString(
        getValue(row, validation.columnMap.assignedEngineer),
      ),
      approximateAmount: parseOptionalCurrency(
        getValue(row, validation.columnMap.approximateAmount),
      ),
      invoicedAmount: parseOptionalCurrency(
        getValue(row, validation.columnMap.invoicedAmount),
      ),
      reportAmountToInvoice: parseOptionalCurrency(
        getValue(row, validation.columnMap.reportAmountToInvoice),
      ),
      amountToInvoice: parseOptionalCurrency(
        getValue(row, validation.columnMap.amountToInvoice),
      ),
      isDuplicate: parseBoolean(
        getValue(row, validation.columnMap.isDuplicate),
      ),
    })
  }

  return {
    rows: normalizedRows,
    ignoredRows,
  }
}
