import type {
  BrandIntelligenceItem,
} from '../../../core/analytics/brands'

import type {
  BrandWorkspaceFilters,
  BrandWorkspaceSortDirection,
  BrandWorkspaceSortField,
} from '../types/brandWorkspaceTypes'

function normalizeText(
  value: string,
) {
  return value
    .trim()
    .toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
}

export function filterBrands(
  brands:
    BrandIntelligenceItem[],

  filters:
    BrandWorkspaceFilters,
) {
  const normalizedSearch =
    normalizeText(
      filters.search,
    )

  return brands.filter(
    (brand) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeText(
          brand.brandName,
        ).includes(
          normalizedSearch,
        ) ||
        normalizeText(
          brand.brandId,
        ).includes(
          normalizedSearch,
        )

      const matchesLifecycle =
        filters.lifecycle === 'all' ||
        brand.lifecycleStatus ===
          filters.lifecycle

      const matchesTrend =
        filters.trend === 'all' ||
        brand.trendStatus ===
          filters.trend

      const matchesAttention =
        !filters.requiresAttention ||
        brand.requiresAttention

      return (
        matchesSearch &&
        matchesLifecycle &&
        matchesTrend &&
        matchesAttention
      )
    },
  )
}

function getSortValue(
  brand:
    BrandIntelligenceItem,

  sortField:
    BrandWorkspaceSortField,
): string | number {
  switch (sortField) {
    case 'brandName':
      return brand.brandName

    case 'revenue':
      return (
        brand.currentPeriod
          .revenue
      )

    case 'grossProfit':
      return (
        brand.currentPeriod
          .grossProfit
      )

    case 'margin':
      return (
        brand.currentPeriod
          .margin ??
        Number.NEGATIVE_INFINITY
      )

    case 'revenueVariation':
      return (
        brand.revenueVariation
      )

    case 'revenueVariationPercentage':
      return (
        brand
          .revenueVariationPercentage ??
        Number.NEGATIVE_INFINITY
      )

    case 'revenueParticipation':
      return (
        brand.revenueParticipation
      )

    case 'customers':
      return (
        brand.currentPeriod
          .customers
      )

    case 'products':
      return (
        brand.currentPeriod
          .products
      )
  }
}

export function sortBrands(
  brands:
    BrandIntelligenceItem[],

  sortField:
    BrandWorkspaceSortField,

  sortDirection:
    BrandWorkspaceSortDirection,
) {
  const direction =
    sortDirection === 'asc'
      ? 1
      : -1

  return [...brands].sort(
    (
      firstBrand,
      secondBrand,
    ) => {
      const firstValue =
        getSortValue(
          firstBrand,
          sortField,
        )

      const secondValue =
        getSortValue(
          secondBrand,
          sortField,
        )

      if (
        typeof firstValue ===
          'string' &&
        typeof secondValue ===
          'string'
      ) {
        return (
          firstValue.localeCompare(
            secondValue,
            'es-MX',
          ) * direction
        )
      }

      return (
        (
          Number(firstValue) -
          Number(secondValue)
        ) * direction
      )
    },
  )
}

export function selectBrandById(
  brands:
    BrandIntelligenceItem[],

  selectedBrandId:
    string | null,
) {
  if (
    selectedBrandId === null
  ) {
    return null
  }

  return (
    brands.find(
      (brand) =>
        brand.brandId ===
        selectedBrandId,
    ) ?? null
  )
}