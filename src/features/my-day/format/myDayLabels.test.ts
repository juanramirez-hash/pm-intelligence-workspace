// MD-003: Spanish labels and the single place of the pace thresholds.

import { describe, expect, it } from 'vitest'

import {
  ARRIVAL_STATUS_LABELS,
  LIFECYCLE_LABELS,
  PACE_THRESHOLDS,
  TREND_LABELS,
  paceTone,
  reasonMessage,
  sourceLabel,
  sourceWarning,
} from './myDayLabels'

const source = (overrides: Record<string, unknown>) => ({
  lastImportedAt: '2026-08-26T15:00:00.000Z',
  dataCutoff: null,
  referenceDate: '2026-08-26',
  daysSince: 91,
  status: 'stale' as const,
  stale: true,
  ...overrides,
})

describe('MD-003 labels', () => {
  it('colors the projected close: green ≥ 100 %, amber 90–99.9 %, red < 90 %', () => {
    expect(PACE_THRESHOLDS).toEqual({ onTrack: 1, atRisk: 0.9 })
    expect(Object.isFrozen(PACE_THRESHOLDS)).toBe(true)
    expect(paceTone(1)).toBe('green')
    expect(paceTone(1.2)).toBe('green')
    expect(paceTone(0.999)).toBe('amber')
    expect(paceTone(0.9)).toBe('amber')
    expect(paceTone(0.8999)).toBe('red')
    expect(paceTone(null)).toBe('none')
  })

  it('translates the status of brands and arrivals', () => {
    expect(LIFECYCLE_LABELS).toEqual({
      active: 'Activa', new: 'Nueva', recovered: 'Recuperada', lost: 'Perdida', inactive: 'Inactiva',
    })
    expect(TREND_LABELS).toEqual({
      growing: 'Crece', stable: 'Estable', declining: 'Cae', without_comparison: 'Sin comparativo',
    })
    expect(ARRIVAL_STATUS_LABELS).toEqual({
      scheduled: 'Programada',
      overdue: 'Atrasada',
      'no-date': 'Sin fecha',
      'no-po-data': 'Sin PO cargada',
      'no-po': 'Sin PO',
    })
  })

  it('warns about stale or missing sources with their date', () => {
    expect(sourceWarning('purchases', source({}))).toBe(
      "Datos de compras al 26 ago 2026: pueden faltar PO's",
    )
    expect(sourceWarning('purchases', source({ stale: false, status: 'up-to-date' }))).toBeNull()
    expect(sourceWarning('inventory', source({ status: 'no-data', referenceDate: null, stale: null }))).toBe(
      'No hay datos de inventario cargados',
    )
    expect(sourceLabel('inventory', source({ referenceDate: '2026-11-24' }))).toBe('Inventario al 24 nov 2026')
  })

  it('explains the empty reasons of the server', () => {
    expect(reasonMessage('no-brand-assignments')).toBe('No tienes marcas asignadas.')
    expect(reasonMessage('catalog-status-missing')).toContain('vuelve a cargarlo')
    expect(reasonMessage('otro')).toBe('Sin datos para mostrar.')
    expect(reasonMessage(undefined)).toBeNull()
  })
})
