import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import type {
  NormalizedProjectRow,
} from '../../../features/data-center/importers/projects/projectTypes'

import type {
  NormalizedProjectBillingRow,
} from '../../../features/data-center/importers/project-billings/projectBillingTypes'

import {
  buildBusinessDataModel,
} from '../builders/buildBusinessDataModel'

import {
  BusinessRepository,
} from '../repository/businessRepository'

import {
  buildProjectBillingReconciliation,
} from './projectBillingReconciliation'

function salesRow(
  input: Partial<NormalizedSalesRow> &
    Pick<NormalizedSalesRow, 'documentNumber' | 'revenue'>,
): NormalizedSalesRow {
  return {
    ...input,
    date: input.date ?? '2026-07-05',
    brand: input.brand ?? 'UNV',
    revenue: input.revenue,
    grossProfit: input.grossProfit ?? input.revenue * 0.3,
    customerId: input.customerId ?? 'C-001',
    customerName: input.customerName ?? 'Cliente Uno',
    productName: input.productName ?? null,
    productCode: input.productCode ?? null,
    model: input.model ?? 'IPC-001',
    productStatus: input.productStatus ?? null,
    quantity: input.quantity ?? 1,
    documentNumber: input.documentNumber,
    location: input.location ?? 'CDMX',
    salesRep: input.salesRep ?? 'EJECUTIVO 1',
    currency: input.currency ?? 'MXN',
  }
}

function projectRow(
  projectId: string,
): NormalizedProjectRow {
  return {
    internalId: `INT-${projectId}`,
    projectId,
    name: `Proyecto ${projectId}`,
    endUser: null,
    customerId: 'C-001',
    customerName: 'Cliente Uno',
    salesExecutive: null,
    location: null,
    assignedBusinessDeveloper: null,
    assignedProductManager: null,
    group: null,
    primaryBrand: 'UNV',
    createdAt: null,
    elapsedDays: null,
    currency: 'USD',
    statusCode: '06',
    statusLabel: '06 Surtido parcialmente',
    forecastStage: 'mature',
    closingProbability: 1,
    estimatedCloseDate: null,
    estimatedBillingDate: '2026-07-31',
    amountToClose: 1000,
    observations: null,
    assignedEngineer: null,
    approximateAmount: null,
    invoicedAmount: null,
    reportAmountToInvoice: null,
    amountToInvoice: null,
    isDuplicate: false,
  }
}

function billingRow(
  input: Partial<NormalizedProjectBillingRow> &
    Pick<
      NormalizedProjectBillingRow,
      | 'internalId'
      | 'projectId'
      | 'documentNumber'
    >,
): NormalizedProjectBillingRow {
  const documentType =
    input.documentType ??
    (
      input.documentNumber.startsWith('NC')
        ? 'credit_note'
        : 'invoice'
    )

  return {
    lineKey: input.lineKey ?? `LINE-${input.internalId}`,
    duplicateOccurrences: input.duplicateOccurrences ?? 0,
    internalId: input.internalId,
    projectId: input.projectId,
    projectDescription: input.projectDescription ?? null,
    endUser: input.endUser ?? null,
    customerId: input.customerId ?? 'C-001',
    customerName: input.customerName ?? 'Cliente Uno',
    primaryBrand: input.primaryBrand ?? 'UNV',
    itemCode: input.itemCode ?? 'ITEM-001',
    model: input.model ?? 'IPC-001',
    brand: input.brand ?? 'UNV',
    quantity: input.quantity ?? 1,
    amount: input.amount ?? 1000,
    date: input.date ?? '2026-07-05',
    periodId: input.periodId ?? '2026-07',
    documentNumber: input.documentNumber,
    documentType,
    documentStatus: input.documentStatus ?? 'Open',
    createdFrom: input.createdFrom ?? null,
    relatedDocumentStatus: input.relatedDocumentStatus ?? null,
    currency: input.currency ?? 'MXN',
    isVoided: input.isVoided ?? false,
    estimatedCloseDate: input.estimatedCloseDate ?? null,
    estimatedBillingDate: input.estimatedBillingDate ?? null,
    estimatedDeliveryDate: input.estimatedDeliveryDate ?? null,
    salesRepresentative: input.salesRepresentative ?? null,
    salesLocation: input.salesLocation ?? null,
    assignedBusinessDeveloper:
      input.assignedBusinessDeveloper ?? null,
    purchaseDescription: input.purchaseDescription ?? null,
  }
}

describe('FW-008 Project Billing Reconciliation', () => {
  it('separa facturacion neta de proyectos y venta transaccional', () => {
    const model = buildBusinessDataModel(
      [
        salesRow({
          documentNumber: 'F-PROJ',
          revenue: 1000,
          grossProfit: 300,
        }),
        salesRow({
          documentNumber: 'NC-PROJ',
          revenue: -100,
          grossProfit: -30,
          quantity: -1,
        }),
        salesRow({
          documentNumber: 'F-TRANS',
          revenue: 500,
          grossProfit: 150,
          brand: 'TP-LINK',
        }),
        salesRow({
          documentNumber: 'F-VOID',
          revenue: 200,
          grossProfit: 60,
        }),
      ],
      {
        projects: [projectRow('PROY-001')],
        projectBillings: [
          billingRow({
            internalId: 'B-1',
            projectId: 'PROY-001',
            documentNumber: 'F-PROJ',
          }),
          billingRow({
            internalId: 'B-2',
            projectId: 'PROY-001',
            documentNumber: 'NC-PROJ',
            amount: -100,
          }),
          billingRow({
            internalId: 'B-3',
            projectId: 'PROY-001',
            documentNumber: 'F-MISSING',
          }),
          billingRow({
            internalId: 'B-4',
            projectId: 'PROY-001',
            documentNumber: 'F-VOID',
            isVoided: true,
            documentStatus: 'Voided',
          }),
        ],
      },
    )

    const report =
      buildProjectBillingReconciliation(model)

    expect(report.total.revenue).toBe(1600)
    expect(report.project.revenue).toBe(900)
    expect(report.project.grossProfit).toBe(270)
    expect(report.transactional.revenue).toBe(700)
    expect(report.transactional.grossProfit).toBe(210)

    expect(report.quality.activeBillingDocuments).toBe(3)
    expect(report.quality.matchedBillingDocuments).toBe(2)
    expect(report.quality.missingBillingDocuments).toBe(1)
    expect(report.quality.voidedBillingDocuments).toBe(1)
    expect(report.quality.creditNoteDocuments).toBe(1)
    expect(report.quality.coverageRate).toBeCloseTo(2 / 3)
    expect(report.quality.missingSalesDocumentNumbers).toEqual([
      'F-MISSING',
    ])
    expect(report.quality.voidedDocumentsPresentInSales).toEqual([
      'F-VOID',
    ])

    const july = report.periods.find(
      (period) => period.periodId === '2026-07',
    )

    expect(july?.project.revenue).toBe(900)
    expect(july?.transactional.revenue).toBe(700)

    const repository = new BusinessRepository(model)

    expect(
      repository.projectBillingReconciliation
        .getDocumentsByStatus('matched'),
    ).toHaveLength(2)
  })

  it('asigna la facturacion a la marca real de ventas y no a la marca principal', () => {
    const model = buildBusinessDataModel(
      [
        salesRow({
          documentNumber: 'F-MULTIMARCA',
          revenue: 800,
          grossProfit: 240,
          brand: 'TP-LINK',
          model: 'SWITCH-001',
        }),
      ],
      {
        projects: [projectRow('PROY-002')],
        projectBillings: [
          billingRow({
            internalId: 'B-5',
            projectId: 'PROY-002',
            documentNumber: 'F-MULTIMARCA',
            primaryBrand: 'UNV',
            brand: 'UNV',
          }),
        ],
      },
    )

    const report =
      buildProjectBillingReconciliation(model)

    const tpLink = report.brandPeriods.find(
      (period) =>
        period.periodId === '2026-07' &&
        period.brandId === 'TP-LINK',
    )

    const unv = report.brandPeriods.find(
      (period) =>
        period.periodId === '2026-07' &&
        period.brandId === 'UNV',
    )

    expect(tpLink?.project.revenue).toBe(800)
    expect(unv).toBeUndefined()
    expect(report.projects[0]?.brandIds).toEqual([
      'TP-LINK',
    ])
  })

  it('bloquea documentos conflictivos para impedir doble conteo', () => {
    const model = buildBusinessDataModel(
      [
        salesRow({
          documentNumber: 'F-CONFLICT',
          revenue: 1200,
          grossProfit: 360,
        }),
      ],
      {
        projects: [
          projectRow('PROY-003'),
          projectRow('PROY-004'),
        ],
        projectBillings: [
          billingRow({
            internalId: 'B-6',
            projectId: 'PROY-003',
            documentNumber: 'F-CONFLICT',
          }),
          billingRow({
            internalId: 'B-7',
            projectId: 'PROY-004',
            documentNumber: 'F-CONFLICT',
          }),
        ],
      },
    )

    const report =
      buildProjectBillingReconciliation(model)

    expect(report.project.revenue).toBe(0)
    expect(report.transactional.revenue).toBe(1200)
    expect(report.quality.conflictBillingDocuments).toBe(2)
    expect(report.quality.conflictDocumentNumbers).toEqual([
      'F-CONFLICT',
    ])
    expect(
      report.documents.filter(
        (document) => document.status === 'conflict',
      ),
    ).toHaveLength(2)
  })
})
