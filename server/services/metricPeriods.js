import { isoDate, periodId } from './actionValidation.js'
import { EMPTY_CALENDAR } from './businessCalendar.js'
export function shiftMonth(period, months) {
  const [year,month] = periodId(period).split('-').map(Number)
  return new Date(Date.UTC(year,month-1+months,1)).toISOString().slice(0,7)
}
export function monthEnd(period) {
  const [year,month] = periodId(period).split('-').map(Number)
  return new Date(Date.UTC(year,month,0)).toISOString().slice(0,10)
}
export function lossWindow(period,cutoff,inactivePeriods=2,basePeriods=1) {
  periodId(period); isoDate(cutoff)
  const dataMonth = cutoff.slice(0,7)
  const completed = cutoff >= monthEnd(dataMonth) ? dataMonth : shiftMonth(dataMonth,-1)
  const last = period < completed ? period : completed
  return {
    baseFrom:shiftMonth(last,-inactivePeriods-basePeriods+1),baseTo:shiftMonth(last,-inactivePeriods),
    inactiveFrom:shiftMonth(last,-inactivePeriods+1),inactiveTo:last,
  }
}
function workingDates(period,to) {
  const dates=[]
  for (let day=1;day<=31;day++) {
    const date = `${period}-${String(day).padStart(2,'0')}`
    if (date>to || date>monthEnd(period)) break
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
    if (weekday!==0 && weekday!==6) dates.push(date)
  }
  return dates
}
export function comparisonWindow(period,cutoff) {
  periodId(period); isoDate(cutoff)
  if (cutoff < `${period}-01`) return null
  const previousPeriod = shiftMonth(period,-1)
  const closed = cutoff >= monthEnd(period)
  let currentTo = closed ? monthEnd(period) : cutoff
  let previousTo = monthEnd(previousPeriod)
  if (!closed) {
    const currentDays=workingDates(period,currentTo), previousDays=workingDates(previousPeriod,previousTo)
    const count=Math.min(currentDays.length,previousDays.length)
    if (!count) return null
    if (currentDays.length>count) currentTo=currentDays[count-1]
    previousTo=previousDays[count-1]
  }
  return {basis:closed?'full-month':'equivalent-working-days',currentFrom:`${period}-01`,currentTo,
    previousFrom:`${previousPeriod}-01`,previousTo,holidaysExcluded:false}
}

// MD-001 / CAL-001. Business days of the calendar (Monday to Friday minus the
// non-working days of business_calendar), both dates included. Without a
// calendar (EMPTY_CALENDAR, the default) it is Monday to Friday.
export function weekdaysBetween(from, to, calendar = EMPTY_CALENDAR) {
  isoDate(from); isoDate(to)
  return calendar.businessDaysBetween(from, to)
}

export function weekdaysInPeriod(period, calendar = EMPTY_CALENDAR) {
  return calendar.businessDaysInPeriod(periodId(period))
}

/**
 * Same rule as resolveEquivalentWorkingDayCutoff in the frontend (Executive),
 * with the calendar: the previous month is cut on its Nth business day, N being
 * the business days elapsed in the period up to the cutoff; its last day when
 * it has fewer. NULL when no business day has elapsed (Executive then compares
 * the full month). The current window is never trimmed, unlike comparisonWindow.
 */
export function equivalentPreviousCutoff(period, cutoff, calendar = EMPTY_CALENDAR) {
  periodId(period); isoDate(cutoff)
  if (cutoff < `${period}-01`) return null
  const elapsed = weekdaysBetween(`${period}-01`, cutoff, calendar)
  if (elapsed <= 0) return null
  const previousPeriod = shiftMonth(period, -1)
  return calendar.nthBusinessDay(previousPeriod, elapsed) ?? monthEnd(previousPeriod)
}
