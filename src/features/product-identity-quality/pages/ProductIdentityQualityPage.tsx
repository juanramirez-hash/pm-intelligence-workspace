import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Database,
  Download,
  PackageSearch,
  Rows3,
  ShieldCheck,
} from 'lucide-react'

import {
  AtlasCard,
} from '../../../atlas/components/AtlasCard'

import {
  PageHeader,
} from '../../../atlas/layout/PageHeader'

import {
  SectionHeader,
} from '../../../atlas/layout/SectionHeader'

import type {
  ProductIdentityGateStatus,
  ProductIdentityQualityIssue,
} from '../../../core/business/quality'

import type {
  ProductSalesReconciliationReason,
} from '../../../core/business/reconciliation'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

function formatInteger(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function statusLabel(status: ProductIdentityGateStatus): string {
  switch (status) {
    case 'passed':
      return 'Gate aprobado'
    case 'warning':
      return 'Gate condicionado'
    case 'failed':
      return 'Gate bloqueado'
    default:
      return 'Sin diagnostico'
  }
}

function reasonLabel(reason: ProductSalesReconciliationReason): string {
  switch (reason) {
    case 'matched_by_name':
      return 'Conciliado por Name'
    case 'matched_by_name_with_attribute_warning':
      return 'Conciliado por Name con advertencia'
    case 'historical_unlisted':
      return 'Producto historico fuera del catalogo actual'
    case 'ambiguous_name':
      return 'Name duplicado o ambiguo'
    case 'matched_by_erp_code':
      return 'Conciliado por codigo ERP'
    case 'matched_by_brand_model':
      return 'Conciliado por marca + modelo'
    case 'ambiguous_erp_code':
      return 'Codigo ERP ambiguo'
    case 'ambiguous_brand_model':
      return 'Marca + modelo ambiguos'
    case 'missing_product_identity':
      return 'Identidad faltante'
    case 'product_not_found':
    default:
      return 'Producto no encontrado'
  }
}

function escapeCsv(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function exportIssues(issues: ProductIdentityQualityIssue[]): void {
  const headers = [
    'Causa',
    'Name',
    'Codigo producto',
    'Marca',
    'Modelo',
    'Names candidatos',
    'Codigos candidatos',
    'Advertencias',
    'Filas',
    'Valor venta',
    'Venta neta',
    'Gross Profit',
    'Cantidad',
    'Documentos',
  ]

  const rows = issues.map((issue) => [
    reasonLabel(issue.reason),
    issue.normalizedProductName,
    issue.normalizedProductCode,
    issue.brandId,
    issue.model,
    issue.candidateNames.join(' | '),
    issue.candidateCodes.join(' | '),
    issue.attributeWarnings.join(' | '),
    issue.rows,
    issue.salesValue,
    issue.netRevenue,
    issue.grossProfit,
    issue.quantity,
    issue.documents,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n')

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'product-identity-exceptions.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <AtlasCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </AtlasCard>
  )
}

export function ProductIdentityQualityPage() {
  const workspace = useWorkspaceContext()
  const report = workspace.repository?.productIdentityQuality.getReport() ?? null

  if (!report || report.totalRows === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Data Quality"
          title="Product Identity Quality Gate"
          description="Valida la vinculacion entre ventas y Product Master antes de habilitar Inventory Workspace."
        />
        <AtlasCard className="p-8 text-center">
          <Database className="mx-auto text-slate-400" size={34} />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">
            Diagnostico no disponible
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
            Importa ventas y Product Master desde Data Center. El gate se recalcula automaticamente con los datasets persistidos.
          </p>
        </AtlasCard>
      </div>
    )
  }

  const statusTone = {
    passed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    failed: 'border-red-200 bg-red-50 text-red-800',
    not_available: 'border-slate-200 bg-slate-50 text-slate-700',
  }[report.status]

  const StatusIcon =
    report.status === 'passed'
      ? CheckCircle2
      : report.status === 'warning'
        ? AlertTriangle
        : CircleX

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Data Quality"
        title="Product Identity Quality Gate"
        description="Cobertura por filas, valor de venta y excepciones clasificadas antes de integrar inventario."
      />

      <AtlasCard className={`border p-6 ${statusTone}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <StatusIcon size={30} />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider">
                Estado de entrada a Inventory Workspace
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {statusLabel(report.status)}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportIssues(report.issues)}
            disabled={report.issues.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-current bg-white/70 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} />
            Exportar excepciones
          </button>
        </div>
      </AtlasCard>

      {report.matchedByNameRows === 0 && report.totalRows > 0 ? (
        <AtlasCard className="border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3 text-amber-900">
            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold">Name aun no esta materializado en las ventas persistidas</p>
              <p className="mt-1 text-sm text-amber-800">
                Reimporta el dataset de Ventas desde Data Center despues de aplicar IQ-002. La nueva normalizacion guardara Name, Modelo y Marca y recalculara la conciliacion primaria.
              </p>
            </div>
          </div>
        </AtlasCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Cobertura por filas"
          value={formatPercentage(report.rowCoverage)}
          description={`Name ${formatPercentage(report.nameRowCoverage)} · Meta total ${formatPercentage(report.thresholds.minimumRowCoverage)}`}
          icon={<Rows3 size={21} />}
        />
        <MetricCard
          label="Cobertura por valor"
          value={formatPercentage(report.valueCoverage)}
          description={`Name ${formatPercentage(report.nameValueCoverage)} · Meta total ${formatPercentage(report.thresholds.minimumValueCoverage)}`}
          icon={<ShieldCheck size={21} />}
        />
        <MetricCard
          label="Product Master"
          value={formatInteger(report.catalogProducts)}
          description="Productos disponibles para conciliacion"
          icon={<PackageSearch size={21} />}
        />
        <MetricCard
          label="Excepciones"
          value={formatInteger(report.exceptionRows)}
          description={`${formatInteger(report.exceptionGroups)} excepciones · ${formatInteger(report.attributeWarningGroups)} advertencias`}
          icon={<AlertTriangle size={21} />}
        />
      </div>

      <AtlasCard className="p-6">
        <SectionHeader
          title="Cobertura de conciliacion"
          description="El valor utiliza la magnitud absoluta de venta para evitar que devoluciones oculten exposicion no conciliada."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <div className="rounded-2xl bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Por Name</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950">{formatInteger(report.matchedByNameRows)} filas</p>
            <p className="mt-1 text-sm text-emerald-700">{formatCurrency(report.matchedByNameSalesValue)}</p>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Historico por Name</p>
            <p className="mt-2 text-2xl font-bold text-cyan-950">{formatInteger(report.historicalUnlistedRows)} filas</p>
            <p className="mt-1 text-sm text-cyan-700">{formatCurrency(report.historicalUnlistedSalesValue)}</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Fallback</p>
            <p className="mt-2 text-2xl font-bold text-sky-950">{formatInteger(report.matchedByLegacyCodeRows + report.matchedByBrandAndModelRows)} filas</p>
            <p className="mt-1 text-sm text-sky-700">Codigo o marca + modelo</p>
          </div>
          <div className="rounded-2xl bg-violet-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Advertencias</p>
            <p className="mt-2 text-2xl font-bold text-violet-950">{formatInteger(report.attributeWarningRows)} filas</p>
            <p className="mt-1 text-sm text-violet-700">{formatCurrency(report.attributeWarningSalesValue)}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Ambiguo</p>
            <p className="mt-2 text-2xl font-bold text-amber-950">{formatInteger(report.ambiguousRows)} filas</p>
            <p className="mt-1 text-sm text-amber-700">{formatCurrency(report.ambiguousSalesValue)}</p>
          </div>
          <div className="rounded-2xl bg-red-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Sin correspondencia</p>
            <p className="mt-2 text-2xl font-bold text-red-950">{formatInteger(report.unmatchedRows)} filas</p>
            <p className="mt-1 text-sm text-red-700">{formatCurrency(report.unmatchedSalesValue)}</p>
          </div>
        </div>
      </AtlasCard>

      <AtlasCard className="overflow-hidden">
        <div className="p-6">
          <SectionHeader
            title="Excepciones priorizadas"
            description="Ordenadas por valor de venta afectado. Cada fila representa una identidad agregada, no una transaccion individual."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Causa</th>
                <th className="px-5 py-3">Name / codigo</th>
                <th className="px-5 py-3">Marca / modelo</th>
                <th className="px-5 py-3 text-right">Filas</th>
                <th className="px-5 py-3 text-right">Valor</th>
                <th className="px-5 py-3">Candidatos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {report.issues.slice(0, 100).map((issue) => (
                <tr key={issue.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{reasonLabel(issue.reason)}</td>
                  <td className="px-5 py-4 text-slate-700">
                    <div>{issue.normalizedProductName ?? 'Sin Name'}</div>
                    <div className="text-xs text-slate-400">{issue.normalizedProductCode ?? 'Sin codigo alterno'}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    <div>{issue.brandId ?? 'Sin marca'}</div>
                    <div className="text-xs text-slate-400">{issue.model ?? 'Sin modelo'}</div>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-700">{formatInteger(issue.rows)}</td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900">{formatCurrency(issue.salesValue)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{issue.candidateNames.join(', ') || issue.candidateCodes.join(', ') || 'Sin candidatos'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AtlasCard>
    </div>
  )
}
