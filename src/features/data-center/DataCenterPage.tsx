import {
  Download,
  XCircle,
} from 'lucide-react'

import {
  useRef,
  useState,
} from 'react'

import {
  AtlasCard,
} from '../../atlas/components/AtlasCard'

import {
  PageHeader,
} from '../../atlas/layout/PageHeader'

import {
  SectionHeader,
} from '../../atlas/layout/SectionHeader'

import {
  DataCatalog,
} from './components/DataCatalog'

import {
  DataCenterImportPanel,
} from './components/DataCenterImportPanel'

import {
  SalesImportSummary,
} from './components/SalesImportSummary'

import {
  TargetImportSummary,
} from './components/TargetImportSummary'

import {
  ProductMasterImportSummary,
} from './components/ProductMasterImportSummary'

import {
  InventoryImportSummary,
} from './components/InventoryImportSummary'

import {
  SpreadsheetFileInformation,
} from './components/SpreadsheetFileInformation'

import {
  SpreadsheetPreview,
} from './components/SpreadsheetPreview'

import {
  SpreadsheetStructure,
} from './components/SpreadsheetStructure'

import {
  SpreadsheetUploadArea,
} from './components/SpreadsheetUploadArea'

import {
  acceptedSpreadsheetFormats,
  parseSpreadsheetFile,
  parseSpreadsheetSheet,
  type ParsedSpreadsheet,
  type SpreadsheetRow,
} from './parsers/spreadsheetParser'

import {
  useDataCenterStore,
} from './store/dataCenterStore'

export function DataCenterPage() {
  const inputRef =
    useRef<HTMLInputElement>(null)

  const resetCurrentImport =
    useDataCenterStore(
      (state) =>
        state.resetCurrentImport,
    )

  const importStatus =
    useDataCenterStore(
      (state) =>
        state.importStatus,
    )

  const [
    loadedSpreadsheet,
    setLoadedSpreadsheet,
  ] =
    useState<ParsedSpreadsheet | null>(
      null,
    )

  const [
    selectedSheet,
    setSelectedSheet,
  ] = useState('')

  const [
    rows,
    setRows,
  ] =
    useState<SpreadsheetRow[]>([])

  const [
    columns,
    setColumns,
  ] =
    useState<string[]>([])

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false)

  const [
    isProcessingSheet,
    setIsProcessingSheet,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(null)

  const isImporting =
    importStatus ===
      'validating' ||
    importStatus ===
      'processing'

  async function processSheet(
    spreadsheet:
      ParsedSpreadsheet,
    sheetName: string,
  ) {
    setIsProcessingSheet(true)
    setError(null)
    resetCurrentImport()

    try {
      await new Promise<void>(
        (resolve) => {
          window.setTimeout(
            resolve,
            50,
          )
        },
      )

      const parsedSheet =
        parseSpreadsheetSheet(
          spreadsheet.workbook,
          sheetName,
        )

      setRows(parsedSheet.rows)
      setColumns(
        parsedSheet.columns,
      )
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible procesar la hoja.'

      setRows([])
      setColumns([])
      setError(message)
    } finally {
      setIsProcessingSheet(false)
    }
  }

  async function handleFile(
    file: File,
  ) {
    setError(null)
    setIsLoading(true)

    resetCurrentImport()
    setLoadedSpreadsheet(null)
    setSelectedSheet('')
    setRows([])
    setColumns([])

    try {
      const spreadsheet =
        await parseSpreadsheetFile(
          file,
        )

      const firstSheet =
        spreadsheet.sheetNames[0]

      if (!firstSheet) {
        throw new Error(
          'El archivo no contiene hojas disponibles.',
        )
      }

      setLoadedSpreadsheet(
        spreadsheet,
      )

      setSelectedSheet(
        firstSheet,
      )

      await processSheet(
        spreadsheet,
        firstSheet,
      )
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible leer el archivo.'

      setLoadedSpreadsheet(null)
      setSelectedSheet('')
      setRows([])
      setColumns([])
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSheetChange(
    sheetName: string,
  ) {
    setSelectedSheet(sheetName)

    if (!loadedSpreadsheet) {
      return
    }

    await processSheet(
      loadedSpreadsheet,
      sheetName,
    )
  }

  function resetImport() {
    resetCurrentImport()
    setLoadedSpreadsheet(null)
    setSelectedSheet('')
    setRows([])
    setColumns([])
    setError(null)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Data Operations"
        title="Data Center"
        description="Administra, carga y valida las fuentes de información de PM Intelligence."
      />

      <DataCatalog />

      <AtlasCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            title="Cargar fuente de datos"
            description="El archivo se procesa localmente dentro del navegador."
          />

          <a
            href="/templates/plantilla-objetivos-comerciales.xlsx"
            download
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            <Download size={17} />
            Plantilla de objetivos
          </a>
        </div>

        <SpreadsheetUploadArea
          inputRef={inputRef}
          acceptedFormats={
            acceptedSpreadsheetFormats
          }
          isLoading={isLoading}
          onFileSelected={(file) =>
            void handleFile(file)
          }
        />

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <XCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-800">
                No fue posible procesar el archivo
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}
      </AtlasCard>

      {loadedSpreadsheet && (
        <>
          <SpreadsheetFileInformation
            fileName={
              loadedSpreadsheet.fileName
            }
            fileSize={
              loadedSpreadsheet.fileSize
            }
            totalRows={rows.length}
            totalColumns={
              columns.length
            }
          />

          <SpreadsheetStructure
            sheetNames={
              loadedSpreadsheet.sheetNames
            }
            selectedSheet={
              selectedSheet
            }
            columns={columns}
            isProcessingSheet={
              isProcessingSheet
            }
            isImporting={
              isImporting
            }
            onSheetChange={(
              sheetName,
            ) =>
              void handleSheetChange(
                sheetName,
              )
            }
            onRemoveFile={
              resetImport
            }
          />

          {!isProcessingSheet && (
            <>
              <SpreadsheetPreview
                rows={rows}
                columns={columns}
              />

              <DataCenterImportPanel
                fileName={
                  loadedSpreadsheet.fileName
                }
                fileSize={
                  loadedSpreadsheet.fileSize
                }
                sheetName={
                  selectedSheet
                }
                rows={rows}
                columns={columns}
              />

              <SalesImportSummary />

              <TargetImportSummary />

              <ProductMasterImportSummary />

              <InventoryImportSummary />
            </>
          )}
        </>
      )}
    </div>
  )
}