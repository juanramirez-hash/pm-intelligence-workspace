import {
  DATA_CENTER_IMPORTERS,
  NETSUITE_EXPORT_HELP,
  NETSUITE_SOURCES,
  type DataCenterImporterId,
  type NetsuiteSource,
} from '../config/netsuiteSources'

export type NetsuiteSourceStatus =
  | 'up-to-date'
  | 'stale'
  | 'no-data'
  | 'unconfigured'

export const NETSUITE_SOURCE_STATUS_LABELS: Record<
  NetsuiteSourceStatus,
  string
> = {
  'up-to-date': 'Al día',
  stale: 'Atrasado',
  'no-data': 'Sin datos',
  unconfigured: 'Fuente sin configurar',
}

export interface NetsuiteSourceDates {
  // uploaded_at of the last completed import (date and time).
  lastImportedAt: string | null
  // Date-only cut of the data (YYYY-MM-DD) when the store has it.
  dataCutoff: string | null
}

export interface NetsuiteSourceRow {
  importerId: DataCenterImporterId
  label: string
  source: NetsuiteSource | null
  help: string | null
  lastImportedAt: string | null
  dataCutoff: string | null
  // Local calendar date the status is measured from.
  referenceDate: string | null
  daysSinceReference: number | null
  status: NetsuiteSourceStatus
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** YYYY-MM-DD of an instant in the browser's time zone (or the given one). */
export function toLocalDateKey(
  value: Date | string,
  timeZone?: string,
): string | null {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value

  return `${part('year')}-${part('month')}-${part('day')}`
}

function dateKeyToDayNumber(dateKey: string): number | null {
  const match = DATE_ONLY.exec(dateKey)

  if (!match) {
    return null
  }

  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ) / 86_400_000
}

/** Calendar days between two YYYY-MM-DD dates, without hours. */
export function calendarDaysBetween(
  fromDateKey: string,
  toDateKey: string,
): number | null {
  const from = dateKeyToDayNumber(fromDateKey)
  const to = dateKeyToDayNumber(toDateKey)

  return from === null || to === null
    ? null
    : Math.round(to - from)
}

/**
 * The data cutoff is already a date; the last import is an instant and is
 * converted to the local date first.
 */
export function resolveReferenceDate(
  dates: NetsuiteSourceDates,
  timeZone?: string,
): string | null {
  const cutoff = dates.dataCutoff?.slice(0, 10) ?? null

  if (cutoff && DATE_ONLY.test(cutoff)) {
    return cutoff
  }

  return dates.lastImportedAt
    ? toLocalDateKey(dates.lastImportedAt, timeZone)
    : null
}

export function buildNetsuiteSourceRows(
  datesByImporter: Partial<
    Record<DataCenterImporterId, NetsuiteSourceDates>
  >,
  now: Date = new Date(),
  timeZone?: string,
): NetsuiteSourceRow[] {
  const today = toLocalDateKey(now, timeZone)

  return DATA_CENTER_IMPORTERS.map(({ id, label }) => {
    const source = NETSUITE_SOURCES[id] ?? null
    const dates = datesByImporter[id] ?? {
      lastImportedAt: null,
      dataCutoff: null,
    }
    const referenceDate = resolveReferenceDate(dates, timeZone)
    const daysSinceReference =
      referenceDate && today
        ? calendarDaysBetween(referenceDate, today)
        : null

    let status: NetsuiteSourceStatus

    if (!source) {
      status = 'unconfigured'
    } else if (daysSinceReference === null) {
      status = 'no-data'
    } else {
      status = daysSinceReference <= source.staleAfterDays
        ? 'up-to-date'
        : 'stale'
    }

    return {
      importerId: id,
      label,
      source,
      help: source ? NETSUITE_EXPORT_HELP[source.kind] : null,
      lastImportedAt: dates.lastImportedAt,
      dataCutoff: dates.dataCutoff,
      referenceDate,
      daysSinceReference,
      status,
    }
  })
}
