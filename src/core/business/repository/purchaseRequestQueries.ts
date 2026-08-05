import type {
  BusinessPurchaseRequest,
} from '../entities/purchaseRequest'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildPurchaseRequestIndexes,
} from './purchaseRequestIndexes'

import type {
  PurchaseRequestIndexes,
} from './purchaseRequestIndexes'

export interface PurchaseRequestDataQualityReport {
  totalRequests: number
  requestsWithoutPurchaseOrder: number
  requestsMissingQuantity: number
  requestsMissingItemCode: number
  requestsWithProject: number
  requestsWithAssignedBuyer: number
  duplicateSourceRows: number
  orphanPurchaseOrderNumbers: string[]
  orphanProjectIds: string[]
}

function normalizeQueryValue(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

export class PurchaseRequestQueries {
  private readonly model:
    BusinessDataModel

  private readonly indexes:
    PurchaseRequestIndexes

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model
    this.indexes =
      buildPurchaseRequestIndexes(
        model,
      )
  }

  getAll():
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.model
          .purchaseRequests
          ?.values() ?? []
      ),
    ]
  }

  findByNumber(
    purchaseRequestNumber: string,
  ):
    BusinessPurchaseRequest |
    undefined {
    return this.indexes
      .requestsByNumber
      .get(
        normalizeQueryValue(
          purchaseRequestNumber,
        ),
      )
  }

  getByPeriod(
    periodId: string,
  ):
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.indexes
          .requestsByPeriod
          .get(periodId) ?? []
      ),
    ]
  }

  getByPurchaseOrder(
    purchaseOrderNumber: string,
  ):
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.indexes
          .requestsByPurchaseOrder
          .get(
            normalizeQueryValue(
              purchaseOrderNumber,
            ),
          ) ?? []
      ),
    ]
  }

  getBySalesOrder(
    salesOrderNumber: string,
  ):
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.indexes
          .requestsBySalesOrder
          .get(
            normalizeQueryValue(
              salesOrderNumber,
            ),
          ) ?? []
      ),
    ]
  }

  getByProject(
    projectId: string,
  ):
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.indexes
          .requestsByProject
          .get(
            normalizeQueryValue(
              projectId,
            ),
          ) ?? []
      ),
    ]
  }

  getByStatus(
    status: string,
  ):
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.indexes
          .requestsByStatus
          .get(
            normalizeQueryValue(
              status,
            ),
          ) ?? []
      ),
    ]
  }

  getByItemCode(
    itemCode: string,
  ):
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.indexes
          .requestsByItemCode
          .get(
            normalizeQueryValue(
              itemCode,
            ),
          ) ?? []
      ),
    ]
  }

  getByBrand(
    brandId: string,
  ):
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.indexes
          .requestsByBrand
          .get(
            normalizeQueryValue(
              brandId,
            ),
          ) ?? []
      ),
    ]
  }

  getByBuyer(
    assignedBuyer: string,
  ):
    BusinessPurchaseRequest[] {
    return [
      ...(
        this.indexes
          .requestsByBuyer
          .get(
            normalizeQueryValue(
              assignedBuyer,
            ),
          ) ?? []
      ),
    ]
  }

  getQualityReport():
    PurchaseRequestDataQualityReport {
    const requests =
      this.getAll()

    const purchaseOrderNumbers =
      new Set(
        [
          ...(
            this.model
              .purchaseOrders
              ?.values() ?? []
          ),
        ].map(
          (order) =>
            order.purchaseOrderNumber,
        ),
      )

    const projectIds =
      new Set(
        [
          ...(
            this.model
              .projects
              ?.values() ?? []
          ),
        ].map(
          (project) =>
            project.projectId,
        ),
      )

    const orphanPurchaseOrderNumbers =
      [
        ...new Set(
          requests
            .map(
              (request) =>
                request
                  .relatedPurchaseOrderNumber,
            )
            .filter(
              (
                purchaseOrderNumber,
              ): purchaseOrderNumber is string =>

                purchaseOrderNumber !== null &&
                !purchaseOrderNumbers.has(
                  purchaseOrderNumber,
),
            ),
        ),
      ].sort()

    const orphanProjectIds =
      [
        ...new Set(
          requests
            .map(
              (request) =>
                request.projectId,
            )
            .filter(
              (
                projectId,
              ): projectId is string =>

                projectId !== null &&
                !projectIds.has(
                  projectId,
          ),
            ),
        ),
      ].sort()

    return {
      totalRequests:
        requests.length,

      requestsWithoutPurchaseOrder:
        requests.filter(
          (request) =>
            !request
              .relatedPurchaseOrderNumber,
        ).length,

      requestsMissingQuantity:
        requests.filter(
          (request) =>
            request.quantity === null,
        ).length,

      requestsMissingItemCode:
        requests.filter(
          (request) =>
            !request.itemCode,
        ).length,

      requestsWithProject:
        requests.filter(
          (request) =>
            Boolean(
              request.projectId,
            ),
        ).length,

      requestsWithAssignedBuyer:
        requests.filter(
          (request) =>
            Boolean(
              request.assignedBuyer,
            ),
        ).length,

      duplicateSourceRows:
        requests.reduce(
          (total, request) =>
            total +
            request.duplicateOccurrences,
          0,
        ),

      orphanPurchaseOrderNumbers,
      orphanProjectIds,
    }
  }
}