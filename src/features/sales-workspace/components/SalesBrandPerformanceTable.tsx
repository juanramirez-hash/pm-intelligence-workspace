import {
  ListChecks,
} from 'lucide-react'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  SalesPerformanceStatus,
  SalesWorkspaceBrandPerformanceItem,
} from '../types'

import {
  formatSalesCurrency,
  formatSalesPercentage,
} from '../utils'

interface SalesBrandPerformanceTableProps {
  items: SalesWorkspaceBrandPerformanceItem[]
}

const statusLabels: Record<
  SalesPerformanceStatus,
  string
> = {
  'not-evaluable': 'No evaluable',
  'behind-plan': 'Debajo',
  'on-plan': 'En ritmo',
  'ahead-of-plan': 'Adelantado',
  achieved: 'Alcanzado',
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

export function SalesBrandPerformanceTable({
  items,
}: SalesBrandPerformanceTableProps) {
  const visibleItems =
    items.slice(0, 12)

  return (
    <ExecutivePanel
      count={`${visibleItems.length}/${items.length}`}
      icon={<ListChecks size={19} />}
      subtitle="Prioriza las marcas con mayor rezago frente al avance esperado por día laboral."
      title="Brecha de objetivos por marca"
      tone="intelligence"
    >
      {items.length === 0 ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
          No existen objetivos de marca para el periodo seleccionado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                <th className="border-b border-slate-100 px-3 pb-3">Marca</th>
                <th className="border-b border-slate-100 px-3 pb-3 text-right">Venta / objetivo</th>
                <th className="border-b border-slate-100 px-3 pb-3 text-right">Cumplimiento</th>
                <th className="border-b border-slate-100 px-3 pb-3 text-right">Brecha al ritmo</th>
                <th className="border-b border-slate-100 px-3 pb-3 text-right">Proyección</th>
                <th className="border-b border-slate-100 px-3 pb-3 text-right">Margen</th>
                <th className="border-b border-slate-100 px-3 pb-3 text-right">Estado</th>
              </tr>
            </thead>

            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.brandId}>
                  <td className="border-b border-slate-100 px-3 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.brandName}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {item.brandId}
                    </p>
                  </td>

                  <td className="border-b border-slate-100 px-3 py-4 text-right text-xs tabular-nums text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {formatSalesCurrency(item.actualRevenue)}
                    </p>

                    <p className="mt-1 text-slate-400">
                      {item.targetRevenue === null
                        ? 'Sin objetivo'
                        : formatSalesCurrency(item.targetRevenue)}
                    </p>
                  </td>

                  <td className="border-b border-slate-100 px-3 py-4 text-right text-xs font-semibold tabular-nums text-slate-700">
                    {formatSalesPercentage(item.attainment)}
                  </td>

                  <td className={[
                    'border-b border-slate-100 px-3 py-4 text-right text-xs font-semibold tabular-nums',
                    (item.varianceToPlan ?? 0) < 0
                      ? 'text-rose-600'
                      : 'text-emerald-600',
                  ].join(' ')}>
                    {item.varianceToPlan === null
                      ? 'No disponible'
                      : formatSalesCurrency(item.varianceToPlan)}
                  </td>

                  <td className="border-b border-slate-100 px-3 py-4 text-right text-xs tabular-nums text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {item.projectedRevenue === null
                        ? 'No disponible'
                        : formatSalesCurrency(item.projectedRevenue)}
                    </p>

                    <p className="mt-1 text-slate-400">
                      {formatSalesPercentage(item.projectedAttainment)}
                    </p>
                  </td>

                  <td className="border-b border-slate-100 px-3 py-4 text-right text-xs tabular-nums text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {formatSalesPercentage(item.currentGrossMargin)}
                    </p>

                    <p className="mt-1 text-slate-400">
                      {item.marginVariancePoints === null
                        ? 'Sin objetivo'
                        : formatSalesPercentage(item.marginVariancePoints, {
                            signed: true,
                            suffix: ' pp',
                          })}
                    </p>
                  </td>

                  <td className="border-b border-slate-100 px-3 py-4 text-right">
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        getStatusClass(item.status),
                      ].join(' ')}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ExecutivePanel>
  )
}
