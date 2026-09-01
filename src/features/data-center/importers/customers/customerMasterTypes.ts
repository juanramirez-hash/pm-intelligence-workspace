export interface RawCustomerMasterRow {
  [column: string]: unknown
}

/**
 * Canonical commercial Customer Master row.
 *
 * Identity and commercial attributes come from the ERP customer portfolio.
 * Transactional metrics such as revenue, gross profit, quantities and
 * purchase activity remain owned by Sales / Business Core.
 */
export interface NormalizedCustomerMasterRow {
  internalId: string | null
  customerId: string
  name: string

  isDuplicate: boolean

  primaryContact: string | null

  category: string | null
  salesRep: string | null
  salesRepLocation: string | null
  assignedKam: string | null

  lastSaleDate: string | null
  inactiveDate: string | null

  phone: string | null
  email: string | null

  location: string | null
  hasPhysicalLocation: boolean
  department: string | null

  specialtyBrands: string | null
  previousSalesRep: string | null
  customerRegistrationForm: string | null

  priceLevel: string | null

  whatsapp: string | null
  serviceSegment: string | null

  taxId: string | null

  catalogDelivered: boolean

  registrationDate: string | null

  portalAccessBlocked: boolean

  contactLetter: string | null
  billingVersion: string | null

  salesClassification: string | null
  frequencyClassification: string | null
  purchaseAmountClassification: string | null

  permanentFreeLocalShipping: boolean
}

export interface CustomerMasterDatasetSummary {
  totalCustomers: number
  duplicateCustomers: number

  customersWithSalesRep: number
  customersWithKam: number
  customersWithEmail: number
  customersWithPhone: number

  inactiveCustomers: number

  uniqueCategories: number
  uniqueLocations: number
  uniqueSalesReps: number
  uniquePriceLevels: number

  processedRows: number
  ignoredRows: number
}