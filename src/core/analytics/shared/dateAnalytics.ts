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

export function countWeekdaysInclusive(
  startValue: string,
  endValue: string,
): number | null {
  const start =
    parseIsoDate(
      startValue,
    )

  const end =
    parseIsoDate(
      endValue,
    )

  if (
    !start ||
    !end ||
    start > end
  ) {
    return null
  }

  let weekdays = 0

  for (
    const cursor =
      new Date(start);
    cursor <= end;
    cursor.setUTCDate(
      cursor.getUTCDate() + 1,
    )
  ) {
    const day =
      cursor.getUTCDay()

    if (
      day !== 0 &&
      day !== 6
    ) {
      weekdays += 1
    }
  }

  return weekdays
}

export function resolveEquivalentWorkingDayCutoff(
  sourcePeriodId: string,
  sourceCutoff: string,
  comparisonPeriodId: string,
  comparisonPeriodEnd: string,
): string | null {
  const elapsedWeekdays =
    countWeekdaysInclusive(
      `${sourcePeriodId}-01`,
      sourceCutoff,
    )

  if (
    elapsedWeekdays === null ||
    elapsedWeekdays <= 0
  ) {
    return null
  }

  const comparisonStart =
    parseIsoDate(
      `${comparisonPeriodId}-01`,
    )

  const comparisonEnd =
    parseIsoDate(
      comparisonPeriodEnd,
    )

  if (
    !comparisonStart ||
    !comparisonEnd
  ) {
    return null
  }

  let countedWeekdays = 0

  for (
    const cursor =
      new Date(comparisonStart);
    cursor <= comparisonEnd;
    cursor.setUTCDate(
      cursor.getUTCDate() + 1,
    )
  ) {
    const day =
      cursor.getUTCDay()

    if (
      day === 0 ||
      day === 6
    ) {
      continue
    }

    countedWeekdays += 1

    if (
      countedWeekdays ===
      elapsedWeekdays
    ) {
      return toIsoDate(
        cursor,
      )
    }
  }

  return comparisonPeriodEnd
}