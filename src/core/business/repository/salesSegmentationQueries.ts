import type {
  BusinessSalesSegment,
} from '../entities/salesSegment'

import type {
  BusinessDataModel,
} from '../models'

export type SalesSegmentationDimension =
  | 'period'
  | 'brand'
  | 'customer'
  | 'product'
  | 'location'
  | 'salesRepresentative'

export interface SalesSegmentationFilter {
  periodIds?: readonly string[]
  brandIds?: readonly string[]
  customerIds?: readonly string[]
  productIds?: readonly string[]
  locationIds?: readonly string[]
  salesRepresentativeIds?: readonly string[]
  searchTerm?: string | null
}

export interface SalesSegmentationSummary {
  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number
  documents: number
  customerCount: number
  brandCount: number
  productCount: number
  rowCount: number
  segmentCount: number
}

export interface SalesSegmentationGroup {
  id: string
  label: string
  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number
  documents: number
  rowCount: number
}

export interface SalesSegmentationOption {
  id: string
  label: string
  revenue: number
}

export interface SalesSegmentationOptions {
  brands: SalesSegmentationOption[]
  customers: SalesSegmentationOption[]
  products: SalesSegmentationOption[]
  locations: SalesSegmentationOption[]
  salesRepresentatives: SalesSegmentationOption[]
}

export interface SalesSegmentationDetailRow {
  id: string
  periodId: string
  brandId: string
  brandLabel: string
  customerId: string | null
  customerLabel: string
  productId: string | null
  productLabel: string
  locationId: string | null
  locationLabel: string
  salesRepresentativeId: string | null
  salesRepresentativeLabel: string
  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number
  documents: number
  rowCount: number
}

function normalizeValue(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function normalizeList(
  values?: readonly string[],
): Set<string> | null {
  if (!values || values.length === 0) {
    return null
  }

  return new Set(
    values
      .map(normalizeValue)
      .filter(Boolean),
  )
}

function calculateGrossMargin(
  revenue: number,
  grossProfit: number,
): number {
  if (revenue === 0) {
    return 0
  }

  return (grossProfit / revenue) * 100
}

function compareGroups(
  left: SalesSegmentationGroup,
  right: SalesSegmentationGroup,
): number {
  return (
    right.revenue - left.revenue ||
    left.label.localeCompare(
      right.label,
      'es-MX',
    )
  )
}

export class SalesSegmentationQueries {
  private readonly model:
    BusinessDataModel

  private readonly filteredSegmentsCache =
    new Map<string, BusinessSalesSegment[]>()

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model
  }

  private getLabel(
    dimension: SalesSegmentationDimension,
    id: string,
  ): string {
    switch (dimension) {
      case 'brand':
        return (
          this.model.brands.get(id)?.name ??
          id
        )
      case 'customer': {
        const customer =
          this.model.customers.get(id)

        if (!customer) {
          return id
        }

        return customer.name
          ? `${customer.id} ${customer.name}`
          : customer.id
      }
      case 'product': {
        const product =
          this.model.products.get(id)

        if (!product) {
          return id
        }

        return (
          product.model ||
          product.sku ||
          product.id
        )
      }
      case 'location':
      case 'salesRepresentative':
      case 'period':
        return id
    }
  }

  private getDimensionId(
    segment: BusinessSalesSegment,
    dimension: SalesSegmentationDimension,
  ): string | null {
    switch (dimension) {
      case 'period':
        return segment.periodId
      case 'brand':
        return segment.brandId
      case 'customer':
        return segment.customerId
      case 'product':
        return segment.productId
      case 'location':
        return segment.locationId
      case 'salesRepresentative':
        return segment.salesRepresentativeId
    }
  }

  private matchesSearch(
    segment: BusinessSalesSegment,
    normalizedSearch: string | null,
  ): boolean {
    if (!normalizedSearch) {
      return true
    }

    const values = [
      segment.periodId,
      segment.brandId,
      this.getLabel('brand', segment.brandId),
      segment.customerId,
      segment.customerId
        ? this.getLabel('customer', segment.customerId)
        : null,
      segment.productId,
      segment.productId
        ? this.getLabel('product', segment.productId)
        : null,
      segment.locationId,
      segment.salesRepresentativeId,
    ]

    return values.some(
      (value) =>
        value !== null &&
        normalizeValue(value).includes(
          normalizedSearch,
        ),
    )
  }

  private getFilterCacheKey(
    filter: SalesSegmentationFilter,
  ): string {
    const normalizeValues = (
      values?: readonly string[],
    ) =>
      values
        ? [...values]
            .map(normalizeValue)
            .sort()
        : []

    return JSON.stringify({
      periods: normalizeValues(filter.periodIds),
      brands: normalizeValues(filter.brandIds),
      customers: normalizeValues(filter.customerIds),
      products: normalizeValues(filter.productIds),
      locations: normalizeValues(filter.locationIds),
      salesRepresentatives: normalizeValues(
        filter.salesRepresentativeIds,
      ),
      search: filter.searchTerm
        ? normalizeValue(filter.searchTerm)
        : '',
    })
  }

  private getFilteredSegments(
    filter: SalesSegmentationFilter = {},
  ): BusinessSalesSegment[] {
    const cacheKey =
      this.getFilterCacheKey(filter)

    const cached =
      this.filteredSegmentsCache.get(
        cacheKey,
      )

    if (cached) {
      return cached
    }

    const periods =
      normalizeList(filter.periodIds)
    const brands =
      normalizeList(filter.brandIds)
    const customers =
      normalizeList(filter.customerIds)
    const products =
      normalizeList(filter.productIds)
    const locations =
      normalizeList(filter.locationIds)
    const salesRepresentatives =
      normalizeList(
        filter.salesRepresentativeIds,
      )
    const normalizedSearch =
      filter.searchTerm
        ? normalizeValue(filter.searchTerm)
        : null

    const filtered = [
      ...(this.model.salesSegments?.values() ?? []),
    ].filter((segment) => {
      if (
        periods &&
        !periods.has(
          normalizeValue(segment.periodId),
        )
      ) {
        return false
      }

      if (
        brands &&
        !brands.has(
          normalizeValue(segment.brandId),
        )
      ) {
        return false
      }

      if (
        customers &&
        (
          !segment.customerId ||
          !customers.has(
            normalizeValue(segment.customerId),
          )
        )
      ) {
        return false
      }

      if (
        products &&
        (
          !segment.productId ||
          !products.has(
            normalizeValue(segment.productId),
          )
        )
      ) {
        return false
      }

      if (
        locations &&
        (
          !segment.locationId ||
          !locations.has(
            normalizeValue(segment.locationId),
          )
        )
      ) {
        return false
      }

      if (
        salesRepresentatives &&
        (
          !segment.salesRepresentativeId ||
          !salesRepresentatives.has(
            normalizeValue(
              segment.salesRepresentativeId,
            ),
          )
        )
      ) {
        return false
      }

      return this.matchesSearch(
        segment,
        normalizedSearch,
      )
    })

    if (this.filteredSegmentsCache.size >= 32) {
      const oldestKey =
        this.filteredSegmentsCache
          .keys()
          .next().value

      if (oldestKey) {
        this.filteredSegmentsCache.delete(
          oldestKey,
        )
      }
    }

    this.filteredSegmentsCache.set(
      cacheKey,
      filtered,
    )

    return filtered
  }

  summarize(
    filter: SalesSegmentationFilter = {},
  ): SalesSegmentationSummary {
    const segments =
      this.getFilteredSegments(filter)

    const documents =
      new Set<string>()
    const customers =
      new Set<string>()
    const brands =
      new Set<string>()
    const products =
      new Set<string>()

    let revenue = 0
    let grossProfit = 0
    let quantity = 0
    let rowCount = 0

    for (const segment of segments) {
      revenue += segment.revenue
      grossProfit += segment.grossProfit
      quantity += segment.quantity
      rowCount += segment.rowCount
      brands.add(segment.brandId)

      if (segment.customerId) {
        customers.add(segment.customerId)
      }

      if (segment.productId) {
        products.add(segment.productId)
      }

      for (
        const documentNumber of
        segment.documentNumbers
      ) {
        documents.add(documentNumber)
      }
    }

    return {
      revenue,
      grossProfit,
      grossMargin:
        calculateGrossMargin(
          revenue,
          grossProfit,
        ),
      quantity,
      documents: documents.size,
      customerCount: customers.size,
      brandCount: brands.size,
      productCount: products.size,
      rowCount,
      segmentCount: segments.length,
    }
  }

  groupBy(
    dimension: SalesSegmentationDimension,
    filter: SalesSegmentationFilter = {},
  ): SalesSegmentationGroup[] {
    const groups =
      new Map<
        string,
        {
          revenue: number
          grossProfit: number
          quantity: number
          rowCount: number
          documents: Set<string>
        }
      >()

    for (
      const segment of
      this.getFilteredSegments(filter)
    ) {
      const id =
        this.getDimensionId(
          segment,
          dimension,
        )

      if (!id) {
        continue
      }

      let group = groups.get(id)

      if (!group) {
        group = {
          revenue: 0,
          grossProfit: 0,
          quantity: 0,
          rowCount: 0,
          documents: new Set<string>(),
        }
        groups.set(id, group)
      }

      group.revenue += segment.revenue
      group.grossProfit += segment.grossProfit
      group.quantity += segment.quantity
      group.rowCount += segment.rowCount

      for (
        const documentNumber of
        segment.documentNumbers
      ) {
        group.documents.add(documentNumber)
      }
    }

    const result = [...groups.entries()]
      .map(([id, group]) => ({
        id,
        label: this.getLabel(dimension, id),
        revenue: group.revenue,
        grossProfit: group.grossProfit,
        grossMargin:
          calculateGrossMargin(
            group.revenue,
            group.grossProfit,
          ),
        quantity: group.quantity,
        documents: group.documents.size,
        rowCount: group.rowCount,
      }))

    if (dimension === 'period') {
      return result.sort(
        (left, right) =>
          left.id.localeCompare(right.id),
      )
    }

    return result.sort(compareGroups)
  }

  getOptions(
    periodId: string | null,
  ): SalesSegmentationOptions {
    const filter = periodId
      ? { periodIds: [periodId] }
      : {}

    const mapOptions = (
      dimension: Exclude<
        SalesSegmentationDimension,
        'period'
      >,
    ): SalesSegmentationOption[] =>
      this.groupBy(dimension, filter)
        .map((group) => ({
          id: group.id,
          label: group.label,
          revenue: group.revenue,
        }))
        .sort((left, right) =>
          left.label.localeCompare(
            right.label,
            'es-MX',
          ),
        )

    return {
      brands: mapOptions('brand'),
      customers: mapOptions('customer'),
      products: mapOptions('product'),
      locations: mapOptions('location'),
      salesRepresentatives:
        mapOptions('salesRepresentative'),
    }
  }

  getDetailRows(
    filter: SalesSegmentationFilter = {},
    limit = 100,
  ): SalesSegmentationDetailRow[] {
    const normalizedLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.floor(limit)
        : 0

    return this.getFilteredSegments(filter)
      .sort(
        (left, right) =>
          right.revenue - left.revenue ||
          left.id.localeCompare(right.id),
      )
      .slice(0, normalizedLimit)
      .map((segment) => ({
        id: segment.id,
        periodId: segment.periodId,
        brandId: segment.brandId,
        brandLabel:
          this.getLabel(
            'brand',
            segment.brandId,
          ),
        customerId: segment.customerId,
        customerLabel:
          segment.customerId
            ? this.getLabel(
                'customer',
                segment.customerId,
              )
            : 'Sin cliente',
        productId: segment.productId,
        productLabel:
          segment.productId
            ? this.getLabel(
                'product',
                segment.productId,
              )
            : 'Sin producto',
        locationId: segment.locationId,
        locationLabel:
          segment.locationId ??
          'Sin ubicación',
        salesRepresentativeId:
          segment.salesRepresentativeId,
        salesRepresentativeLabel:
          segment.salesRepresentativeId ??
          'Sin vendedor',
        revenue: segment.revenue,
        grossProfit: segment.grossProfit,
        grossMargin:
          calculateGrossMargin(
            segment.revenue,
            segment.grossProfit,
          ),
        quantity: segment.quantity,
        documents:
          segment.documentNumbers.size,
        rowCount: segment.rowCount,
      }))
  }
}
