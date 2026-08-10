import type {
  BusinessPurchaseOrder,
} from '../../../core/business/entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../../../core/business/entities/purchaseRequest'

import type {
  PurchasingAnalyticsGroup,
} from '../../../core/business/analytics/purchasing'

function formatCurrency(
  value: number,
): string {
  return value.toLocaleString(
    'es-MX',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    },
  )
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

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return 'Sin fecha'
  }

  return value.slice(0, 10)
}

interface PurchasingRankingTableProps {
  groups:
    readonly PurchasingAnalyticsGroup[]
  onSelect?:
    (
      group:
        PurchasingAnalyticsGroup,
    ) => void
}

export function PurchasingRankingTable({
  groups,
  onSelect,
}: PurchasingRankingTableProps) {
  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No hay datos para esta dimensión.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-3 py-3 font-semibold">Dimensión\</th>
            <th className="px-3 py-3 text-right font-semibold">PO</th>
            <th className="px-3 py-3 text-right font-semibold">SC</th>
            <th className="px-3 py-3 text-right font-semibold">Cantidad PO</th>
            <th className="px-3 py-3 text-right font-semibold">Monto</th>
            <th className="px-3 py-3 text-right font-semibold">Vencidas</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr
              className={[
                'border-b border-slate-100',
                onSelect
                  ? 'cursor-pointer transition hover:bg-slate-50'
                  : '',
              ].join(' ')}
              key={group.key}
              onClick={() => onSelect?.(group)}
            >
              <td className="px-3 py-3">
                <p className="font-semibold text-slate-900">{group.label}</p>
                <p className="mt-1 text-xs text-slate-400">{group.key}</p>
              </td>
              <td className="px-3 py-3 text-right text-slate-700">{group.purchaseOrders}</td>
              <td className="px-3 py-3 text-right text-slate-700">{group.purchaseRequests}</td>
              <td className="px-3 py-3 text-right text-slate-700">{formatNumber(group.orderedQuantity)}</td>
              <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatCurrency(group.orderedAmountForeignCurrency)}</td>
              <td className="px-3 py-3 text-right text-rose-600">{group.overduePurchaseOrders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface PurchaseOrderTableProps {
  orders:
    readonly BusinessPurchaseOrder[]
}

export function PurchaseOrderTable({
  orders,
}: PurchaseOrderTableProps) {
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No hay ordenes de compra para los filtros actuales.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w[[980px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-3 py-3 font-semibold">PO</th>
            <th className="px-3 py-3 font-semibold">Proveedor</th>
            <th className="px-3 py-3 font-semibold">Comprador</th>
            <th className="px-3 py-3 font-semibold">Estado</th>
            <th className="px-3 py-3 font-semibold">Fecha PO</th>
            <th className="px-3 py-3 font-semibold">Recepción esperada</th>
            <th className="px-3 py-3 text-right font-semibold">Cantidad</th>
            <th className="px-3 py-3 text-right font-semibold">Monto</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr className="border-b border-slate-100" key={order.id}>
              <td className="px-3 py-3 font-semibold text-slate-900">{order.purchaseOrderNumber}</td>
              <td className="px-3 py-3 text-slate-700">{order.supplierName ?? order.supplierId ?? 'Sin proveedor'}</td>
              <td className="px-3 py-3 text-slate-700">{order.purchasingExecutive ?? 'Sin comprador'}</td>
              <td className="px-3 py-3 text-slate-700">{order.status ?? 'Sin estado'}</td>
              <td className="px-3 py-3 text-slate-600">{formatDate(order.purchaseOrderDate)}</td>
              <td className="px-3 py-3 text-slate-600">{formatDate(order.expectedReceiptDate)}</td>
              <td className="px-3 py-3 text-right text-slate-700">{formatNumber(order.quantity)}</td>
              <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatCurrency(order.amountForeignCurrency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface PurchaseRequestTableProps {
  requests:
    readonly BusinessPurchaseRequest[]
}

export function PurchaseRequestTable({
  requests,
}: PurchaseRequestTableProps) {
  if (requests.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No hay solicitudes de compra para los filtros actuales.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w[[1100px]] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-3 py-3 font-semibold">SC</th>
            <th className="px-3 py-3 font-semibold">PO relacionada</th>
            <th className="px-3 py-3 font-semibold">Orden venta</th>
            <th className="px-3 py-3 font-semibold">Artículo</th>
            <th className="px-3 py-3 font-semibold">Marca</th>
            <th className="px-3 py-3 font-semibold">Comprador</th>
            <th className="px-3 py-3 font-semibold">Estado</th>
            <th className="px-3 py-3 text-right font-semibold">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr className="border-b border-slate-100" key={request.id}>
              <td className="px-3 py-3 font-semibold text-slate-900">{request.purchaseRequestNumber}</td>
              <td className="px-3 py-3 text-slate-700">{request.relatedPurchaseOrderNumber ?? 'Sin PO'}</td>
              <td className="px-3 py-3 text-slate-700">{request.salesOrderNumber ?? 'Sin OV'}</td>
              <td className="px-3 py-3 text-slate-700">{request.itemCode ?? 'Sin artículo'}</td>
              <td className="px-3 py-3 text-slate-700">{request.brandId ?? 'Sin marca'}</td>
              <td className="px-3 py-3 text-slate-700">{request.assignedBuyer ?? 'Sin comprador'}</td>
              <td className="px-3 py-3 text-slate-700">{request.requestStatus ?? 'Sin estado'}</td>
              <td className="px-3 py-3 text-right text-slate-700">{formatNumber(request.quantity ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}