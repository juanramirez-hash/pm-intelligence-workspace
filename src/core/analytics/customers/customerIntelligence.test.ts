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
} from '../../business/builders'

import {
  BusinessRepository,
} from '../../business/repository'

import {
  buildCustomerIntelligence,
} from './customerIntelligence'

function createRow(
  overrides:
    Partial<NormalizedSalesRow>,
): NormalizedSalesRow {
  return {
    date: '2026-03-20',
    brand: 'UNV',

    revenue: 0,
    grossProfit: 0,
    quantity: 0,

    customerId: null,
    customerName: null,

    model: null,
    documentNumber: null,
    location: null,
    salesRep: null,
    currency: null,

    ...overrides,
  }
}

function createTestRows():
  NormalizedSalesRow[] {
  return [
    createRow({
      date: '2026-02-10',
      customerId: '100001',
      customerName:
        'Cliente Crecimiento',
      revenue: 100,
      grossProfit: 30,
      quantity: 1,
      documentNumber: 'F001',
      model: 'IPC-A',
    }),

    createRow({
      date: '2026-03-10',
      customerId: '100001',
      customerName:
        'Cliente Crecimiento',
      revenue: 150,
      grossProfit: 45,
      quantity: 2,
      documentNumber: 'F002',
      model: 'IPC-B',
    }),

    createRow({
      date: '2026-02-12',
      customerId: '100002',
      customerName:
        'Cliente Caída',
      revenue: 200,
      grossProfit: 60,
      quantity: 2,
      documentNumber: 'F003',
      model: 'IPC-C',
    }),

    createRow({
      date: '2026-03-12',
      customerId: '100002',
      customerName:
        'Cliente Caída',
      revenue: 100,
      grossProfit: 30,
      quantity: 1,
      documentNumber: 'F004',
      model: 'IPC-C',
    }),

    createRow({
      date: '2026-02-15',
      customerId: '100003',
      customerName:
        'Cliente Estable',
      revenue: 100,
      grossProfit: 30,
      quantity: 1,
      documentNumber: 'F005',
      model: 'IPC-D',
    }),

    createRow({
      date: '2026-03-15',
      customerId: '100003',
      customerName:
        'Cliente Estable',
      revenue: 103,
      grossProfit: 31,
      quantity: 1,
      documentNumber: 'F006',
      model: 'IPC-D',
    }),

    createRow({
      date: '2026-03-18',
      customerId: '100004',
      customerName:
        'Cliente Nuevo',
      revenue: 80,
      grossProfit: 24,
      quantity: 1,
      documentNumber: 'F007',
      model: 'IPC-E',
    }),

    createRow({
      date: '2026-01-10',
      customerId: '100005',
      customerName:
        'Cliente Recuperado',
      revenue: 90,
      grossProfit: 27,
      quantity: 1,
      documentNumber: 'F008',
      model: 'IPC-F',
    }),

    createRow({
      date: '2026-03-19',
      customerId: '100005',
      customerName:
        'Cliente Recuperado',
      revenue: 120,
      grossProfit: 36,
      quantity: 1,
      documentNumber: 'F009',
      model: 'IPC-F',
    }),

    createRow({
      date: '2025-12-10',
      customerId: '100006',
      customerName:
        'Cliente Inactivo',
      revenue: 70,
      grossProfit: 21,
      quantity: 1,
      documentNumber: 'F010',
      model: 'IPC-G',
    }),

    createRow({
      date: '2025-08-01',
      customerId: '100007',
      customerName:
        'Cliente Perdido',
      revenue: 60,
      grossProfit: 18,
      quantity: 1,
      documentNumber: 'F011',
      model: 'IPC-H',
    }),

    createRow({
      date: '2026-03-20',
      customerId: '100008',
      customerName:
        'Cliente Documentos',
      revenue: 40,
      grossProfit: 12,
      quantity: 1,
      documentNumber: 'F012',
      model: 'IPC-I',
    }),

    createRow({
      date: '2026-03-20',
      customerId: '100008',
      customerName:
        'Cliente Documentos',
      revenue: 60,
      grossProfit: 18,
      quantity: 1,
      documentNumber: 'F012',
      model: 'IPC-J',
    }),
  ]
}

function buildTestIntelligence(
  rows:
    NormalizedSalesRow[] =
      createTestRows(),
) {
  const model =
    buildBusinessDataModel(
      rows,
    )

  const repository =
    new BusinessRepository(
      model,
    )

  return buildCustomerIntelligence(
    repository,
    model.periodEnd,
  )
}

describe(
  'buildCustomerIntelligence',
  () => {
    it(
      'determina el periodo de análisis usando la fecha más reciente',
      () => {
        const result =
          buildTestIntelligence()

        expect(result).not.toBeNull()

        expect(
          result?.analysisDate,
        ).toBe('2026-03-20')

        expect(
          result?.currentPeriodStart,
        ).toBe('2026-03-01')

        expect(
          result?.currentPeriodEnd,
        ).toBe('2026-03-31')

        expect(
          result?.previousPeriodStart,
        ).toBe('2026-02-01')

        expect(
          result?.previousPeriodEnd,
        ).toBe('2026-02-28')
      },
    )

    it(
      'clasifica clientes nuevos, recuperados, inactivos y perdidos',
      () => {
        const result =
          buildTestIntelligence()

        const customers =
          result?.customers ?? []

        const findCustomer = (
          customerId: string,
        ) =>
          customers.find(
            customer =>
              customer.customerId ===
              customerId,
          )

        expect(
          findCustomer('100004')
            ?.lifecycleStatus,
        ).toBe('new')

        expect(
          findCustomer('100005')
            ?.lifecycleStatus,
        ).toBe('recovered')

        expect(
          findCustomer('100006')
            ?.lifecycleStatus,
        ).toBe('inactive')

        expect(
          findCustomer('100007')
            ?.lifecycleStatus,
        ).toBe('lost')
      },
    )

    it(
      'clasifica las tendencias de venta',
      () => {
        const result =
          buildTestIntelligence()

        const customers =
          result?.customers ?? []

        const findCustomer = (
          customerId: string,
        ) =>
          customers.find(
            customer =>
              customer.customerId ===
              customerId,
          )

        expect(
          findCustomer('100001')
            ?.trendStatus,
        ).toBe('growing')

        expect(
          findCustomer('100002')
            ?.trendStatus,
        ).toBe('declining')

        expect(
          findCustomer('100003')
            ?.trendStatus,
        ).toBe('stable')

        expect(
          findCustomer('100004')
            ?.trendStatus,
        ).toBe(
          'without_comparison',
        )
      },
    )

    it(
      'calcula correctamente los periodos y la variación',
      () => {
        const result =
          buildTestIntelligence()

        const customer =
          result?.customers.find(
            item =>
              item.customerId ===
              '100001',
          )

        expect(
          customer?.previousPeriod
            .revenue,
        ).toBe(100)

        expect(
          customer?.currentPeriod
            .revenue,
        ).toBe(150)

        expect(
          customer?.revenueVariation,
        ).toBe(50)

        expect(
          customer
            ?.revenueVariationPercentage,
        ).toBe(0.5)

        expect(
          customer?.historicalRevenue,
        ).toBe(250)

        expect(
          customer
            ?.historicalGrossProfit,
        ).toBe(75)

        expect(
          customer
            ?.historicalQuantity,
        ).toBe(3)

        expect(
          customer
            ?.historicalDocuments,
        ).toBe(2)
      },
    )

    it(
      'deduplica documentos dentro del periodo y del histórico',
      () => {
        const result =
          buildTestIntelligence()

        const customer =
          result?.customers.find(
            item =>
              item.customerId ===
              '100008',
          )

        expect(
          customer?.currentPeriod
            .revenue,
        ).toBe(100)

        expect(
          customer?.currentPeriod
            .quantity,
        ).toBe(2)

        expect(
          customer?.currentPeriod
            .documents,
        ).toBe(1)

        expect(
          customer
            ?.historicalDocuments,
        ).toBe(1)
      },
    )

    it(
      'marca clientes perdidos, inactivos y en caída para atención',
      () => {
        const result =
          buildTestIntelligence()

        const attentionIds =
          result?.attentionCustomers.map(
            customer =>
              customer.customerId,
          ) ?? []

        expect(
          attentionIds,
        ).toContain('100002')

        expect(
          attentionIds,
        ).toContain('100006')

        expect(
          attentionIds,
        ).toContain('100007')

        expect(
          result
            ?.customers.find(
              customer =>
                customer.customerId ===
                '100001',
            )
            ?.requiresAttention,
        ).toBe(false)
      },
    )

    it(
      'construye correctamente los rankings de crecimiento y caída',
      () => {
        const result =
          buildTestIntelligence()

        expect(
          result
            ?.topGrowingCustomers[0]
            ?.customerId,
        ).toBe('100001')

        expect(
          result
            ?.topDecliningCustomers[0]
            ?.customerId,
        ).toBe('100002')
      },
    )

    it(
      'devuelve null cuando no existe una fecha de análisis válida',
      () => {
        const model =
          buildBusinessDataModel(
            [],
          )

        const repository =
          new BusinessRepository(
            model,
          )

        const result =
          buildCustomerIntelligence(
            repository,
            model.periodEnd,
          )

        expect(result).toBeNull()
      },
    )
  },
)