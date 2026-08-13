import {
  AlertTriangle,
  PackageSearch,
  ShoppingCart,
  Truck,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

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
  PurchasingInventoryItem,
} from '../../../core/business/analytics/purchasingInventory'

import {
  PurchasingInventoryTable,
} from './PurchasingInventoryTable'

interface PurchasingInventorySummaryProps {
  report:
    PurchasingInventoryAnalyticsReport | null
}

type PurchasingInventoryView =
  | 'without_open_po'
  | 'overdue_po'
  | 'with_open_po'
  | 'no_available_stock'

const viewLabels:
  Record<
    PurchasingInventoryView,
    string
  > = {
    without_open_po:
      'Sin PO abierta',
    overdue_po:
      'PO vencida',
    with_open_po:
      'Con PO abierta',
    no_available_stock:
      'Sin disponibilidad',
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

function matchesView(
  item: PurchasingInventoryItem,
  view: PurchasingInventoryView,
): boolean {
  const hasNoAvailableStock =
    item.hasInventory &&
    item.inventory.available <= 0

  if (!hasNoAvailableStock) {
    return false
  }

  if (
    view ===
    'without_open_po'
  ) {
    return (
      item.purchasing
        .openPurchaseOrders ===
      0
    )
  }

  if (
    view ===
    'overdue_po'
  ) {
    return (
      item.purchasing
        .overduePurchaseOrders >
      0
    )
  }

  if (
    view ===
    'with_open_po'
  ) {
    return (
      item.purchasing
        .openPurchaseOrders >
      0
    )
  }

  return true
}

export function PurchasingInventorySummary({
  report,
}: PurchasingInventorySummaryProps) {
  const [
    activeView,
    setActiveView,
  ] =
    useState<PurchasingInventoryView>(
      'without_open_po',
    )

  const filteredItems =
    useMemo(() => {
      if (!report) {
        return []
      }

      return report.items.filter(
        (item) =>
          matchesView(
            item,
            activeView,
          ),
      )
    }, [
      report,
      activeView,
    ])

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

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Detalle operativo por artículo
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {
                formatNumber(
                  filteredItems.length,
                )
              } artículos en {
                viewLabels[
                  activeView
                ].toLowerCase()
              }
            </p>
          </div>

          <div className="flex flex-wrap rounded-xl bg-slate-100 p-1">
            {(
              Object.keys(
                viewLabels,
              ) as PurchasingInventoryView[]
            ).map(
              (view) => (
                <button
                  className={[
                    'rounded-lg px-3 py-2 text-xs font-semibold transition',
                    activeView === view
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                  key={view}
                  onClick={() =>
                    setActiveView(
                      view,
                    )
                  }
                  type="button"
                >
                  {
                    viewLabels[
                      view
                    ]
                  }
                </button>
              ),
            )}
          </div>
        </div>

        <div className="mt-4">
          <PurchasingInventoryTable
            emptyMessage="No hay artículos para este criterio en el corte actual."
            items={
              filteredItems.slice(
                0,
                100,
              )
            }
          />

          {filteredItems.length >
            100 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Se muestran los primeros 100 artículos de este criterio.
            </p>
          )}
        </div>
      </div>
    </WorkspaceSection>
  )
}