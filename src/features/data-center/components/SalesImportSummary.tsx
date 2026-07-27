import {
  BadgeDollarSign,
  Boxes,
  Building2,
  CalendarRange,
  FileText,
  MapPin,
  PackageSearch,
  Users,
} from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'
import { useDataCenterStore } from '../store/dataCenterStore'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    'es-MX',
  ).format(value)
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return 'Sin información'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      month: 'short',
      year: 'numeric',
    },
  ).format(date)
}

interface SummaryMetricProps {
  label: string
  value: string
  icon: React.ReactNode
}

function SummaryMetric({
  label,
  value,
  icon,
}: SummaryMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-4 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  )
}

export function SalesImportSummary() {
  const salesSummary =
    useDataCenterStore(
      (state) => state.salesSummary,
    )

  const activeReportType =
    useDataCenterStore(
      (state) => state.activeReportType,
    )

  const importStatus =
    useDataCenterStore(
      (state) => state.importStatus,
    )

  if (
    importStatus !== 'completed' ||
    activeReportType !== 'sales' ||
    !salesSummary
  ) {
    return null
  }

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Resumen ejecutivo de ventas"
        description="Indicadores generados por el pipeline de importación."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Venta total"
          value={formatCurrency(
            salesSummary.totalSales,
          )}
          icon={
            <BadgeDollarSign size={20} />
          }
        />

        <SummaryMetric
          label="GP total"
          value={formatCurrency(
            salesSummary.totalGrossProfit,
          )}
          icon={<Building2 size={20} />}
        />

        <SummaryMetric
          label="Margen"
          value={`${salesSummary.grossMargin.toFixed(
            2,
          )}%`}
          icon={
            <PackageSearch size={20} />
          }
        />

        <SummaryMetric
          label="Cantidad"
          value={formatNumber(
            salesSummary.totalQuantity,
          )}
          icon={<Boxes size={20} />}
        />

        <SummaryMetric
          label="Clientes"
          value={formatNumber(
            salesSummary.uniqueCustomers,
          )}
          icon={<Users size={20} />}
        />

        <SummaryMetric
          label="Productos"
          value={formatNumber(
            salesSummary.uniqueProducts,
          )}
          icon={
            <PackageSearch size={20} />
          }
        />

        <SummaryMetric
          label="Documentos"
          value={formatNumber(
            salesSummary.uniqueDocuments,
          )}
          icon={<FileText size={20} />}
        />

        <SummaryMetric
          label="Marcas"
          value={formatNumber(
            salesSummary.activeBrands,
          )}
          icon={<Building2 size={20} />}
        />

        <SummaryMetric
          label="Ubicaciones"
          value={formatNumber(
            salesSummary.activeLocations,
          )}
          icon={<MapPin size={20} />}
        />

        <SummaryMetric
          label="Filas procesadas"
          value={formatNumber(
            salesSummary.processedRows,
          )}
          icon={<FileText size={20} />}
        />

        <SummaryMetric
          label="Filas ignoradas"
          value={formatNumber(
            salesSummary.ignoredRows,
          )}
          icon={<FileText size={20} />}
        />

        <SummaryMetric
          label="Periodo"
          value={`${formatDate(
            salesSummary.periodStart,
          )} – ${formatDate(
            salesSummary.periodEnd,
          )}`}
          icon={
            <CalendarRange size={20} />
          }
        />
      </div>
    </AtlasCard>
  )
}