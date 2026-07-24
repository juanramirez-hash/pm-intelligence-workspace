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
        grossProfit: 40,

        customerId: '100001',
        customerName:
          'Cliente Uno',

        model: 'IPC-A',
        quantity: 1,

        documentNumber: 'F001',
        location: 'CDMX',
        salesRep: 'Ana',
        currency: 'MXN',
      },

      {
        date: '2026-01-10',
        brand: 'AJAX',
        revenue: 500,
        grossProfit: 100,

        customerId: '100002',
        customerName:
          'Cliente Dos',

        model: 'HUB-2',
        quantity: 2,

        documentNumber: 'F002',
        location: 'QRO',
        salesRep: 'Luis',
        currency: 'MXN',
      },

      {
        date: '2026-02-01',
        brand: 'UNV',
        revenue: 300,
        grossProfit: 150,

        customerId: '100003',
        customerName:
          'Cliente Tres',

        model: 'IPC-B',
        quantity: 3,

        documentNumber: 'F003',
        location: 'CDMX',
        salesRep: 'Ana',
        currency: 'MXN',
      },

      {
        date: '2026-02-15',
        brand: 'UNV',
        revenue: 250,
        grossProfit: 80,

        customerId: '100001',
        customerName:
          'Cliente Uno',

        model: 'IPC-C',
        quantity: 1,

        documentNumber: 'F004',
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
  'BrandQueries',
  () => {
    it(
      'devuelve todas las marcas',
      () => {
        const repository =
          createRepository()

        expect(
          repository.brand.getAll(),
        ).toHaveLength(2)
      },
    )

    it(
      'encuentra una marca normalizando el identificador',
      () => {
        const repository =
          createRepository()

        const brand =
          repository.brand.findById(
            ' unv ',
          )

        expect(
          brand?.name,
        ).toBe('UNV')

        expect(
          brand?.revenue,
        ).toBe(650)
      },
    )

    it(
      'ordena marcas por venta descendente',
      () => {
        const repository =
          createRepository()

        const brands =
          repository.brand
            .topByRevenue(2)

        expect(
          brands.map(
            brand =>
              brand.id,
          ),
        ).toEqual([
          'UNV',
          'AJAX',
        ])
      },
    )

    it(
      'ordena marcas por GP descendente',
      () => {
        const repository =
          createRepository()

        const brands =
          repository.brand
            .topByGrossProfit(2)

        expect(
          brands.map(
            brand =>
              brand.id,
          ),
        ).toEqual([
          'UNV',
          'AJAX',
        ])
      },
    )

    it(
      'obtiene todos los periodos de una marca',
      () => {
        const repository =
          createRepository()

        const periods =
          repository.brand
            .findPeriodsByBrandId(
              'UNV',
            )

        expect(
          periods,
        ).toHaveLength(2)

        expect(
          periods.map(
            period =>
              period.periodId,
          ),
        ).toEqual([
          '2026-01',
          '2026-02',
        ])
      },
    )

    it(
      'encuentra un periodo específico de una marca',
      () => {
        const repository =
          createRepository()

        const period =
          repository.brand
            .findPeriod(
              'UNV',
              '2026-02',
            )

        expect(
          period,
        ).toBeDefined()

        expect(
          period?.revenue,
        ).toBe(550)

        expect(
          period?.grossProfit,
        ).toBe(230)
      },
    )

    it(
      'devuelve la línea de tiempo de la marca',
      () => {
        const repository =
          createRepository()

        const timeline =
          repository.brand
            .getBrandTimeline(
              'UNV',
            )

        expect(
          timeline.map(
            period =>
              period.periodId,
          ),
        ).toEqual([
          '2026-01',
          '2026-02',
        ])
      },
    )

    it(
      'respeta el límite solicitado',
      () => {
        const repository =
          createRepository()

        expect(
          repository.brand
            .topByRevenue(1),
        ).toHaveLength(1)
      },
    )

    it(
      'devuelve una lista vacía para límites inválidos',
      () => {
        const repository =
          createRepository()

        expect(
          repository.brand
            .topByRevenue(0),
        ).toEqual([])

        expect(
          repository.brand
            .topByRevenue(-1),
        ).toEqual([])
      },
    )
  },
)