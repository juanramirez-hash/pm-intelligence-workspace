import {
  BadgeDollarSign,
  Building2,
  CalendarRange,
  CalendarDays,
  Percent,
  Rows3,
} from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'
import { useDataCenterStore } from '../store/dataCenterStore'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

interface SummaryMetricProps {
  label: string
  value: string
  icon: React.ReactNode
}

function SummaryMetric({ label, value, icon }: SummaryMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  )
}

export function TargetImportSummary() {
  const targetSummary = useDataCenterStore((state) => state.targetSummary)
  const activeReportType = useDataCenterStore((state) => state.activeReportType)
  const importStatus = useDataCenterStore((state) => state.importStatus)

  if (
    importStatus !== 'completed' ||
    activeReportType !== 'quota' ||
    !targetSummary
  ) {
    return null
  }

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Resumen de objetivos comerciales"
        description="Cuotas mensuales listas para integrarse al Business Repository."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Objetivo de venta"
          value={formatCurrency(targetSummary.totalRevenueTarget)}
          icon={<BadgeDollarSign size={20} />}
        />
        <SummaryMetric
          label="Objetivo de GP"
          value={formatCurrency(targetSummary.totalGrossProfitTarget)}
          icon={<Building2 size={20} />}
        />
        <SummaryMetric
          label="Margen objetivo promedio"
          value={
            targetSummary.averageGrossMarginTarget === null
              ? 'Sin dato'
              : `${(targetSummary.averageGrossMarginTarget * 100).toFixed(1)}%`
          }
          icon={<Percent size={20} />}
        />
        <SummaryMetric
          label="Marcas"
          value={formatNumber(targetSummary.uniqueBrands)}
          icon={<Building2 size={20} />}
        />
        <SummaryMetric
          label="Periodos"
          value={formatNumber(targetSummary.periods)}
          icon={<CalendarRange size={20} />}
        />
        <SummaryMetric
          label="Cuotas cargadas"
          value={formatNumber(targetSummary.totalTargets)}
          icon={<Rows3 size={20} />}
        />
        <SummaryMetric
          label="Con días laborables"
          value={formatNumber(targetSummary.rowsWithWorkingDays)}
          icon={<CalendarDays size={20} />}
        />
        <SummaryMetric
          label="Cobertura"
          value={
            targetSummary.periodStart && targetSummary.periodEnd
              ? `${targetSummary.periodStart} – ${targetSummary.periodEnd}`
              : 'Sin periodo'
          }
          icon={<CalendarRange size={20} />}
        />
      </div>
    </AtlasCard>
  )
}
