// Complete cost data (no NULL) shared by the SEC-003C no-regression test.
// Two brands, two locations, two snapshots, a superseded product and a
// purchase order with lines of both brands.

import type {
  NormalizedInventoryRow,
} from '../../../src/features/data-center/importers/inventory/inventoryTypes'
import type {
  NormalizedProductMasterRow,
} from '../../../src/features/data-center/importers/products/productMasterTypes'
import type {
  NormalizedPurchaseOrderRow,
} from '../../../src/features/data-center/importers/purchases/purchaseOrderTypes'
import type {
  NormalizedSalesRow,
} from '../../../src/features/data-center/importers/sales/salesTypes'

export const REFERENCE_DATE = '2026-03-31'
export const LATEST_SNAPSHOT = '2026-03-13'

function salesRow(
  date: string,
  productName: string,
  brand: string,
  revenue: number,
  quantity: number,
): NormalizedSalesRow {
  return {
    date,
    brand,
    revenue,
    grossProfit: revenue * 0.25,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    productName,
    productCode: productName,
    model: productName,
    quantity,
    documentNumber: `${productName}-${date}`,
    location: 'CDMX',
    salesRep: null,
    currency: 'MXN',
  }
}

function productMasterRow(
  name: string,
  brand: string,
  overrides: Partial<NormalizedProductMasterRow> = {},
): NormalizedProductMasterRow {
  return {
    erpInternalId: name,
    name,
    code: name,
    model: name,
    brand,
    vendorCode: null,
    vendorName: null,
    description: null,
    classification: null,
    commercialStatus: 'A',
    trend: null,
    category: null,
    subcategory1: null,
    subcategory2: null,
    createdAt: null,
    updatedAt: null,
    averageCostUsd: 10,
    totalValue: 100,
    currency: 'MXN',
    inventoryValueMxn: 2000,
    inventoryValueUsd: 100,
    lastPurchaseDate: null,
    lastSaleDate: null,
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
    inactiveForPurchases: false,
    showOnPortal: true,
    supersededBy: null,
    blockPurchaseRequests: false,
    directSubstitute: null,
    benchmarkS: null,
    benchmarkT: null,
    benchmarkO: null,
    ...overrides,
  }
}

function inventoryRow(
  productName: string,
  brand: string,
  location: string,
  available: number,
  inventoryValue: number,
  overrides: Partial<NormalizedInventoryRow> = {},
): NormalizedInventoryRow {
  return {
    snapshotDate: LATEST_SNAPSHOT,
    productName,
    productCode: productName,
    brand,
    model: productName,
    location,
    onHand: available,
    available,
    committed: 0,
    inTransit: 0,
    onOrder: 0,
    unitCost: available > 0 ? inventoryValue / available : 100,
    inventoryValue,
    currency: 'MXN',
    ...overrides,
  }
}

function purchaseOrderRow(
  purchaseOrderNumber: string,
  line: number,
  itemCode: string,
  brand: string,
  amountForeignCurrency: number,
  overrides: Partial<NormalizedPurchaseOrderRow> = {},
): NormalizedPurchaseOrderRow {
  return {
    lineKey: `${purchaseOrderNumber}:${line}`,
    sourceRowNumber: line,
    duplicateOccurrences: 0,
    purchaseOrderNumber,
    sourceInternalId: purchaseOrderNumber,
    sourceSecondaryInternalId: null,
    purchaseOrderReference: null,
    purchaseOrderDate: '2026-02-10',
    periodId: '2026-02',
    expectedReceiptDate: '2026-04-15',
    status: 'Pending Receipt',
    mainMemo: null,
    supplierId: 'SUP-1',
    supplierName: 'Proveedor Uno',
    currency: 'USD',
    lineType: 'product',
    itemCode,
    brand,
    lineMemo: null,
    quantity: 10,
    amountForeignCurrency,
    weight: null,
    supplierLeadTimeDays: 45,
    supplierExpressLeadTimeDays: null,
    inventoryDays: null,
    shipmentNumber: null,
    shipmentStatus: null,
    zone: null,
    purchasingExecutive: 'Comprador Uno',
    coffDate: null,
    atdDate: null,
    ataDate: null,
    atwDate: null,
    department: null,
    valueClassification: null,
    valueScore: null,
    amountClassification: null,
    ...overrides,
  }
}

export const completeSales: NormalizedSalesRow[] = [
  salesRow('2026-01-30', 'P-1', 'UNV', 100, 10),
  salesRow('2026-02-27', 'P-1', 'UNV', 120, 12),
  salesRow('2026-03-13', 'P-1', 'UNV', 100, 10),
  salesRow('2026-01-30', 'P-OLD', 'UNV', 100, 10),
  salesRow('2026-02-27', 'P-OLD', 'UNV', 100, 10),
  salesRow('2026-03-13', 'P-OLD', 'UNV', 20, 2),
  salesRow('2026-01-30', 'H-1', 'HIKVISION', 300, 30),
  salesRow('2026-02-27', 'H-1', 'HIKVISION', 280, 28),
  salesRow('2026-03-13', 'H-1', 'HIKVISION', 320, 32),
  salesRow('2026-02-27', 'H-2', 'HIKVISION', 50, 5),
]

export const completeProductMaster: NormalizedProductMasterRow[] = [
  productMasterRow('P-1', 'UNV'),
  productMasterRow('P-OLD', 'UNV', {
    commercialStatus: 'D',
    supersededBy: 'P-NEW',
    directSubstitute: 'P-NEW',
  }),
  productMasterRow('P-NEW', 'UNV'),
  productMasterRow('P-IDLE', 'UNV'),
  productMasterRow('H-1', 'HIKVISION'),
  productMasterRow('H-2', 'HIKVISION'),
]

export const completeInventory: NormalizedInventoryRow[] = [
  inventoryRow('P-1', 'UNV', 'CDMX', 5, 500, { inTransit: 10 }),
  inventoryRow('P-1', 'UNV', 'MTY', 0, 300, { onHand: 3 }),
  inventoryRow('P-OLD', 'UNV', 'CDMX', 4, 400, { onOrder: 3 }),
  inventoryRow('P-NEW', 'UNV', 'CDMX', 8, 800),
  inventoryRow('P-IDLE', 'UNV', 'MTY', 20, 2000),
  inventoryRow('H-1', 'HIKVISION', 'CDMX', 2, 600, { committed: 5 }),
  inventoryRow('H-1', 'HIKVISION', 'MTY', 40, 12000),
  inventoryRow('H-2', 'HIKVISION', 'CDMX', 6, 900),
  inventoryRow('P-1', 'UNV', 'CDMX', 7, 700, {
    snapshotDate: '2026-02-27',
  }),
  inventoryRow('H-1', 'HIKVISION', 'CDMX', 10, 3000, {
    snapshotDate: '2026-02-27',
  }),
]

export const completePurchaseOrders: NormalizedPurchaseOrderRow[] = [
  purchaseOrderRow('PO-1', 1, 'P-1', 'UNV', 1000),
  purchaseOrderRow('PO-1', 2, 'H-1', 'HIKVISION', 500),
  purchaseOrderRow('PO-2', 1, 'H-1', 'HIKVISION', 2000, {
    supplierId: 'SUP-2',
    supplierName: 'Proveedor Dos',
    purchaseOrderDate: '2025-12-01',
    periodId: '2025-12',
    expectedReceiptDate: '2026-01-20',
  }),
  purchaseOrderRow('PO-3', 1, 'P-NEW', 'UNV', 300, {
    status: 'Fully Billed',
    purchaseOrderDate: '2026-01-05',
    periodId: '2026-01',
  }),
  purchaseOrderRow('PO-3', 2, 'P-IDLE', 'UNV', 150, {
    status: 'Fully Billed',
    purchaseOrderDate: '2026-01-05',
    periodId: '2026-01',
  }),
]
