import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import type {
  ProductIdentityAttributeWarning,
  ProductSalesReconciliationReason,
  ProductSalesReconciliationResult,
  ProductSalesReconciliationStatus,
} from '../reconciliation'

export type ProductIdentityGateStatus =
  | 'passed'
  | 'warning'
  | 'failed'
  | 'not_available'

export interface ProductIdentityQualityThresholds {
  minimumRowCoverage: number
  minimumValueCoverage: number
  minimumClassifiedExceptionRate: number
}

export interface ProductIdentityQualityIssue {
  id: string
  status: ProductSalesReconciliationStatus
  reason: ProductSalesReconciliationReason
  normalizedProductName: string | null
  normalizedProductCode: string | null
  brandId: string | null
  model: string | null
  candidateNames: string[]
  candidateCodes: string[]
  attributeWarnings: ProductIdentityAttributeWarning[]
  rows: number
  salesValue: number
  netRevenue: number
  grossProfit: number
  quantity: number
  documents: number
}

export interface ProductIdentityReasonSummary {
  reason: ProductSalesReconciliationReason
  rows: number
  salesValue: number
}

export interface ProductIdentityQualityReport {
  generatedAt: string
  status: ProductIdentityGateStatus
  thresholds: ProductIdentityQualityThresholds
  catalogProducts: number
  totalRows: number
  matchedRows: number
  matchedByNameRows: number
  matchedByNameSalesValue: number
  matchedByNameWithWarningsRows: number
  historicalUnlistedRows: number
  historicalUnlistedSalesValue: number
  matchedByLegacyCodeRows: number
  matchedByBrandAndModelRows: number
  attributeWarningRows: number
  attributeWarningSalesValue: number
  attributeWarningGroups: number
  ambiguousRows: number
  unmatchedRows: number
  missingIdentityRows: number
  totalSalesValue: number
  matchedSalesValue: number
  ambiguousSalesValue: number
  unmatchedSalesValue: number
  rowCoverage: number
  valueCoverage: number
  nameRowCoverage: number
  nameValueCoverage: number
  classifiedExceptionRate: number
  exceptionRows: number
  exceptionGroups: number
  reasonSummaries: ProductIdentityReasonSummary[]
  issues: ProductIdentityQualityIssue[]
}

interface ProductIdentityQualityIssueAccumulator
  extends Omit<ProductIdentityQualityIssue, 'documents'> {
  documentNumbers: Set<string>
}

export interface ProductIdentityQualityAccumulator {
  catalogProducts: number
  totalRows: number
  matchedRows: number
  matchedByNameRows: number
  matchedByNameSalesValue: number
  matchedByNameWithWarningsRows: number
  historicalUnlistedRows: number
  historicalUnlistedSalesValue: number
  matchedByLegacyCodeRows: number
  matchedByBrandAndModelRows: number
  attributeWarningRows: number
  attributeWarningSalesValue: number
  ambiguousRows: number
  unmatchedRows: number
  missingIdentityRows: number
  totalSalesValue: number
  matchedSalesValue: number
  ambiguousSalesValue: number
  unmatchedSalesValue: number
  reasonRows: Map<ProductSalesReconciliationReason, number>
  reasonValues: Map<ProductSalesReconciliationReason, number>
  issues: Map<string, ProductIdentityQualityIssueAccumulator>
}

export const DEFAULT_PRODUCT_IDENTITY_QUALITY_THRESHOLDS:
  ProductIdentityQualityThresholds = {
    minimumRowCoverage: 0.9,
    minimumValueCoverage: 0.95,
    minimumClassifiedExceptionRate: 1,
  }

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0
}

function buildIssueId(
  result: ProductSalesReconciliationResult,
): string {
  return [
    result.reason,
    result.normalizedProductName ?? 'NO_NAME',
    result.normalizedProductCode ?? 'NO_CODE',
    result.normalizedBrandId ?? 'NO_BRAND',
    result.normalizedModel ?? 'NO_MODEL',
    result.candidateNames.join('|') || 'NO_CANDIDATE_NAMES',
    result.attributeWarnings.join('|') || 'NO_WARNINGS',
  ].join('::')
}

export function createProductIdentityQualityAccumulator(
  catalogProducts: number,
): ProductIdentityQualityAccumulator {
  return {
    catalogProducts: Math.max(0, Math.floor(catalogProducts)),
    totalRows: 0,
    matchedRows: 0,
    matchedByNameRows: 0,
    matchedByNameSalesValue: 0,
    matchedByNameWithWarningsRows: 0,
    historicalUnlistedRows: 0,
    historicalUnlistedSalesValue: 0,
    matchedByLegacyCodeRows: 0,
    matchedByBrandAndModelRows: 0,
    attributeWarningRows: 0,
    attributeWarningSalesValue: 0,
    ambiguousRows: 0,
    unmatchedRows: 0,
    missingIdentityRows: 0,
    totalSalesValue: 0,
    matchedSalesValue: 0,
    ambiguousSalesValue: 0,
    unmatchedSalesValue: 0,
    reasonRows: new Map(),
    reasonValues: new Map(),
    issues: new Map(),
  }
}

function registerIssue(
  accumulator: ProductIdentityQualityAccumulator,
  row: Pick<
    NormalizedSalesRow,
    | 'revenue'
    | 'grossProfit'
    | 'quantity'
    | 'documentNumber'
  >,
  result: ProductSalesReconciliationResult,
  salesValue: number,
): void {
  const issueId = buildIssueId(result)
  const existing = accumulator.issues.get(issueId)

  if (existing) {
    existing.rows += 1
    existing.salesValue += salesValue
    existing.netRevenue += finiteNumber(row.revenue)
    existing.grossProfit += finiteNumber(row.grossProfit)
    existing.quantity += finiteNumber(row.quantity)

    if (row.documentNumber) {
      existing.documentNumbers.add(row.documentNumber)
    }

    return
  }

  const documentNumbers = new Set<string>()

  if (row.documentNumber) {
    documentNumbers.add(row.documentNumber)
  }

  accumulator.issues.set(issueId, {
    id: issueId,
    status: result.status,
    reason: result.reason,
    normalizedProductName: result.normalizedProductName,
    normalizedProductCode: result.normalizedProductCode,
    brandId: result.normalizedBrandId,
    model: result.normalizedModel,
    candidateNames: [...result.candidateNames],
    candidateCodes: [...result.candidateCodes],
    attributeWarnings: [...result.attributeWarnings],
    rows: 1,
    salesValue,
    netRevenue: finiteNumber(row.revenue),
    grossProfit: finiteNumber(row.grossProfit),
    quantity: finiteNumber(row.quantity),
    documentNumbers,
  })
}

export function registerProductIdentityQualityResult(
  accumulator: ProductIdentityQualityAccumulator,
  row: Pick<
    NormalizedSalesRow,
    | 'revenue'
    | 'grossProfit'
    | 'quantity'
    | 'documentNumber'
  >,
  result: ProductSalesReconciliationResult,
): void {
  const revenue = finiteNumber(row.revenue)
  const salesValue = Math.abs(revenue)

  accumulator.totalRows += 1
  accumulator.totalSalesValue += salesValue
  accumulator.reasonRows.set(
    result.reason,
    (accumulator.reasonRows.get(result.reason) ?? 0) + 1,
  )
  accumulator.reasonValues.set(
    result.reason,
    (accumulator.reasonValues.get(result.reason) ?? 0) + salesValue,
  )

  if (result.status === 'matched') {
    accumulator.matchedRows += 1
    accumulator.matchedSalesValue += salesValue

    if (
      result.reason === 'matched_by_name' ||
      result.reason === 'matched_by_name_with_attribute_warning' ||
      result.reason === 'historical_unlisted'
    ) {
      accumulator.matchedByNameRows += 1
      accumulator.matchedByNameSalesValue += salesValue
    }

    if (result.reason === 'historical_unlisted') {
      accumulator.historicalUnlistedRows += 1
      accumulator.historicalUnlistedSalesValue += salesValue
    }

    if (result.reason === 'matched_by_name_with_attribute_warning') {
      accumulator.matchedByNameWithWarningsRows += 1
      accumulator.attributeWarningRows += 1
      accumulator.attributeWarningSalesValue += salesValue
      registerIssue(accumulator, row, result, salesValue)
    }

    if (result.reason === 'matched_by_erp_code') {
      accumulator.matchedByLegacyCodeRows += 1
    }

    if (result.reason === 'matched_by_brand_model') {
      accumulator.matchedByBrandAndModelRows += 1
    }

    return
  }

  if (result.status === 'ambiguous') {
    accumulator.ambiguousRows += 1
    accumulator.ambiguousSalesValue += salesValue
  } else {
    accumulator.unmatchedRows += 1
    accumulator.unmatchedSalesValue += salesValue

    if (result.reason === 'missing_product_identity') {
      accumulator.missingIdentityRows += 1
    }
  }

  registerIssue(accumulator, row, result, salesValue)
}

function calculateCoverage(
  matched: number,
  total: number,
): number {
  if (total <= 0) {
    return 0
  }

  return matched / total
}

function resolveGateStatus(
  totalRows: number,
  rowCoverage: number,
  valueCoverage: number,
  classifiedExceptionRate: number,
  thresholds: ProductIdentityQualityThresholds,
): ProductIdentityGateStatus {
  if (totalRows === 0) {
    return 'not_available'
  }

  if (
    rowCoverage >= thresholds.minimumRowCoverage &&
    valueCoverage >= thresholds.minimumValueCoverage &&
    classifiedExceptionRate >=
      thresholds.minimumClassifiedExceptionRate
  ) {
    return 'passed'
  }

  if (rowCoverage >= 0.75 && valueCoverage >= 0.85) {
    return 'warning'
  }

  return 'failed'
}

export function finalizeProductIdentityQualityReport(
  accumulator: ProductIdentityQualityAccumulator,
  thresholds:
    ProductIdentityQualityThresholds =
      DEFAULT_PRODUCT_IDENTITY_QUALITY_THRESHOLDS,
): ProductIdentityQualityReport {
  const rowCoverage = calculateCoverage(
    accumulator.matchedRows,
    accumulator.totalRows,
  )

  const valueCoverage = calculateCoverage(
    accumulator.matchedSalesValue,
    accumulator.totalSalesValue,
  )

  const nameRowCoverage = calculateCoverage(
    accumulator.matchedByNameRows,
    accumulator.totalRows,
  )

  const nameValueCoverage = calculateCoverage(
    accumulator.matchedByNameSalesValue,
    accumulator.totalSalesValue,
  )

  const exceptionRows =
    accumulator.ambiguousRows +
    accumulator.unmatchedRows

  const classifiedExceptionRows = [
    'ambiguous_name',
    'ambiguous_erp_code',
    'ambiguous_brand_model',
    'product_not_found',
    'missing_product_identity',
  ].reduce(
    (total, reason) =>
      total +
      (accumulator.reasonRows.get(
        reason as ProductSalesReconciliationReason,
      ) ?? 0),
    0,
  )

  const classifiedExceptionRate =
    exceptionRows > 0
      ? classifiedExceptionRows / exceptionRows
      : 1

  const issues = [...accumulator.issues.values()]
    .map((issue) => ({
      id: issue.id,
      status: issue.status,
      reason: issue.reason,
      normalizedProductName: issue.normalizedProductName,
      normalizedProductCode: issue.normalizedProductCode,
      brandId: issue.brandId,
      model: issue.model,
      candidateNames: [...issue.candidateNames],
      candidateCodes: [...issue.candidateCodes],
      attributeWarnings: [...issue.attributeWarnings],
      rows: issue.rows,
      salesValue: issue.salesValue,
      netRevenue: issue.netRevenue,
      grossProfit: issue.grossProfit,
      quantity: issue.quantity,
      documents: issue.documentNumbers.size,
    }))
    .sort(
      (left, right) =>
        right.salesValue - left.salesValue ||
        right.rows - left.rows ||
        left.id.localeCompare(right.id),
    )

  const reasonSummaries = [
    ...accumulator.reasonRows.keys(),
  ]
    .map((reason) => ({
      reason,
      rows: accumulator.reasonRows.get(reason) ?? 0,
      salesValue: accumulator.reasonValues.get(reason) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.salesValue - left.salesValue ||
        right.rows - left.rows,
    )

  return {
    generatedAt: new Date().toISOString(),
    status: resolveGateStatus(
      accumulator.totalRows,
      rowCoverage,
      valueCoverage,
      classifiedExceptionRate,
      thresholds,
    ),
    thresholds: { ...thresholds },
    catalogProducts: accumulator.catalogProducts,
    totalRows: accumulator.totalRows,
    matchedRows: accumulator.matchedRows,
    matchedByNameRows: accumulator.matchedByNameRows,
    matchedByNameSalesValue: accumulator.matchedByNameSalesValue,
    matchedByNameWithWarningsRows:
      accumulator.matchedByNameWithWarningsRows,
    historicalUnlistedRows:
      accumulator.historicalUnlistedRows,
    historicalUnlistedSalesValue:
      accumulator.historicalUnlistedSalesValue,
    matchedByLegacyCodeRows: accumulator.matchedByLegacyCodeRows,
    matchedByBrandAndModelRows:
      accumulator.matchedByBrandAndModelRows,
    attributeWarningRows: accumulator.attributeWarningRows,
    attributeWarningSalesValue:
      accumulator.attributeWarningSalesValue,
    attributeWarningGroups: issues.filter(
      (issue) =>
        issue.reason ===
        'matched_by_name_with_attribute_warning',
    ).length,
    ambiguousRows: accumulator.ambiguousRows,
    unmatchedRows: accumulator.unmatchedRows,
    missingIdentityRows: accumulator.missingIdentityRows,
    totalSalesValue: accumulator.totalSalesValue,
    matchedSalesValue: accumulator.matchedSalesValue,
    ambiguousSalesValue: accumulator.ambiguousSalesValue,
    unmatchedSalesValue: accumulator.unmatchedSalesValue,
    rowCoverage,
    valueCoverage,
    nameRowCoverage,
    nameValueCoverage,
    classifiedExceptionRate,
    exceptionRows,
    exceptionGroups: issues.filter(
      (issue) => issue.status !== 'matched',
    ).length,
    reasonSummaries,
    issues,
  }
}

export function createEmptyProductIdentityQualityReport():
  ProductIdentityQualityReport {
  return finalizeProductIdentityQualityReport(
    createProductIdentityQualityAccumulator(0),
  )
}
