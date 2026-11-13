import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  CostVisibility,
} from './brandAccess'

import {
  canSeeBrandCost,
  costExportNote,
  costTotalLabel,
  describeMissingCosts,
  formatCostShare,
  formatCostTotal,
  formatCostValue,
} from './costPresentation'

const all: CostVisibility = { mode: 'all' }
const none: CostVisibility = { mode: 'none' }
const assigned: CostVisibility = {
  mode: 'assigned',
  brandKeys: ['UNV', 'STREAMAXMERIVA'],
}

const money = (value: number) => `$${value}`

describe('cost presentation (SEC-003C)', () => {
  it('matches brands with the server normalization, including STREAMAX', () => {
    expect(
      canSeeBrandCost(assigned, 'MERIVA TECHNOLOGY - STREAMAX'),
    ).toBe(true)
    expect(canSeeBrandCost(assigned, 'Streamax - Meriva')).toBe(true)
    expect(canSeeBrandCost(assigned, 'HIKVISION')).toBe(false)
    expect(canSeeBrandCost(assigned, null)).toBe(false)
    expect(canSeeBrandCost(all, 'HIKVISION')).toBe(true)
    expect(canSeeBrandCost(none, 'UNV')).toBe(false)
  })

  it('never shows a missing value as $0', () => {
    expect(formatCostValue(0, all, 'UNV', money)).toBe('$0')
    expect(formatCostValue(null, all, 'UNV', money)).toBe('Sin dato')
    expect(
      formatCostValue(null, assigned, 'MERIVA TECHNOLOGY - STREAMAX', money),
    ).toBe('Sin dato')
    expect(formatCostValue(null, assigned, 'HIKVISION', money)).toBe(
      'Sin acceso a costo',
    )
    expect(formatCostValue(null, none, 'UNV', money)).toBe(
      'Sin acceso a costo',
    )
  })

  it('formats totals by cost scope', () => {
    expect(formatCostTotal(1500, all, money)).toBe('$1500')
    expect(formatCostTotal(null, all, money)).toBe('Sin dato')
    expect(formatCostTotal(1500, assigned, money)).toBe('$1500')
    expect(formatCostTotal(null, assigned, money)).toBe(
      'Sin acceso a costo',
    )
    expect(formatCostTotal(1500, none, money)).toBe('Sin acceso a costo')
    expect(formatCostShare(null, all, String)).toBe('—')
    expect(formatCostShare(0.5, none, String)).toBe('Sin acceso a costo')
  })

  it('labels mixed-brand totals for assigned users', () => {
    expect(
      costTotalLabel('Valor de inventario', 'Valor de tus marcas', assigned),
    ).toBe('Valor de tus marcas')
    expect(
      costTotalLabel('Valor de inventario', 'Valor de tus marcas', all),
    ).toBe('Valor de inventario')
    expect(describeMissingCosts(0, 'posición', 'posiciones')).toBeNull()
    expect(describeMissingCosts(1, 'posición', 'posiciones')).toBe(
      '1 posición sin valor',
    )
    expect(describeMissingCosts(3, 'posición', 'posiciones')).toBe(
      '3 posiciones sin valor',
    )
  })

  it('uses the agreed export notes', () => {
    expect(costExportNote(all)).toBeNull()
    expect(costExportNote(assigned)).toBe(
      'Valores de costo calculados solo sobre las marcas asignadas al usuario.',
    )
    expect(costExportNote(none)).toBe(
      'Este usuario no tiene acceso a costos; las columnas de valor aparecen vacías.',
    )
  })
})
