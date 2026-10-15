export type GlobalSearchResultType =
  | 'brand'
  | 'customer'
  | 'product'

export interface GlobalSearchResult {
  id: string
  type: GlobalSearchResultType
  primary: string
  secondary: string
  route: string
  score: number
}

export interface GlobalSearchGroup {
  type: GlobalSearchResultType
  label: string
  items: GlobalSearchResult[]
}

interface GlobalSearchBrand {
  id: string
  name: string
  score: number
}

interface GlobalSearchCustomer {
  id: string
  name: string | null
  erpInternalId: string | null
  email: string | null
  phone: string | null
  salesRep: string | null
  assignedKam: string | null
  taxId: string | null
  score: number
}

interface GlobalSearchProduct {
  id: string
  name: string | null
  code: string | null
  model: string | null
  sku: string
  brand: string | null
  erpInternalId: string | null
  vendorCode: string | null
  description: string | null
  score: number
}

interface GlobalSearchResponse {
  ok: true
  query: string
  brands: GlobalSearchBrand[]
  customers: GlobalSearchCustomer[]
  products: GlobalSearchProduct[]
}

async function requestGlobalSearch(
  query: string,
  signal?: AbortSignal,
): Promise<GlobalSearchResponse> {
  const params =
    new URLSearchParams({
      q: query,
    })

  const response =
    await fetch(
      `/api/search?${params.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
        signal,
      },
    )

  const payload =
    await response
      .json()
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

  return payload as GlobalSearchResponse
}

function buildBrandResults(
  rows: GlobalSearchBrand[],
): GlobalSearchResult[] {
  return rows.map(
    (brand) => ({
      id: brand.id,
      type: 'brand',
      primary:
        brand.name ||
        brand.id,
      secondary:
        brand.id ===
        brand.name
          ? 'Marca'
          : `ID ${brand.id}`,
      route:
        `/brands/${encodeURIComponent(brand.id)}`,
      score:
        brand.score,
    }),
  )
}

function buildCustomerResults(
  rows: GlobalSearchCustomer[],
): GlobalSearchResult[] {
  return rows.map(
    (customer) => {
      const detailParts = [
        customer.id,
        customer.salesRep,
      ].filter(Boolean)

      return {
        id: customer.id,
        type: 'customer',
        primary:
          customer.name ||
          customer.id,
        secondary:
          detailParts.join(
            ' · ',
          ),
        route:
          `/customers/${encodeURIComponent(customer.id)}`,
        score:
          customer.score,
      }
    },
  )
}

function buildProductResults(
  rows: GlobalSearchProduct[],
): GlobalSearchResult[] {
  return rows.map(
    (product) => {
      const primary =
        product.model ||
        product.name ||
        product.sku ||
        product.id

      const detailParts = [
        product.brand,
        product.sku !== primary
          ? product.sku
          : null,
      ].filter(Boolean)

      return {
        id: product.id,
        type: 'product',
        primary,
        secondary:
          detailParts.join(
            ' · ',
          ),
        route:
          `/products/${encodeURIComponent(product.id)}`,
        score:
          product.score,
      }
    },
  )
}

export async function searchGlobalCatalog(
  query: string,
  signal?: AbortSignal,
): Promise<GlobalSearchGroup[]> {
  const normalizedQuery =
    query.trim()

  if (
    normalizedQuery.length < 2
  ) {
    return []
  }

  const response =
    await requestGlobalSearch(
      normalizedQuery,
      signal,
    )

  const groups:
    GlobalSearchGroup[] = [
      {
        type: 'brand',
        label: 'Marcas',
        items:
          buildBrandResults(
            response.brands,
          ),
      },
      {
        type: 'customer',
        label: 'Clientes',
        items:
          buildCustomerResults(
            response.customers,
          ),
      },
      {
        type: 'product',
        label: 'Productos',
        items:
          buildProductResults(
            response.products,
          ),
      },
    ]

  return groups.filter(
    (group) =>
      group.items.length > 0,
  )
}