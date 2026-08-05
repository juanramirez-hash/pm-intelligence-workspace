import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../entities/purchaseOrder'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildPurchaseOrderIndexes,
} from './purchaseOrderIndexes'

import type {
  PurchaseOrderIndexes,
} from './purchaseOrderIndexes'

export interface PurchaseOrderDataQualityReport {
  totalOrders: number
  totalLines: number
  ordersMissingSupplier: number
  ordersMissingCurrency: number
  ordersWithHeaderConflicts: number
  linesMissingAmount: number
  duplicateSourceLines: number
}

function normalizeQueryValue(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

export class PurchaseOrderQueries {
  private readonly model:
    BusinessDataModel

  private readonly indexes:
    PurchaseOrderIndexes

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model
    this.indexes =
      buildPurchaseOrderIndexes(
        model,
      )
  }

  getAll():
    BusinessPurchaseOrder[] {
    return [
      ...(
        this.model
          .purchaseOrders
          ?.values() ?? []
      ),
    ]
  }

  getAllLines():
    BusinessPurchaseOrderLine[] {
    return [
      ...(
        this.model
          .purchaseOrderLines
          ?.values() ?? []
      ),
    ]
  }

  findByNumber(
    purchaseOrderNumber: string,
  ):
    BusinessPurchaseOrder |
    undefined {
    return this.indexes
      .ordersByNumber
      .get(
        normalizeQueryValue(
          purchaseOrderNumber,
        ),
      )
  }

  getByPeriod(
    periodId: string,
  ):
    BusinessPurchaseOrder[] {
    return [
      ...(
        this.indexes
          .ordersByPeriod
          .get(periodId) ?? []
      ),
    ]
  }

  getBySupplier(
    supplier: string,
  ):
    BusinessPurchaseOrder[] {
    return [
      ...(
        this.indexes
          .ordersBySupplier
          .get(
            normalizeQueryValue(
              supplier,
            ),
          ) ?? []
      ),
    ]
  }

  getByStatus(
    status: string,
  ):
    BusinessPurchaseOrder[] {
    return [
      ...(
        this.indexes
          .ordersByStatus
          .get(
            normalizeQueryValue(
              status,
            ),
          ) ?? []
      ),
    ]
  }

  getLinesByOrder(
    purchaseOrderNumber: string,
  ):
    BusinessPurchaseOrderLine[] {
    return [
      ...(
        this.indexes
          .linesByOrder
          .get(
            normalizeQueryValue(
              purchaseOrderNumber,
            ),
          ) ?? []
      ),
    ]
  }

  getLinesByPeriod(
    periodId: string,
  ):
    BusinessPurchaseOrderLine[] {
    return [
      ...(
        this.indexes
          .linesByPeriod
          .get(periodId) ?? []
      ),
    ]
  }

  getLinesByItemCode(
    itemCode: string,
  ):
    BusinessPurchaseOrderLine[] {
    return [
      ...(
        this.indexes
          .linesByItemCode
          .get(
            normalizeQueryValue(
              itemCode,
            ),
          ) ?? []
      ),
    ]
  }

  getLinesByBrand(
    brandId: string,
  ):
    BusinessPurchaseOrderLine[] {
    return [
      ...(
        this.indexes
          .linesByBrand
          .get(
            normalizeQueryValue(
              brandId,
            ),
          ) ?? []
      ),
    ]
  }

  getQualityReport():
    PurchaseOrderDataQualityReport {
    const orders =
      this.getAll()

    const lines =
      this.getAllLines()

    return {
      totalOrders:
        orders.length,

      totalLines:
        lines.length,

      ordersMissingSupplier:
        orders.filter(
          (order) =>
            !order.supplierId &&
            !order.supplierName,
        ).length,

      ordersMissingCurrency:
        orders.filter(
          (order) =>
            !order.currency,
        ).length,

      ordersWithHeaderConflicts:
        orders.filter(
          (order) =>
            order
              .headerConflictFields
              .length > 0,
        ).length,

      linesMissingAmount:
        lines.filter(
          (line) =>
            line
              .amountForeignCurrency ===
            null,
        ).length,

      duplicateSourceLines:
        lines.reduce(
          (total, line) =>
            total +
            line.duplicateOccurrences,
          0,
        ),
    }
  }
}