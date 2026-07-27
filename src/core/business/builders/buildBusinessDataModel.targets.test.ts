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

const salesRows:
  NormalizedSalesRow[] = [
    {
      date: '2026-07-01',
      brand: 'BELDEN',
      revenue: 100000,
      grossProfit: 24000,
      customerId: '100001',
      customerName: 'Integrador Uno',
      model: 'BELDEN-001',
      quantity: 10,
      documentNumber: 'F001',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },
  ]

describe(
  'buildBusinessDataModel con objetivos',
  () => {
    it(
      'integra objetivos de marca sin mezclarlos con los hechos de venta',
      () => {
        const model =
          buildBusinessDataModel(
            salesRows,
            {
              brandTargets: [
                {
                  brandId: 'BELDEN',
                  periodId: '2026-07',
                  targetRevenue: 500000,
                  targetGrossProfit: 120000,
                  targetGrossMargin: 0.24,
                  workingDays: 23,
                },
              ],
            },
          )

        expect(
          model.brandTargets.get(
            '2026-07::BELDEN',
          ),
        ).toEqual({
          id: '2026-07::BELDEN',
          brandId: 'BELDEN',
          periodId: '2026-07',
          targetRevenue: 500000,
          targetGrossProfit: 120000,
          targetGrossMargin: 0.24,
          workingDays: 23,
        })

        expect(
          model.totals.revenue,
        ).toBe(100000)

        expect(
          model.totals.grossProfit,
        ).toBe(24000)
      },
    )

    it(
      'mantiene compatibilidad cuando no se proporcionan objetivos',
      () => {
        const model =
          buildBusinessDataModel(
            salesRows,
          )

        expect(
          model.brandTargets.size,
        ).toBe(0)
      },
    )
  },
)
