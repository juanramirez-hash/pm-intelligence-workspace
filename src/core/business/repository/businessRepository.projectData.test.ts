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
} from './businessRepository'

import type {
  NormalizedProjectRow,
} from '../../../features/data-center/importers/projects/projectTypes'

import type {
  NormalizedProjectBillingRow,
} from '../../../features/data-center/importers/project-billings/projectBillingTypes'

const project: NormalizedProjectRow = {
  internalId: '3807',
  projectId: 'PROY3807',
  name: 'KOBLENZ Qro y Cuautitlán',
  endUser: 'KOBLENZ',
  customerId: '123456',
  customerName: 'Cliente de prueba',
  salesExecutive: 'Ejecutivo',
  location: '002 CDMX',
  assignedBusinessDeveloper: null,
  assignedProductManager: 'PM',
  group: 'Grupo 1',
  primaryBrand: 'UNV (UNIVIEW)',
  createdAt: '2026-05-01',
  elapsedDays: 91,
  currency: 'USD',
  statusCode: '06',
  statusLabel: '06 Surtido parcialmente',
  forecastStage: 'mature',
  closingProbability: 1,
  estimatedCloseDate: '2026-07-15',
  estimatedBillingDate: '2026-07-31',
  amountToClose: 1000,
  observations: null,
  assignedEngineer: null,
  approximateAmount: 5000,
  invoicedAmount: 4000,
  reportAmountToInvoice: 1000,
  amountToInvoice: 1000,
  isDuplicate: false,
}

const billingLine: NormalizedProjectBillingRow = {
  lineKey: 'line-1',
  duplicateOccurrences: 0,
  internalId: '701105',
  projectId: 'PROY3807',
  projectDescription: 'KOBLENZ',
  endUser: 'KOBLENZ',
  customerId: '123456',
  customerName: 'Cliente de prueba',
  primaryBrand: 'UNV (UNIVIEW)',
  itemCode: 'ITEM-1',
  model: 'MODEL-1',
  brand: 'UNV',
  quantity: 2,
  amount: 10000,
  date: '2026-07-15',
  periodId: '2026-07',
  documentNumber: 'F00701105',
  documentType: 'invoice',
  documentStatus: 'Open',
  createdFrom: null,
  relatedDocumentStatus: null,
  currency: 'MXN',
  isVoided: false,
  estimatedCloseDate: null,
  estimatedBillingDate: null,
  estimatedDeliveryDate: null,
  salesRepresentative: 'Ejecutivo',
  salesLocation: '002 CDMX',
  assignedBusinessDeveloper: null,
  purchaseDescription: null,
}

describe('FW-007 Project Data Foundation', () => {
  it('expone proyectos, documentos y conversiones desde BusinessRepository', () => {
    const model = buildBusinessDataModel([], {
      projects: [project],
      projectBillings: [billingLine],
      exchangeRates: [{
        periodId: '2026-07',
        sourceCurrency: 'USD',
        targetCurrency: 'MXN',
        rate: 18.75,
        sourceReference: 'Autorizado',
        effectiveDate: null,
        recordedAt: '2026-07-31T12:00:00.000Z',
      }],
    })
    const repository = new BusinessRepository(model)

    expect(
      repository.projects.getMatureOpenByPeriod('2026-07'),
    ).toHaveLength(1)
    expect(
      repository.projectBillings.findByDocumentNumber('f00701105')?.projectId,
    ).toBe('PROY3807')
    expect(
      repository.exchangeRates.convert(
        1000,
        '2026-07',
        'USD',
        'MXN',
      ).convertedAmount,
    ).toBe(18750)
  })

  it('bloquea conversiones cuando falta el tipo de cambio', () => {
    const repository = new BusinessRepository(
      buildBusinessDataModel([], {
        projects: [project],
      }),
    )

    const conversion = repository.exchangeRates.convert(
      1000,
      '2026-08',
      'USD',
      'MXN',
    )

    expect(conversion.available).toBe(false)
    expect(conversion.reason).toBe('missing_rate')
    expect(conversion.convertedAmount).toBeNull()
  })
})
