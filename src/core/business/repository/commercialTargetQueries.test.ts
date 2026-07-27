import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessBrandTargetInput,
} from '../targets'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  BusinessRepository,
} from './businessRepository'

function createRepository():
  BusinessRepository {
  const targets:
    BusinessBrandTargetInput[] = [
      {
        brandId: 'UNV',
        periodId: '2026-08',
        targetRevenue: 800,
        workingDays: 21,
      },
      {
        brandId: 'BELDEN',
        periodId: '2026-07',
        targetRevenue: 500,
        targetGrossProfit: 120,
        targetGrossMargin: 0.24,
        workingDays: 23,
      },
      {
        brandId: 'UNV',
        periodId: '2026-07',
        targetRevenue: 700,
        targetGrossMargin: 0.25,
        workingDays: 23,
      },
    ]

  const model =
    buildBusinessDataModel(
      [],
      {
        brandTargets: targets,
      },
    )

  return new BusinessRepository(
    model,
  )
}

describe(
  'CommercialTargetQueries',
  () => {
    it(
      'encuentra un objetivo por marca y periodo normalizados',
      () => {
        const repository =
          createRepository()

        const target =
          repository.targets
            .findBrandTarget(
              '  belden ',
              '2026-07',
            )

        expect(target).toEqual({
          id: '2026-07::BELDEN',
          brandId: 'BELDEN',
          periodId: '2026-07',
          targetRevenue: 500,
          targetGrossProfit: 120,
          targetGrossMargin: 0.24,
          workingDays: 23,
        })
      },
    )

    it(
      'devuelve los objetivos de un periodo ordenados por marca',
      () => {
        const repository =
          createRepository()

        const targets =
          repository.targets
            .findPeriodTargets(
              '2026-07',
            )

        expect(
          targets.map(
            target => target.brandId,
          ),
        ).toEqual([
          'BELDEN',
          'UNV',
        ])
      },
    )

    it(
      'devuelve la linea de objetivos de una marca ordenada por periodo',
      () => {
        const repository =
          createRepository()

        const targets =
          repository.targets
            .findTargetsByBrand(
              'unv',
            )

        expect(
          targets.map(
            target => target.periodId,
          ),
        ).toEqual([
          '2026-07',
          '2026-08',
        ])
      },
    )

    it(
      'expone periodos y marcas con objetivos sin duplicados',
      () => {
        const repository =
          createRepository()

        expect(
          repository.targets
            .getAvailablePeriods(),
        ).toEqual([
          '2026-07',
          '2026-08',
        ])

        expect(
          repository.targets
            .getTargetedBrands(),
        ).toEqual([
          'BELDEN',
          'UNV',
        ])
      },
    )

    it(
      'consulta existencia y maneja entradas invalidas o inexistentes',
      () => {
        const repository =
          createRepository()

        expect(
          repository.targets.exists(
            'UNV',
            '2026-07',
          ),
        ).toBe(true)

        expect(
          repository.targets.exists(
            'UNV',
            '2026-09',
          ),
        ).toBe(false)

        expect(
          repository.targets
            .findBrandTarget(
              '',
              '2026-07',
            ),
        ).toBeUndefined()

        expect(
          repository.targets
            .findPeriodTargets(
              '07-2026',
            ),
        ).toEqual([])

        expect(
          repository.targets
            .findTargetsByBrand(''),
        ).toEqual([])
      },
    )

    it(
      'devuelve copias de las colecciones indexadas',
      () => {
        const repository =
          createRepository()

        const firstRead =
          repository.targets
            .findTargetsByBrand(
              'UNV',
            )

        firstRead.pop()

        expect(
          repository.targets
            .findTargetsByBrand(
              'UNV',
            ),
        ).toHaveLength(2)
      },
    )
  },
)
