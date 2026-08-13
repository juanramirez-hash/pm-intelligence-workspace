import {
  AlertTriangle,
  PackageSearch,
  ShoppingCart,
  Truck,
} from 'lucide-react'

import {
  KpiCard,
} from '../../../components/business/kpi'

import {
  WorkspaceGrid,
} from '../../../components/workspace/grid'

import {
  WorkspaceSection,
} from '../../../components/workspace/section'

import type {
  PurchasingInventoryAnalyticsReport,
} from '../../../core/business/analytics/purchasingInventory'

interface PurchasingInventorySummaryProps {
  report:
    PurchasingInventoryAnalyticsReport | null
}

function formatNumber(
  value: number,
): string {
  return value.toLocaleString(
    'es-MX',
    {
      maximumFractionDigits: 0,
    },
  )
}

export function PurchasingInventorySummary({
  report,
}: PurchasingInventorySummaryProps) {
  if (!report) {
    return null
  }

  const summary =
    report.summary

  const quality =
    report.quality

  const nonLinkableRecords =
    quality.inventoryPositionsWithoutProductCode +
    quality.purchaseOrderLinesWithoutItemCode +
    quality.purchaseRequestsWithoutItemCode

  const snapshotLabel =
    report.snapshotDate
      ? `Corte ${report.snapshotDate}`
      : 'Corte actual sin fecha'

  return (
    <WorkspaceSection
      className="mt-5"
      icon={PackageSearch}
      subtitle={`${snapshotLabel} · ${formatNumber(summary.items)} artículos enlazables · independiente de los filtros de compras`}
      title="Inventario + abastecimiento"
      tone="slate"
    >
      <WorkspaceGrid
        columns={4}
      >
        <KpiCard
          icon={PackageSearch}
          subtitle="Artículos con inventario y disponibilidad ≤ 0"
          title="Sin disponibilidad"
          tone="amber"
          value={
            summary.itemsWithNoAvailableStock
          }
        />

        <KpiCard
          icon={AlertTriangle}
          subtitle="Sin disponibilidad y sin PO abierta; requiere revisión de abastecimiento"
          title="Sin PO abierta"
          tone="rose"
          value={
            summary.itemsWithNoAvailableStockAndNoOpenPurchaseOrder
          }
        />

        <KpiCard
          icon={ShoppingCart}
          subtitle="Sin disponibilidad con abastecimiento actualmente abierto"
          title="Con PO abierta"
          tone="blue"
          value={
            summary.itemsWithNoAvailableStockAndOpenPurchaseOrder
          }
        />

        <KpiCard
          icon={Truck}
          subtitle="Sin disponibilidad y con al menos una PO abierta vencida"
          title="PO vencida"
          tone="amber"
          value={
            summary.itemsWithNoAvailableStockAndOverduePurchaseOrder
          }
        />
      </WorkspaceGrid>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
        <span>
          {formatNumber(
            summary.itemsWithInventory,
          )} artículos con inventario
        </span>

        <span>
          {formatNumber(
            summary.itemsWithPurchasing,
          )} artículos con evidencia de compras
        </span>

        <span>
          {formatNumber(
            summary.itemsWithOpenPurchaseOrders,
          )} artículos con PO abierta
        </span>

        <span>
          {formatNumber(
            summary.itemsWithOverduePurchaseOrders,
          )} artículos con PO vencida
        </span>

        <span>
          {formatNumber(
            nonLinkableRecords,
          )} registros sin código enlazable
        </span>
      </div>
    </WorkspaceSection>
  )
}