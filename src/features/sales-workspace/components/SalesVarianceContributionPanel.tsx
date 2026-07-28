import {
  useState,
} from 'react'

import type {
  LucideIcon,
} from 'lucide-react'

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Package,
  Users,
} from 'lucide-react'

import type {
  SalesContributionBreakdown,
  SalesContributionItem,
  SalesCustomerMovementStatus,
  SalesVarianceContributionAnalysis,
  SalesVarianceDimension,
} from '../types'

import {
  formatSalesCurrency,
  formatSalesInteger,
  formatSalesPercentage,
} from '../utils'

const dimensionPresentation:
Record<
  SalesVarianceDimension,
  {
    label: string
    icon: LucideIcon
  }
> = {
  brand: {
    label: 'Marcas',
    icon: Building2,
  },
  customer: {
    label: 'Clientes',
    icon: Users,
  },
  product: {
    label: 'Productos',
    icon: Package,
  },
}

const customerStatusPresentation:
Record<
  SalesCustomerMovementStatus,
  {
    label: string
    classes: string
  }
> = {
  new: {
    label: 'Nuevo',
    classes: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  recovered: {
    label: 'Recuperado',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  growing: {
    label: 'Crecimiento',
    classes: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  declining: {
    label: 'En baja',
    classes: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  lost: {
    label: 'Perdido',
    classes: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  stable: {
    label: 'Estable',
    classes: 'bg-slate-50 text-slate-600 ring-slate-200',
  },
}

function signedCurrency(
  value: number,
): string {
  if (value === 0) {
    return formatSalesCurrency(0)
  }

  return `${value > 0 ? '+' : '-'}${formatSalesCurrency(Math.abs(value))}`
}

function signedInteger(
  value: number,
): string {
  if (value === 0) {
    return '0'
  }

  return `${value > 0 ? '+' : '-'}${formatSalesInteger(Math.abs(value))}`
}

function ContributionItem({
  item,
}: {
  item: SalesContributionItem
}) {
  const positive =
    item.direction === 'positive'

  const Icon = positive
    ? ArrowUpRight
    : ArrowDownRight

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {item.label}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatSalesPercentage(item.movementShare)} del movimiento absoluto
          </p>
        </div>

        <span
          className={[
            'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
            positive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700',
          ].join(' ')}
        >
          <Icon size={14} />
          {signedCurrency(item.revenueVariation)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-slate-400">Venta actual</p>
          <p className="mt-1 font-semibold text-slate-700">
            {formatSalesCurrency(item.currentRevenue)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-slate-400">Periodo base</p>
          <p className="mt-1 font-semibold text-slate-700">
            {formatSalesCurrency(item.comparisonRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
        <span className="rounded-full border border-slate-200 px-2.5 py-1">
          Mix {formatSalesPercentage(item.mixVariationPoints, {
            signed: true,
            suffix: ' pp',
          })}
        </span>
        <span className="rounded-full border border-slate-200 px-2.5 py-1">
          GP {signedCurrency(item.grossProfitVariation)}
        </span>
        <span className="rounded-full border border-slate-200 px-2.5 py-1">
          Cantidad {signedInteger(item.quantityVariation)}
        </span>
      </div>
    </article>
  )
}

function ContributionColumn({
  title,
  subtitle,
  items,
  total,
  positive,
}: {
  title: string
  subtitle: string
  items: SalesContributionItem[]
  total: number
  positive: boolean
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={[
              'text-xs font-semibold uppercase tracking-[0.14em]',
              positive
                ? 'text-emerald-700'
                : 'text-rose-700',
            ].join(' ')}
          >
            {title}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <p
          className={[
            'text-base font-bold',
            positive
              ? 'text-emerald-700'
              : 'text-rose-700',
          ].join(' ')}
        >
          {positive
            ? signedCurrency(total)
            : signedCurrency(-total)}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <ContributionItem
              item={item}
              key={item.id}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Sin contribuciones relevantes.
          </div>
        )}
      </div>
    </div>
  )
}

function getBreakdown(
  analysis: SalesVarianceContributionAnalysis,
  dimension: SalesVarianceDimension,
): SalesContributionBreakdown {
  switch (dimension) {
    case 'brand':
      return analysis.brands
    case 'customer':
      return analysis.customers
    case 'product':
      return analysis.products
  }
}

export function SalesVarianceContributionPanel({
  analysis,
}: {
  analysis: SalesVarianceContributionAnalysis
}) {
  const [dimension, setDimension] =
    useState<SalesVarianceDimension>('brand')

  const breakdown =
    getBreakdown(
      analysis,
      dimension,
    )

  if (!analysis.available) {
    return (
      <section
        className="rounded-[28px] border border-slate-200 bg-white p-6"
        data-atlas-component="sales-variance-contribution-panel"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Variance & Contribution Analysis
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Explicación de la variación comercial
        </h2>
        <p className="mt-3 text-sm text-slate-500">
          {analysis.unavailableReason}
        </p>
      </section>
    )
  }

  const movement =
    analysis.customerMovements

  return (
    <section
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-6"
      data-atlas-component="sales-variance-contribution-panel"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-700">
            <BarChart3 size={18} />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              Variance & Contribution Analysis
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Qué explica el cambio de venta
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Descompone la variación contra {analysis.comparisonLabel.toLowerCase()} en impulsores positivos, deterioros, cambios de mezcla y movimientos de clientes.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[38rem] xl:grid-cols-4">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Variación neta
            </p>
            <p className={[
              'mt-1 text-base font-bold',
              analysis.netRevenueVariation >= 0
                ? 'text-emerald-700'
                : 'text-rose-700',
            ].join(' ')}>
              {signedCurrency(analysis.netRevenueVariation)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Impulso positivo
            </p>
            <p className="mt-1 text-base font-bold text-emerald-700">
              {signedCurrency(analysis.positiveRevenueContribution)}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Deterioro
            </p>
            <p className="mt-1 text-base font-bold text-rose-700">
              {signedCurrency(-analysis.negativeRevenueContribution)}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Margen
            </p>
            <p className={[
              'mt-1 text-base font-bold',
              analysis.grossMargin.pointVariation >= 0
                ? 'text-emerald-700'
                : 'text-rose-700',
            ].join(' ')}>
              {formatSalesPercentage(
                analysis.grossMargin.pointVariation,
                {
                  signed: true,
                  suffix: ' pp',
                },
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Venta
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {signedCurrency(analysis.revenue.absoluteVariation)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatSalesPercentage(analysis.revenue.percentageVariation, {
              signed: true,
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Gross Profit
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {signedCurrency(analysis.grossProfit.absoluteVariation)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatSalesPercentage(analysis.grossProfit.percentageVariation, {
              signed: true,
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Cantidad
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {signedInteger(analysis.quantity.absoluteVariation)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatSalesPercentage(analysis.quantity.percentageVariation, {
              signed: true,
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Documentos
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {signedInteger(analysis.documents.absoluteVariation)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatSalesPercentage(analysis.documents.percentageVariation, {
              signed: true,
            })}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(dimensionPresentation) as SalesVarianceDimension[]).map((item) => {
          const presentation =
            dimensionPresentation[item]
          const Icon = presentation.icon
          const active = item === dimension

          return (
            <button
              className={[
                'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition',
                active
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
              key={item}
              onClick={() => setDimension(item)}
              type="button"
            >
              <Icon size={15} />
              {presentation.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ContributionColumn
          items={breakdown.positive}
          positive
          subtitle="Entidades que elevaron la venta contra el periodo base."
          title="Contribución positiva"
          total={breakdown.positiveContribution}
        />

        <ContributionColumn
          items={breakdown.negative}
          positive={false}
          subtitle="Entidades que redujeron la venta contra el periodo base."
          title="Contribución negativa"
          total={breakdown.negativeContribution}
        />
      </div>

      <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Movimiento de clientes
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">
              Altas, recuperaciones, bajas y pérdidas
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
              Nuevos {movement.newCount}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              Recuperados {movement.recoveredCount}
            </span>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-700">
              Crecen {movement.growingCount}
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
              En baja {movement.decliningCount}
            </span>
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
              Perdidos {movement.lostCount}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {movement.items.slice(0, 9).map((item) => {
            const presentation =
              customerStatusPresentation[item.status]

            return (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-3.5"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-bold text-slate-900">
                    {item.label}
                  </p>
                  <span
                    className={[
                      'shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset',
                      presentation.classes,
                    ].join(' ')}
                  >
                    {presentation.label}
                  </span>
                </div>

                <p className={[
                  'mt-3 text-base font-bold',
                  item.revenueVariation >= 0
                    ? 'text-emerald-700'
                    : 'text-rose-700',
                ].join(' ')}>
                  {signedCurrency(item.revenueVariation)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Actual {formatSalesCurrency(item.currentRevenue)} · Base {formatSalesCurrency(item.comparisonRevenue)}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
