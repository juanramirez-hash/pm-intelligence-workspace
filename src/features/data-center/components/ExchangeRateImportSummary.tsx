import {
  ArrowRightLeft,
  CalendarRange,
  CircleAlert,
  Rows3,
} from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'
import { useDataCenterStore } from '../store/dataCenterStore'

export function ExchangeRateImportSummary() {
  const activeReportType = useDataCenterStore(
    (state) => state.activeReportType,
  )
  const importStatus = useDataCenterStore(
    (state) => state.importStatus,
  )
  const summary = useDataCenterStore(
    (state) => state.exchangeRateSummary,
  )

  if (
    activeReportType !== 'exchange-rates' ||
    importStatus !== 'completed' ||
    !summary
  ) {
    return null
  }

  const cards = [
    {
      label: 'Tipos de cambio',
      value: summary.totalRates.toLocaleString('es-MX'),
      detail: 'Un registro activo por periodo y par',
      icon: Rows3,
    },
    {
      label: 'Pares de moneda',
      value: summary.currencyPairs.toLocaleString('es-MX'),
      detail: 'USD → MXN es el par operativo inicial',
      icon: ArrowRightLeft,
    },
    {
      label: 'Cobertura',
      value: summary.periodEnd ?? 'Sin periodo',
      detail: summary.periodStart
        ? `Desde ${summary.periodStart}`
        : 'Sin cobertura',
      icon: CalendarRange,
    },
    {
      label: 'Registros inválidos',
      value: summary.invalidRates.toLocaleString('es-MX'),
      detail: `${summary.ignoredRows} filas ignoradas`,
      icon: CircleAlert,
    },
  ]

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Resumen de tipos de cambio"
        description="Control mensual auditable para convertir pipeline abierto de USD a MXN."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <Icon size={18} className="text-amber-600" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {value}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {detail}
            </p>
          </div>
        ))}
      </div>
    </AtlasCard>
  )
}
