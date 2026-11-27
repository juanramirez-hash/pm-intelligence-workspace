// CAL-001: texts about the business calendar (missing years, quota template).

import { describe, expect, it } from 'vitest'

import {
  calendarNotes,
  missingCalendarNote,
  paceRuleNote,
  summaryNote,
  templateMismatchNote,
} from './calendarText'

describe('CAL-001 calendar texts', () => {
  it('warns of the years without calendar, and says what is counted instead', () => {
    expect(missingCalendarNote(undefined)).toBeNull()
    expect(missingCalendarNote([])).toBeNull()
    expect(missingCalendarNote([2027])).toContain('para 2027;')
    expect(missingCalendarNote([2027])).toContain('de lunes a viernes')
    expect(missingCalendarNote([2027])).toContain('Configuración > Calendario')
    expect(missingCalendarNote([2026, 2027])).toContain('para 2026 y 2027;')
    expect(missingCalendarNote([2025, 2026, 2027])).toContain('para 2025, 2026 y 2027;')
  })

  it('the template note says the calendar rules, with both numbers', () => {
    expect(templateMismatchNote({ total: 21, templateTotal: 23, mismatch: true })).toBe(
      'La plantilla de cuotas indica 23 días hábiles; el calendario, 21. Manda el calendario.',
    )
    expect(templateMismatchNote({ total: 21, templateTotal: null, mismatch: true })).toContain('no coincide con el calendario')
    expect(templateMismatchNote({ total: 20, templateTotal: 20, mismatch: false })).toBeNull()
    expect(templateMismatchNote(undefined)).toBeNull()
    expect(templateMismatchNote({ total: 20 })).toBeNull()
  })

  it('the pace rule names the calendar, or Monday to Friday when a year is missing', () => {
    expect(paceRuleNote({ total: 20, holidaysExcluded: true })).toContain('menos feriados y días de la empresa')
    expect(paceRuleNote({ total: 20, holidaysExcluded: false })).toBe('el cierre por ritmo usa días hábiles de lunes a viernes')
    expect(paceRuleNote(undefined)).toBe('el cierre por ritmo usa días hábiles de lunes a viernes')
  })

  it('the Mi día summary note adds the template note only when it differs', () => {
    expect(summaryNote({ total: 20, holidaysExcluded: true, templateTotal: 20, mismatch: false })).toBe(
      'Ordenado por venta · el cierre por ritmo usa días hábiles (lunes a viernes menos feriados y días de la empresa)',
    )
    expect(summaryNote({ total: 21, holidaysExcluded: true, templateTotal: 23, mismatch: true })).toContain(
      ' · La plantilla de cuotas indica 23 días hábiles; el calendario, 21.',
    )
  })

  it('calendarNotes lists the missing years first, then the template; nothing when all is fine', () => {
    expect(calendarNotes([], { total: 20, mismatch: false })).toEqual([])
    expect(calendarNotes(undefined, undefined)).toEqual([])

    const notes = calendarNotes([2027], { total: 21, templateTotal: 23, mismatch: true })

    expect(notes).toHaveLength(2)
    expect(notes[0]).toContain('2027')
    expect(notes[1]).toContain('23')
  })
})
