import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  BusinessRepository,
} from '../repository'

import type {
  NormalizedExchangeRateRow,
} from '../../../features/data-center/importers/exchange-rates/exchangeRateTypes'

import type {
  NormalizedProjectBillingRow,
} from '../../../features/data-center/importers/project-billings/projectBillingTypes'

import type {
  NormalizedProjectRow,
} from '../../../features/data-center/importers/projects/projectTypes'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

function salesRow(
  date: string,
  documentNumber: string,
  revenue: number,
  grossProfit: number,
): NormalizedSalesRow {
  return {
    date,
    brand: 'UNV',
    revenue,
    grossProfit,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    productName: 'P-1',
    productCode: 'P-1',
    model: 'P-1',
    quantity: 1,
    documentNumber,
    location: 'CDMX',
    salesRep: 'VENDEDOR 1',
    currency: 'MXN',
  }
}

function project(
  internalId: string,
  projectId: string,
  forecastStage: NormalizedProjectRow['forecastStage'],
  statusCode: NormalizedProjectRow['statusCode'],
  estimatedBillingDate: string | null,
  amountToClose: number | null,
  closingProbability: number | null,
): NormalizedProjectRow {
  return {
    internalId,
    projectId,
    name: `Proyecto ${projectId}`,
    endUser: null,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    salesExecutive: 'VENDEDOR 1',
    location: 'CDMX',
    assignedBusinessDeveloper: null,
    assignedProductManager: null,
    group: null,
    primaryBrand: 'UNV',
    createdAt: '2026-01-01',
    elapsedDays: 10,
    currency: 'USD',
    statusCode,
    statusLabel: `${statusCode} Status`,
    forecastStage,
    closingProbability,
    estimatedCloseDate: estimatedBillingDate,
    estimatedBillingDate,
    amountToClose,
    observations: null,
    assignedEngineer: null,
    approximateAmount: amountToClose,
    invoicedAmount: 0,
    reportAmountToInvoice: amountToClose,
    amountToInvoice: amountToClose,
    isDuplicate: false,
  }
}

function billingRow(
  lineKey: string,
  internalId: string,
  projectId: string,
  date: string,
  documentNumber: string,
  amount: number,
): NormalizedProjectBillingRow {
  return {
    lineKey,
    duplicateOccurrences: 1,
    internalId,
    projectId,
    projectDescription: `Proyecto ${projectId}`,
    endUser: null,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    primaryBrand: 'UNV',
    itemCode: 'P-1',
    model: 'P-1',
    brand: 'UNV',
    quantity: 1,
    amount,
    date,
    periodId: date.slice(0, 7),
    documentNumber,
    documentType: 'invoice',
    documentStatus: 'Facturado',
    createdFrom: null,
    relatedDocumentStatus: null,
    currency: 'MXN',
    isVoided: false,
    estimatedCloseDate: date,
    estimatedBillingDate: date,
    estimatedDeliveryDate: null,
    salesRepresentative: 'VENDEDOR 1',
    salesLocation: 'CDMX',
    assignedBusinessDeveloper: null,
    purchaseDescription: null,
  }
}

function exchangeRate(): NormalizedExchangeRateRow {
  return {
    periodId: '2026-07',
    sourceCurrency: 'USD',
    targetCurrency: 'MXN',
    rate: 20,
    sourceReference: 'Planeación mensual',
    effectiveDate: '2026-07-01',
    recordedAt: '2026-07-01T12:00:00.000Z',
  }
}

function createModel(includeExchangeRate = true) {
  const sales: NormalizedSalesRow[] = [
    salesRow('2026-01-15', 'F-TX-01', 100, 25),
    salesRow('2026-01-20', 'F-PROJ-HIST', 50, 12.5),
    salesRow('2026-02-15', 'F-TX-02', 100, 25),
    salesRow('2026-03-15', 'F-TX-03', 100, 25),
    salesRow('2026-04-15', 'F-TX-04', 100, 25),
    salesRow('2026-05-15', 'F-TX-05', 100, 25),
    salesRow('2026-06-15', 'F-TX-06', 100, 25),
    salesRow('2026-07-15', 'F-TX-07', 100, 25),
    salesRow('2026-07-16', 'F-PROJ-CURRENT', 50, 12.5),
  ]

  const projects: NormalizedProjectRow[] = [
    project(
      'INT-HIST',
      'PROY-HIST',
      'realized',
      '07',
      '2026-01-20',
      0,
      1,
    ),
    project(
      'INT-CURRENT',
      'PROY-CURRENT',
      'realized',
      '07',
      '2026-07-16',
      0,
      1,
    ),
    project(
      'INT-MATURE',
      'PROY-MATURE',
      'mature',
      '05',
      '2026-07-28',
      10,
      1,
    ),
    project(
      'INT-POTENTIAL',
      'PROY-POTENTIAL',
      'potential',
      '04',
      '2026-07-30',
      30,
      0.4,
    ),
  ]

  const billings: NormalizedProjectBillingRow[] = [
    billingRow(
      'LINE-HIST',
      'BILL-HIST',
      'PROY-HIST',
      '2026-01-20',
      'F-PROJ-HIST',
      50,
    ),
    billingRow(
      'LINE-CURRENT',
      'BILL-CURRENT',
      'PROY-CURRENT',
      '2026-07-16',
      'F-PROJ-CURRENT',
      50,
    ),
  ]

  return buildBusinessDataModel(
    sales,
    {
      projects,
      projectBillings: billings,
      exchangeRates: includeExchangeRate
        ? [exchangeRate()]
        : [],
      brandTargets: [
        {
          brandId: 'UNV',
          periodId: '2026-07',
          targetRevenue: 500,
          workingDays: 23,
        },
      ],
    },
  )
}

describe('FW-009 Project-Aware Forecast Engine', () => {
  it('separa baseline transaccional, facturación real y pipeline maduro sin sumar upside potencial', () => {
    const repository = new BusinessRepository(createModel())
    const projection =
      repository.forecast.getProjectAwarePortfolioProjection()

    expect(projection).toBeDefined()
    expect(projection?.methodologyVersion).toBe('project-aware-v1')
    expect(projection?.officialAvailable).toBe(true)
    expect(projection?.actualTotal.revenue).toBe(150)
    expect(projection?.actualTransactional.revenue).toBe(100)
    expect(projection?.actualProjectBilling.revenue).toBe(50)
    expect(projection?.pipeline.matureRevenueMxn).toBe(200)
    expect(
      projection?.pipeline.matureEstimatedGrossProfitMxn,
    ).toBe(50)
    expect(projection?.pipeline.potentialRevenueMxn).toBe(600)
    expect(
      projection?.pipeline.potentialWeightedRevenueMxn,
    ).toBe(240)

    const expectedScenario = projection?.scenarios.find(
      (scenario) => scenario.id === 'expected',
    )

    expect(expectedScenario?.values.revenue).toBe(
      (projection?.transactionalBaseline.expected.revenue ?? 0) +
        50 +
        200,
    )
    expect(expectedScenario?.values.revenue).not.toBe(
      (projection?.transactionalBaseline.expected.revenue ?? 0) +
        50 +
        200 +
        600,
    )
    expect(expectedScenario?.maturePipeline.quantity).toBe(0)
    expect(
      projection?.projectContributions.find(
        (contribution) => contribution.projectId === 'PROY-POTENTIAL',
      )?.contributionStatus,
    ).toBe('upside')
  })

  it('bloquea el forecast oficial cuando un proyecto maduro USD no tiene tipo de cambio del periodo', () => {
    const repository = new BusinessRepository(createModel(false))
    const projection =
      repository.forecast.getProjectAwarePortfolioProjection()

    expect(projection?.status).toBe('blocked')
    expect(projection?.officialAvailable).toBe(false)
    expect(projection?.pipeline.matureRevenueMxn).toBe(0)
    expect(projection?.quality.blockingIssues).toBeGreaterThan(0)
    expect(
      projection?.quality.issues.some(
        (candidate) => candidate.code === 'EXCHANGE_RATE_MISSING',
      ),
    ).toBe(true)
  })

  it('publica proyecciones project-aware por marca desde BusinessRepository', () => {
    const repository = new BusinessRepository(createModel())
    const report = repository.getProjectAwareForecastReport()
    const unv = repository.forecast.findProjectAwareBrandProjection('unv')

    expect(report.portfolio?.methodologyVersion).toBe('project-aware-v1')
    expect(unv?.entityId).toBe('UNV')
    expect(unv?.actualProjectBilling.revenue).toBe(50)
    expect(unv?.pipeline.matureRevenueMxn).toBe(200)
  })
})
