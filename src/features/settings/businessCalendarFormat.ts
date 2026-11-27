// CAL-001: texts of Configuración > Calendario.

import {
  capitalizeFirst,
  formatInteger,
  formatPeriod,
} from '../my-day/format/myDayFormat'

import type {
  CalendarTemplateCheck,
} from './businessCalendarRepository'

/** "Febrero de 2026: la plantilla de cuotas indica 20 (31 marcas) días hábiles; el calendario, 19." */
export function templateWarning(check: CalendarTemplateCheck): string {
  const values = check.templateValues
    .map((item) => `${formatInteger(item.workingDays)} (${formatInteger(item.brands)} ${item.brands === 1 ? 'marca' : 'marcas'})`)
    .join(', ')

  return `${capitalizeFirst(formatPeriod(check.period))}: la plantilla de cuotas indica ${values} días hábiles; el calendario, ${formatInteger(check.calendarDays)}.`
}
