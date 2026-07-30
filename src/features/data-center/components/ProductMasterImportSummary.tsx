import {
  AlertTriangle,
  Boxes,
  Building2,
  CircleCheckBig,
  Copy,
  PackageSearch,
  Rows3,
} from 'lucide-react'

import {
  AtlasCard,
} from '../../../atlas/components/AtlasCard'

import {
  SectionHeader,
} from '../../../atlas/layout/SectionHeader'

import {
  useDataCenterStore,
} from '../store/dataCenterStore'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

interface SummaryMetricProps {
  label: string
  value: string
  icon: React.ReactNode
  tone?: 'neutral' | 'positive' | 'attention'
}

function SummaryMetric({
  label,
  value,
  icon,
  tone = 'neutral',
}: SummaryMetricProps) {
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-600',
    positive: 'bg-emerald-50 text-emerald-700',
    attention: 'bg-amber-50 text-amber-700',
  }[tone]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${toneClass}`}>
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

export function ProductMasterImportSummary() {
  const summary = useDataCenterStore(
    (state) => state.productMasterSummary,
  )

  const activeReportType = useDataCenterStore(
    (state) => state.activeReportType,
  )

  const importStatus = useDataCenterStore(
    (state) => state.importStatus,
  )

  if (
    importStatus !== 'completed' ||
    activeReportType !== 'products' ||
    !summary
  ) {
    return null
  }

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Resumen de Product Master"
        description="Catalogo ERP listo para conciliacion y analitica de identidad."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Productos procesados"
          value={formatNumber(summary.totalProducts)}
          icon={<Rows3 size={20} />}
          tone="positive"
        />
        <SummaryMetric
          label="Productos activos"
          value={formatNumber(summary.activeProducts)}
          icon={<CircleCheckBig size={20} />}
          tone="positive"
        />
        <SummaryMetric
          label="Marcas"
          value={formatNumber(summary.uniqueBrands)}
          icon={<Building2 size={20} />}
        />
        <SummaryMetric
          label="Con inventario"
          value={formatNumber(summary.productsWithInventory)}
          icon={<Boxes size={20} />}
        />
        <SummaryMetric
          label="Names duplicados"
          value={formatNumber(summary.duplicateNames ?? summary.duplicateCodes)}
          icon={<Copy size={20} />}
          tone={(summary.duplicateNames ?? summary.duplicateCodes) > 0 ? 'attention' : 'positive'}
        />
        <SummaryMetric
          label="ERP IDs duplicados"
          value={formatNumber(summary.duplicateErpInternalIds)}
          icon={<Copy size={20} />}
          tone={summary.duplicateErpInternalIds > 0 ? 'attention' : 'positive'}
        />
        <SummaryMetric
          label="Marca + modelo ambiguos"
          value={formatNumber(summary.ambiguousBrandModels)}
          icon={<AlertTriangle size={20} />}
          tone={summary.ambiguousBrandModels > 0 ? 'attention' : 'positive'}
        />
        <SummaryMetric
          label="Filas ignoradas"
          value={formatNumber(summary.ignoredRows)}
          icon={<PackageSearch size={20} />}
          tone={summary.ignoredRows > 0 ? 'attention' : 'positive'}
        />
      </div>
    </AtlasCard>
  )
}
