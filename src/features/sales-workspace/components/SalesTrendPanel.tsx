import {
  ChartNoAxesCombined,
} from 'lucide-react'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  SalesWorkspaceTrendItem,
} from '../types'

import {
  formatSalesCurrency,
  formatSalesPercentage,
} from '../utils'

interface SalesTrendPanelProps {
  trend: SalesWorkspaceTrendItem[]
}

export function SalesTrendPanel({
  trend,
}: SalesTrendPanelProps) {
  const maximumRevenue =
    Math.max(
      ...trend.map(
        (item) => item.revenue,
      ),
      0,
    )

  return (
    <ExecutivePanel
      className="h-full"
      count={`${trend.length} periodos`}
      icon={
        <ChartNoAxesCombined
          size={19}
        />
      }
      subtitle="Evolución mensual hasta el periodo seleccionado."
      title="Tendencia de ventas"
      tone="intelligence"
    >
      {trend.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
          Importa ventas para construir la tendencia mensual.
        </div>
      ) : (
        <div
          aria-label="Tendencia mensual de ventas"
          className="space-y-3"
          role="list"
        >
          {trend.map((item) => {
            const width =
              maximumRevenue > 0
                ? Math.max(
                    4,
                    (
                      item.revenue /
                      maximumRevenue
                    ) * 100,
                  )
                : 0

            return (
              <article
                className="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_8.5rem] sm:items-center"
                key={item.periodId}
                role="listitem"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-700">
                    {item.periodLabel}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Margen {formatSalesPercentage(item.grossMargin)}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{
                      width: `${width}%`,
                    }}
                  />
                </div>

                <p className="text-right text-xs font-semibold tabular-nums text-slate-800">
                  {formatSalesCurrency(item.revenue)}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </ExecutivePanel>
  )
}
