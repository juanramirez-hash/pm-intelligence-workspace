import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildCostVisibilityCondition,
  resolveCostScope,
} from '../../server/middleware/requireBrandScope.js'

describe(
  'resolveCostScope',
  () => {
    it(
      'niega costos sin costAccess, aunque el alcance sea total',
      () => {
        expect(
          resolveCostScope({
            scope: 'all',
            costAccess: false,
            brandIds: [],
          }),
        ).toEqual({
          mode: 'none',
        })

        expect(
          resolveCostScope(undefined),
        ).toEqual({
          mode: 'none',
        })
      },
    )

    it(
      'da todos los costos con alcance total',
      () => {
        expect(
          resolveCostScope({
            scope: 'all',
            costAccess: true,
            brandIds: [],
          }),
        ).toEqual({
          mode: 'all',
        })
      },
    )

    it(
      'limita los costos a las marcas asignadas normalizadas',
      () => {
        expect(
          resolveCostScope({
            scope: 'assigned',
            costAccess: true,
            brandIds: [
              'Hikvision',
              'MERIVA TECHNOLOGY - STREAMAX',
              'HIKVISION',
            ],
          }),
        ).toEqual({
          mode: 'assigned',
          brandKeys: [
            'HIKVISION',
            'STREAMAXMERIVA',
          ],
        })
      },
    )

    it(
      'niega costos con cualquier otro alcance',
      () => {
        expect(
          resolveCostScope({
            scope: 'legacy',
            costAccess: true,
            brandIds: ['HIKVISION'],
          }),
        ).toEqual({
          mode: 'none',
        })
      },
    )
  },
)

describe(
  'buildCostVisibilityCondition',
  () => {
    it(
      'compara brand_key() contra las claves asignadas como parametro',
      () => {
        const params = ['previo']

        expect(
          buildCostVisibilityCondition(
            {
              mode: 'assigned',
              brandKeys: ['HIKVISION'],
            },
            'brand',
            params,
          ),
        ).toBe(
          'brand_key(brand) = ANY($2::TEXT[])',
        )

        expect(params).toEqual([
          'previo',
          ['HIKVISION'],
        ])
      },
    )

    it(
      'permite todo con alcance total y niega sin alcance o sin marcas',
      () => {
        const params = []

        expect(
          buildCostVisibilityCondition(
            { mode: 'all' },
            'brand',
            params,
          ),
        ).toBe('TRUE')

        for (const costScope of [
          { mode: 'none' },
          { mode: 'assigned', brandKeys: [] },
          undefined,
        ]) {
          expect(
            buildCostVisibilityCondition(
              costScope,
              'brand',
              params,
            ),
          ).toBe('FALSE')
        }

        expect(params).toEqual([])
      },
    )
  },
)
