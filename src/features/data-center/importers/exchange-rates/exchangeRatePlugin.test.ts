import {
  describe,
  expect,
  it,
} from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { exchangeRateImportPlugin } from './exchangeRatePlugin'

describe('exchangeRateImportPlugin', () => {
  it('normaliza un tipo de cambio mensual USD a MXN', () => {
    const result = runImportEngine(
      exchangeRateImportPlugin,
      [
        {
          Periodo: '2026-08',
          'Moneda origen': 'USD',
          'Moneda destino': 'MXN',
          'Tipo de cambio': 18.75,
          Fuente: 'Control mensual PM',
        },
      ],
    )

    expect(result.valid).toBe(true)
    expect(result.summary.totalRates).toBe(1)
    expect(result.normalizedRows[0]).toMatchObject({
      periodId: '2026-08',
      sourceCurrency: 'USD',
      targetCurrency: 'MXN',
      rate: 18.75,
      sourceReference: 'Control mensual PM',
    })
  })
})
