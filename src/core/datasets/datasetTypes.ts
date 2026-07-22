export type DatasetType =
  | 'sales'
  | 'inventory'
  | 'salesTargets'
  | 'purchases'
  | 'purchaseRequests'
  | 'pricing'
  | 'customers'
  | 'products'
  | 'businessCalendar'

export type DatasetStatus =
  | 'active'
  | 'not_loaded'
  | 'error'

export type DatasetStorage =
  | 'indexeddb'
  | 'supabase'
  | 'google_sheets'
  | 'not_configured'

export interface DatasetDefinition {
  type: DatasetType
  label: string
  description: string
  updateFrequency: string
  displayOrder: number
}

export interface DatasetRegistryItem {
  type: DatasetType
  label: string
  description: string

  status: DatasetStatus
  storage: DatasetStorage

  totalRows: number
  ignoredRows: number

  periodStart: string | null
  periodEnd: string | null

  lastImportedFile: string | null
  lastImportedAt: string | null

  version: number

  updateFrequency: string
  displayOrder: number
}