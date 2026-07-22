const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000

export function parseIsoDate(
  value: string,
): Date | null {
  const parsedDate =
    new Date(value)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return null
  }

  return parsedDate
}

export function toIsoDate(
  date: Date,
): string {
  return date
    .toISOString()
    .slice(0, 10)
}

export function getDaysBetween(
  startDate: Date,
  endDate: Date,
): number {
  const startUtc =
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    )

  const endUtc =
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
    )

  return Math.max(
    0,
    Math.floor(
      (endUtc - startUtc) /
        MILLISECONDS_PER_DAY,
    ),
  )
}

export function startOfMonth(
  date: Date,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1,
    ),
  )
}

export function endOfMonth(
  date: Date,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      0,
    ),
  )
}

export function addMonths(
  date: Date,
  months: number,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() +
        months,
      1,
    ),
  )
}

export function isDateWithinRange(
  date: Date,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  return (
    date >= rangeStart &&
    date <= rangeEnd
  )
}