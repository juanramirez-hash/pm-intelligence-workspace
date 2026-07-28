import {
  CalendarDays,
  Gauge,
  Target,
  TrendingUp,
} from 'lucide-react'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  SalesPerformanceStatus,
  SalesWorkspacePerformance,
} from '../types'

import {
  formatSalesCurrency,
  formatSalesInteger,
  formatSalesPercentage,
} from '../utils'

interface SalesPerformancePanelProps {
  performance: SalesWorkspacePerformance
}

const statusLabels: Record<
  SalesPerformanceStatus,
  string
> = {
  'not-evaluable': 'No evaluable',
  'behind-plan': 'Debajo del ritmo',
  'on-plan': 'En ritmo',
  'ahead-of-plan': 'Adelantado',
  achieved: 'Objetivo alcanzado',
}

function getStatusTone(
  status: SalesPerformanceStatus,
) {
  if (
    status === 'achieved' ||
    status === 'ahead-of-plan'
  ) {
    return 'positive' as const
  }

  if (status === 'behind-plan') {
    return 'critical' as const
  }

  if (status === 'on-plan') {
    return 'attention' as const
  }

  return 'neutral' as const
}

function getStatusClass(
  status: SalesPerformanceStatus,
): string {
  if (
    status === 'achieved' ||
    status === 'ahead-of-plan'
  ) {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'behind-plan') {
    return 'bg-rose-100 text-rose-700'
  }

  if (status === 'on-plan') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function clampProgress(
  value: number | null,
): number {
  if (value === null) {
    return 0
  }

  return Math.min(
    Math.max(value, 0),
    100,
  )
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold tabular-nums text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {helper}
      </p>
    </div>
  )
}

export function SalesPerformancePanel({
  performance,
}: SalesPerformancePanelProps) {
  const pace =
    performance.pace

  if (!performance.available) {
    return (
      <ExecutivePanel
        className="h-full"
        icon={<Target size={19} />}
        subtitle="Compara la venta real contra la cuota mensual y el avance esperado por día laboral."
        title="Desempeño contra objetivo"
        tone="attention"
      >
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {performance.unavailableReason
                ? 'Objetivo no evaluable con este segmento.'
                : 'No hay objetivos para el periodo seleccionado.'}
            </p>

            <p className="mt-2 max-w-xl text-xs leading-5 text-amber-700">
              {performance.unavailableReason ??
                'Importa la cuota mensual por marca y los días laborables para activar cumplimiento, ritmo diario y proyección de cierre.'}
            </p>
          </div>
        </div>
      </ExecutivePanel>
    )
  }

  const attainment =
    performance.revenue.attainment

  const projection =
    pace.projectedAttainment

  return (
    <ExecutivePanel
      className="h-full"
      count={statusLabels[pace.status]}
      footer={
        pace.dataCutoff
          ? `Corte de ventas utilizado para el ritmo laboral: ${pace.dataCutoff}.`
          : 'Sin fecha de corte disponible.'
      }
      icon={<Target size={19} />}
      subtitle="Objetivo consolidado de las marcas cargadas para el periodo seleccionado."
      title="Desempeño contra objetivo"
      tone={getStatusTone(pace.status)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Venta real / objetivo mensual
          </p>

          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">
            {formatSalesCurrency(performance.revenue.actual)}
            <span className="ml-2 text-sm font-medium text-slate-400">
              / {performance.revenue.target === null
                ? 'Sin objetivo'
                : formatSalesCurrency(performance.revenue.target)}
            </span>
          </p>
        </div>

        <span
          className={[
            'inline-flex rounded-full px-3 py-1.5 text-xs font-semibold',
            getStatusClass(pace.status),
          ].join(' ')}
        >
          {statusLabels[pace.status]}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-500">
            Cumplimiento de venta
          </span>

          <span className="font-semibold tabular-nums text-slate-800">
            {formatSalesPercentage(attainment)}
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            aria-label={`Cumplimiento ${formatSalesPercentage(attainment)}`}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            style={{
              width: `${clampProgress(attainment)}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          helper={pace.expectedToDate === null
            ? 'Requiere objetivo y días laborables.'
            : `Brecha ${formatSalesCurrency(pace.varianceToPlan ?? 0)}`}
          label="Esperado al corte"
          value={pace.expectedToDate === null
            ? 'No disponible'
            : formatSalesCurrency(pace.expectedToDate)}
        />

        <Metric
          helper={pace.elapsedWorkingDays === null
            ? 'Sin calendario laboral.'
            : `${formatSalesInteger(pace.elapsedWorkingDays)} de ${formatSalesInteger(pace.workingDays ?? 0)} días`}
          label="Ritmo diario actual"
          value={pace.currentDailyRevenue === null
            ? 'No disponible'
            : formatSalesCurrency(pace.currentDailyRevenue)}
        />

        <Metric
          helper={pace.remainingWorkingDays === null
            ? 'Sin calendario laboral.'
            : `${formatSalesInteger(pace.remainingWorkingDays)} días restantes`}
          label="Ritmo diario requerido"
          value={pace.requiredDailyRevenue === null
            ? 'No disponible'
            : formatSalesCurrency(pace.requiredDailyRevenue)}
        />

        <Metric
          helper={projection === null
            ? 'Sin proyección evaluable.'
            : `${formatSalesPercentage(projection)} del objetivo`}
          label="Proyección de cierre"
          value={pace.projectedPeriodEnd === null
            ? 'No disponible'
            : formatSalesCurrency(pace.projectedPeriodEnd)}
        />
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Gauge size={17} />
          </span>

          <div>
            <p className="text-xs font-semibold text-slate-800">
              Ritmo contra plan
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatSalesPercentage(pace.attainmentToPlan)} del avance esperado.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <TrendingUp size={17} />
          </span>

          <div>
            <p className="text-xs font-semibold text-slate-800">
              Gross Profit
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatSalesPercentage(performance.grossProfit.attainment)} de la cuota GP.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <CalendarDays size={17} />
          </span>

          <div>
            <p className="text-xs font-semibold text-slate-800">
              Cobertura de objetivos
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatSalesInteger(performance.coverage.coveredActiveBrands)} de {formatSalesInteger(performance.coverage.activeBrands)} marcas activas.
            </p>
          </div>
        </div>
      </div>
    </ExecutivePanel>
  )
}
