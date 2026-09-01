import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import type {
  NormalizedProductMasterRow,
} from '../../../features/data-center/importers/products/productMasterTypes'

import type {
  NormalizedCustomerMasterRow,
} from '../../../features/data-center/importers/customers/customerMasterTypes'

import type {
  NormalizedInventoryRow,
} from '../../../features/data-center/importers/inventory/inventoryTypes'

import type {
  NormalizedPurchaseOrderRow,
} from '../../../features/data-center/importers/purchases/purchaseOrderTypes'

import type {
  NormalizedPurchaseRequestRow,
} from '../../../features/data-center/importers/purchase-requests/purchaseRequestTypes'

import type {
  NormalizedProjectRow,
} from '../../../features/data-center/importers/projects/projectTypes'

import type {
  NormalizedProjectBillingRow,
} from '../../../features/data-center/importers/project-billings/projectBillingTypes'

import type {
  NormalizedExchangeRateRow,
} from '../../../features/data-center/importers/exchange-rates/exchangeRateTypes'

import type {
  BusinessPriceInput,
  BusinessPriceScenarioInput,
} from '../pricing'

import type {
  BusinessBrand,
} from '../entities/brand'

import type {
  BusinessBrandPeriod,
} from '../entities/brandPeriod'

import type {
  BusinessCustomer,
} from '../entities/customer'

import type {
  BusinessCustomerPeriod,
} from '../entities/customerPeriod'

import type {
  BusinessCustomerBrandPeriod,
} from '../entities/customerBrandPeriod'

import type {
  BusinessProduct,
} from '../entities/product'

import type {
  BusinessProductPeriod,
} from '../entities/productPeriod'

import type {
  BusinessSalesSegment,
} from '../entities/salesSegment'

import type {
  BusinessSalesTransactionDocument,
  BusinessSalesTransactionLine,
} from '../entities/salesTransaction'

import type {
  BusinessDataModel,
  BusinessPeriod,
} from '../models/businessDataModel'

import type {
  BusinessBrandTargetInput,
} from '../targets'

import {
  buildBusinessBrandTargets,
} from '../targets'

import {
  buildProductSalesReconciliationIndex,
  createProductSalesReconciliationSummary,
  getProductMasterName,
  reconcileSalesProduct,
  registerProductSalesReconciliationResult,
} from '../reconciliation'

import type {
  ProductSalesReconciliationStatus,
} from '../reconciliation'

import {
  buildBusinessInventory,
} from './buildBusinessInventory'

import {
  buildBusinessProjects,
} from './buildBusinessProjects'

import {
  buildBusinessProjectBillings,
} from './buildBusinessProjectBillings'

import {
  buildBusinessPurchaseOrders,
} from './buildBusinessPurchaseOrders'

import {
  buildBusinessPurchaseRequests,
} from './buildBusinessPurchaseRequests'

import {
  buildBusinessExchangeRates,
} from './buildBusinessExchangeRates'

import {
  buildBusinessPrices,
} from './buildBusinessPrices'

import {
  createProductIdentityQualityAccumulator,
  finalizeProductIdentityQualityReport,
  registerProductIdentityQualityResult,
} from '../quality'

function normalizeIdentifier(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value
      .trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

  return normalizedValue || null
}

function normalizeText(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value
      .trim()
      .replace(/\s+/g, ' ')

  return normalizedValue || null
}

function parseDate(
  value: string,
): Date | null {
  const parsedDate =
    new Date(value)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return null
  }

  return parsedDate
}

function toIsoDate(
  date: Date,
): string {
  return date
    .toISOString()
    .slice(0, 10)
}

function getPeriodId(
  date: Date,
): string {
  const year =
    date.getUTCFullYear()

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, '0')

  return `${year}-${month}`
}

function getBrandPeriodId(
  periodId: string,
  brandId: string,
): string {
  return `${periodId}::${brandId}`
}

function getCustomerPeriodId(
  periodId: string,
  customerId: string,
): string {
  return `${periodId}::${customerId}`
}

function getProductPeriodId(
  periodId: string,
  productId: string,
): string {
  return `${periodId}::${productId}`
}

function getCustomerBrandPeriodId(
  periodId: string,
  customerId: string,
  brandId: string,
): string {
  return `${periodId}::${customerId}::${brandId}`
}

function getSalesSegmentId(
  dateId: string,
  periodId: string,
  brandId: string,
  customerId: string | null,
  productId: string | null,
  locationId: string | null,
  salesRepresentativeId: string | null,
): string {
  return [
    dateId,
    periodId,
    brandId,
    customerId ?? 'NO_CUSTOMER',
    productId ?? 'NO_PRODUCT',
    locationId ?? 'NO_LOCATION',
    salesRepresentativeId ?? 'NO_SALES_REP',
  ].join('::')
}

function createBusinessSalesSegment(
  dateId: string,
  periodId: string,
  brandId: string,
  customerId: string | null,
  productId: string | null,
  locationId: string | null,
  salesRepresentativeId: string | null,
): BusinessSalesSegment {
  return {
    id: getSalesSegmentId(
      dateId,
      periodId,
      brandId,
      customerId,
      productId,
      locationId,
      salesRepresentativeId,
    ),
    dateId,
    periodId,
    brandId,
    customerId,
    productId,
    locationId,
    salesRepresentativeId,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    rowCount: 0,
    documentNumbers: new Set<string>(),
  }
}

function createBusinessPeriod(
  date: Date,
): BusinessPeriod {
  const year =
    date.getUTCFullYear()

  const month =
    date.getUTCMonth() + 1

  const periodStart =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
      ),
    )

  const periodEnd =
    new Date(
      Date.UTC(
        year,
        month,
        0,
      ),
    )

  return {
    id: getPeriodId(date),

    year,
    month,

    periodStart:
      toIsoDate(periodStart),

    periodEnd:
      toIsoDate(periodEnd),

    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,

    customers:
      new Set<string>(),

    brands:
      new Set<string>(),

    products:
      new Set<string>(),
  }
}

function createBusinessCustomer(
  customerId: string,
  customerName: string | null,
  rowDate: string,
): BusinessCustomer {
  return {
    id: customerId,

    name:
      customerName ??
      `Cliente ${customerId}`,

      identitySource:
      'sales_fallback',

    firstPurchase:
      rowDate,

    lastPurchase:
      rowDate,

    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,

    brands:
      new Set<string>(),

    products:
      new Set<string>(),

    locations:
      new Set<string>(),

    activePeriods:
      new Set<string>(),
  }
}

function createBusinessCustomerFromMaster(
  source: NormalizedCustomerMasterRow,
): BusinessCustomer {
  return {
    id:
      source.customerId,

    name:
      source.name,

    erpInternalId:
      source.internalId,

    isDuplicate:
      source.isDuplicate,

    primaryContact:
      source.primaryContact,

    category:
      source.category,

    salesRep:
      source.salesRep,

    salesRepLocation:
      source.salesRepLocation,

    assignedKam:
      source.assignedKam,

    lastSaleDate:
      source.lastSaleDate,

    inactiveDate:
      source.inactiveDate,

    phone:
      source.phone,

    email:
      source.email,

    location:
      source.location,

    hasPhysicalLocation:
      source.hasPhysicalLocation,

    department:
      source.department,

    specialtyBrands:
      source.specialtyBrands,

    previousSalesRep:
      source.previousSalesRep,

    customerRegistrationForm:
      source.customerRegistrationForm,

    priceLevel:
      source.priceLevel,

    whatsapp:
      source.whatsapp,

    serviceSegment:
      source.serviceSegment,

    taxId:
      source.taxId,

    catalogDelivered:
      source.catalogDelivered,

    registrationDate:
      source.registrationDate,

    portalAccessBlocked:
      source.portalAccessBlocked,

    contactLetter:
      source.contactLetter,

    billingVersion:
      source.billingVersion,

    salesClassification:
      source.salesClassification,

    frequencyClassification:
      source.frequencyClassification,

    purchaseAmountClassification:
      source.purchaseAmountClassification,

    permanentFreeLocalShipping:
      source.permanentFreeLocalShipping,

    identitySource:
      'customer_master',

    firstPurchase:
      null,

    lastPurchase:
      null,

    revenue: 0,

    grossProfit: 0,

    quantity: 0,

    documents: 0,

    brands:
      new Set<string>(),

    products:
      new Set<string>(),

    locations:
      new Set<string>(),

    activePeriods:
      new Set<string>(),
  }
}

function createBusinessCustomerPeriod(
  customerId: string,
  periodId: string,
): BusinessCustomerPeriod {
  return {
    id:
      getCustomerPeriodId(
        periodId,
        customerId,
      ),

    customerId,
    periodId,

    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,

    brands:
      new Set<string>(),

    products:
      new Set<string>(),

    locations:
      new Set<string>(),
  }
}

function createBusinessCustomerBrandPeriod(
  customerId: string,
  brandId: string,
  periodId: string,
): BusinessCustomerBrandPeriod {
  return {
    id: getCustomerBrandPeriodId(
      periodId,
      customerId,
      brandId,
    ),
    customerId,
    brandId,
    periodId,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    products: new Set<string>(),
  }
}

function createBusinessBrand(
  brandId: string,
  brandName: string,
): BusinessBrand {
  return {
    id: brandId,

    name: brandName,

    revenue: 0,
    grossProfit: 0,
    quantity: 0,

    customers:
      new Set<string>(),

    products:
      new Set<string>(),
  }
}

function createBusinessBrandPeriod(
  brandId: string,
  periodId: string,
): BusinessBrandPeriod {
  return {
    id:
      getBrandPeriodId(
        periodId,
        brandId,
      ),

    brandId,
    periodId,

    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,

    customers:
      new Set<string>(),

    products:
      new Set<string>(),
  }
}

function createBusinessProductPeriod(
  productId: string,
  periodId: string,
): BusinessProductPeriod {
  return {
    id: getProductPeriodId(periodId, productId),
    productId,
    periodId,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    customers: new Set<string>(),
    brands: new Set<string>(),
    locations: new Set<string>(),
  }
}

function createBusinessProductFromMaster(
  source: NormalizedProductMasterRow,
): BusinessProduct {
  return {
    id: getProductMasterName(source),
    name: getProductMasterName(source),
    code: source.code,
    model: source.model,
    sku: getProductMasterName(source),
    erpInternalId: source.erpInternalId,
    brandId:
      normalizeIdentifier(source.brand) ??
      source.brand,
    brand: source.brand,
    identitySource: 'product_master',
    vendorCode: source.vendorCode,
    vendorName:
      source.vendorName ??
      source.preferredVendor,
    description: source.description,
    classification:
      source.classification ??
      source.productClass,
    commercialStatus: source.commercialStatus,
    trend: source.trend,
    category:
      source.category ??
      source.productClass,
    subcategory1:
      source.subcategory1 ??
      source.secondaryCategory1,
    subcategory2:
      source.subcategory2 ??
      source.secondaryCategory2,
    createdAt:
      source.createdAt ??
      null,
    updatedAt:
      source.updatedAt ??
      null,
    averageCostUsd: source.averageCostUsd,
    totalValue: source.totalValue,
    currency: source.currency,
    inventoryValueMxn: source.inventoryValueMxn,
    inventoryValueUsd: source.inventoryValueUsd,
    lastPurchaseDate: source.lastPurchaseDate,
    lastCatalogSaleDate: source.lastSaleDate,
    unitsSoldLast90Days: source.unitsSoldLast90Days,
    preferredVendor: source.preferredVendor,
    productClass: source.productClass,
    secondaryCategory1: source.secondaryCategory1,
    secondaryCategory2: source.secondaryCategory2,
    quantityPricingSchedule: source.quantityPricingSchedule,
    formulaText: source.formulaText,
    onHand: source.onHand,
    onOrder: source.onOrder,
    catalogStatus: source.catalogStatus,
    inactiveForPurchases: source.inactiveForPurchases,
    showOnPortal: source.showOnPortal,
    supersededBy: source.supersededBy,
    blockPurchaseRequests: source.blockPurchaseRequests,
    directSubstitute: source.directSubstitute,
    benchmarkS: source.benchmarkS,
    benchmarkT: source.benchmarkT,
    benchmarkO: source.benchmarkO,
    firstSale: null,
    lastSale: null,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    activePeriods: new Set<string>(),
    brands: new Set<string>(),
    customers: new Set<string>(),
    locations: new Set<string>(),
  }
}

function createFallbackBusinessProduct(
  productId: string,
  model: string,
  brand: string,
  sourceName: string | null,
  sourceCode: string | null,
  ambiguous = false,
  historicalUnlisted = false,
): BusinessProduct {
  const fallbackCode =
    ambiguous
      ? productId
      : sourceName ?? sourceCode ?? productId

  return {
    id: productId,
    name: sourceName ?? fallbackCode,
    code: sourceCode ?? fallbackCode,
    model,
    sku: fallbackCode,
    erpInternalId: null,
    brandId:
      normalizeIdentifier(brand) ??
      brand,
    brand,
    identitySource: ambiguous
      ? 'ambiguous_match'
      : historicalUnlisted
        ? 'historical_unlisted'
        : 'sales_fallback',
    vendorCode: null,
    vendorName: null,
    description: null,
    classification: null,
    commercialStatus: null,
    trend: null,
    category: null,
    subcategory1: null,
    subcategory2: null,
    createdAt: null,
    updatedAt: null,
    averageCostUsd: null,
    totalValue: null,
    currency: null,
    inventoryValueMxn: null,
    inventoryValueUsd: null,
    lastPurchaseDate: null,
    lastCatalogSaleDate: null,
    unitsSoldLast90Days: null,
    preferredVendor: null,
    productClass: null,
    secondaryCategory1: null,
    secondaryCategory2: null,
    quantityPricingSchedule: null,
    formulaText: null,
    onHand: null,
    onOrder: null,
    catalogStatus: null,
    inactiveForPurchases: null,
    showOnPortal: null,
    supersededBy: null,
    blockPurchaseRequests: null,
    directSubstitute: null,
    benchmarkS: null,
    benchmarkT: null,
    benchmarkO: null,
    firstSale: null,
    lastSale: null,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    activePeriods: new Set<string>(),
    brands: new Set<string>(),
    customers: new Set<string>(),
    locations: new Set<string>(),
  }
}

function getFallbackProductId(
  products: Map<string, BusinessProduct>,
  brandId: string,
  productModel: string | null,
  productName: string | null,
  productCode: string | null,
  status: ProductSalesReconciliationStatus,
): string | null {
  const baseId =
    normalizeIdentifier(productName) ??
    normalizeIdentifier(productCode) ??
    normalizeIdentifier(productModel)

  if (!baseId) {
    return null
  }

  if (status === 'ambiguous') {
    return `AMBIGUOUS::${brandId}::${baseId}`
  }

  const existingProduct = products.get(baseId)

  if (!existingProduct) {
    return baseId
  }

  const existingBrandId =
    normalizeIdentifier(
      existingProduct.brandId ??
      existingProduct.brand,
    )

  const existingModel =
    normalizeIdentifier(existingProduct.model)

  const normalizedProductModel =
    normalizeIdentifier(productModel)

  if (
    existingProduct.identitySource !== 'product_master' &&
    existingBrandId === brandId &&
    existingModel === normalizedProductModel
  ) {
    return baseId
  }

  return `SALES::${brandId}::${baseId}`
}

function updateModelPeriodRange(
  model: BusinessDataModel,
  rowDate: string,
): void {
  if (
    !model.periodStart ||
    rowDate < model.periodStart
  ) {
    model.periodStart =
      rowDate
  }

  if (
    !model.periodEnd ||
    rowDate > model.periodEnd
  ) {
    model.periodEnd =
      rowDate
  }
}

export interface BuildBusinessDataModelOptions {
  brandTargets?: readonly BusinessBrandTargetInput[]
  productMaster?: readonly NormalizedProductMasterRow[]
  customerMaster?: readonly NormalizedCustomerMasterRow[]
  inventory?: readonly NormalizedInventoryRow[]

  purchaseOrders?:
    readonly NormalizedPurchaseOrderRow[]

  purchaseRequests?:
    readonly NormalizedPurchaseRequestRow[]

  projects?: readonly NormalizedProjectRow[]
  projectBillings?: readonly NormalizedProjectBillingRow[]
  exchangeRates?: readonly NormalizedExchangeRateRow[]
  prices?: readonly BusinessPriceInput[]
  priceScenarios?: readonly BusinessPriceScenarioInput[]
}

export function buildBusinessDataModel(
  rows: NormalizedSalesRow[],
  options: BuildBusinessDataModelOptions = {},
): BusinessDataModel {
  const brandTargetsResult =
    buildBusinessBrandTargets(
      options.brandTargets ?? [],
    )

  const model: BusinessDataModel = {
    generatedAt:
      new Date().toISOString(),

    periodStart: null,
    periodEnd: null,

    totals: {
      revenue: 0,
      grossProfit: 0,
      quantity: 0,
      documents: 0,
    },

    customers:
      new Map<
        string,
        BusinessCustomer
      >(),

    customerPeriods:
      new Map<
        string,
        BusinessCustomerPeriod
      >(),

    customerBrandPeriods:
      new Map<
        string,
        BusinessCustomerBrandPeriod
      >(),

    brands:
      new Map<
        string,
        BusinessBrand
      >(),

    brandPeriods:
      new Map<
        string,
        BusinessBrandPeriod
      >(),

    brandTargets:
      brandTargetsResult.brandTargets,

    products:
      new Map<
        string,
        BusinessProduct
      >(),

    productPeriods:
      new Map<
        string,
        BusinessProductPeriod
      >(),

    salesSegments:
      new Map<
        string,
        BusinessSalesSegment
      >(),

    salesTransactionLines:
      new Map<
        string,
        BusinessSalesTransactionLine
      >(),

    salesDocuments:
      new Map<
        string,
        BusinessSalesTransactionDocument
      >(),

    productReconciliation:
      createProductSalesReconciliationSummary(),

    inventoryPositions:
      new Map(),

    inventorySnapshots:
      new Map(),

    projects:
      new Map(),

    projectBillings:
      new Map(),

    projectBillingLines:
      new Map(),

    purchaseOrders:
      new Map(),

    purchaseOrderLines:
      new Map(),

    purchaseRequests:
      new Map(),

    exchangeRates:
      new Map(),

    prices:
      new Map(),

    priceScenarios:
      new Map(),

    pricingSummary: {
      totalPrices: 0,
      totalScenarios: 0,
      uniqueProducts: 0,
      uniqueBrands: 0,
      uniqueCurrencies: 0,
      pricesWithNegativeMargin: 0,
      pricesWithoutEffectiveDate: 0,
      invalidPriceInputs: 0,
      invalidScenarioInputs: 0,
      duplicatePriceRecords: 0,
      duplicateScenarioRecords: 0,
      blockingIssues: 0,
      warningIssues: 0,
    },

    pricingQualityIssues:
      [],

    periods:
      new Map<
        string,
        BusinessPeriod
      >(),

    documentNumbers:
      new Set<string>(),

    locations:
      new Set<string>(),

    salesRepresentatives:
      new Set<string>(),

    currencies:
      new Set<string>(),

    processedRows: 0,
    ignoredRows: 0,
  }

  const customerMaster =
    options.customerMaster ?? []

  for (const source of customerMaster) {
    if (
      !source.customerId ||
      !source.name
    ) {
      continue
    }

    if (
      !model.customers.has(
        source.customerId,
      )
    ) {
      model.customers.set(
        source.customerId,
        createBusinessCustomerFromMaster(
          source,
        ),
      )
    }
  }


  const productMaster =
    options.productMaster ?? []

  const productIdentityQuality =
    createProductIdentityQualityAccumulator(
      productMaster.length,
    )

  const productReconciliationIndex =
    buildProductSalesReconciliationIndex(
      productMaster,
    )

  for (const source of productMaster) {
    const name = normalizeIdentifier(
      getProductMasterName(source),
    )

    if (!name) {
      continue
    }

    if (!model.products.has(name)) {
      model.products.set(
        name,
        createBusinessProductFromMaster({
          ...source,
          name,
          code: normalizeIdentifier(source.code) ?? name,
        }),
      )
    }
  }

  const inventory = buildBusinessInventory(
    options.inventory ?? [],
    model.products,
  )

  model.inventoryPositions = inventory.positions
  model.inventorySnapshots = inventory.snapshots

  model.projects = buildBusinessProjects(
    options.projects ?? [],
  )

  const projectBillings = buildBusinessProjectBillings(
    options.projectBillings ?? [],
  )

  model.projectBillings = projectBillings.documents
  model.projectBillingLines = projectBillings.lines

  const purchaseOrders =
    buildBusinessPurchaseOrders(
      options.purchaseOrders ?? [],
    )

  model.purchaseOrders =
    purchaseOrders.orders

  model.purchaseOrderLines =
    purchaseOrders.lines

  const purchaseRequests =
    buildBusinessPurchaseRequests(
      options.purchaseRequests ?? [],
    )

  model.purchaseRequests =
    purchaseRequests.requests

  model.exchangeRates = buildBusinessExchangeRates(
    options.exchangeRates ?? [],
  )

  const periodDocuments =
    new Map<
      string,
      Set<string>
    >()

  const customerDocuments =
    new Map<
      string,
      Set<string>
    >()

  const customerPeriodDocuments =
    new Map<
      string,
      Set<string>
    >()

  const brandPeriodDocuments =
    new Map<
      string,
      Set<string>
    >()

  const productDocuments =
    new Map<string, Set<string>>()

  const productPeriodDocuments =
    new Map<string, Set<string>>()

  const customerBrandPeriodDocuments =
    new Map<
      string,
      Set<string>
    >()

  for (
    const [
      rowIndex,
      row,
    ] of rows.entries()
  ) {
    const parsedDate =
      parseDate(row.date)

    const brandId =
      normalizeIdentifier(
        row.brand,
      )

    if (
      !parsedDate ||
      !brandId
    ) {
      model.ignoredRows += 1
      continue
    }

    model.processedRows += 1

    const rowDate =
      toIsoDate(parsedDate)

    const periodId =
      getPeriodId(parsedDate)

    const brandPeriodId =
      getBrandPeriodId(
        periodId,
        brandId,
      )

    const brandName =
      normalizeText(row.brand) ??
      brandId

    const customerId =
      normalizeIdentifier(
        row.customerId,
      )

    const customerPeriodId =
      customerId
        ? getCustomerPeriodId(
            periodId,
            customerId,
          )
        : null

    const customerName =
      normalizeText(
        row.customerName,
      )

    const productModel =
      normalizeText(row.model)

    const productReconciliation =
      reconcileSalesProduct(
        row,
        productReconciliationIndex,
      )

    if (model.productReconciliation) {
      registerProductSalesReconciliationResult(
        model.productReconciliation,
        productReconciliation,
      )
    }

    registerProductIdentityQualityResult(
      productIdentityQuality,
      row,
      productReconciliation,
    )

    const matchedProduct =
      productReconciliation.product

    const sourceProductName =
      productReconciliation.normalizedProductName

    const sourceProductCode =
      productReconciliation.normalizedProductCode

    const resolvedProductModel =
      matchedProduct?.model ??
      productModel ??
      sourceProductName ??
      sourceProductCode

    const productId =
      matchedProduct
        ? normalizeIdentifier(
            getProductMasterName(matchedProduct),
          )
        : getFallbackProductId(
            model.products,
            brandId,
            resolvedProductModel,
            sourceProductName,
            sourceProductCode,
            productReconciliation.status,
          )

    const documentNumber =
      normalizeIdentifier(
        row.documentNumber,
      )

    const location =
      normalizeIdentifier(
        row.location,
      )

    const salesRepresentative =
      normalizeIdentifier(
        row.salesRep,
      )

    const currency =
      normalizeIdentifier(
        row.currency,
      )

    if (documentNumber) {
      const salesLineId =
        `SALES::${String(rowIndex + 1).padStart(8, '0')}`

      const salesLine:
        BusinessSalesTransactionLine = {
          id: salesLineId,
          date: rowDate,
          periodId,
          documentNumber,
          brandId,
          customerId,
          customerName,
          productId,
          locationId: location,
          salesRepresentativeId: salesRepresentative,
          currency,
          revenue: row.revenue,
          grossProfit: row.grossProfit,
          quantity: row.quantity,
        }

      model.salesTransactionLines?.set(
        salesLineId,
        salesLine,
      )

      let salesDocument =
        model.salesDocuments?.get(
          documentNumber,
        )

      if (!salesDocument) {
        salesDocument = {
          id: documentNumber,
          documentNumber,
          firstDate: rowDate,
          lastDate: rowDate,
          revenue: 0,
          grossProfit: 0,
          quantity: 0,
          lineCount: 0,
          lineIds: new Set<string>(),
          periodIds: new Set<string>(),
          brandIds: new Set<string>(),
          customerIds: new Set<string>(),
          productIds: new Set<string>(),
          locationIds: new Set<string>(),
          salesRepresentativeIds: new Set<string>(),
          currencies: new Set<string>(),
        }

        model.salesDocuments?.set(
          documentNumber,
          salesDocument,
        )
      }

      salesDocument.firstDate =
        rowDate < salesDocument.firstDate
          ? rowDate
          : salesDocument.firstDate

      salesDocument.lastDate =
        rowDate > salesDocument.lastDate
          ? rowDate
          : salesDocument.lastDate

      salesDocument.revenue += row.revenue
      salesDocument.grossProfit += row.grossProfit
      salesDocument.quantity += row.quantity
      salesDocument.lineCount += 1
      salesDocument.lineIds.add(salesLineId)
      salesDocument.periodIds.add(periodId)
      salesDocument.brandIds.add(brandId)

      if (customerId) {
        salesDocument.customerIds.add(customerId)
      }

      if (productId) {
        salesDocument.productIds.add(productId)
      }

      if (location) {
        salesDocument.locationIds.add(location)
      }

      if (salesRepresentative) {
        salesDocument.salesRepresentativeIds.add(
          salesRepresentative,
        )
      }

      if (currency) {
        salesDocument.currencies.add(currency)
      }
    }

    const salesSegmentId =
      getSalesSegmentId(
        rowDate,
        periodId,
        brandId,
        customerId,
        productId,
        location,
        salesRepresentative,
      )

    let salesSegment =
      model.salesSegments?.get(
        salesSegmentId,
      )

    if (!salesSegment) {
      salesSegment =
        createBusinessSalesSegment(
          rowDate,
          periodId,
          brandId,
          customerId,
          productId,
          location,
          salesRepresentative,
        )

      model.salesSegments?.set(
        salesSegmentId,
        salesSegment,
      )
    }

    salesSegment.revenue += row.revenue
    salesSegment.grossProfit += row.grossProfit
    salesSegment.quantity += row.quantity
    salesSegment.rowCount += 1

    if (documentNumber) {
      salesSegment.documentNumbers.add(
        documentNumber,
      )
    }

    updateModelPeriodRange(
      model,
      rowDate,
    )

    model.totals.revenue +=
      row.revenue

    model.totals.grossProfit +=
      row.grossProfit

    model.totals.quantity +=
      row.quantity

    if (documentNumber) {
      model.documentNumbers.add(
        documentNumber,
      )
    }

    if (location) {
      model.locations.add(
        location,
      )
    }

    if (salesRepresentative) {
      model.salesRepresentatives.add(
        salesRepresentative,
      )
    }

    if (currency) {
      model.currencies.add(
        currency,
      )
    }

    let brand =
      model.brands.get(
        brandId,
      )

    if (!brand) {
      brand =
        createBusinessBrand(
          brandId,
          brandName,
        )

      model.brands.set(
        brandId,
        brand,
      )
    }

    brand.revenue +=
      row.revenue

    brand.grossProfit +=
      row.grossProfit

    brand.quantity +=
      row.quantity

    if (customerId) {
      brand.customers.add(
        customerId,
      )
    }

    if (productId) {
      brand.products.add(
        productId,
      )
    }

    if (customerId) {
      let customer =
        model.customers.get(
          customerId,
        )

      if (!customer) {
        customer =
          createBusinessCustomer(
            customerId,
            customerName,
            rowDate,
          )

        model.customers.set(
          customerId,
          customer,
        )
      }

      if (
        customerName &&
        customer.identitySource !==
          'customer_master'
      ) {
        customer.name =
          customerName
      }

      if (
        !customer.firstPurchase ||
        rowDate <
          customer.firstPurchase
      ) {
        customer.firstPurchase =
          rowDate
      }

      if (
        !customer.lastPurchase ||
        rowDate >
          customer.lastPurchase
      ) {
        customer.lastPurchase =
          rowDate
      }

      customer.revenue +=
        row.revenue

      customer.grossProfit +=
        row.grossProfit

      customer.quantity +=
        row.quantity

      customer.activePeriods.add(
        periodId,
      )

      customer.brands.add(
        brandId,
      )

      if (productId) {
        customer.products.add(
          productId,
        )
      }

      if (location) {
        customer.locations.add(
          location,
        )
      }

      if (documentNumber) {
        let documents =
          customerDocuments.get(
            customerId,
          )

        if (!documents) {
          documents =
            new Set<string>()

          customerDocuments.set(
            customerId,
            documents,
          )
        }

        documents.add(
          documentNumber,
        )
      }

      if (customerPeriodId) {
        let customerPeriod =
          model.customerPeriods.get(
            customerPeriodId,
          )

        if (!customerPeriod) {
          customerPeriod =
            createBusinessCustomerPeriod(
              customerId,
              periodId,
            )

          model.customerPeriods.set(
            customerPeriodId,
            customerPeriod,
          )
        }

        customerPeriod.revenue +=
          row.revenue

        customerPeriod.grossProfit +=
          row.grossProfit

        customerPeriod.quantity +=
          row.quantity

        customerPeriod.brands.add(
          brandId,
        )

        if (productId) {
          customerPeriod.products.add(
            productId,
          )
        }

        if (location) {
          customerPeriod.locations.add(
            location,
          )
        }

        if (documentNumber) {
          let documents =
            customerPeriodDocuments.get(
              customerPeriodId,
            )

          if (!documents) {
            documents =
              new Set<string>()

            customerPeriodDocuments.set(
              customerPeriodId,
              documents,
            )
          }

          documents.add(
            documentNumber,
          )
        }
      }

      const customerBrandPeriodId =
        getCustomerBrandPeriodId(
          periodId,
          customerId,
          brandId,
        )

      let customerBrandPeriod =
        model.customerBrandPeriods.get(
          customerBrandPeriodId,
        )

      if (!customerBrandPeriod) {
        customerBrandPeriod =
          createBusinessCustomerBrandPeriod(
            customerId,
            brandId,
            periodId,
          )

        model.customerBrandPeriods.set(
          customerBrandPeriodId,
          customerBrandPeriod,
        )
      }

      customerBrandPeriod.revenue +=
        row.revenue

      customerBrandPeriod.grossProfit +=
        row.grossProfit

      customerBrandPeriod.quantity +=
        row.quantity

      if (productId) {
        customerBrandPeriod.products.add(
          productId,
        )
      }

      if (documentNumber) {
        let documents =
          customerBrandPeriodDocuments.get(
            customerBrandPeriodId,
          )

        if (!documents) {
          documents = new Set<string>()
          customerBrandPeriodDocuments.set(
            customerBrandPeriodId,
            documents,
          )
        }

        documents.add(documentNumber)
      }
    }

    if (
      productId &&
      resolvedProductModel
    ) {
      let product =
        model.products.get(
          productId,
        )

      if (!product) {
        product = matchedProduct
          ? createBusinessProductFromMaster({
              ...matchedProduct,
              code: productId,
            })
          : createFallbackBusinessProduct(
              productId,
              resolvedProductModel,
              brandName,
              sourceProductName,
              sourceProductCode,
              productReconciliation.status === 'ambiguous',
              productReconciliation.reason === 'historical_unlisted',
            )

        model.products.set(productId, product)
      }

      if (row.productStatus) {
        product.commercialStatus = row.productStatus
      }

      product.revenue +=
        row.revenue

      product.grossProfit +=
        row.grossProfit

      product.quantity +=
        row.quantity

      if (
        !product.firstSale ||
        rowDate < product.firstSale
      ) {
        product.firstSale = rowDate
      }

      if (
        !product.lastSale ||
        rowDate > product.lastSale
      ) {
        product.lastSale = rowDate
      }

      product.activePeriods.add(periodId)
      product.brands.add(brandId)

      if (location) {
        product.locations.add(location)
      }

      if (documentNumber) {
        let documents =
          productDocuments.get(productId)

        if (!documents) {
          documents = new Set<string>()
          productDocuments.set(
            productId,
            documents,
          )
        }

        documents.add(documentNumber)
      }

      if (customerId) {
        product.customers.add(
          customerId,
        )
      }

      const productPeriodId =
        getProductPeriodId(
          periodId,
          productId,
        )

      let productPeriod =
        model.productPeriods.get(
          productPeriodId,
        )

      if (!productPeriod) {
        productPeriod =
          createBusinessProductPeriod(
            productId,
            periodId,
          )
        model.productPeriods.set(
          productPeriodId,
          productPeriod,
        )
      }

      productPeriod.revenue += row.revenue
      productPeriod.grossProfit += row.grossProfit
      productPeriod.quantity += row.quantity
      productPeriod.brands.add(brandId)

      if (location) {
        productPeriod.locations.add(location)
      }

      if (customerId) {
        productPeriod.customers.add(customerId)
      }

      if (documentNumber) {
        let documents =
          productPeriodDocuments.get(
            productPeriodId,
          )
        if (!documents) {
          documents = new Set<string>()
          productPeriodDocuments.set(
            productPeriodId,
            documents,
          )
        }
        documents.add(documentNumber)
      }
    }

    let period =
      model.periods.get(
        periodId,
      )

    if (!period) {
      period =
        createBusinessPeriod(
          parsedDate,
        )

      model.periods.set(
        periodId,
        period,
      )
    }

    period.revenue +=
      row.revenue

    period.grossProfit +=
      row.grossProfit

    period.quantity +=
      row.quantity

    period.brands.add(
      brandId,
    )

    if (customerId) {
      period.customers.add(
        customerId,
      )
    }

    if (productId) {
      period.products.add(
        productId,
      )
    }

    if (documentNumber) {
      let documents =
        periodDocuments.get(
          periodId,
        )

      if (!documents) {
        documents =
          new Set<string>()

        periodDocuments.set(
          periodId,
          documents,
        )
      }

      documents.add(
        documentNumber,
      )
    }

    let brandPeriod =
      model.brandPeriods.get(
        brandPeriodId,
      )

    if (!brandPeriod) {
      brandPeriod =
        createBusinessBrandPeriod(
          brandId,
          periodId,
        )

      model.brandPeriods.set(
        brandPeriodId,
        brandPeriod,
      )
    }

    brandPeriod.revenue +=
      row.revenue

    brandPeriod.grossProfit +=
      row.grossProfit

    brandPeriod.quantity +=
      row.quantity

    if (customerId) {
      brandPeriod.customers.add(
        customerId,
      )
    }

    if (productId) {
      brandPeriod.products.add(
        productId,
      )
    }

    if (documentNumber) {
      let documents =
        brandPeriodDocuments.get(
          brandPeriodId,
        )

      if (!documents) {
        documents =
          new Set<string>()

        brandPeriodDocuments.set(
          brandPeriodId,
          documents,
        )
      }

      documents.add(
        documentNumber,
      )
    }
  }

  model.totals.documents =
    model.documentNumbers.size

  for (
    const [
      customerId,
      documents,
    ] of customerDocuments
  ) {
    const customer =
      model.customers.get(
        customerId,
      )

    if (customer) {
      customer.documents =
        documents.size
    }
  }

  for (
    const [
      customerPeriodId,
      documents,
    ] of customerPeriodDocuments
  ) {
    const customerPeriod =
      model.customerPeriods.get(
        customerPeriodId,
      )

    if (customerPeriod) {
      customerPeriod.documents =
        documents.size
    }
  }

  for (
    const [
      periodId,
      documents,
    ] of periodDocuments
  ) {
    const period =
      model.periods.get(
        periodId,
      )

    if (period) {
      period.documents =
        documents.size
    }
  }

  for (
    const [
      brandPeriodId,
      documents,
    ] of brandPeriodDocuments
  ) {
    const brandPeriod =
      model.brandPeriods.get(
        brandPeriodId,
      )

    if (brandPeriod) {
      brandPeriod.documents =
        documents.size
    }
  }

  for (
    const [
      customerBrandPeriodId,
      documents,
    ] of customerBrandPeriodDocuments
  ) {
    const customerBrandPeriod =
      model.customerBrandPeriods.get(
        customerBrandPeriodId,
      )

    if (customerBrandPeriod) {
      customerBrandPeriod.documents =
        documents.size
    }
  }


  for (const [id, documents] of productDocuments) {
    const product = model.products.get(id)
    if (product) {
      product.documents = documents.size
    }
  }

  for (const [id, documents] of productPeriodDocuments) {
    const productPeriod = model.productPeriods.get(id)
    if (productPeriod) {
      productPeriod.documents = documents.size
    }
  }

  const pricing = buildBusinessPrices(
    options.prices ?? [],
    options.priceScenarios ?? [],
    model.products,
  )

  model.prices = pricing.prices
  model.priceScenarios = pricing.scenarios
  model.pricingSummary = pricing.summary
  model.pricingQualityIssues = pricing.qualityIssues

  model.productIdentityQuality =
    finalizeProductIdentityQualityReport(
      productIdentityQuality,
    )

  return model
}