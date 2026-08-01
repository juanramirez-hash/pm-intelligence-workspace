import type { NormalizationResult } from '../../engine/importPlugin'
import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import {
  parseCurrency,
  parseExcelDate,
  parseNumber,
  parseString,
} from '../../utils/valueParsers'
import type {
  NormalizedProjectBillingRow,
  ProjectBillingDocumentType,
} from './projectBillingTypes'
import type { ProjectBillingValidationResult } from './projectBillingValidator'

function getValue(
  row: SpreadsheetRow,
  column: string | undefined,
): unknown {
  return column ? row[column] : undefined
}

function normalizeIdentifier(
  value: unknown,
): string | null {
  const text = parseString(value)

  return text
    ? text
        .toLocaleUpperCase('es-MX')
        .replace(/\s+/g, ' ')
    : null
}

function toDateOnly(value: unknown): string | null {
  return parseExcelDate(value)?.slice(0, 10) ?? null
}

function getPeriodId(date: string): string {
  return date.slice(0, 7)
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

  return match
    ? {
        customerId: match[1],
        customerName: match[2].trim() || null,
      }
    : {
        customerId: null,
        customerName: text,
      }
}

function getDocumentType(
  documentNumber: string,
): ProjectBillingDocumentType {
  if (documentNumber.startsWith('NC')) {
    return 'credit_note'
  }

  if (documentNumber.startsWith('F')) {
    return 'invoice'
  }

  return 'other'
}

function isVoidedStatus(value: string | null): boolean {
  const normalized = value
    ?.toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return Boolean(
    normalized &&
    (
      normalized.includes('void') ||
      normalized.includes('anulad') ||
      normalized.includes('cancelad')
    ),
  )
}

function stableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

function buildLineKey(
  values: readonly unknown[],
): string {
  return stableHash(
    values
      .map((value) => value ?? '')
      .join('|'),
  )
}

export function normalizeProjectBillingRows(
  rows: SpreadsheetRow[],
  validation: ProjectBillingValidationResult,
): NormalizationResult<NormalizedProjectBillingRow> {
  const rowsByLineKey = new Map<string, NormalizedProjectBillingRow>()
  let ignoredRows = 0

  for (const row of rows) {
    const internalId = normalizeIdentifier(
      getValue(row, validation.columnMap.internalId),
    )
    const projectId = normalizeIdentifier(
      getValue(row, validation.columnMap.projectId),
    )
    const documentNumber = normalizeIdentifier(
      getValue(row, validation.columnMap.documentNumber),
    )
    const date = toDateOnly(
      getValue(row, validation.columnMap.date),
    )

    if (!internalId || !projectId || !documentNumber || !date) {
      ignoredRows += 1
      continue
    }

    const customer = parseCustomer(
      getValue(row, validation.columnMap.customer),
    )
    const documentStatus = parseString(
      getValue(row, validation.columnMap.documentStatus),
    )
    const itemCode = normalizeIdentifier(
      getValue(row, validation.columnMap.itemCode),
    )
    const model = normalizeIdentifier(
      getValue(row, validation.columnMap.model),
    )
    const quantity = parseNumber(
      getValue(row, validation.columnMap.quantity),
    )
    const amount = parseCurrency(
      getValue(row, validation.columnMap.amount),
    )
    const currency = normalizeIdentifier(
      getValue(row, validation.columnMap.currency),
    )
    const brand = normalizeIdentifier(
      getValue(row, validation.columnMap.brand),
    )
    const createdFrom = parseString(
      getValue(row, validation.columnMap.createdFrom),
    )

    const lineKey = buildLineKey([
      internalId,
      projectId,
      documentNumber,
      date,
      itemCode,
      model,
      brand,
      quantity,
      amount,
      currency,
      createdFrom,
    ])
    const existing = rowsByLineKey.get(lineKey)

    if (existing) {
      existing.duplicateOccurrences += 1
      continue
    }

    rowsByLineKey.set(lineKey, {
      lineKey,
      duplicateOccurrences: 0,
      internalId,
      projectId,
      projectDescription: parseString(
        getValue(row, validation.columnMap.projectDescription),
      ),
      endUser: parseString(
        getValue(row, validation.columnMap.endUser),
      ),
      customerId: customer.customerId,
      customerName: customer.customerName,
      primaryBrand: normalizeIdentifier(
        getValue(row, validation.columnMap.primaryBrand),
      ),
      itemCode,
      model,
      brand,
      quantity,
      amount,
      date,
      periodId: getPeriodId(date),
      documentNumber,
      documentType: getDocumentType(documentNumber),
      documentStatus,
      createdFrom,
      relatedDocumentStatus: parseString(
        getValue(row, validation.columnMap.relatedDocumentStatus),
      ),
      currency,
      isVoided: isVoidedStatus(documentStatus),
      estimatedCloseDate: toDateOnly(
        getValue(row, validation.columnMap.estimatedCloseDate),
      ),
      estimatedBillingDate: toDateOnly(
        getValue(row, validation.columnMap.estimatedBillingDate),
      ),
      estimatedDeliveryDate: toDateOnly(
        getValue(row, validation.columnMap.estimatedDeliveryDate),
      ),
      salesRepresentative: parseString(
        getValue(row, validation.columnMap.salesRepresentative),
      ),
      salesLocation: parseString(
        getValue(row, validation.columnMap.salesLocation),
      ),
      assignedBusinessDeveloper: parseString(
        getValue(
          row,
          validation.columnMap.assignedBusinessDeveloper,
        ),
      ),
      purchaseDescription: parseString(
        getValue(row, validation.columnMap.purchaseDescription),
      ),
    })
  }

  return {
    rows: [...rowsByLineKey.values()],
    ignoredRows,
  }
}
