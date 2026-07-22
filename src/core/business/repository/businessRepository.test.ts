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

function createRepository():
  BusinessRepository {
  const rows:
    NormalizedSalesRow[] = [
      {
        date: '2026-01-05',
        brand: 'UNV',
        revenue: 100,
        grossProfit: 30,

        customerId: '100001',
        customerName:
          'Integrador Uno',

        model: 'IPC-A',
        quantity: 2,

        documentNumber: 'F001',
        location: 'CDMX',
        salesRep: 'Ana',
        currency: 'MXN',
      },

      {
        date: '2026-02-10',
        brand: 'AJAX',
        revenue: 300,
        grossProfit: 90,

        customerId: '100002',
        customerName:
          'Integrador Dos',

        model: 'HUB-2',
        quantity: 3,

        documentNumber: 'F002',
        location: 'QRO',
        salesRep: 'Luis',
        currency: 'USD',
      },

      {
        date: '2026-02-15',
        brand: 'UNV',
        revenue: 50,
        grossProfit: 15,

        customerId: '100001',
        customerName:
          'Integrador Uno',

        model: 'IPC-A',
        quantity: 1,

        documentNumber: 'F003',
        location: 'CDMX',
        salesRep: 'Ana',
        currency: 'MXN',
      },
    ]

  const model =
    buildBusinessDataModel(
      rows,
    )

  return new BusinessRepository(
    model,
  )
}

describe(
  'BusinessRepository',
  () => {
    it(
      'devuelve todas las entidades',
      () => {
        const repository =
          createRepository()

        expect(
          repository.getCustomers(),
        ).toHaveLength(2)

        expect(
          repository.getBrands(),
        ).toHaveLength(2)

        expect(
          repository.getProducts(),
        ).toHaveLength(2)

        expect(
          repository.getPeriods(),
        ).toHaveLength(2)
      },
    )

    it(
      'encuentra un cliente por su identificador',
      () => {
        const repository =
          createRepository()

        const customer =
          repository.findCustomer(
            '100001',
          )

        expect(
          customer,
        ).toBeDefined()

        expect(
          customer?.name,
        ).toBe('Integrador Uno')

        expect(
          customer?.revenue,
        ).toBe(150)
      },
    )

    it(
      'encuentra marcas y productos por identificador',
      () => {
        const repository =
          createRepository()

        const brand =
          repository.findBrand(
            'UNV',
          )

        const product =
          repository.findProduct(
            'IPC-A',
          )

        expect(
          brand?.revenue,
        ).toBe(150)

        expect(
          product?.revenue,
        ).toBe(150)

        expect(
          product?.quantity,
        ).toBe(3)
      },
    )

    it(
      'devuelve los totales generales',
      () => {
        const repository =
          createRepository()

        const totals =
          repository.getTotals()

        expect(
          totals,
        ).toEqual({
          revenue: 450,
          grossProfit: 135,
          quantity: 6,
          documents: 3,
        })
      },
    )

    it(
      'devuelve undefined cuando la entidad no existe',
      () => {
        const repository =
          createRepository()

        expect(
          repository.findCustomer(
            '999999',
          ),
        ).toBeUndefined()

        expect(
          repository.findBrand(
            'NO-EXISTE',
          ),
        ).toBeUndefined()

        expect(
          repository.findProduct(
            'NO-EXISTE',
          ),
        ).toBeUndefined()
      },
    )
  },
)