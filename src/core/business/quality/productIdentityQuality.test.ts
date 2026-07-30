import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createProductIdentityQualityAccumulator,
  finalizeProductIdentityQualityReport,
  registerProductIdentityQualityResult,
} from './productIdentityQuality'

import type {
  ProductSalesReconciliationResult,
} from '../reconciliation'

function result(
  overrides: Partial<ProductSalesReconciliationResult>,
): ProductSalesReconciliationResult {
  return {
    status: 'matched',
    strategy: 'name',
    reason: 'matched_by_name',
    product: null,
    candidateNames: ['P-1'],
    candidateCodes: ['ALT-P-1'],
    attributeWarnings: [],
    normalizedProductName: 'P-1',
    normalizedProductCode: null,
    normalizedBrandId: 'UNV',
    normalizedModel: 'IPC-A',
    ...overrides,
  }
}

describe('IQ-002 Product Identity Quality Gate', () => {
  it('mide cobertura primaria por Name y cobertura total', () => {
    const accumulator = createProductIdentityQualityAccumulator(10)

    for (let index = 0; index < 19; index += 1) {
      registerProductIdentityQualityResult(
        accumulator,
        {
          revenue: 100,
          grossProfit: 25,
          quantity: 1,
          documentNumber: `F-${index}`,
        },
        result({}),
      )
    }

    registerProductIdentityQualityResult(
      accumulator,
      {
        revenue: 10,
        grossProfit: 2,
        quantity: 1,
        documentNumber: 'F-X',
      },
      result({
        status: 'unmatched',
        strategy: 'none',
        reason: 'product_not_found',
        product: null,
        candidateNames: [],
        candidateCodes: [],
        normalizedProductName: 'P-X',
      }),
    )

    const report = finalizeProductIdentityQualityReport(accumulator)

    expect(report.status).toBe('passed')
    expect(report.rowCoverage).toBe(0.95)
    expect(report.nameRowCoverage).toBe(0.95)
    expect(report.valueCoverage).toBeGreaterThan(0.99)
    expect(report.nameValueCoverage).toBeGreaterThan(0.99)
    expect(report.exceptionGroups).toBe(1)
  })

  it('mantiene conciliada una fila por Name con advertencia de atributos', () => {
    const accumulator = createProductIdentityQualityAccumulator(1)

    registerProductIdentityQualityResult(
      accumulator,
      {
        revenue: 500,
        grossProfit: 100,
        quantity: 2,
        documentNumber: 'F-1',
      },
      result({
        reason: 'matched_by_name_with_attribute_warning',
        attributeWarnings: ['brand_mismatch'],
      }),
    )

    const report = finalizeProductIdentityQualityReport(accumulator)

    expect(report.matchedRows).toBe(1)
    expect(report.matchedByNameRows).toBe(1)
    expect(report.attributeWarningRows).toBe(1)
    expect(report.attributeWarningGroups).toBe(1)
    expect(report.exceptionRows).toBe(0)
    expect(report.issues[0]?.status).toBe('matched')
  })

  it('falla y agrupa excepciones por identidad', () => {
    const accumulator = createProductIdentityQualityAccumulator(0)

    for (let index = 0; index < 2; index += 1) {
      registerProductIdentityQualityResult(
        accumulator,
        {
          revenue: 500,
          grossProfit: 100,
          quantity: 2,
          documentNumber: `F-${index}`,
        },
        result({
          status: 'unmatched',
          strategy: 'none',
          reason: 'product_not_found',
          product: null,
          candidateNames: [],
          candidateCodes: [],
          normalizedProductName: 'P-X',
        }),
      )
    }

    const report = finalizeProductIdentityQualityReport(accumulator)

    expect(report.status).toBe('failed')
    expect(report.unmatchedRows).toBe(2)
    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]?.salesValue).toBe(1000)
    expect(report.issues[0]?.documents).toBe(2)
    expect(report.classifiedExceptionRate).toBe(1)
  })

  it('incluye productos historicos por Name dentro de la cobertura de identidad', () => {
    const accumulator = createProductIdentityQualityAccumulator(10)

    registerProductIdentityQualityResult(
      accumulator,
      {
        revenue: 250,
        grossProfit: 50,
        quantity: 2,
        documentNumber: 'F-1',
      },
      {
        status: 'matched',
        strategy: 'name',
        reason: 'historical_unlisted',
        product: null,
        candidateNames: [],
        candidateCodes: [],
        attributeWarnings: [],
        normalizedProductName: 'HIST-1',
        normalizedProductCode: null,
        normalizedBrandId: 'UNV',
        normalizedModel: 'OLD-1',
      },
    )

    const report = finalizeProductIdentityQualityReport(accumulator)

    expect(report.matchedRows).toBe(1)
    expect(report.matchedByNameRows).toBe(1)
    expect(report.historicalUnlistedRows).toBe(1)
    expect(report.historicalUnlistedSalesValue).toBe(250)
    expect(report.rowCoverage).toBe(1)
  })

})
