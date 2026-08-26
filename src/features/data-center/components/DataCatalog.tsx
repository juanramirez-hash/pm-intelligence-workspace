import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Database,
  FileSpreadsheet,
  HardDrive,
  Rows3,
} from 'lucide-react'

import {
  useMemo,
} from 'react'

import {
  buildDatasetRegistry,
} from '../../../core/registry/buildDatasetRegistry'

import type {
  DatasetRegistryItem,
  DatasetStatus,
} from '../../../core/datasets/datasetTypes'

import {
  AtlasCard,
} from '../../../atlas/components/AtlasCard'

import {
  SectionHeader,
} from '../../../atlas/layout/SectionHeader'

import {
  useDataCenterStore,
} from '../store/dataCenterStore'

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return 'Sin información'
  }

  const monthMatch =
    value.match(
      /^(\d{4})-(\d{2})$/,
    )

  if (monthMatch) {
    const year =
      Number(monthMatch[1])

    const month =
      Number(monthMatch[2]) - 1

    const parsedDate =
      new Date(
        year,
        month,
        1,
      )

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        month: 'short',
        year: 'numeric',
      },
    ).format(parsedDate)
  }

  const dateMatch =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    )

  if (dateMatch) {
    const year =
      Number(dateMatch[1])

    const month =
      Number(dateMatch[2]) - 1

    const day =
      Number(dateMatch[3])

    const parsedDate =
      new Date(
        year,
        month,
        day,
      )

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(parsedDate)
  }

  const parsedDate =
    new Date(value)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(parsedDate)
}

function formatPeriod(
  periodStart: string | null,
  periodEnd: string | null,
): string {
  if (
    !periodStart ||
    !periodEnd
  ) {
    return 'Sin periodo disponible'
  }

  return `${formatDate(periodStart)} — ${formatDate(periodEnd)}`
}

function getStatusLabel(
  status: DatasetStatus,
): string {
  switch (status) {
    case 'active':
      return 'Activo'

    case 'error':
      return 'Con error'

    case 'not_loaded':
    default:
      return 'Sin cargar'
  }
}

function getStorageLabel(
  dataset:
    DatasetRegistryItem,
): string {
  switch (dataset.storage) {
    case 'indexeddb':
      return 'IndexedDB local'

    case 'postgresql':
      return 'PostgreSQL'

    case 'supabase':
      return 'Supabase'

    case 'google_sheets':
      return 'Google Sheets'

    case 'not_configured':
    default:
      return 'No configurado'
  }
}

function DatasetStatusBadge({
  status,
}: {
  status: DatasetStatus
}) {
  const isActive =
    status === 'active'

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-50 text-slate-600',
      ].join(' ')}
    >
      {isActive ? (
        <CheckCircle2 size={14} />
      ) : (
        <CircleDashed size={14} />
      )}

      {getStatusLabel(status)}
    </span>
  )
}

function DatasetCatalogCard({
  dataset,
}: {
  dataset: DatasetRegistryItem
}) {
  const isActive =
    dataset.status === 'active'

  return (
    <AtlasCard
      className={[
        'flex h-full flex-col p-5',
        isActive
          ? 'border-emerald-200'
          : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500',
            ].join(' ')}
          >
            <Database size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-950">
              {dataset.label}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
              {dataset.description}
            </p>
          </div>
        </div>

        <DatasetStatusBadge
          status={dataset.status}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Rows3 size={14} />
            Registros
          </div>

          <p className="mt-2 text-lg font-semibold text-slate-900">
            {isActive
              ? dataset.totalRows.toLocaleString(
                  'es-MX',
                )
              : '—'}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <CalendarDays size={14} />
            Frecuencia
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {dataset.updateFrequency}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-500">
            Periodo
          </span>

          <span className="text-right font-medium text-slate-800">
            {formatPeriod(
              dataset.periodStart,
              dataset.periodEnd,
            )}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <FileSpreadsheet size={14} />
            Archivo
          </span>

          <span className="max-w-[58%] truncate text-right font-medium text-slate-800">
            {dataset.lastImportedFile ??
              'Sin archivo'}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <HardDrive size={14} />
            Almacenamiento
          </span>

          <span className="text-right font-medium text-slate-800">
            {getStorageLabel(dataset)}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-500">
            Última carga
          </span>

          <span className="text-right font-medium text-slate-800">
            {formatDate(
              dataset.lastImportedAt,
            )}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-500">
            Versión
          </span>

          <span className="text-right font-medium text-slate-800">
            {dataset.version > 0
              ? `v${dataset.version}.0`
              : '—'}
          </span>
        </div>
      </div>
    </AtlasCard>
  )
}

export function DataCatalog() {
  const salesSummary =
    useDataCenterStore(
      (state) =>
        state.salesSummary,
    )

  const targetSummary =
    useDataCenterStore(
      (state) =>
        state.targetSummary,
    )

  const targetsLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.targetsLastImportedFile,
    )

  const targetsLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.targetsLastImportedAt,
    )

  const lastImportedFile =
    useDataCenterStore(
      (state) =>
        state.lastImportedFile,
    )

  const lastImportedAt =
    useDataCenterStore(
      (state) =>
        state.lastImportedAt,
    )

  const inventorySummary =
    useDataCenterStore(
      (state) =>
        state.inventorySummary,
    )

  const inventoryLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.inventoryLastImportedFile,
    )

  const inventoryLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.inventoryLastImportedAt,
    )

  const productMasterSummary =
    useDataCenterStore(
      (state) =>
        state.productMasterSummary,
    )

  const productMasterLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.productMasterLastImportedFile,
    )

  const productMasterLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.productMasterLastImportedAt,
    )

  const purchaseOrderSummary =
    useDataCenterStore(
      (state) =>
        state.purchaseOrderSummary,
    )

  const purchaseOrderLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.purchaseOrderLastImportedFile,
    )

  const purchaseOrderLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.purchaseOrderLastImportedAt,
    )

  const purchaseRequestSummary =
    useDataCenterStore(
      (state) =>
        state.purchaseRequestSummary,
    )

  const purchaseRequestLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.purchaseRequestLastImportedFile,
    )

  const purchaseRequestLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.purchaseRequestLastImportedAt,
    )

  const projectsSummary =
    useDataCenterStore(
      (state) =>
        state.projectsSummary,
    )

  const projectsLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.projectsLastImportedFile,
    )

  const projectsLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.projectsLastImportedAt,
    )

  const projectBillingSummary =
    useDataCenterStore(
      (state) =>
        state.projectBillingSummary,
    )

  const projectBillingLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.projectBillingLastImportedFile,
    )

  const projectBillingLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.projectBillingLastImportedAt,
    )

  const exchangeRateSummary =
    useDataCenterStore(
      (state) =>
        state.exchangeRateSummary,
    )

  const exchangeRateLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.exchangeRateLastImportedFile,
    )

  const exchangeRateLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.exchangeRateLastImportedAt,
    )

  const pricingSummary =
    useDataCenterStore(
      (state) =>
        state.pricingSummary,
    )

  const pricingLastImportedFile =
    useDataCenterStore(
      (state) =>
        state.pricingLastImportedFile,
    )

  const pricingLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.pricingLastImportedAt,
    )

  const datasets =
    useMemo(
      () =>
        buildDatasetRegistry({
          salesSummary,
          salesLastImportedFile:
            lastImportedFile,
          salesLastImportedAt:
            lastImportedAt,
          targetSummary,
          targetsLastImportedFile,
          targetsLastImportedAt,
          productMasterSummary,
          productMasterLastImportedFile,
          productMasterLastImportedAt,
          inventorySummary,
          inventoryLastImportedFile,
          inventoryLastImportedAt,
          purchaseOrderSummary,
          purchaseOrderLastImportedFile,
          purchaseOrderLastImportedAt,
          purchaseRequestSummary,
          purchaseRequestLastImportedFile,
          purchaseRequestLastImportedAt,
          projectsSummary,
          projectsLastImportedFile,
          projectsLastImportedAt,
          projectBillingSummary,
          projectBillingLastImportedFile,
          projectBillingLastImportedAt,
          exchangeRateSummary,
          exchangeRateLastImportedFile,
          exchangeRateLastImportedAt,
          pricingSummary,
          pricingLastImportedFile,
          pricingLastImportedAt,
        }),
      [
        salesSummary,
        lastImportedFile,
        lastImportedAt,
        targetSummary,
        targetsLastImportedFile,
        targetsLastImportedAt,
        productMasterSummary,
        productMasterLastImportedFile,
        productMasterLastImportedAt,
        inventorySummary,
        inventoryLastImportedFile,
        inventoryLastImportedAt,
        purchaseOrderSummary,
        purchaseOrderLastImportedFile,
        purchaseOrderLastImportedAt,
        purchaseRequestSummary,
        purchaseRequestLastImportedFile,
        purchaseRequestLastImportedAt,
        projectsSummary,
        projectsLastImportedFile,
        projectsLastImportedAt,
        projectBillingSummary,
        projectBillingLastImportedFile,
        projectBillingLastImportedAt,
        exchangeRateSummary,
        exchangeRateLastImportedFile,
        exchangeRateLastImportedAt,
        pricingSummary,
        pricingLastImportedFile,
        pricingLastImportedAt,
      ],
    )

  const activeDatasets =
    datasets.filter(
      (dataset) =>
        dataset.status ===
        'active',
    ).length

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="Data Catalog"
          description="Registro central de las fuentes de información disponibles para los Workspaces."
        />

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <span className="text-slate-500">
            Datasets activos
          </span>

          <span className="ml-2 font-semibold text-slate-950">
            {activeDatasets} de{' '}
            {datasets.length}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {datasets.map(
          (dataset) => (
            <DatasetCatalogCard
              key={dataset.type}
              dataset={dataset}
            />
          ),
        )}
      </div>
    </section>
  )
}