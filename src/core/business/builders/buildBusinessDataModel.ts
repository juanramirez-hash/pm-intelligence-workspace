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
  BusinessProduct,
} from '../entities/product'

import type {
  BusinessDataModel,
  BusinessPeriod,
} from '../models/businessDataModel'

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

export function buildBusinessDataModel(
  rows: NormalizedSalesRow[],
): BusinessDataModel {
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

    products:
      new Map<
        string,
        BusinessProduct
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

  const brandPeriodDocuments =
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

  return model
}