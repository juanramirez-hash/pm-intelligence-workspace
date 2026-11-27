// MB-001: the only server calls of the brand page. It reads /api/brands/*
// and /api/actions, never the /api/data/* datasets. authenticatedFetch sends
// the session cookie and, on 401, sends the user back to the login screen.

import {
  authenticatedFetch,
} from '../../../shared/http/authenticatedFetch'

import type {
  BrandCustomerFilter,
  BrandCustomersResponse,
  BrandDirectoryRequest,
  BrandDirectoryResponse,
  BrandExportResponse,
  BrandHeaderResponse,
  BrandProductFilter,
  BrandProductsResponse,
  BrandSalesResponse,
  BrandSalesSection,
} from './brandsTypes'

export class BrandsApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'BrandsApiError'
    this.status = status
  }
}

type QueryValue = string | number | null | undefined

/** Path plus query string; empty values are left out. */
export function brandsPath(
  path: string,
  params: Record<string, QueryValue> = {},
): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }

  const text = query.toString()

  return text ? `${path}?${text}` : path
}

/** Server messages for the statuses the screen explains. */
export function brandsErrorMessage(status: number, serverMessage: string | null): string {
  if (status === 404) {
    return 'Marca no encontrada'
  }

  if (status === 403) {
    return serverMessage ?? 'Marca fuera del alcance del usuario'
  }

  return serverMessage ?? `La consulta respondió ${status}`
}

async function requestJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await authenticatedFetch(path, {
    headers: { Accept: 'application/json' },
    signal,
  })
  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const serverMessage =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : null

    throw new BrandsApiError(response.status, brandsErrorMessage(response.status, serverMessage))
  }

  return payload as T
}

const brandUrl = (brand: string) => `/api/brands/${encodeURIComponent(brand)}`

export function loadBrandDirectory(
  { view, period, q, status, sales, sort, limit, offset }: BrandDirectoryRequest,
  signal?: AbortSignal,
): Promise<BrandDirectoryResponse> {
  return requestJson(
    brandsPath('/api/brands', {
      // The server default is view=mine; only view=all is sent.
      view: view === 'all' ? 'all' : undefined,
      period,
      q: q?.trim(),
      status,
      sales,
      sort: sort === 'revenue' ? undefined : sort,
      limit,
      offset: offset || undefined,
    }),
    signal,
  )
}

export function loadBrandHeader(
  brand: string,
  period: string | null,
  signal?: AbortSignal,
): Promise<BrandHeaderResponse> {
  return requestJson(brandsPath(brandUrl(brand), { period }), signal)
}

export function loadBrandSales(
  brand: string,
  {
    period,
    sections,
    limit,
    offset,
  }: { period: string | null, sections: readonly BrandSalesSection[], limit?: number, offset?: number },
  signal?: AbortSignal,
): Promise<BrandSalesResponse> {
  return requestJson(
    brandsPath(`${brandUrl(brand)}/sales`, {
      period,
      sections: sections.join(','),
      limit,
      offset: offset || undefined,
    }),
    signal,
  )
}

export function loadBrandSalesExport(
  brand: string,
  period: string | null,
  signal?: AbortSignal,
): Promise<BrandExportResponse> {
  return requestJson(brandsPath(`${brandUrl(brand)}/sales/export`, { period }), signal)
}

export function loadBrandCustomers(
  brand: string,
  {
    period,
    filter,
    limit,
    offset,
  }: { period: string | null, filter: BrandCustomerFilter, limit: number, offset: number },
  signal?: AbortSignal,
): Promise<BrandCustomersResponse> {
  return requestJson(
    brandsPath(`${brandUrl(brand)}/customers`, {
      period,
      filter,
      limit,
      offset: offset || undefined,
    }),
    signal,
  )
}

export function loadBrandProducts(
  brand: string,
  {
    period,
    filter,
    limit,
    offset,
  }: { period: string | null, filter: BrandProductFilter, limit: number, offset: number },
  signal?: AbortSignal,
): Promise<BrandProductsResponse> {
  return requestJson(
    brandsPath(`${brandUrl(brand)}/products`, {
      period,
      filter,
      limit,
      offset: offset || undefined,
    }),
    signal,
  )
}
