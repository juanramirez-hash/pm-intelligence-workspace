import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../../../core/business/builders'

import {
  BusinessRepository,
} from '../../../core/business/repository'

import type {
  NormalizedSalesRow,
} from '../../data-center/importers/sales/salesTypes'

import {
  buildSalesVarianceContributionAnalysis,
} from './buildSalesVarianceContribution'

function sale(
  date: string,
  brand: string,
  customerId: string,
  customerName: string,
  model: string,
  revenue: number,
  grossProfit: number,
  quantity: number,
  documentNumber: string,
): NormalizedSalesRow {
  return {
    date,
    brand,
    revenue,
    grossProfit,
    customerId,
    customerName,
    productCode: null,
    model,
    productStatus: 'A',
    quantity,
    documentNumber,
    location: 'CDMX',
    salesRep: 'VENDEDOR 1',
    currency: 'MXN',
  }
}

function createRepository() {
  return new BusinessRepository(
    buildBusinessDataModel([
      sale(
        '2026-01-10',
        'UNV',
        'C2',
        'Cliente Recuperado',
        'IPC-B',
        100,
        30,
        1,
        'J1',
      ),
      sale(
        '2026-02-05',
        'UNV',
        'C1',
        'Cliente Crecimiento',
        'IPC-A',
        500,
        100,
        5,
        'F1',
      ),
      sale(
        '2026-02-06',
        'TP-LINK',
        'C3',
        'Cliente Perdido',
        'SW-8',
        300,
        90,
        3,
        'F2',
      ),
      sale(
        '2026-02-07',
        'UNV',
        'C5',
        'Cliente en Baja',
        'IPC-C',
        400,
        120,
        4,
        'F3',
      ),
      sale(
        '2026-02-08',
        'UNV',
        'C6',
        'Cliente Estable',
        'IPC-D',
        100,
        30,
        1,
        'F4',
      ),
      sale(
        '2026-03-05',
        'UNV',
        'C1',
        'Cliente Crecimiento',
        'IPC-A',
        800,
        200,
        8,
        'M1',
      ),
      sale(
        '2026-03-06',
        'UNV',
        'C2',
        'Cliente Recuperado',
        'IPC-B',
        200,
        60,
        2,
        'M2',
      ),
      sale(
        '2026-03-07',
        'TP-LINK',
        'C4',
        'Cliente Nuevo',
        'EAP-NEW',
        250,
        50,
        2,
        'M3',
      ),
      sale(
        '2026-03-08',
        'UNV',
        'C5',
        'Cliente en Baja',
        'IPC-C',
        100,
        20,
        1,
        'M4',
      ),
      sale(
        '2026-03-09',
        'UNV',
        'C6',
        'Cliente Estable',
        'IPC-D',
        100,
        30,
        1,
        'M5',
      ),
    ]),
  )
}

function buildAnalysis(
  filters = {},
) {
  return buildSalesVarianceContributionAnalysis({
    repository: createRepository(),
    filters: {
      periodId: '2026-03',
      comparisonMode: 'previous-period',
      ...filters,
    },
    currentPeriodId: '2026-03',
    comparisonPeriodId: '2026-02',
    comparisonLabel: 'Periodo anterior',
  })
}

describe('SW-004 Variance & Contribution Analysis', () => {
  it('calcula la variación ejecutiva de venta, GP, cantidad, documentos y margen', () => {
    const analysis = buildAnalysis()

    expect(analysis.available).toBe(true)
    expect(analysis.revenue.current).toBe(1_450)
    expect(analysis.revenue.comparison).toBe(1_300)
    expect(analysis.revenue.absoluteVariation).toBe(150)
    expect(analysis.grossProfit.absoluteVariation).toBe(20)
    expect(analysis.quantity.absoluteVariation).toBe(1)
    expect(analysis.documents.absoluteVariation).toBe(1)
    expect(analysis.grossMargin.pointVariation).toBeCloseTo(-1.33, 1)
  })

  it('separa impulsores positivos y negativos por marca', () => {
    const analysis = buildAnalysis()

    expect(analysis.brands.positive[0]?.id).toBe('UNV')
    expect(analysis.brands.positive[0]?.revenueVariation).toBe(200)
    expect(analysis.brands.negative[0]?.id).toBe('TP-LINK')
    expect(analysis.brands.negative[0]?.revenueVariation).toBe(-50)
    expect(analysis.positiveRevenueContribution).toBe(200)
    expect(analysis.negativeRevenueContribution).toBe(50)
  })

  it('detecta clientes nuevos, recuperados, crecientes, en baja y perdidos', () => {
    const movements =
      buildAnalysis().customerMovements

    const status = (id: string) =>
      movements.items.find(
        (item) => item.id === id,
      )?.status

    expect(status('C1')).toBe('growing')
    expect(status('C2')).toBe('recovered')
    expect(status('C3')).toBe('lost')
    expect(status('C4')).toBe('new')
    expect(status('C5')).toBe('declining')
    expect(status('C6')).toBe('stable')
  })

  it('calcula el cambio de mezcla y el peso del movimiento', () => {
    const unv =
      buildAnalysis().brands.positive[0]

    expect(unv?.mixVariationPoints).toBeGreaterThan(5)
    expect(unv?.movementShare).toBe(80)
  })

  it('respeta los filtros activos del Sales Workspace', () => {
    const analysis =
      buildAnalysis({
        brandIds: ['UNV'],
      })

    expect(analysis.revenue.current).toBe(1_200)
    expect(analysis.revenue.comparison).toBe(1_000)
    expect(analysis.brands.negative).toHaveLength(0)
    expect(
      analysis.customerMovements.items.some(
        (item) => item.id === 'C3',
      ),
    ).toBe(false)
  })

  it('devuelve estado no evaluable cuando no existe periodo comparable', () => {
    const analysis =
      buildSalesVarianceContributionAnalysis({
        repository: createRepository(),
        filters: {
          periodId: '2026-01',
          comparisonMode: 'previous-period',
        },
        currentPeriodId: '2026-01',
        comparisonPeriodId: null,
        comparisonLabel: 'Periodo anterior',
      })

    expect(analysis.available).toBe(false)
    expect(analysis.brands.positive).toHaveLength(0)
  })
})
