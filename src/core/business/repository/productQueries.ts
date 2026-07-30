import type {
  BusinessDataModel,
} from '../models'

import type {
  BusinessProduct,
} from '../entities/product'

import type {
  BusinessProductPeriod,
} from '../entities/productPeriod'

import type {
  ProductSalesReconciliationSummary,
} from '../reconciliation'

import {
  createProductSalesReconciliationSummary,
} from '../reconciliation'

import {
  buildProductPeriodIndexes,
} from './productPeriodIndexes'

import {
  buildBrandAndModelKey,
  buildProductIndexes,
  normalizeProductIndexValue,
} from './productIndexes'

function normalizePeriodId(
  value: string,
): string {
  return value.trim()
}

function normalizeLimit(
  limit: number,
): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0
  }

  return Math.floor(limit)
}

export class ProductQueries {
  private readonly model:
    BusinessDataModel

  private readonly productsById:
    Map<string, BusinessProduct>

  private readonly productsByName:
    Map<string, BusinessProduct>

  private readonly productsByCode:
    Map<string, BusinessProduct>

  private readonly productsByErpInternalId:
    Map<string, BusinessProduct>

  private readonly productsByBrandId:
    Map<string, BusinessProduct[]>

  private readonly productsByModel:
    Map<string, BusinessProduct[]>

  private readonly productsByBrandAndModel:
    Map<string, BusinessProduct[]>

  private readonly productsByVendorName:
    Map<string, BusinessProduct[]>

  private readonly productsByClassification:
    Map<string, BusinessProduct[]>

  private readonly productsByCategory:
    Map<string, BusinessProduct[]>

  private readonly productsBySubcategory1:
    Map<string, BusinessProduct[]>

  private readonly productsBySubcategory2:
    Map<string, BusinessProduct[]>

  private readonly productsByCatalogStatus:
    Map<string, BusinessProduct[]>

  private readonly productsByCommercialStatus:
    Map<string, BusinessProduct[]>

  private readonly productsByIdentitySource:
    Map<string, BusinessProduct[]>

  private readonly periodsByProductId:
    Map<string, BusinessProductPeriod[]>

  private readonly periodsByPeriodId:
    Map<string, BusinessProductPeriod[]>

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model

    const productIndexes =
      buildProductIndexes(model)

    this.productsById =
      productIndexes.byId

    this.productsByName =
      productIndexes.byName

    this.productsByCode =
      productIndexes.byCode

    this.productsByErpInternalId =
      productIndexes.byErpInternalId

    this.productsByBrandId =
      productIndexes.byBrandId

    this.productsByModel =
      productIndexes.byModel

    this.productsByBrandAndModel =
      productIndexes.byBrandAndModel

    this.productsByVendorName =
      productIndexes.byVendorName

    this.productsByClassification =
      productIndexes.byClassification

    this.productsByCategory =
      productIndexes.byCategory

    this.productsBySubcategory1 =
      productIndexes.bySubcategory1

    this.productsBySubcategory2 =
      productIndexes.bySubcategory2

    this.productsByCatalogStatus =
      productIndexes.byCatalogStatus

    this.productsByCommercialStatus =
      productIndexes.byCommercialStatus

    this.productsByIdentitySource =
      productIndexes.byIdentitySource

    const periodIndexes =
      buildProductPeriodIndexes(model)

    this.periodsByProductId =
      periodIndexes.byProductId

    this.periodsByPeriodId =
      periodIndexes.byPeriodId
  }

  getAll(): BusinessProduct[] {
    return [...this.productsById.values()]
  }

  findById(
    id: string,
  ): BusinessProduct | undefined {
    const normalizedId =
      normalizeProductIndexValue(id)

    return normalizedId
      ? this.productsById.get(normalizedId)
      : undefined
  }

  findByName(
    name: string,
  ): BusinessProduct | undefined {
    const normalizedName =
      normalizeProductIndexValue(name)

    return normalizedName
      ? this.productsByName.get(normalizedName)
      : undefined
  }

  findByCode(
    code: string,
  ): BusinessProduct | undefined {
    const normalizedCode =
      normalizeProductIndexValue(code)

    return normalizedCode
      ? this.productsByCode.get(normalizedCode)
      : undefined
  }

  findByErpInternalId(
    erpInternalId: string,
  ): BusinessProduct | undefined {
    const normalizedErpInternalId =
      normalizeProductIndexValue(erpInternalId)

    return normalizedErpInternalId
      ? this.productsByErpInternalId.get(
          normalizedErpInternalId,
        )
      : undefined
  }

  findByBrand(
    brandId: string,
  ): BusinessProduct[] {
    const normalizedBrandId =
      normalizeProductIndexValue(brandId)

    const products =
      this.productsByBrandId.get(normalizedBrandId)

    return products ? [...products] : []
  }

  findByModel(
    model: string,
  ): BusinessProduct[] {
    const normalizedModel =
      normalizeProductIndexValue(model)

    const products =
      this.productsByModel.get(normalizedModel)

    return products ? [...products] : []
  }

  findByBrandAndModel(
    brandId: string,
    model: string,
  ): BusinessProduct[] {
    const key =
      buildBrandAndModelKey(brandId, model)

    const products =
      this.productsByBrandAndModel.get(key)

    return products ? [...products] : []
  }

  findUniqueByBrandAndModel(
    brandId: string,
    model: string,
  ): BusinessProduct | undefined {
    const products =
      this.findByBrandAndModel(brandId, model)

    return products.length === 1
      ? products[0]
      : undefined
  }

  private findInGroupedIndex(
    index: Map<string, BusinessProduct[]>,
    value: string,
  ): BusinessProduct[] {
    const normalizedValue =
      normalizeProductIndexValue(value)

    if (!normalizedValue) {
      return []
    }

    const products = index.get(normalizedValue)
    return products ? [...products] : []
  }

  findByVendor(
    vendorName: string,
  ): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsByVendorName,
      vendorName,
    )
  }

  findByClassification(
    classification: string,
  ): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsByClassification,
      classification,
    )
  }

  findByCategory(
    category: string,
  ): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsByCategory,
      category,
    )
  }

  findBySubcategory1(
    subcategory: string,
  ): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsBySubcategory1,
      subcategory,
    )
  }

  findBySubcategory2(
    subcategory: string,
  ): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsBySubcategory2,
      subcategory,
    )
  }

  findByCatalogStatus(
    status: string,
  ): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsByCatalogStatus,
      status,
    )
  }

  findByCommercialStatus(
    status: string,
  ): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsByCommercialStatus,
      status,
    )
  }

  findCatalogProducts(): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsByIdentitySource,
      'product_master',
    )
  }

  findSalesFallbackProducts(): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsByIdentitySource,
      'sales_fallback',
    )
  }

  findAmbiguousProducts(): BusinessProduct[] {
    return this.findInGroupedIndex(
      this.productsByIdentitySource,
      'ambiguous_match',
    )
  }

  getReconciliationSummary():
    ProductSalesReconciliationSummary {
    return {
      ...(this.model.productReconciliation ??
        createProductSalesReconciliationSummary()),
    }
  }

  getReconciliationRate(): number {
    return this.getReconciliationSummary().matchRate
  }

  findTopRevenue(
    limit: number,
  ): BusinessProduct[] {
    const normalizedLimit =
      normalizeLimit(limit)

    return this.getAll()
      .sort(
        (left, right) =>
          right.revenue - left.revenue ||
          left.id.localeCompare(right.id),
      )
      .slice(0, normalizedLimit)
  }

  findTopGrossProfit(
    limit: number,
  ): BusinessProduct[] {
    const normalizedLimit =
      normalizeLimit(limit)

    return this.getAll()
      .sort(
        (left, right) =>
          right.grossProfit - left.grossProfit ||
          left.id.localeCompare(right.id),
      )
      .slice(0, normalizedLimit)
  }

  findInactive(): BusinessProduct[] {
    return this.getAll()
      .filter(
        (product) =>
          product.activePeriods.size === 0 ||
          product.revenue === 0,
      )
      .sort(
        (left, right) =>
          left.id.localeCompare(right.id),
      )
  }

  findPeriod(
    productId: string,
    periodId: string,
  ): BusinessProductPeriod | undefined {
    const normalizedProductId =
      normalizeProductIndexValue(productId)

    const normalizedPeriodId =
      normalizePeriodId(periodId)

    if (!normalizedProductId || !normalizedPeriodId) {
      return undefined
    }

    return this.model.productPeriods.get(
      `${normalizedPeriodId}::${normalizedProductId}`,
    )
  }

  findTimeline(
    productId: string,
  ): BusinessProductPeriod[] {
    const normalizedProductId =
      normalizeProductIndexValue(productId)

    if (!normalizedProductId) {
      return []
    }

    const periods =
      this.periodsByProductId.get(normalizedProductId)

    return periods ? [...periods] : []
  }

  findPeriodsByProductId(
    productId: string,
  ): BusinessProductPeriod[] {
    return this.findTimeline(productId)
  }

  findPeriodsByPeriodId(
    periodId: string,
  ): BusinessProductPeriod[] {
    const normalizedPeriodId =
      normalizePeriodId(periodId)

    if (!normalizedPeriodId) {
      return []
    }

    const periods =
      this.periodsByPeriodId.get(normalizedPeriodId)

    return periods ? [...periods] : []
  }

  getActivePeriodCount(
    productId: string,
  ): number {
    return this.findById(productId)
      ?.activePeriods.size ?? 0
  }

  getCustomerIds(
    productId: string,
  ): string[] {
    return [
      ...(this.findById(productId)?.customers ?? []),
    ].sort((left, right) => left.localeCompare(right))
  }

  getBrandIds(
    productId: string,
  ): string[] {
    return [
      ...(this.findById(productId)?.brands ?? []),
    ].sort((left, right) => left.localeCompare(right))
  }

  getLocations(
    productId: string,
  ): string[] {
    return [
      ...(this.findById(productId)?.locations ?? []),
    ].sort((left, right) => left.localeCompare(right))
  }
}
