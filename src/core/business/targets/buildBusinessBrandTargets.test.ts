import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessBrandTargets,
} from './buildBusinessBrandTargets'

describe(
  'buildBusinessBrandTargets',
  () => {
    it(
      'construye objetivos normalizados con la clave PERIOD::BRAND',
      () => {
        const result =
          buildBusinessBrandTargets([
            {
              brandId: '  Belden  ',
              periodId: '2026-07',
              targetRevenue: 500000,
              targetGrossProfit: 120000,
              targetGrossMargin: 0.24,
              workingDays: 23,
            },
          ])

        expect(
          result.processedRows,
        ).toBe(1)

        expect(
          result.ignoredRows,
        ).toBe(0)

        expect(
          result.issues,
        ).toEqual([])

        expect(
          result.brandTargets.get(
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
      },
    )

    it(
      'acepta objetivos parciales sin calcular valores derivados',
      () => {
        const result =
          buildBusinessBrandTargets([
            {
              brandId: 'UNV',
              periodId: '2026-08',
              targetRevenue: 750000,
            },
          ])

        expect(
          result.brandTargets.get(
            '2026-08::UNV',
          ),
        ).toEqual({
          id: '2026-08::UNV',
          brandId: 'UNV',
          periodId: '2026-08',
          targetRevenue: 750000,
          targetGrossProfit: null,
          targetGrossMargin: null,
          workingDays: null,
        })
      },
    )

    it(
      'ignora entradas inválidas y reporta problemas estructurados',
      () => {
        const result =
          buildBusinessBrandTargets([
            {
              brandId: '',
              periodId: '2026-07',
              targetRevenue: 1,
            },
            {
              brandId: 'UNV',
              periodId: '07-2026',
              targetRevenue: 1,
            },
            {
              brandId: 'AJAX',
              periodId: '2026-07',
              targetGrossMargin: 24,
            },
            {
              brandId: 'BELDEN',
              periodId: '2026-07',
              workingDays: 23,
            },
          ])

        expect(
          result.processedRows,
        ).toBe(0)

        expect(
          result.ignoredRows,
        ).toBe(4)

        expect(
          result.issues.map(
            issue => issue.code,
          ),
        ).toEqual([
          'INVALID_BRAND_ID',
          'INVALID_PERIOD_ID',
          'INVALID_TARGET_GROSS_MARGIN',
          'MISSING_TARGET_VALUE',
        ])
      },
    )

    it(
      'conserva el primer objetivo válido cuando existen duplicados',
      () => {
        const result =
          buildBusinessBrandTargets([
            {
              brandId: 'UNV',
              periodId: '2026-07',
              targetRevenue: 100,
            },
            {
              brandId: 'unv',
              periodId: '2026-07',
              targetRevenue: 200,
            },
          ])

        expect(
          result.brandTargets.get(
            '2026-07::UNV',
          )?.targetRevenue,
        ).toBe(100)

        expect(
          result.processedRows,
        ).toBe(1)

        expect(
          result.ignoredRows,
        ).toBe(1)

        expect(
          result.issues[0]?.code,
        ).toBe('DUPLICATE_TARGET')
      },
    )
  },
)
