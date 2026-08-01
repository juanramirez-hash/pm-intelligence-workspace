import {
  BadgeDollarSign,
  CalendarClock,
  CircleAlert,
  FolderKanban,
  Gauge,
  ShieldCheck,
} from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'
import { useDataCenterStore } from '../store/dataCenterStore'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function ProjectImportSummary() {
  const activeReportType = useDataCenterStore(
    (state) => state.activeReportType,
  )
  const importStatus = useDataCenterStore(
    (state) => state.importStatus,
  )
  const summary = useDataCenterStore(
    (state) => state.projectsSummary,
  )

  if (
    activeReportType !== 'projects' ||
    importStatus !== 'completed' ||
    !summary
  ) {
    return null
  }

  const qualityAlerts =
    summary.duplicateProjects +
    summary.projectsMissingBillingDate +
    summary.projectsMissingAmountToClose +
    summary.projectsMissingCurrency

  const cards = [
    {
      label: 'Proyectos',
      value: formatNumber(summary.totalProjects),
      detail: `${formatNumber(summary.activeProjects)} activos`,
      icon: FolderKanban,
    },
    {
      label: 'Pipeline maduro',
      value: formatNumber(summary.matureProjects),
      detail: 'Status 05 y 06',
      icon: ShieldCheck,
    },
    {
      label: 'Pipeline potencial',
      value: formatNumber(summary.potentialProjects),
      detail: 'Status 03 y 04',
      icon: Gauge,
    },
    {
      label: 'Monto maduro USD',
      value: formatUsd(summary.matureAmountToCloseUsd),
      detail: 'Monto por cerrar · sin conversión',
      icon: BadgeDollarSign,
    },
    {
      label: 'Fecha de facturación',
      value: summary.periodEnd ?? 'Sin fecha',
      detail: summary.periodStart
        ? `Desde ${summary.periodStart}`
        : 'Sin cobertura temporal',
      icon: CalendarClock,
    },
    {
      label: 'Alertas de calidad',
      value: formatNumber(qualityAlerts),
      detail: `${summary.duplicateProjects} repetidos · ${summary.projectsMissingBillingDate} sin fecha`,
      icon: CircleAlert,
    },
  ]

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Resumen del repositorio de proyectos"
        description="Snapshot operativo listo para consultas por status y fecha estimada de facturación."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <Icon size={18} className="text-violet-600" />
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
