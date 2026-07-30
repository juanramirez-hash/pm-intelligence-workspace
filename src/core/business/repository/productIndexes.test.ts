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
      date: '2026-01-06',
      brand: 'HIKVISION',
      revenue: 200,
      grossProfit: 50,
      customerId: '100002',
      customerName: 'Cliente Dos',
      model: 'NVR-B',
      quantity: 2,
      documentNumber: 'F002',
      location: 'QRO',
      salesRep: 'Luis',
      currency: 'MXN',
    },
  ]

  return new BusinessRepository(
    buildBusinessDataModel(rows),
  )
}

describe('PMC-003 Product Repository', () => {
  it('consulta por Name, ID y codigo normalizados', () => {
    const repository = createRepository().product

    expect(repository.findByName(' ipc-a ')?.id).toBe('IPC-A')
    expect(repository.findById(' ipc-a ')?.id).toBe('IPC-A')
    expect(repository.findByCode(' ipc-a ')?.id).toBe('IPC-A')
  })

  it('consulta productos por marca', () => {
    const products =
      createRepository().product.findByBrand(' unv ')

    expect(products).toHaveLength(1)
    expect(products[0]?.brandId).toBe('UNV')
  })

  it('consulta coincidencias por marca y modelo', () => {
    const repository = createRepository()

    expect(
      repository.product.findByBrandAndModel(
        'UNV',
        'IPC-A',
      ),
    ).toHaveLength(1)

    expect(
      repository.product.findUniqueByBrandAndModel(
        'UNV',
        'IPC-A',
      )?.brandId,
    ).toBe('UNV')
  })

  it('mantiene separados los índices de marca y modelo', () => {
    const repository = createRepository()

    expect(
      repository.product.findByModel('IPC-A'),
    ).toHaveLength(1)

    expect(
      repository.product.findByBrandAndModel(
        'HIKVISION',
        'NVR-B',
      ),
    ).toHaveLength(1)
  })

  it('ordena resultados de revenue y gross profit', () => {
    const repository = createRepository()

    expect(
      repository.product.findTopRevenue(1)[0]?.id,
    ).toBe('NVR-B')

    expect(
      repository.product.findTopGrossProfit(1)[0]?.id,
    ).toBe('NVR-B')
  })
})
