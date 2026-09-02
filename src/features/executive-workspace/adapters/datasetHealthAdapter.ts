import {
  Crosshair,
  Database,
  DollarSign,
  FolderKanban,
  ReceiptText,
  ArrowRightLeft,
  Package,
  PackageSearch,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'

import type {
  LucideIcon,
} from 'lucide-react'

import type {
  DatasetRegistryItem,
  DatasetStatus,
  DatasetType,
} from '../../../core/datasets/datasetTypes'

export type DatasetHealthStatus =
  | 'ready'
  | 'pending'
  | 'warning'

export interface DatasetHealthItem {
  id: DatasetType

  name: string

  description: string

  status:
    DatasetHealthStatus

  statusLabel: string

  updatedAt: string

  icon: LucideIcon
}

const DATASET_ICONS: Record<
  DatasetType,
  LucideIcon
> = {
  sales:
    TrendingUp,

  inventory:
    PackageSearch,

  salesTargets:
    Crosshair,

  projects:
    FolderKanban,

  projectBillings:
    ReceiptText,

  exchangeRates:
    ArrowRightLeft,

  purchases:
    ShoppingCart,

  purchaseRequests:
    ShoppingCart,

  pricing:
    DollarSign,

  customers:
    Users,

  products:
    Package,


}

function mapDatasetStatus(
  status: DatasetStatus,
): DatasetHealthStatus {
  switch (status) {
    case 'active':
      return 'ready'

    case 'error':
      return 'warning'

    case 'not_loaded':
    default:
      return 'pending'
  }
}

function getDatasetStatusLabel(
  status: DatasetStatus,
): string {
  switch (status) {
    case 'active':
      return 'Actualizado'

    case 'error':
      return 'Requiere atención'

    case 'not_loaded':
    default:
      return 'Sin datos'
  }
}

function formatDatasetDate(
  value: string | null,
): string {
  if (!value) {
    return 'Pendiente de carga'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}

export function mapDatasetHealthItem(
  dataset:
    DatasetRegistryItem,
): DatasetHealthItem {
  return {
    id:
      dataset.type,

    name:
      dataset.label,

    description:
      dataset.description,

    status:
      mapDatasetStatus(
        dataset.status,
      ),

    statusLabel:
      getDatasetStatusLabel(
        dataset.status,
      ),

    updatedAt:
      formatDatasetDate(
        dataset.lastImportedAt,
      ),

    icon:
      DATASET_ICONS[
        dataset.type
      ] ?? Database,
  }
}

export function mapDatasetHealth(
  datasets:
    DatasetRegistryItem[],
): DatasetHealthItem[] {
  return datasets.map(
    mapDatasetHealthItem,
  )
}