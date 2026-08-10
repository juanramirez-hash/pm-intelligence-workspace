import {
  AlertCircle,
  CheckCircle2,
  Database,
  LoaderCircle,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  AtlasCard,
} from '../../../atlas/components/AtlasCard'

import {
  SectionHeader,
} from '../../../atlas/layout/SectionHeader'

import type {
  SpreadsheetRow,
} from '../parsers/spreadsheetParser'

import type {
  ReportType,
} from '../types/reportTypes'

import {
  useDataCenterStore,
} from '../store/dataCenterStore'

interface DataCenterImportPanelProps {
  fileName: string
  fileSize: number
  sheetName: string
  rows: SpreadsheetRow[]
  columns: string[]
}

type ImportDestination =
  | ReportType
  | 'auto'

const destinationLabels:
  Record<ImportDestination, string> = {
    auto:
      'Detectar automáticamente',
    sales:
      'Ventas',
    quota:
      'Objetivos comerciales',
    products:
      'Product Master',
    inventory:
      'Inventario',
    purchases:
      'Órdenes de compra',
    'purchase-requests':
      'Solicitudes de compra',
    projects:
      'Proyectos',
    'project-billing':
      'Facturación de proyectos',
    'exchange-rates':
      'Tipos de cambio',
    pricing:
      'Pricing',
    customers:
      'Clientes',
    forecast:
      'Forecast',
    other:
      'Otro',
  }

const destinationOptions:
  ImportDestination[] = [
    'auto',
    'sales',
    'quota',
    'products',
    'inventory',
    'purchases',
    'purchase-requests',
    'projects',
    'project-billing',
    'exchange-rates',
    'pricing',
  ]

function getFileExtension(
  fileName: string,
): string {
  const lastDotIndex =
    fileName.lastIndexOf('.')

  if (lastDotIndex === -1) {
    return ''
  }

  return fileName
    .slice(lastDotIndex + 1)
    .toLowerCase()
}

function getStatusDescription(
  status: ReturnType<
    typeof useDataCenterStore.getState
  >['importStatus'],
): string {
  switch (status) {
    case 'validating':
      return 'Validando el archivo contra el destino seleccionado.'

    case 'processing':
      return 'Normalizando registros y calculando indicadores.'

    case 'completed':
      return 'Los datos fueron procesados correctamente.'

    case 'error':
      return 'La importación no pudo completarse.'

    default:
      return 'Selecciona el repositorio de destino y ejecuta la importación.'
  }
}

export function DataCenterImportPanel({
  fileName,
  fileSize,
  sheetName,
  rows,
  columns,
}: DataCenterImportPanelProps) {
  const [
    selectedDestination,
    setSelectedDestination,
  ] =
    useState<ImportDestination>(
      'auto',
    )

  const executeImport =
    useDataCenterStore(
      (state) =>
        state.executeImport,
    )

  const importStatus =
    useDataCenterStore(
      (state) =>
        state.importStatus,
    )

  const importErrors =
    useDataCenterStore(
      (state) =>
        state.importErrors,
    )

  const activeReportType =
    useDataCenterStore(
      (state) =>
        state.activeReportType,
    )

  const isImporting =
    importStatus ===
      'validating' ||
    importStatus ===
      'processing'

  const canImport =
    rows.length > 0 &&
    columns.length > 0 &&
    !isImporting

  function handleImport(): void {
    executeImport(
      rows,
      {
        fileName,
        fileSize,
        extension:
          getFileExtension(
            fileName,
          ),
        sheetName,
        totalRows:
          rows.length,
        totalColumns:
          columns.length,
      },
      selectedDestination ===
        'auto'
        ? undefined
        : selectedDestination,
    )
  }

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Importar al Data Center"
        description={
          getStatusDescription(
            importStatus,
          )
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px_auto] lg:items-end">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Database size={21} />
            </div>

            <div>
              <p className="font-semibold text-slate-950">
                {new Intl.NumberFormat(
                  'es-MX',
                ).format(
                  rows.length,
                )}{' '}
                registros preparados
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Hoja: {sheetName}
              </p>

              {activeReportType && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2
                    size={15}
                  />
                  Destino procesado:{' '}
                  {
                    destinationLabels[
                      activeReportType
                    ]
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Repositorio de destino
          </span>

          <select
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={
              isImporting
            }
            onChange={(
              event,
            ) =>
              setSelectedDestination(
                event.target
                  .value as ImportDestination,
              )
            }
            value={
              selectedDestination
            }
          >
            {destinationOptions.map(
              (destination) => (
                <option
                  key={
                    destination
                  }
                  value={
                    destination
                  }
                >
                  {
                    destinationLabels[
                      destination
                    ]
                  }
                </option>
              ),
            )}
          </select>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            La selección manual tiene prioridad. Usa detección automática solo cuando quieras que Data Center determine el tipo de archivo.
          </p>
        </label>

        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!canImport}
          onClick={
            handleImport
          }
          type="button"
        >
          {isImporting ? (
            <>
              <LoaderCircle
                className="animate-spin"
                size={18}
              />
              Procesando
            </>
          ) : importStatus ===
            'completed' ? (
            <>
              <CheckCircle2
                size={18}
              />
              Importado
            </>
          ) : (
            <>
              <Database
                size={18}
              />
              Importar datos
            </>
          )}
        </button>
      </div>

      {importErrors.length >
        0 && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 shrink-0 text-red-600"
              size={21}
            />

            <div className="min-w-0">
              <p className="font-semibold text-red-800">
                Se encontraron errores
              </p>

              <div className="mt-2 space-y-1">
                {importErrors.map(
                  (
                    importError,
                    index,
                  ) => (
                    <p
                      className="text-sm text-red-700"
                      key={`${importError.message}-${index}`}
                    >
                      {importError.row
                        ? `Fila ${importError.row}: `
                        : ''}
                      {importError.column
                        ? `${importError.column}: `
                        : ''}
                      {
                        importError.message
                      }
                    </p>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AtlasCard>
  )
}