// NAV-001: "Datos al corte" of the top bar, from GET /api/status/data-cutoff
// (session only, dates only). Never reads the /api/data/* datasets.

import {
  authenticatedFetch,
} from '../../shared/http/authenticatedFetch'

import {
  formatDate,
} from '../../features/my-day/format/myDayFormat'

export interface DataCutoffSource {
  lastImportedAt: string | null
  dataCutoff: string | null
  referenceDate: string | null
  daysSince: number | null
  status: 'up-to-date' | 'stale' | 'no-data'
  stale: boolean | null
}

export interface DataCutoffResponse {
  ok: true
  salesCutoff: string | null
  staleAfterDays: number
  anyStale: boolean
  sources: {
    sales: DataCutoffSource
    inventory: DataCutoffSource
    purchases: DataCutoffSource
  }
}

export const DATA_CUTOFF_PATH = '/api/status/data-cutoff'

export async function loadDataCutoff(signal?: AbortSignal): Promise<DataCutoffResponse> {
  const response = await authenticatedFetch(DATA_CUTOFF_PATH, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`La consulta respondió ${response.status}`)
  }

  return await response.json() as DataCutoffResponse
}

const SOURCE_LABELS: Array<[keyof DataCutoffResponse['sources'], string]> = [
  ['sales', 'Ventas'],
  ['inventory', 'Inventario'],
  ['purchases', 'Compras'],
]

export interface DataCutoffSummary {
  label: string
  tooltip: string
  stale: boolean
}

/** Text of the badge and of its tooltip; never invents a date. */
export function summarizeDataCutoff(
  data: DataCutoffResponse | null,
  failed = false,
): DataCutoffSummary {
  if (!data) {
    return {
      label: `Datos al corte: ${failed ? 'sin dato' : '…'}`,
      tooltip: failed ? 'No se pudo consultar la fecha de corte' : 'Consultando la fecha de corte',
      stale: false,
    }
  }

  const tooltip = SOURCE_LABELS.map(([key, name]) => {
    const source = data.sources[key]

    if (!source?.referenceDate) {
      return `${name}: sin datos cargados`
    }

    return `${name} al ${formatDate(source.referenceDate)}${source.stale ? ` (atrasado, más de ${data.staleAfterDays} días)` : ''}`
  }).join(' · ')

  return {
    label: `Datos al corte: ${formatDate(data.salesCutoff)}`,
    tooltip,
    stale: data.anyStale,
  }
}
