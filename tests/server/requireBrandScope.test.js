import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  normalizeBrandKey,
  normalizeBrandKeys,
} from '../../server/middleware/requireBrandScope.js'

describe(
  'normalizeBrandKey',
  () => {
    it(
      'consolida la identidad historica de STREAMAX - MERIVA',
      () => {
        expect(
          normalizeBrandKey(
            'MERIVA TECHNOLOGY - STREAMAX',
          ),
        ).toBe(
          'STREAMAXMERIVA',
        )

        expect(
          normalizeBrandKey(
            'STREAMAX - MERIVA',
          ),
        ).toBe(
          'STREAMAXMERIVA',
        )
      },
    )

    it(
      'deduplica ambas identidades al normalizar una lista de marcas',
      () => {
        expect(
          normalizeBrandKeys([
            'MERIVA TECHNOLOGY - STREAMAX',
            'STREAMAX - MERIVA',
          ]),
        ).toEqual([
          'STREAMAXMERIVA',
        ])
      },
    )

    it(
      'mantiene la normalizacion existente para otras marcas',
      () => {
        expect(
          normalizeBrandKey(
            'UNV (UNIVIEW)',
          ),
        ).toBe(
          'UNVUNIVIEW',
        )
      },
    )
  },
)