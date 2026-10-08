import { useState } from 'react'

import {
  BarChart3,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'

import {
  WorkspaceSection,
} from '../../../components/workspace/section'

import type {
  BrandWorkspaceViewModel,
} from '../../../core/decision/brands/brandWorkspaceViewModel'

type CommercialComparison =
  BrandWorkspaceViewModel['commercialComparison']

type CommercialWindow =
  NonNullable<
    CommercialComparison['monthly']['current']
  >

type CommercialDelta =
  NonNullable<
    CommercialComparison['monthly']['vsPreviousYear']
  >

type AnnualProjection =
  NonNullable<
    CommercialComparison['annual']['projection']
  >

type ComparisonTab =
  | 'monthly'
  | 'ytd'
  | 'annual'

function valueTone(
  value: number | null,
): string {
  if (value === null || value === 0) {
    return 'text-slate-600'
  }

  return value > 0
    ? 'text-emerald-700'
    : 'text-rose-700'
}

function MetricRow({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={
          emphasis
            ? 'text-base font-bold text-slate-950'
            : 'text-sm font-semibold text-slate-900'
        }
      >
        {value}
      </span>
    </div>
  )
}

function CommercialWindowCard({
  window,
  title,
  badge,
  featured = false,
  showActivity = true,
  subtitle,
}: {
  window: CommercialWindow | null
  title: string
  badge?: string
  featured?: boolean
  showActivity?: boolean
  subtitle?: string
}) {
  if (!window) {
    return (
      <article className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-700">
            {title}
          </h3>

          {badge && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-8 text-sm text-slate-400">
          Sin histórico suficiente
        </p>
      </article>
    )
  }

  return (
    <article
      className={
        featured
          ? 'rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm'
          : 'rounded-2xl border border-slate-200 bg-slate-50 p-5'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {subtitle ?? window.rangeLabel}
          </p>
        </div>

        {badge && (
          <span
            className={
              featured
                ? 'rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700'
                : 'rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500'
            }
          >
            {badge}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <MetricRow
          emphasis
          label="Venta"
          value={window.revenueLabel}
        />

        <MetricRow
          label="GP"
          value={window.grossProfitLabel}
        />

        <MetricRow
          label="Margen"
          value={window.grossMarginLabel}
        />

        {showActivity && (
          <>
            <div className="my-4 border-t border-slate-200" />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-3 text-center">
                <p className="text-xs text-slate-400">
                  Clientes
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {window.customersLabel}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3 text-center">
                <p className="text-xs text-slate-400">
                  Productos
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {window.productsLabel}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  )
}

function ComparisonDeltaCard({
  title,
  delta,
  showActivity = true,
}: {
  title: string
  delta: CommercialDelta | null
  showActivity?: boolean
}) {
  if (!delta) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </p>

        <p className="mt-3 text-sm text-slate-400">
          Comparativo no disponible
        </p>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-400">
            Venta
          </p>

          <p
            className={`mt-1 font-bold ${valueTone(
              delta.revenueAmount,
            )}`}
          >
            {delta.revenueAmountLabel}
          </p>

          <p
            className={`text-xs font-semibold ${valueTone(
              delta.revenuePercent,
            )}`}
          >
            {delta.revenuePercentLabel ??
              'Base sin comparativo'}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            GP
          </p>

          <p
            className={`mt-1 font-bold ${valueTone(
              delta.grossProfitAmount,
            )}`}
          >
            {delta.grossProfitAmountLabel}
          </p>

          <p
            className={`text-xs font-semibold ${valueTone(
              delta.grossProfitPercent,
            )}`}
          >
            {delta.grossProfitPercentLabel ??
              'Base sin comparativo'}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Margen
          </p>

          <p
            className={`mt-1 font-bold ${valueTone(
              delta.grossMarginPoints,
            )}`}
          >
            {delta.grossMarginPointsLabel ??
              'Sin dato'}
          </p>
        </div>
      </div>

      {showActivity && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div>
            <span className="text-xs text-slate-400">
              Clientes
            </span>

            <strong
              className={`ml-2 text-sm ${valueTone(
                delta.customersChange,
              )}`}
            >
              {delta.customersChangeLabel ??
                'Sin dato'}
            </strong>
          </div>

          <div>
            <span className="text-xs text-slate-400">
              Productos
            </span>

            <strong
              className={`ml-2 text-sm ${valueTone(
                delta.productsChange,
              )}`}
            >
              {delta.productsChangeLabel ??
                'Sin dato'}
            </strong>
          </div>
        </div>
      )}
    </article>
  )
}

function ProjectionCard({
  projection,
}: {
  projection: AnnualProjection | null
}) {
  if (!projection) {
    return (
      <article className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />

          <h3 className="font-semibold text-slate-800">
            Cierre proyectado
          </h3>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Histórico insuficiente para construir una
          proyección anual.
        </p>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />

            <h3 className="font-semibold text-slate-950">
              {projection.year} · PROYECTADO
            </h3>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Estacionalidad histórica:
            {' '}
            {projection.historicalYearsLabel}
          </p>
        </div>

        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
          Forecast
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <MetricRow
          emphasis
          label="Venta"
          value={projection.revenueLabel}
        />

        <MetricRow
          label="GP"
          value={projection.grossProfitLabel}
        />

        <MetricRow
          label="Margen"
          value={projection.grossMarginLabel}
        />
      </div>

      <div className="mt-5 rounded-xl border border-blue-100 bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Base de proyección
        </p>

        <div className="mt-2 flex justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Avance histórico de venta
          </span>

          <strong className="text-slate-800">
            {
              projection.historicalRevenueCompletionRatioLabel
            }
          </strong>
        </div>

        <div className="mt-1 flex justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Avance histórico de GP
          </span>

          <strong className="text-slate-800">
            {
              projection.historicalGrossProfitCompletionRatioLabel
            }
          </strong>
        </div>
      </div>
    </article>
  )
}

export function BrandCommercialComparisonPanel({
  comparison,
}: {
  comparison: CommercialComparison
}) {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ComparisonTab>(
      'monthly',
    )

  const currentYear =
    comparison.currentYear

  const previousYear =
    currentYear !== null
      ? currentYear - 1
      : null

  const twoYearsBack =
    currentYear !== null
      ? currentYear - 2
      : null

  const tabs: readonly {
    id: ComparisonTab
    label: string
    icon: typeof CalendarDays
  }[] = [
    {
      id: 'monthly',
      label: 'Mes equivalente',
      icon: CalendarDays,
    },
    {
      id: 'ytd',
      label: 'Acumulado YTD',
      icon: BarChart3,
    },
    {
      id: 'annual',
      label: 'Cierre anual',
      icon: TrendingUp,
    },
  ]

  return (
    <WorkspaceSection
      className="mt-6"
      icon={BarChart3}
      subtitle={comparison.description}
      title="Comparativo YoY y proyección anual"
      tone="blue"
    >
      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1.5">
        {tabs.map(
          ({
            id,
            label,
            icon: Icon,
          }) => (
            <button
              aria-pressed={
                activeTab === id
              }
              className={
                activeTab === id
                  ? 'flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm'
                  : 'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white/70 hover:text-slate-800'
              }
              key={id}
              onClick={() =>
                setActiveTab(id)
              }
              type="button"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ),
        )}
      </div>

      {activeTab === 'monthly' && (
        <div>
          <div className="grid gap-5 lg:grid-cols-3">
            <CommercialWindowCard
              badge="Actual"
              featured
              title={
                currentYear !== null
                  ? `${currentYear} · ACTUAL`
                  : 'Año actual'
              }
              window={
                comparison.monthly.current
              }
            />

            <CommercialWindowCard
              badge="Año -1"
              title={
                previousYear !== null
                  ? `${previousYear} · AÑO -1`
                  : 'Año -1'
              }
              window={
                comparison.monthly.previousYear
              }
            />

            <CommercialWindowCard
              badge="Año -2"
              title={
                twoYearsBack !== null
                  ? `${twoYearsBack} · AÑO -2`
                  : 'Año -2'
              }
              window={
                comparison.monthly.twoYearsBack
              }
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ComparisonDeltaCard
              delta={
                comparison.monthly.vsPreviousYear
              }
              title={
                currentYear !== null &&
                previousYear !== null
                  ? `${currentYear} vs ${previousYear}`
                  : 'Actual vs año anterior'
              }
            />

            <ComparisonDeltaCard
              delta={
                comparison.monthly.vsTwoYearsBack
              }
              title={
                currentYear !== null &&
                twoYearsBack !== null
                  ? `${currentYear} vs ${twoYearsBack}`
                  : 'Actual vs hace 2 años'
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'ytd' && (
        <div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-600">
            Acumulado desde enero hasta el mismo
            segmento laboral del periodo seleccionado.
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <CommercialWindowCard
              badge="Actual"
              featured
              title={
                currentYear !== null
                  ? `${currentYear} · YTD`
                  : 'YTD actual'
              }
              window={
                comparison.ytd.current
              }
            />

            <CommercialWindowCard
              badge="Año -1"
              title={
                previousYear !== null
                  ? `${previousYear} · YTD`
                  : 'YTD año -1'
              }
              window={
                comparison.ytd.previousYear
              }
            />

            <CommercialWindowCard
              badge="Año -2"
              title={
                twoYearsBack !== null
                  ? `${twoYearsBack} · YTD`
                  : 'YTD año -2'
              }
              window={
                comparison.ytd.twoYearsBack
              }
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ComparisonDeltaCard
              delta={
                comparison.ytd.vsPreviousYear
              }
              title={
                currentYear !== null &&
                previousYear !== null
                  ? `YTD ${currentYear} vs ${previousYear}`
                  : 'YTD vs año anterior'
              }
            />

            <ComparisonDeltaCard
              delta={
                comparison.ytd.vsTwoYearsBack
              }
              title={
                currentYear !== null &&
                twoYearsBack !== null
                  ? `YTD ${currentYear} vs ${twoYearsBack}`
                  : 'YTD vs hace 2 años'
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'annual' && (
        <div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">
              Proyección de cierre anual
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              El cierre proyectado utiliza el avance
              YTD actual y la proporción histórica que
              ese mismo segmento del año representó
              sobre los cierres reales disponibles.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <ProjectionCard
              projection={
                comparison.annual.projection
              }
            />

            <CommercialWindowCard
              badge="Real"
              showActivity={false}
              subtitle="Cierre real del ejercicio"
              title={
                previousYear !== null
                  ? `${previousYear} · REAL`
                  : 'Año anterior'
              }
              window={
                comparison.annual.previousYear
              }
            />

            <CommercialWindowCard
              badge="Real"
              showActivity={false}
              subtitle="Cierre real del ejercicio"
              title={
                twoYearsBack !== null
                  ? `${twoYearsBack} · REAL`
                  : 'Hace 2 años'
              }
              window={
                comparison.annual.twoYearsBack
              }
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ComparisonDeltaCard
              delta={
                comparison.annual.vsPreviousYear
              }
              showActivity={false}
              title={
                currentYear !== null &&
                previousYear !== null
                  ? `Proyección ${currentYear} vs cierre ${previousYear}`
                  : 'Proyección vs año anterior'
              }
            />

            <ComparisonDeltaCard
              delta={
                comparison.annual.vsTwoYearsBack
              }
              showActivity={false}
              title={
                currentYear !== null &&
                twoYearsBack !== null
                  ? `Proyección ${currentYear} vs cierre ${twoYearsBack}`
                  : 'Proyección vs hace 2 años'
              }
            />
          </div>
        </div>
      )}
    </WorkspaceSection>
  )
}