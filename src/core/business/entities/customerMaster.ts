/**
 * Canonical customer identity owned by the Business Core.
 *
 * This entity contains stable ERP/commercial master attributes only.
 * Transactional and analytical values remain owned by Sales and the
 * specialised customer period entities.
 */
export interface BusinessCustomerMaster {
  /** Stable business identifier. Canonical customer identity. */
  id: string

  /** Customer display name from the ERP master. */
  name: string

  /** Secondary ERP internal identifier. */
  erpInternalId: string | null

  /** Whether the ERP record is marked as duplicate. */
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

/**
 * Transitional analytics contract.
 *
 * These fields preserve the current Customer Intelligence implementation
 * while transactional behaviour remains derived from Sales.
 */
export interface BusinessCustomerLegacyAnalytics {
  firstPurchase: string | null
  lastPurchase: string | null

  revenue: number
  grossProfit: number
  quantity: number
  documents: number

  brands: Set<string>
  products: Set<string>
  locations: Set<string>
  activePeriods: Set<string>
}