import {
  BookOpenText,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react'

interface ExecutiveBriefHeaderProps {
  title: string
  periodId: string
  generatedAt: string
  summary: string
}

function formatGeneratedAt(
  value: string,
): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date =
      new Date(
        `${value}T00:00:00.000Z`,
      )

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value
    }

    return date.toLocaleDateString(
      'es-MX',
      {
        dateStyle: 'medium',
        timeZone: 'UTC',
      },
    )
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleString(
    'es-MX',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  )
}

export function ExecutiveBriefHeader({
  title,
  periodId,
  generatedAt,
  summary,
}: ExecutiveBriefHeaderProps) {
  return (
    <header
      className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/50 to-sky-100/60 p-6 text-blue-950 shadow-sm sm:p-7"
      data-atlas-component="executive-brief-header"
    >
      <div className="absolute -right-20 -top-24 size-64 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute -bottom-28 left-1/3 size-56 rounded-full bg-sky-200/20 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                <BookOpenText size={21} />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Executive Brief
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-blue-950 sm:text-2xl">
                  {title}
                </h2>
              </div>
            </div>

            <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              {summary}
            </p>
          </div>

          <div className="grid shrink-0 gap-2 text-xs text-blue-700 sm:grid-cols-2 lg:grid-cols-1">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-inset ring-blue-200">
              <CalendarDays size={14} />
              Periodo {periodId}
            </span>

            <span className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-inset ring-blue-200">
              <CheckCircle2 size={14} />
              Generado {formatGeneratedAt(generatedAt)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}