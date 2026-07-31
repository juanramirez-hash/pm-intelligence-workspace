function parsePeriodId(
  periodId: string,
): {
  year: number
  month: number
} | null {
  const match = /^(\d{4})-(\d{2})$/.exec(periodId)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }

  return {
    year,
    month,
  }
}

function parseIsoDate(
  value: string,
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00Z`)

  return Number.isNaN(date.getTime())
    ? null
    : date
}

export function countWeekdaysThroughDate(
  periodId: string,
  dataPeriodEnd: string | null,
  workingDays: number | null,
): number | undefined {
  if (
    workingDays === null ||
    !Number.isInteger(workingDays) ||
    workingDays <= 0 ||
    !dataPeriodEnd
  ) {
    return undefined
  }

  const period = parsePeriodId(periodId)
  const end = parseIsoDate(dataPeriodEnd)

  if (!period || !end) {
    return undefined
  }

  const endYear = end.getUTCFullYear()
  const endMonth = end.getUTCMonth() + 1

  if (
    endYear > period.year ||
    (
      endYear === period.year &&
      endMonth > period.month
    )
  ) {
    return workingDays
  }

  if (
    endYear < period.year ||
    (
      endYear === period.year &&
      endMonth < period.month
    )
  ) {
    return 0
  }

  let count = 0

  for (
    let day = 1;
    day <= end.getUTCDate();
    day += 1
  ) {
    const weekday = new Date(
      Date.UTC(period.year, period.month - 1, day),
    ).getUTCDay()

    if (weekday !== 0 && weekday !== 6) {
      count += 1
    }
  }

  return Math.min(workingDays, count)
}

export function previousYearPeriodId(
  periodId: string,
): string | null {
  const period = parsePeriodId(periodId)

  if (!period) {
    return null
  }

  return `${period.year - 1}-${String(period.month).padStart(2, '0')}`
}
