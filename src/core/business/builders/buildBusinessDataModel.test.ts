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
} from './buildBusinessDataModel'

function createTestRows():
  NormalizedSalesRow[] {
  return [
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
      date: '2026-01-20',
      brand: 'UNV',
      revenue: 200,
      grossProfit: 60,

      customerId: '100001',
      customerName:
        'Integrador Uno',

      model: 'IPC-B',
      quantity: 1,

      documentNumber: 'F002',
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

      documentNumber: 'F003',
      location: 'QRO',
      salesRep: 'Luis',
      currency: 'USD',
    },

    {
      date: '2026-02-12',
      brand: 'UNV',
      revenue: 50,
      grossProfit: 15,

      customerId: '100001',
      customerName:
        'Integrador Uno',

      model: 'IPC-A',
      quantity: 1,

      documentNumber: 'F001',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },

    {
      date: '2026-02-15',
      brand: '',
      revenue: 999,
      grossProfit: 999,

      customerId: '100003',
      customerName:
        'Registro inválido',

      model: 'INVALIDO',
      quantity: 99,

      documentNumber: 'F999',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },
  ]
}

describe(
  'buildBusinessDataModel',
  () => {
    it(
      'calcula correctamente los totales generales',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
          )

        expect(
          model.totals.revenue,
        ).toBe(650)

        expect(
          model.totals.grossProfit,
        ).toBe(195)

        expect(
          model.totals.quantity,
        ).toBe(7)

        expect(
          model.totals.documents,
        ).toBe(3)
      },
    )

    it(
      'crea las entidades únicas del modelo',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
          )

        expect(
          model.customers.size,
        ).toBe(2)

        expect(
          model.brands.size,
        ).toBe(2)

        expect(
          model.products.size,
        ).toBe(3)

        expect(
          model.periods.size,
        ).toBe(2)

        expect(
          model.customerBrandPeriods.size,
        ).toBe(3)
      },
    )

    it(
      'consolida correctamente la información de cada cliente',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
          )

        const customer =
          model.customers.get(
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
        ).toBe(350)

        expect(
          customer?.grossProfit,
        ).toBe(105)

        expect(
          customer?.quantity,
        ).toBe(4)

        expect(
          customer?.documents,
        ).toBe(2)

        expect(
          customer?.firstPurchase,
        ).toBe('2026-01-05')

        expect(
          customer?.lastPurchase,
        ).toBe('2026-02-12')

        expect(
          customer?.brands,
        ).toEqual(
          new Set([
            'UNV',
          ]),
        )

        expect(
          customer?.products,
        ).toEqual(
          new Set([
            'IPC-A',
            'IPC-B',
          ]),
        )

        expect(
          customer?.locations,
        ).toEqual(
          new Set([
            'CDMX',
          ]),
        )
      },
    )

        it(
      'consolida correctamente la información de cliente por periodo',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
          )

        expect(
          model.customerPeriods.size,
        ).toBe(3)

        const januaryCustomer =
          model.customerPeriods.get(
            '2026-01::100001',
          )

        expect(
          januaryCustomer,
        ).toBeDefined()

        expect(
          januaryCustomer?.customerId,
        ).toBe('100001')

        expect(
          januaryCustomer?.periodId,
        ).toBe('2026-01')

        expect(
          januaryCustomer?.revenue,
        ).toBe(300)

        expect(
          januaryCustomer?.grossProfit,
        ).toBe(90)

        expect(
          januaryCustomer?.quantity,
        ).toBe(3)

        expect(
          januaryCustomer?.documents,
        ).toBe(2)

        expect(
          januaryCustomer?.brands,
        ).toEqual(
          new Set([
            'UNV',
          ]),
        )

        expect(
          januaryCustomer?.products,
        ).toEqual(
          new Set([
            'IPC-A',
            'IPC-B',
          ]),
        )

        const februaryCustomer =
          model.customerPeriods.get(
            '2026-02::100001',
          )

        expect(
          februaryCustomer,
        ).toBeDefined()

        expect(
          februaryCustomer?.revenue,
        ).toBe(50)

        expect(
          februaryCustomer?.grossProfit,
        ).toBe(15)

        expect(
          februaryCustomer?.quantity,
        ).toBe(1)

        expect(
          februaryCustomer?.documents,
        ).toBe(1)

        expect(
          februaryCustomer?.brands,
        ).toEqual(
          new Set([
            'UNV',
          ]),
        )

        expect(
          februaryCustomer?.products,
        ).toEqual(
          new Set([
            'IPC-A',
          ]),
        )
      },
    )

    it(
      'mantiene documentos únicos dentro de cada cliente y periodo',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
          )

        const januaryCustomer =
          model.customerPeriods.get(
            '2026-01::100001',
          )

        const februaryCustomer =
          model.customerPeriods.get(
            '2026-02::100001',
          )

        expect(
          januaryCustomer?.documents,
        ).toBe(2)

        expect(
          februaryCustomer?.documents,
        ).toBe(1)

        expect(
          model.customers.get(
            '100001',
          )?.documents,
        ).toBe(2)
      },
    )

    it(
      'consolida correctamente los periodos mensuales',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
          )

        const january =
          model.periods.get(
            '2026-01',
          )

        const february =
          model.periods.get(
            '2026-02',
          )

        expect(
          january?.revenue,
        ).toBe(300)

        expect(
          january?.grossProfit,
        ).toBe(90)

        expect(
          january?.quantity,
        ).toBe(3)

        expect(
          january?.documents,
        ).toBe(2)

        expect(
          february?.revenue,
        ).toBe(350)

        expect(
          february?.grossProfit,
        ).toBe(105)

        expect(
          february?.quantity,
        ).toBe(4)

        expect(
          february?.documents,
        ).toBe(2)
      },
    )

    it(
      'ignora filas sin fecha válida o sin marca',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
          )

        expect(
          model.processedRows,
        ).toBe(4)

        expect(
          model.ignoredRows,
        ).toBe(1)

        expect(
          model.documentNumbers.has(
            'F999',
          ),
        ).toBe(false)

        expect(
          model.products.has(
            'INVALIDO',
          ),
        ).toBe(false)
      },
    )

    it(
      'determina correctamente el rango total de fechas',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
          )

        expect(
          model.periodStart,
        ).toBe('2026-01-05')

        expect(
          model.periodEnd,
        ).toBe('2026-02-12')
      },
    )

        it(
      'preserva la identidad del Customer Master y deriva las metricas desde Sales',
      () => {
        const model =
          buildBusinessDataModel(
            createTestRows(),
            {
              customerMaster: [
                {
                  internalId:
                    'ERP-100001',

                  customerId:
                    '100001',

                  name:
                    'Nombre Canonico ERP',

                  isDuplicate:
                    false,

                  primaryContact:
                    'Contacto Principal',

                  category:
                    'INTEGRADOR',

                  salesRep:
                    'Ejecutivo Master',

                  salesRepLocation:
                    'CDMX',

                  assignedKam:
                    'KAM Uno',

                  lastSaleDate:
                    '2026-02-12',

                  inactiveDate:
                    null,

                  phone:
                    '5555555555',

                  email:
                    'cliente@example.com',

                  location:
                    'CDMX',

                  hasPhysicalLocation:
                    true,

                  department:
                    'Ventas',

                  specialtyBrands:
                    'UNV',

                  previousSalesRep:
                    null,

                  customerRegistrationForm:
                    null,

                  priceLevel:
                    'L 24%',

                  whatsapp:
                    '5555555555',

                  serviceSegment:
                    'Corporativo',

                  taxId:
                    'ABC123456XYZ',

                  catalogDelivered:
                    true,

                  registrationDate:
                    '2020-01-15',

                  portalAccessBlocked:
                    false,

                  contactLetter:
                    null,

                  billingVersion:
                    '4.0',

                  salesClassification:
                    'A',

                  frequencyClassification:
                    'B',

                  purchaseAmountClassification:
                    'H',

                  permanentFreeLocalShipping:
                    false,
                },

                {
                  internalId:
                    'ERP-999999',

                  customerId:
                    '999999',

                  name:
                    'Cliente Sin Ventas',

                  isDuplicate:
                    false,

                  primaryContact:
                    null,

                  category:
                    'PROSPECTO',

                  salesRep:
                    'Ejecutivo Master',

                  salesRepLocation:
                    'QRO',

                  assignedKam:
                    null,

                  lastSaleDate:
                    null,

                  inactiveDate:
                    null,

                  phone:
                    null,

                  email:
                    null,

                  location:
                    'QRO',

                  hasPhysicalLocation:
                    false,

                  department:
                    null,

                  specialtyBrands:
                    null,

                  previousSalesRep:
                    null,

                  customerRegistrationForm:
                    null,

                  priceLevel:
                    'L 30%',

                  whatsapp:
                    null,

                  serviceSegment:
                    null,

                  taxId:
                    null,

                  catalogDelivered:
                    false,

                  registrationDate:
                    '2026-01-01',

                  portalAccessBlocked:
                    false,

                  contactLetter:
                    null,

                  billingVersion:
                    null,

                  salesClassification:
                    null,

                  frequencyClassification:
                    null,

                  purchaseAmountClassification:
                    null,

                  permanentFreeLocalShipping:
                    false,
                },
              ],
            },
          )

        const customerWithSales =
          model.customers.get(
            '100001',
          )

        expect(
          customerWithSales,
        ).toBeDefined()

        expect(
          customerWithSales?.name,
        ).toBe(
          'Nombre Canonico ERP',
        )

        expect(
          customerWithSales
            ?.identitySource,
        ).toBe(
          'customer_master',
        )

        expect(
          customerWithSales
            ?.erpInternalId,
        ).toBe(
          'ERP-100001',
        )

        expect(
          customerWithSales
            ?.salesRep,
        ).toBe(
          'Ejecutivo Master',
        )

        expect(
          customerWithSales
            ?.revenue,
        ).toBe(350)

        expect(
          customerWithSales
            ?.grossProfit,
        ).toBe(105)

        expect(
          customerWithSales
            ?.quantity,
        ).toBe(4)

        expect(
          customerWithSales
            ?.documents,
        ).toBe(2)

        expect(
          customerWithSales
            ?.firstPurchase,
        ).toBe(
          '2026-01-05',
        )

        expect(
          customerWithSales
            ?.lastPurchase,
        ).toBe(
          '2026-02-12',
        )

        const customerWithoutSales =
          model.customers.get(
            '999999',
          )

        expect(
          customerWithoutSales,
        ).toBeDefined()

        expect(
          customerWithoutSales
            ?.identitySource,
        ).toBe(
          'customer_master',
        )

        expect(
          customerWithoutSales
            ?.revenue,
        ).toBe(0)

        expect(
          customerWithoutSales
            ?.grossProfit,
        ).toBe(0)

        expect(
          customerWithoutSales
            ?.quantity,
        ).toBe(0)

        expect(
          customerWithoutSales
            ?.documents,
        ).toBe(0)

        expect(
          customerWithoutSales
            ?.firstPurchase,
        ).toBeNull()

        expect(
          customerWithoutSales
            ?.lastPurchase,
        ).toBeNull()

        expect(
          model.customers.get(
            '100002',
          )?.identitySource,
        ).toBe(
          'sales_fallback',
        )
      },
    )

  },
)