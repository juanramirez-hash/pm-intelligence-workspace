// CAL-001: Configuración > Calendario (administrators only). Official holidays
// and company days of each year. Business days = Monday to Friday minus these
// days; they drive the pace of Mi día, the brand page and the portfolio. The
// quota template (brand_targets.working_days) is only compared: where it differs
// from the calendar the calendar rules and a warning is listed here.

import {
  useState,
} from 'react'

import {
  AtlasCard,
} from '../../atlas/components/AtlasCard'

import {
  MyDayBlock,
} from '../my-day/components/MyDayBlock'

import {
  capitalizeFirst,
  formatDate,
  formatInteger,
  formatPeriod,
} from '../my-day/format/myDayFormat'

import {
  templateWarning,
} from './businessCalendarFormat'

import {
  useMyDayBlock,
} from '../my-day/hooks/useMyDayBlock'

import {
  missingCalendarNote,
} from '../../shared/calendar/calendarText'

import {
  DAY_TYPE_LABELS,
  loadCalendarYear,
  removeCalendarDay,
  saveCalendarDay,
  type CalendarDayType,
  type CalendarEntry,
  type CalendarYearResponse,
} from './businessCalendarRepository'

interface CalendarSettingsViewProps {
  data: CalendarYearResponse | null
  year: number
  status: 'loading' | 'success' | 'error'
  error: Error | null
  busy: boolean
  message: string | null
  onYearChange: (year: number) => void
  onSave: (date: string, type: CalendarDayType, description: string) => void
  onRemove: (date: string) => void
  onRetry: () => void
}

/** Presentational part (static markup in the tests). */
export function CalendarSettingsView({
  data,
  year,
  status,
  error,
  busy,
  message,
  onYearChange,
  onSave,
  onRemove,
  onRetry,
}: CalendarSettingsViewProps) {
  const [date, setDate] = useState('')
  const [type, setType] = useState<CalendarDayType>('official')
  const [description, setDescription] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const years = data?.years ?? [year]
  const missing = data && !data.loaded ? missingCalendarNote([year]) : null
  const byMonth = (period: string): CalendarEntry[] =>
    data?.entries.filter((entry) => entry.date.startsWith(period)) ?? []
  const canSave = date !== '' && description.trim() !== '' && !busy

  return (
    <div data-calendar-settings="true" className="space-y-6">
      <AtlasCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Calendario de días no laborables
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Días hábiles = lunes a viernes menos los feriados oficiales y los días de la empresa de cada año. Cambian cada año: carga los del año que sigue aquí. Las ventas de un día no laborable se siguen sumando; solo cambia el conteo de días.
            </p>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Año
            <select
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm"
            >
              {years.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
      </AtlasCard>

      {missing ? (
        <p data-calendar-missing="true" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {missing}
        </p>
      ) : null}

      {data && data.templateMismatches.length > 0 ? (
        <div data-calendar-template-warnings="true" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="font-semibold">
            La plantilla de cuotas no coincide con el calendario en {formatInteger(data.templateMismatches.length)} {data.templateMismatches.length === 1 ? 'mes' : 'meses'}. Manda el calendario:
          </p>
          <ul className="mt-1 list-disc pl-5">
            {data.templateMismatches.map((check) => (
              <li key={check.period}>{templateWarning(check)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <MyDayBlock
        title={`Días no laborables de ${year}`}
        subtitle={data ? `${formatInteger(data.entries.length)} ${data.entries.length === 1 ? 'día' : 'días'}` : undefined}
        status={status === 'success' ? 'ready' : status}
        errorMessage={error?.message}
        onRetry={onRetry}
        toolbar={(
          <form
            data-calendar-form="true"
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault()

              if (canSave) {
                onSave(date, type, description.trim())
              }
            }}
          >
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Fecha
              <input
                type="date"
                value={date}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Tipo
              <select
                value={type}
                onChange={(event) => setType(event.target.value as CalendarDayType)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              >
                <option value="official">{DAY_TYPE_LABELS.official}</option>
                <option value="company">{DAY_TYPE_LABELS.company}</option>
              </select>
            </label>

            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
              Descripción
              <input
                type="text"
                value={description}
                maxLength={data?.limits.descriptionMax ?? 120}
                placeholder="Por ejemplo: Año Nuevo"
                onChange={(event) => setDescription(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              />
            </label>

            <button
              type="submit"
              disabled={!canSave}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Agregar o actualizar
            </button>
          </form>
        )}
        footer={message ? <p data-calendar-message="true" className="text-sm text-slate-700">{message}</p> : null}
      >
        {data ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Mes</th>
                  <th className="border-b border-slate-200 px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Lunes a viernes</th>
                  <th className="border-b border-slate-200 px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Días hábiles</th>
                  <th className="border-b border-slate-200 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Días no laborables</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((month) => (
                  <tr key={month.period} data-calendar-month={month.period}>
                    <td className="border-b border-slate-100 px-2 py-2 align-top font-medium text-slate-900">
                      {capitalizeFirst(formatPeriod(month.period))}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 text-right align-top tabular-nums text-slate-600">
                      {formatInteger(month.weekdays)}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 text-right align-top font-semibold tabular-nums text-slate-900">
                      {formatInteger(month.businessDays)}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 align-top">
                      {byMonth(month.period).length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {byMonth(month.period).map((entry) => (
                            <li key={entry.date} data-calendar-day={entry.date} className="flex flex-wrap items-center gap-2">
                              <span className="tabular-nums text-slate-800">{formatDate(entry.date)}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                                entry.type === 'official'
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-violet-200 bg-violet-50 text-violet-700'
                              }`}
                              >
                                {DAY_TYPE_LABELS[entry.type]}
                              </span>
                              <span className="text-slate-600">{entry.description}</span>
                              {confirming === entry.date ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => { setConfirming(null); onRemove(entry.date) }}
                                    className="rounded-lg bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-rose-700"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirming(null)}
                                    className="text-xs font-medium text-slate-500 hover:underline"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setConfirming(entry.date)}
                                  className="text-xs font-medium text-rose-700 hover:underline"
                                >
                                  Quitar
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </MyDayBlock>
    </div>
  )
}

/** Container: loads the year and saves or removes days (administrators only). */
export function CalendarSettings() {
  const [year, setYear] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const block = useMyDayBlock<CalendarYearResponse>(
    `calendar|${year ?? 'current'}`,
    (signal) => loadCalendarYear(year, signal),
  )

  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    setMessage(null)

    try {
      setMessage(await action())
      block.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la operación.')
    } finally {
      setBusy(false)
    }
  }

  const shownYear = year ?? block.data?.year ?? new Date().getFullYear()

  return (
    <CalendarSettingsView
      data={block.data}
      year={shownYear}
      status={block.status}
      error={block.error}
      busy={busy}
      message={message}
      onYearChange={setYear}
      onSave={(date, type, description) => {
        void run(async () => {
          const result = await saveCalendarDay(date, { type, description })

          return result.created ? 'Día agregado al calendario.' : 'Día actualizado.'
        })
      }}
      onRemove={(date) => {
        void run(async () => {
          await removeCalendarDay(date)

          return 'Día quitado del calendario.'
        })
      }}
      onRetry={block.reload}
    />
  )
}
