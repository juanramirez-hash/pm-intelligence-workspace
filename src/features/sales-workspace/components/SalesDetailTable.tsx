import {
  Rows3,
} from 'lucide-react'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  SalesWorkspaceDetailRow,
} from '../types'

import {
  formatSalesCurrency,
  formatSalesInteger,
  formatSalesPercentage,
} from '../utils'

interface SalesDetailTableProps {
  items: SalesWorkspaceDetailRow[]
  totalRows: number
  sourceRows: number
}

export function SalesDetailTable({
  items,
  totalRows,
  sourceRows,
}: SalesDetailTableProps) {
  return (
    <ExecutivePanel
      count={`${formatSalesInteger(items.length)} de ${formatSalesInteger(totalRows)}`}
      footer={
        totalRows > items.length
          ? `Se muestran las ${formatSalesInteger(items.length)} combinaciones con mayor venta. El segmento contiene ${formatSalesInteger(sourceRows)} filas normalizadas.`
          : `Detalle completo del segmento: ${formatSalesInteger(sourceRows)} filas normalizadas.`
      }
      icon={<Rows3 size={19} />}
      subtitle="Grano comercial por periodo, marca, cliente, producto, ubicación y vendedor."
      title="Detalle de ventas segmentado"
    >
      {items.length === 0 ? (
        <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
          No existen combinaciones para los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3 text-right">Venta</th>
                <th className="px-4 py-3 text-right">GP</th>
                <th className="px-4 py-3 text-right">Margen</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Docs.</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item) => (
                <tr
                  className="align-top transition hover:bg-blue-50/30"
                  key={item.id}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                    {item.periodId}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {item.brandLabel}
                  </td>
                  <td className="max-w-64 px-4 py-3 text-slate-700">
                    <span className="line-clamp-2">
                      {item.customerLabel}
                    </span>
                  </td>
                  <td className="max-w-56 px-4 py-3 text-slate-700">
                    <span className="line-clamp-2">
                      {item.productLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.locationLabel}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.salesRepresentativeLabel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                    {formatSalesCurrency(item.revenue)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatSalesCurrency(item.grossProfit)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatSalesPercentage(item.grossMargin)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatSalesInteger(item.quantity)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatSalesInteger(item.documents)}
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
