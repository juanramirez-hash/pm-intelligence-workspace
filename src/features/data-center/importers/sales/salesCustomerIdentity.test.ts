import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  normalizeSalesRow,
} from './salesNormalizer'

import {
  validateSalesColumns,
} from './salesValidator'

describe(
  'Sales customer identity resolution',
  () => {
    it(
      'usa la ultima razon social de Customer/Project como comprador real',
      () => {
        const row = {
          Date: '2026-06-08',
          Marca: 'MERIVA TECHNOLOGY',
          'Transaction Total (Revenue)':
            1000,

          '# cliente':
            '014686',

          'Customer/Project: Name (Grouped)':
            '014686 LOCALIZACION SATELITAL GPSMOVIL S DE RL DE CV:030950 SOLUCIONES INTELIGENTES EN SEGURIDAD MOVIL S DE RL DE CV',
        }

        const validation =
          validateSalesColumns(
            Object.keys(row),
          )

        const normalized =
          normalizeSalesRow(
            row,
            validation.columnMap,
          )

        expect(
          normalized?.customerId,
        ).toBe('030950')
      },
    )

    it(
      'usa el unico ID cuando no existe agrupacion de razones sociales',
      () => {
        const row = {
          Date: '2026-06-04',
          Marca: 'BELDEN',
          'Transaction Total (Revenue)':
            1000,

          '# cliente':
            '034088',

          'Customer/Project: Name (Grouped)':
            '012653 ADPROACH S DE RL DE CV',
        }

        const validation =
          validateSalesColumns(
            Object.keys(row),
          )

        const normalized =
          normalizeSalesRow(
            row,
            validation.columnMap,
          )

        expect(
          normalized?.customerId,
        ).toBe('012653')
      },
    )

    it(
      'usa # cliente como respaldo cuando Customer/Project no contiene un ID valido',
      () => {
        const row = {
          Date: '2026-06-04',
          Marca: 'BELDEN',
          'Transaction Total (Revenue)':
            1000,

          '# cliente':
            '012653',

          'Customer/Project: Name (Grouped)':
            'ADPROACH S DE RL DE CV',
        }

        const validation =
          validateSalesColumns(
            Object.keys(row),
          )

        const normalized =
          normalizeSalesRow(
            row,
            validation.columnMap,
          )

        expect(
          normalized?.customerId,
        ).toBe('012653')
      },
    )
  },
)