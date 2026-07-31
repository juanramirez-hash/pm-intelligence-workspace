import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  countWeekdaysThroughDate,
  previousYearPeriodId,
} from './forecastCalendar'

describe('FW-002 forecast calendar', () => {
  it('cuenta lunes a viernes y respeta el total laboral declarado', () => {
    expect(
      countWeekdaysThroughDate(
        '2026-03',
        '2026-03-13',
        22,
      ),
    ).toBe(10)

    expect(
      countWeekdaysThroughDate(
        '2026-03',
        '2026-04-01',
        22,
      ),
    ).toBe(22)
  })

  it('resuelve la referencia anual sin depender de la zona horaria', () => {
    expect(previousYearPeriodId('2026-03')).toBe('2025-03')
    expect(previousYearPeriodId('periodo-invalido')).toBeNull()
  })
})
