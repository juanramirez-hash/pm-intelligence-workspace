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
  'CustomerQueries',
  () => {
    it(
      'devuelve todos los clientes',
      () => {
        const repository =
          createRepository()

        expect(
          repository.customer.getAll(),
        ).toHaveLength(3)
      },
    )

    it(
      'encuentra un cliente normalizando el identificador',
      () => {
        const repository =
          createRepository()

        const customer =
          repository.customer.findById(
            ' 100001 ',
          )

        expect(
          customer?.name,
        ).toBe('Cliente Uno')

        expect(
          customer?.revenue,
        ).toBe(350)
      },
    )

    it(
      'ordena clientes por venta descendente',
      () => {
        const repository =
          createRepository()

        const customers =
          repository.customer
            .topByRevenue(3)

        expect(
          customers.map(
            (customer) =>
              customer.id,
          ),
        ).toEqual([
          '100002',
          '100001',
          '100003',
        ])
      },
    )

    it(
      'ordena clientes por GP descendente',
      () => {
        const repository =
          createRepository()

        const customers =
          repository.customer
            .topByGrossProfit(3)

        expect(
          customers.map(
            (customer) =>
              customer.id,
          ),
        ).toEqual([
          '100003',
          '100001',
          '100002',
        ])
      },
    )

    it(
      'respeta el límite solicitado',
      () => {
        const repository =
          createRepository()

        const customers =
          repository.customer
            .topByRevenue(2)

        expect(
          customers,
        ).toHaveLength(2)

        expect(
          customers[0]?.id,
        ).toBe('100002')
      },
    )

    it(
      'devuelve una lista vacía para límites inválidos',
      () => {
        const repository =
          createRepository()

        expect(
          repository.customer
            .topByRevenue(0),
        ).toEqual([])

        expect(
          repository.customer
            .topByRevenue(-5),
        ).toEqual([])
      },
    )

        it(
      'obtiene todos los periodos de un cliente',
      () => {
        const repository =
          createRepository()

        const periods =
          repository.customer
            .findPeriodsByCustomerId(
              '100001',
            )

        expect(
          periods,
        ).toHaveLength(2)

        expect(
          periods.map(
            period =>
              period.periodId,
          ),
        ).toContain(
          '2026-01',
        )

        expect(
          periods.map(
            period =>
              period.periodId,
          ),
        ).toContain(
          '2026-02',
        )
      },
    )

    it(
      'encuentra un periodo específico de un cliente',
      () => {
        const repository =
          createRepository()

        const period =
          repository.customer
            .findPeriod(
              '100001',
              '2026-02',
            )

        expect(
          period,
        ).toBeDefined()

        expect(
          period?.revenue,
        ).toBe(250)

        expect(
          period?.grossProfit,
        ).toBe(80)

        expect(
          period?.quantity,
        ).toBe(1)

        expect(
          period?.documents,
        ).toBe(1)
      },
    )

    it(
      'devuelve la línea de tiempo ordenada cronológicamente',
      () => {
        const repository =
          createRepository()

        const timeline =
          repository.customer
            .getCustomerTimeline(
              '100001',
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
      'normaliza el identificador en consultas de periodos',
      () => {
        const repository =
          createRepository()

        const periods =
          repository.customer
            .findPeriodsByCustomerId(
              ' 100001 ',
            )

        expect(
          periods,
        ).toHaveLength(2)
      },
    )
  },
)