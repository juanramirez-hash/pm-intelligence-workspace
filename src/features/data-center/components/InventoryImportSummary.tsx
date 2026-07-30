import {
  Boxes,
  Building2,
  CalendarDays,
  CircleAlert,
  PackageCheck,
  WalletCards,
} from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'
import { useDataCenterStore } from '../store/dataCenterStore'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function InventoryImportSummary() {
  const activeReportType = useDataCenterStore(
    (state) => state.activeReportType,
  )
  const importStatus = useDataCenterStore(
    (state) => state.importStatus,
  )
  const summary = useDataCenterStore(
    (state) => state.inventorySummary,
  )

  if (
    activeReportType !== 'inventory' ||
    importStatus !== 'completed' ||
    !summary
  ) {
    return null
  }

  const cards = [
    {
      label: 'Posiciones',
      value: formatNumber(summary.totalPositions),
      detail: `${formatNumber(summary.processedRows)} filas procesadas`,
      icon: Boxes,
    },
    {
      label: 'Productos',
      value: formatNumber(summary.uniqueProducts),
      detail: `${formatNumber(summary.uniqueLocations)} ubicaciones`,
      icon: PackageCheck,
    },
    {
      label: 'Existencia',
      value: formatNumber(summary.totalOnHand),
      detail: `Disponible: ${formatNumber(summary.totalAvailable)}`,
      icon: Building2,
    },
    {
      label: 'Valor',
      value: formatMoney(summary.totalInventoryValue),
      detail: `En tránsito: ${formatNumber(summary.totalInTransit)}`,
      icon: WalletCards,
    },
    {
      label: 'Periodo',
      value: summary.periodEnd ?? 'Sin fecha',
      detail: summary.periodStart && summary.periodStart !== summary.periodEnd
        ? `Desde ${summary.periodStart}`
        : 'Corte importado',
      icon: CalendarDays,
    },
    {
      label: 'Alertas de carga',
      value: formatNumber(
        summary.negativeStockRows + summary.duplicatePositions,
      ),
      detail: `${summary.negativeStockRows} negativos · ${summary.duplicatePositions} duplicados`,
      icon: CircleAlert,
    },
  ]

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Resumen de inventario"
        description="Validación inicial del corte antes de construir Inventory Workspace."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <Icon size={18} className="text-blue-600" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {value}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {detail}
            </p>
          </div>
        ))}
      </div>
    </AtlasCard>
  )
}
