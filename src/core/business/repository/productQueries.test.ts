import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  BusinessRepository,
} from './businessRepository'

function createRepository(): BusinessRepository {
  const rows: NormalizedSalesRow[] = [
    {
      date: '2026-01-05',
      brand: 'UNV',
      revenue: 100,
      grossProfit: 30,
      customerId: '100001',
      customerName: 'Cliente Uno',
      model: 'IPC-A',
      quantity: 1,
      documentNumber: 'F001',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },
    {
      date: '2026-01-20',
      brand: 'UNV',
      revenue: 50,
      grossProfit: 15,
      customerId: '100002',
      customerName: 'Cliente Dos',
      model: 'IPC-A',
      quantity: 2,
      documentNumber: 'F002',
      location: 'QRO',
      salesRep: 'Luis',
      currency: 'MXN',
    },
    {
      date: '2026-02-10',
      brand: 'UNV',
      revenue: 200,
      grossProfit: 80,
      customerId: '100001',
      customerName: 'Cliente Uno',
      model: 'IPC-A',
      quantity: 3,
      documentNumber: 'F003',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },
  ]

  return new BusinessRepository(
    buildBusinessDataModel(rows),
  )
}

describe('Product Core Migration', () => {
  it('consolida la entidad de producto completa', () => {
    const product =
      createRepository().product.findById(' ipc-a ')

    expect(product).toBeDefined()
    expect(product?.sku).toBe('IPC-A')
    expect(product?.revenue).toBe(350)
    expect(product?.grossProfit).toBe(125)
    expect(product?.quantity).toBe(6)
    expect(product?.documents).toBe(3)
    expect(product?.firstSale).toBe('2026-01-05')
    expect(product?.lastSale).toBe('2026-02-10')
    expect(product?.activePeriods).toEqual(
      new Set(['2026-01', '2026-02']),
    )
    expect(product?.brands).toEqual(new Set(['UNV']))
    expect(product?.customers).toEqual(
      new Set(['100001', '100002']),
    )
    expect(product?.locations).toEqual(
      new Set(['CDMX', 'QRO']),
    )
  })

  it('consolida relaciones y documentos por periodo', () => {
    const period =
      createRepository().product.findPeriod(
        'IPC-A',
        '2026-01',
      )

    expect(period?.revenue).toBe(150)
    expect(period?.grossProfit).toBe(45)
    expect(period?.quantity).toBe(3)
    expect(period?.documents).toBe(2)
    expect(period?.customers).toEqual(
      new Set(['100001', '100002']),
    )
    expect(period?.brands).toEqual(new Set(['UNV']))
    expect(period?.locations).toEqual(
      new Set(['CDMX', 'QRO']),
    )
  })

  it('consulta periodos mediante índices reutilizables', () => {
    const repository = createRepository()

    expect(
      repository.product
        .findPeriodsByProductId('IPC-A')
        .map((period) => period.periodId),
    ).toEqual(['2026-01', '2026-02'])

    expect(
      repository.product
        .findPeriodsByPeriodId('2026-01')
        .map((period) => period.productId),
    ).toEqual(['IPC-A'])

    expect(
      repository.product.getActivePeriodCount('IPC-A'),
    ).toBe(2)
  })

  it('expone clientes, marcas y ubicaciones relacionadas', () => {
    const queries = createRepository().product

    expect(queries.getCustomerIds('IPC-A')).toEqual([
      '100001',
      '100002',
    ])
    expect(queries.getBrandIds('IPC-A')).toEqual(['UNV'])
    expect(queries.getLocations('IPC-A')).toEqual([
      'CDMX',
      'QRO',
    ])
  })
})
