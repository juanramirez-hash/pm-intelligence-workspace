import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

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
  BusinessDataModel,
  BusinessPeriod,
} from '../models/businessDataModel'

import type {
  BusinessBrandTargetInput,
} from '../targets'

import {
  buildBusinessBrandTargets,
} from '../targets'

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
  }
}

function createBusinessProduct(
  productId: string,
  model: string,
  brand: string,
): BusinessProduct {
  return {
    id: productId,

    model,
    brand,

    revenue: 0,
    grossProfit: 0,
    quantity: 0,

    customers:
      new Set<string>(),
  }
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
  brandTargets?:
    readonly BusinessBrandTargetInput[]
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

  const productPeriodDocuments =
    new Map<string, Set<string>>()

  const customerBrandPeriodDocuments =
    new Map<
      string,
      Set<string>
    >()

  for (const row of rows) {
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

    const productId =
      normalizeIdentifier(
        row.model,
      )

    const productModel =
      normalizeText(row.model)

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

      if (customerName) {
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
      productModel
    ) {
      let product =
        model.products.get(
          productId,
        )

      if (!product) {
        product =
          createBusinessProduct(
            productId,
            productModel,
            brandName,
          )

        model.products.set(
          productId,
          product,
        )
      }

      product.revenue +=
        row.revenue

      product.grossProfit +=
        row.grossProfit

      product.quantity +=
        row.quantity

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


  for (const [id, documents] of productPeriodDocuments) {
    const productPeriod = model.productPeriods.get(id)
    if (productPeriod) {
      productPeriod.documents = documents.size
    }
  }

  return model
}