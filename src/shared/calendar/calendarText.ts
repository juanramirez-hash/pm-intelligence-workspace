// CAL-001: texts about the business calendar, shared by Mi día, the brand page
// and the Marcas directory. Business days = Monday to Friday minus the official
// holidays and company days of Configuración > Calendario.

export interface CalendarWorkingDays {
  total: number
  holidaysExcluded?: boolean
  // The quota template (brand_targets.working_days) is informative; the
  // calendar rules.
  templateTotal?: number | null
  mismatch?: boolean
}

export const PACE_RULE_WITH_CALENDAR =
  'el cierre por ritmo usa días hábiles (lunes a viernes menos feriados y días de la empresa)'

export const PACE_RULE_WEEKDAYS =
  'el cierre por ritmo usa días hábiles de lunes a viernes'

/** "2027", "2026 y 2027", "2025, 2026 y 2027". */
function yearsText(years: readonly number[]): string {
  if (years.length <= 1) {
    return years.join('')
  }

  return `${years.slice(0, -1).join(', ')} y ${years[years.length - 1]}`
}

/**
 * Warning of years without calendar: they are counted Monday to Friday. null
 * when every year has its calendar.
 */
export function missingCalendarNote(years: readonly number[] | null | undefined): string | null {
  if (!years || years.length === 0) {
    return null
  }

  return `No hay calendario de días no laborables cargado para ${yearsText(years)}; esos días se cuentan de lunes a viernes. Un administrador puede cargarlo en Configuración > Calendario.`
}

/**
 * Discreet note when the quota template does not agree with the calendar. The
 * calendar rules, so the pace and the daily gap use its days.
 */
export function templateMismatchNote(days: CalendarWorkingDays | null | undefined): string | null {
  if (!days || !days.mismatch) {
    return null
  }

  return typeof days.templateTotal === 'number'
    ? `La plantilla de cuotas indica ${days.templateTotal} días hábiles; el calendario, ${days.total}. Manda el calendario.`
    : 'La plantilla de cuotas no coincide con el calendario de días hábiles. Manda el calendario.'
}

/** Rule of the pace line: with the calendar, or Monday to Friday when a year is missing. */
export function paceRuleNote(days: CalendarWorkingDays | null | undefined): string {
  return days?.holidaysExcluded ? PACE_RULE_WITH_CALENDAR : PACE_RULE_WEEKDAYS
}

/** Note of the Mi día summary block: order, pace rule and, if any, the template note. */
export function summaryNote(days: CalendarWorkingDays | null | undefined): string {
  return [`Ordenado por venta · ${paceRuleNote(days)}`, templateMismatchNote(days)]
    .filter((part): part is string => part !== null)
    .join(' · ')
}

/** Every calendar note of a response: the missing years first, then the template. */
export function calendarNotes(
  missingYears: readonly number[] | null | undefined,
  days: CalendarWorkingDays | null | undefined,
): string[] {
  return [missingCalendarNote(missingYears), templateMismatchNote(days)].filter(
    (note): note is string => note !== null,
  )
}
