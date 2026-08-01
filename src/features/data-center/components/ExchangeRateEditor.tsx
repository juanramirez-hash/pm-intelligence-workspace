import {
  ArrowRightLeft,
  Save,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import type {
  ChangeEvent,
} from 'react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'
import { useDataCenterStore } from '../store/dataCenterStore'

function currentPeriod(): string {
  const now = new Date()

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function ExchangeRateEditor() {
  const rows = useDataCenterStore(
    (state) => state.normalizedExchangeRates,
  )
  const upsertExchangeRate = useDataCenterStore(
    (state) => state.upsertExchangeRate,
  )
  const [periodId, setPeriodId] = useState(currentPeriod)
  const [rate, setRate] = useState('')
  const [sourceReference, setSourceReference] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const latestRows = useMemo(
    () => [...rows]
      .sort((left, right) => right.periodId.localeCompare(left.periodId))
      .slice(0, 12),
    [rows],
  )

  const numericRate = Number(rate)
  const isValid =
    /^\d{4}-\d{2}$/.test(periodId) &&
    Number.isFinite(numericRate) &&
    numericRate > 0

  function saveRate() {
    if (!isValid) {
      setMessage('Captura un periodo AAAA-MM y un tipo de cambio mayor que cero.')
      return
    }

    upsertExchangeRate({
      periodId,
      sourceCurrency: 'USD',
      targetCurrency: 'MXN',
      rate: numericRate,
      sourceReference: sourceReference.trim() || null,
      effectiveDate: null,
    })

    setMessage(`Tipo de cambio ${periodId} guardado correctamente.`)
    setRate('')
  }

  return (
    <AtlasCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          title="Tipo de cambio mensual"
          description="Registra pesos mexicanos por cada USD. No existe valor predeterminado ni conversión oculta."
        />

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          <ArrowRightLeft size={15} />
          USD → MXN
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[180px_180px_1fr_auto] lg:items-end">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Periodo
          <input
            type="month"
            value={periodId}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setPeriodId(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          MXN por USD
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            value={rate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setRate(event.target.value)
            }
            placeholder="18.7500"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Fuente o referencia
          <input
            type="text"
            value={sourceReference}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSourceReference(event.target.value)
            }
            placeholder="Ej. tipo de cambio mensual autorizado"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </label>

        <button
          type="button"
          onClick={saveRate}
          disabled={!isValid}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Save size={17} />
          Guardar
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}

      {latestRows.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Par</th>
                <th className="px-4 py-3 text-right">Tipo de cambio</th>
                <th className="px-4 py-3">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {latestRows.map((row) => (
                <tr key={`${row.periodId}-${row.sourceCurrency}-${row.targetCurrency}`}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {row.periodId}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.sourceCurrency} → {row.targetCurrency}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {row.rate.toLocaleString('es-MX', {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {row.sourceReference ?? 'Sin referencia'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AtlasCard>
  )
}
