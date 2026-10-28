import {
  authenticatedFetch,
} from '../../../shared/http/authenticatedFetch'

import type {
  SalesWorkspaceDetailRow,
  SalesWorkspaceFilterOptions,
  SalesWorkspaceFilters,
} from '../types'

interface SalesAnalyticsFilter {
  periodIds?: string[]
  brandIds?: string[]
  customerIds?: string[]
  productIds?: string[]
  locationIds?: string[]
  salesRepresentativeIds?: string[]
  searchTerm?: string
}

interface SalesAnalyticsFilterOptionsResponse {
  ok: true
  dataset: 'sales'
  analytics: 'filter-options'
  periodId: string
  data: SalesWorkspaceFilterOptions
}

interface SalesAnalyticsDetailRowsResponse {
  ok: true
  dataset: 'sales'
  analytics: 'detail-rows'
  data: SalesWorkspaceDetailRow[]
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response =
    await authenticatedFetch(
      input,
      {
        credentials: 'include',
        ...init,
      },
    )

  const payload =
    await response.json()
      .catch(() => null)

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return payload as T
}

function copyValues(
  values: readonly string[] | undefined,
): string[] | undefined {
  return values
    ? [...values]
    : undefined
}

function buildFilter(
  filters: SalesWorkspaceFilters,
  periodId?: string,
): SalesAnalyticsFilter {
  return {
    periodIds:
      periodId
        ? [periodId]
        : undefined,
    brandIds:
      copyValues(filters.brandIds),
    customerIds:
      copyValues(filters.customerIds),
    productIds:
      copyValues(filters.productIds),
    locationIds:
      copyValues(filters.locationIds),
    salesRepresentativeIds:
      copyValues(
        filters.salesRepresentativeIds,
      ),
    searchTerm:
      filters.searchTerm,
  }
}

export async function loadSalesFilterOptions(
  periodId: string,
  filters: SalesWorkspaceFilters,
  signal?: AbortSignal,
): Promise<SalesWorkspaceFilterOptions> {
  const filter =
    buildFilter(filters)

  const response =
    await requestJson<SalesAnalyticsFilterOptionsResponse>(
      '/api/data/sales/analytics/filter-options',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          periodId,
          filter,
        }),
        signal,
      },
    )

  return response.data
}

export async function loadSalesDetailRows(
  periodId: string,
  filters: SalesWorkspaceFilters,
  limit = 100,
  signal?: AbortSignal,
): Promise<SalesWorkspaceDetailRow[]> {
  const filter =
    buildFilter(
      filters,
      periodId,
    )

  const response =
    await requestJson<SalesAnalyticsDetailRowsResponse>(
      '/api/data/sales/analytics/detail-rows',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          filter,
          limit,
        }),
        signal,
      },
    )

  return response.data
}