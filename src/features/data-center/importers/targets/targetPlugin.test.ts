import {
  describe,
  expect,
  it,
} from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { targetImportPlugin } from './targetPlugin'

const rows = [
  {
    Marca: 'BELDEN',
    Periodo: '2026-07',
    'Objetivo Venta': 8_500_000,
    'Objetivo GP': 1_900_000,
    'Margen Objetivo': '22.35%',
    'Días Laborables': 23,
  },
]

describe('targetImportPlugin', () => {
  it('normaliza y procesa objetivos mensuales por marca', () => {
    const result = runImportEngine(
      targetImportPlugin,
      rows,
    )

    expect(result.valid).toBe(true)
    expect(result.processedRows).toBe(1)
    expect(result.summary.totalTargets).toBe(1)
    expect(result.normalizedRows[0]).toEqual({
      brandId: 'BELDEN',
      periodId: '2026-07',
      targetRevenue: 8_500_000,
      targetGrossProfit: 1_900_000,
      targetGrossMargin: 0.2235,
      workingDays: 23,
    })
  })
})
