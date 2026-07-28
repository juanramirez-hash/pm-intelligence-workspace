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
  BusinessBrandTargetInput,
} from '../../../core/business/targets'

import type {
  NormalizedSalesRow,
} from '../../data-center/importers/sales/salesTypes'

import {
  buildSalesWorkspace,
} from './buildSalesWorkspace'

function createSale(
  date: string,
  brand: string,
  revenue: number,
  grossProfit: number,
  documentNumber: string,
): NormalizedSalesRow {
  return {
    date,
    brand,
    revenue,
    grossProfit,
    customerId: 'C1',
    customerName: 'Cliente Uno',
    productCode: null,
    model: `${brand}-MODEL`,
    productStatus: 'A',
    quantity: 1,
    documentNumber,
    location: 'CDMX',
    salesRep: 'VENDEDOR 1',
    currency: 'MXN',
  }
}

const targets: BusinessBrandTargetInput[] = [
  {
    brandId: 'UNV',
    periodId: '2026-03',
    targetRevenue: 800,
    targetGrossProfit: 200,
    targetGrossMargin: 0.25,
    workingDays: 22,
  },
  {
    brandId: 'TP-LINK',
    periodId: '2026-03',
    targetRevenue: 400,
    targetGrossProfit: 80,
    targetGrossMargin: 0.2,
    workingDays: 22,
  },
]

function createRepository(
  withTargets = true,
) {
  const sales = [
    createSale(
      '2026-03-05',
      'UNV',
      300,
      90,
      'D-1',
    ),
    createSale(
      '2026-03-12',
      'UNV',
      100,
      30,
      'D-2',
    ),
    createSale(
      '2026-03-18',
      'TP-LINK',
      200,
      30,
      'D-3',
    ),
  ]

  return new BusinessRepository(
    buildBusinessDataModel(
      sales,
      {
        brandTargets:
          withTargets
            ? targets
            : [],
      },
    ),
  )
}

function buildWorkspace(
  withTargets = true,
) {
  return buildSalesWorkspace(
    createRepository(withTargets),
    {
      periodId: '2026-03',
      comparisonMode:
        'previous-period',
    },
  )
}

describe('SW-002 Sales Performance Analytics', () => {
  it('consolida objetivos mensuales y calcula cumplimiento', () => {
    const workspace =
      buildWorkspace()

    expect(
      workspace.performance.available,
    ).toBe(true)
    expect(
      workspace.performance.revenue.target,
    ).toBe(1_200)
    expect(
      workspace.performance.revenue.actual,
    ).toBe(600)
    expect(
      workspace.performance.revenue.attainment,
    ).toBe(50)
    expect(
      workspace.performance.grossProfit.target,
    ).toBe(280)
    expect(
      workspace.performance.grossMargin.target,
    ).toBeCloseTo(23.3333)
  })

  it('calcula ritmo por días laborales al último corte de ventas', () => {
    const pace =
      buildWorkspace().performance.pace

    expect(pace.workingDays).toBe(22)
    expect(pace.elapsedWorkingDays).toBe(13)
    expect(pace.remainingWorkingDays).toBe(9)
    expect(pace.expectedToDate).toBeCloseTo(709.0909)
    expect(pace.currentDailyRevenue).toBeCloseTo(46.1538)
    expect(pace.requiredDailyRevenue).toBeCloseTo(66.6667)
    expect(pace.projectedPeriodEnd).toBeCloseTo(1_015.3846)
    expect(pace.projectedAttainment).toBeCloseTo(84.6154)
    expect(pace.status).toBe('behind-plan')
  })

  it('prioriza las marcas con mayor brecha contra el ritmo', () => {
    const brands =
      buildWorkspace().brandPerformance

    expect(brands).toHaveLength(2)
    expect(brands[0]?.brandId).toBe('UNV')
    expect(brands[0]?.varianceToPlan).toBeCloseTo(-72.7273)
    expect(brands[0]?.projectedAttainment).toBeCloseTo(84.6154)
    expect(brands[1]?.brandId).toBe('TP-LINK')
  })

  it('reporta cobertura de cuotas sobre las marcas activas', () => {
    const coverage =
      buildWorkspace().performance.coverage

    expect(coverage.targetedBrands).toBe(2)
    expect(coverage.activeBrands).toBe(2)
    expect(coverage.coveredActiveBrands).toBe(2)
    expect(coverage.activeBrandsWithoutTarget).toBe(0)
    expect(coverage.coveragePercentage).toBe(100)
  })

  it('mantiene el workspace operativo cuando no hay objetivos', () => {
    const workspace =
      buildWorkspace(false)

    expect(workspace.available).toBe(true)
    expect(
      workspace.performance.available,
    ).toBe(false)
    expect(
      workspace.performance.revenue.actual,
    ).toBe(600)
    expect(
      workspace.performance.revenue.target,
    ).toBeNull()
    expect(workspace.brandPerformance).toEqual([])
  })
})
