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
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function ExecutiveBriefHeader({
  title,
  periodId,
  generatedAt,
  summary,
}: ExecutiveBriefHeaderProps) {
  return (
    <header
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:p-7"
      data-atlas-component="executive-brief-header"
    >
      <div className="absolute -right-20 -top-24 size-64 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-28 left-1/3 size-56 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-violet-200 ring-1 ring-inset ring-white/10">
                <BookOpenText size={21} />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                  Executive Brief
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {title}
                </h2>
              </div>
            </div>

            <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-300 sm:text-[15px]">
              {summary}
            </p>
          </div>

          <div className="grid shrink-0 gap-2 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-1">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
              <CalendarDays size={14} />
              Periodo {periodId}
            </span>

            <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
              <CheckCircle2 size={14} />
              Generado {formatGeneratedAt(generatedAt)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
