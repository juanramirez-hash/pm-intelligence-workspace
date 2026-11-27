// CAL-001: where the business calendar shows up in the screens: the
// Calendario section of Configuración (administrators only) and the notes of
// Mi día, the brand page and the directory.

import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { canAccessWorkspace } from '../../src/features/auth/workspaceAccess'

const read = (path: string) => readFileSync(path, 'utf8')

const user = (role: string) => ({ role, scope: role === 'admin' ? 'all' : 'assigned' }) as never

describe('CAL-001 screens', () => {
  it('Configuración (and with it Calendario) is only for administrators', () => {
    expect(canAccessWorkspace(user('admin'), 'settings')).toBe(true)

    for (const role of ['manager', 'pm', 'engineering', 'assistant']) {
      expect(canAccessWorkspace(user(role), 'settings'), role).toBe(false)
    }
  })

  it('Configuración has the Calendario section', () => {
    const page = read('src/features/settings/SettingsPage.tsx')

    expect(page).toContain("id: 'calendar'")
    expect(page).toContain("label: 'Calendario'")
    expect(page).toContain("activeSection === 'calendar'")
    expect(page).toContain('<CalendarSettings />')
  })

  it('Mi día, the brand frame and the directory show the calendar notes', () => {
    expect(read('src/features/my-day/pages/MyDayPage.tsx')).toContain('summaryNote(data?.workingDays)')
    expect(read('src/features/my-day/pages/MyDayPage.tsx')).toContain('missingCalendarNote(data?.calendarMissingYears)')
    expect(read('src/features/brands/components/BrandFrame.tsx')).toContain('calendarNotes(header.calendarMissingYears, header.workingDays)')
    expect(read('src/features/brands/pages/BrandsDirectoryPage.tsx')).toContain('calendarNotes(data.calendarMissingYears, data.workingDays)')
  })

  it('the old client engines and date helpers are untouched (Pronóstico, Inteligencia and Executive are rewritten or retired later)', () => {
    for (const path of [
      'src/core/analytics/shared/dateAnalytics.ts',
      'src/core/business/forecast/forecastCalendar.ts',
    ]) {
      expect(read(path), path).not.toMatch(/business[_-]?calendar|BusinessCalendar/)
    }
  })
})
