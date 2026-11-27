// NAV-001: "Datos al corte: <fecha>" always visible in the top bar, with an
// amber mark when a source is more than 7 days old and the dates of sales,
// inventory and purchases in the tooltip. Read again when the tab becomes
// visible (after a load in Centro de datos, for example).

import {
  useEffect,
  useState,
} from 'react'

import {
  loadDataCutoff,
  summarizeDataCutoff,
  type DataCutoffResponse,
} from './dataCutoffApi'

export function DataCutoffBadgeView({
  data,
  failed,
}: {
  data: DataCutoffResponse | null
  failed: boolean
}) {
  const summary = summarizeDataCutoff(data, failed)

  return (
    <p
      data-data-cutoff="true"
      title={summary.tooltip}
      className="flex min-w-0 items-center gap-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-600 sm:text-xs"
    >
      {summary.stale ? (
        <span
          aria-label="Alguna fuente está atrasada"
          data-data-cutoff-stale="true"
          className="size-2 shrink-0 rounded-full bg-amber-500"
        />
      ) : null}
      <span className="truncate">
        {summary.label}
      </span>
    </p>
  )
}

export function DataCutoffBadge() {
  const [data, setData] = useState<DataCutoffResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let controller = new AbortController()

    const load = () => {
      controller.abort()
      controller = new AbortController()

      loadDataCutoff(controller.signal)
        .then((response) => {
          setData(response)
          setFailed(false)
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setFailed(true)
          }
        })
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load()
      }
    }

    load()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      controller.abort()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return <DataCutoffBadgeView data={data} failed={failed} />
}
