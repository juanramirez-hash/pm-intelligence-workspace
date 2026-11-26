// MD-003: the 4 portfolio indicators. Quota, attainment, pace and daily gap
// only use the brands with target (the server computes them that way).

import {
  CalendarClock,
  Gauge,
  Target,
  TrendingUp,
} from 'lucide-react'

import {
  KpiCard,
  type KpiCardTone,
} from '../../../components/business/kpi'

import type {
  MyDayPeriodStatus,
  MyDayPortfolio,
  MyDayWorkingDays,
} from '../api/myDayTypes'

import {
  expectedProgress,
  formatInteger,
  formatMoney,
  formatPercent,
} from '../format/myDayFormat'

import {
  paceTone,
  type PaceTone,
} from '../format/myDayLabels'

import {
  targetScopeNote,
} from '../format/myDaySummary'

const PACE_KPI_TONES: Record<PaceTone, KpiCardTone> = {
  green: 'emerald',
  amber: 'amber',
  red: 'rose',
  none: 'slate',
}

interface MyDayKpisProps {
  portfolio: MyDayPortfolio
  workingDays: MyDayWorkingDays | null | undefined
  periodStatus: MyDayPeriodStatus | null | undefined
}

export function MyDayKpis({
  portfolio,
  workingDays,
  periodStatus,
}: MyDayKpisProps) {
  const expected = expectedProgress(workingDays, periodStatus)
  const remaining = periodStatus === 'open' && workingDays
    ? workingDays.remaining
    : null

  return (
    <section aria-label="Indicadores del mes" className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          tone="blue"
          title="Venta del mes"
          value={formatMoney(portfolio.revenue)}
          subtitle={`Cuota ${formatMoney(portfolio.target)}`}
        />

        <KpiCard
          icon={Target}
          tone="violet"
          title="Avance"
          value={formatPercent(portfolio.attainment)}
          subtitle={`Esperado a la fecha ${formatPercent(expected)}`}
        />

        <KpiCard
          icon={Gauge}
          tone={PACE_KPI_TONES[paceTone(portfolio.projectedAttainment)]}
          title="Cierre por ritmo"
          value={formatMoney(portfolio.projectedRevenueWithTarget)}
          subtitle={`${formatPercent(portfolio.projectedAttainment)} de la cuota · Todas las marcas ${formatMoney(portfolio.projectedRevenue)}`}
        />

        <KpiCard
          icon={CalendarClock}
          tone="amber"
          title="Brecha diaria"
          value={formatMoney(portfolio.dailyGap)}
          subtitle={remaining === null
            ? 'Sin días hábiles restantes'
            : `${formatInteger(remaining)} días hábiles restantes`}
        />
      </div>

      <p data-my-day-target-note="true" className="text-xs text-slate-500">
        {targetScopeNote(portfolio)}
      </p>
    </section>
  )
}
