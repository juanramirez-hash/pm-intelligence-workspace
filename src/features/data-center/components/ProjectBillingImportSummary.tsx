import {
  Banknote,
  CircleAlert,
  FileMinus2,
  FileText,
  FolderKanban,
  ReceiptText,
} from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'
import { useDataCenterStore } from '../store/dataCenterStore'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

function formatMoney(value: number, currency: 'MXN' | 'USD'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function ProjectBillingImportSummary() {
  const activeReportType = useDataCenterStore(
    (state) => state.activeReportType,
  )
  const importStatus = useDataCenterStore(
    (state) => state.importStatus,
  )
  const summary = useDataCenterStore(
    (state) => state.projectBillingSummary,
  )

  if (
    activeReportType !== 'project-billing' ||
    importStatus !== 'completed' ||
    !summary
  ) {
    return null
  }

  const cards = [
    {
      label: 'Documentos',
      value: formatNumber(summary.uniqueDocuments),
      detail: `${formatNumber(summary.totalLines)} líneas únicas`,
      icon: ReceiptText,
    },
    {
      label: 'Proyectos facturados',
      value: formatNumber(summary.uniqueProjects),
      detail: 'Vinculados por ID de proyecto',
      icon: FolderKanban,
    },
    {
      label: 'Facturas',
      value: formatNumber(summary.invoiceDocuments),
      detail: `${summary.creditNoteDocuments} notas de crédito`,
      icon: FileText,
    },
    {
      label: 'Importe fuente MXN',
      value: formatMoney(summary.sourceAmountMxn, 'MXN'),
      detail: 'Solo auditoría; Sales será fuente oficial',
      icon: Banknote,
    },
    {
      label: 'Importe fuente USD',
      value: formatMoney(summary.sourceAmountUsd, 'USD'),
      detail: 'No se convierte facturación realizada',
      icon: FileMinus2,
    },
    {
      label: 'Alertas de origen',
      value: formatNumber(
        summary.voidedDocuments +
        summary.duplicateSourceLines +
        summary.documentsMissingCurrency,
      ),
      detail: `${summary.voidedDocuments} anulados · ${summary.duplicateSourceLines} duplicados`,
      icon: CircleAlert,
    },
  ]

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Resumen de facturación de proyectos"
        description="Índice histórico de documentos para reconciliar factura, proyecto y venta real en MXN."
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
              <Icon size={18} className="text-emerald-600" />
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
