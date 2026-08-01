import type {
  NormalizedProjectBillingRow,
  ProjectBillingDatasetSummary,
} from './projectBillingTypes'

export interface ProjectBillingBusinessModel {
  lines: NormalizedProjectBillingRow[]
  summary: ProjectBillingDatasetSummary
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function documentIdentity(
  row: NormalizedProjectBillingRow,
): string {
  return row.internalId || row.documentNumber
}

export function mergeProjectBillingRows(
  existingRows: readonly NormalizedProjectBillingRow[],
  incomingRows: readonly NormalizedProjectBillingRow[],
): NormalizedProjectBillingRow[] {
  const incomingDocuments = new Set(
    incomingRows.map(documentIdentity),
  )
  const rowsByLineKey = new Map<string, NormalizedProjectBillingRow>()

  for (const row of existingRows) {
    if (!incomingDocuments.has(documentIdentity(row))) {
      rowsByLineKey.set(row.lineKey, row)
    }
  }

  for (const row of incomingRows) {
    rowsByLineKey.set(row.lineKey, row)
  }

  return [...rowsByLineKey.values()].sort(
    (left, right) =>
      left.date.localeCompare(right.date) ||
      left.documentNumber.localeCompare(right.documentNumber) ||
      left.lineKey.localeCompare(right.lineKey),
  )
}

export function buildProjectBillingBusinessModel(
  rows: readonly NormalizedProjectBillingRow[],
  ignoredRows = 0,
): ProjectBillingBusinessModel {
  const lines = mergeProjectBillingRows([], rows)
  const documents = new Map<
    string,
    NormalizedProjectBillingRow
  >()

  for (const line of lines) {
    const key = documentIdentity(line)
    const existing = documents.get(key)

    if (!existing || (!existing.isVoided && line.isVoided)) {
      documents.set(key, line)
    }
  }

  const documentRows = [...documents.values()]
  const dates = lines
    .map((line) => line.date)
    .sort()
  const activeLines = lines.filter((line) => !line.isVoided)

  const amountByCurrency = (currency: string): number =>
    roundCurrency(
      activeLines.reduce(
        (total, line) =>
          line.currency === currency
            ? total + line.amount
            : total,
        0,
      ),
    )

  return {
    lines,
    summary: {
      periodStart: dates[0] ?? null,
      periodEnd: dates.at(-1) ?? null,
      totalLines: lines.length,
      uniqueDocuments: documentRows.length,
      uniqueProjects: new Set(
        lines.map((line) => line.projectId),
      ).size,
      invoiceDocuments: documentRows.filter(
        (row) => row.documentType === 'invoice',
      ).length,
      creditNoteDocuments: documentRows.filter(
        (row) => row.documentType === 'credit_note',
      ).length,
      otherDocuments: documentRows.filter(
        (row) => row.documentType === 'other',
      ).length,
      voidedDocuments: documentRows.filter(
        (row) => row.isVoided,
      ).length,
      duplicateSourceLines: lines.reduce(
        (total, line) => total + line.duplicateOccurrences,
        0,
      ),
      documentsMissingCurrency: documentRows.filter(
        (row) => !row.currency,
      ).length,
      documentsMissingProject: documentRows.filter(
        (row) => !row.projectId,
      ).length,
      sourceAmountMxn: amountByCurrency('MXN'),
      sourceAmountUsd: amountByCurrency('USD'),
      currencies: [...new Set(
        lines
          .map((line) => line.currency)
          .filter((currency): currency is string => Boolean(currency)),
      )].sort(),
      processedRows: lines.length,
      ignoredRows,
    },
  }
}
