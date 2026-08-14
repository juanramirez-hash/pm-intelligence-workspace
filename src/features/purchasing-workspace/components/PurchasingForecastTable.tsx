import type {
  PurchasingForecastItem,
} from '../../../core/business/analytics/purchasingForecast'

interface PurchasingForecastTableProps {
  items:
    readonly PurchasingForecastItem[]
  emptyMessage?: string
}

function formatNumber(
  value: number,
): string {
  return value.toLocaleString(
    'es-MX',
    {
      maximumFractionDigits: 1,
    },
  )
}

function formatCoverage(
  value: number | null,
): string {
  if (value === null) {
    return 'N/D'
  }

  return `${value.toLocaleString(
    'es-MX',
    {
      maximumFractionDigits: 2,
    },
  )} meses`
}

function joinLabels(
  values: readonly string[],
  fallback: string,
): string {
  return values.length > 0
    ? values.join(', ')
    : fallback
}

export function PurchasingForecastTable({
  items,
  emptyMessage =
    'No hay revisiones de posible sobreabastecimiento.',
}: PurchasingForecastTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1320px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-3 py-3 font-semibold">
              Artículo
            </th>

            <th className="px-3 py-3 font-semibold">
              Marca
            </th>

            <th className="px-3 py-3 text-right font-semibold">
              Disponible
            </th>

            <th className="px-3 py-3 text-right font-semibold">
              Cobertura
            </th>

            <th className="px-3 py-3 text-right font-semibold">
              Forecast
            </th>

            <th className="px-3 py-3 text-right font-semibold">
              PO abiertas
            </th>

            <th className="px-3 py-3 text-right font-semibold">
              Cantidad PO nominal
            </th>

            <th className="px-3 py-3 text-right font-semibold">
              PO vencidas
            </th>

            <th className="px-3 py-3 font-semibold">
              Proveedor
            </th>

            <th className="px-3 py-3 font-semibold">
              Comprador
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr
              className="border-b border-slate-100"
              key={item.productId}
            >
              <td className="px-3 py-3">
                <p className="font-semibold text-slate-900">
                  {item.itemCode}
                </p>

                {item.productName &&
                  item.productName !==
                    item.itemCode && (
                  <p className="mt-1 text-xs text-slate-400">
                    {item.productName}
                  </p>
                )}
              </td>

              <td className="px-3 py-3 text-slate-700">
                {item.brandId ??
                  'Sin marca'}
              </td>

              <td className="px-3 py-3 text-right font-semibold text-slate-900">
                {formatNumber(
                  item.forecast
                    .inventory.available,
                )}
              </td>

              <td className="px-3 py-3 text-right font-semibold text-amber-700">
                {formatCoverage(
                  item.forecast
                    .coverage.availableMonths,
                )}
              </td>

              <td className="px-3 py-3 text-right text-slate-700">
                {item.forecast
                  .demand.expectedQuantity ===
                null
                  ? 'N/D'
                  : formatNumber(
                      item.forecast
                        .demand.expectedQuantity,
                    )}
              </td>

              <td className="px-3 py-3 text-right text-slate-700">
                {
                  item.purchasing
                    .openPurchaseOrders
                }
              </td>

              <td className="px-3 py-3 text-right font-semibold text-slate-900">
                {formatNumber(
                  item.purchasing
                    .openPurchaseOrderQuantity,
                )}
              </td>

              <td className="px-3 py-3 text-right text-rose-600">
                {
                  item.purchasing
                    .overduePurchaseOrders
                }
              </td>

              <td className="max-w-[220px] px-3 py-3 text-slate-700">
                {joinLabels(
                  item.purchasing.suppliers,
                  'Sin proveedor',
                )}
              </td>

              <td className="max-w-[220px] px-3 py-3 text-slate-700">
                {joinLabels(
                  item.purchasing.buyers,
                  'Sin comprador',
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}