/**
 * Transitional compatibility entry point for Customer Master.
 *
 * BusinessCustomerMaster is the canonical customer identity. BusinessCustomer
 * remains intentionally compatible with existing builders, analytics and
 * workspaces while Customer Intelligence migrates progressively to the
 * canonical master + period architecture.
 */
import type {
  BusinessCustomerLegacyAnalytics,
  BusinessCustomerMaster,
} from './customerMaster'

export type {
  BusinessCustomerLegacyAnalytics,
  BusinessCustomerMaster,
} from './customerMaster'

export type CustomerIdentitySource =
  | 'customer_master'
  | 'sales_fallback'

/**
 * Compatibility shape used by the current BusinessDataModel.
 *
 * Legacy analytics fields remain required because they are derived from Sales.
 * Customer Master attributes are optional while existing consumers migrate to
 * the canonical BusinessCustomerMaster contract.
 */
export interface BusinessCustomer
  extends BusinessCustomerLegacyAnalytics {
  id: string

  name: string

  erpInternalId?:
    BusinessCustomerMaster['erpInternalId']

  isDuplicate?:
    BusinessCustomerMaster['isDuplicate']

  primaryContact?:
    BusinessCustomerMaster['primaryContact']

  category?:
    BusinessCustomerMaster['category']

  salesRep?:
    BusinessCustomerMaster['salesRep']

  salesRepLocation?:
    BusinessCustomerMaster['salesRepLocation']

  assignedKam?:
    BusinessCustomerMaster['assignedKam']

  lastSaleDate?:
    BusinessCustomerMaster['lastSaleDate']

  inactiveDate?:
    BusinessCustomerMaster['inactiveDate']

  phone?:
    BusinessCustomerMaster['phone']

  email?:
    BusinessCustomerMaster['email']

  location?:
    BusinessCustomerMaster['location']

  hasPhysicalLocation?:
    BusinessCustomerMaster['hasPhysicalLocation']

  department?:
    BusinessCustomerMaster['department']

  specialtyBrands?:
    BusinessCustomerMaster['specialtyBrands']

  previousSalesRep?:
    BusinessCustomerMaster['previousSalesRep']

  customerRegistrationForm?:
    BusinessCustomerMaster['customerRegistrationForm']

  priceLevel?:
    BusinessCustomerMaster['priceLevel']

  whatsapp?:
    BusinessCustomerMaster['whatsapp']

  serviceSegment?:
    BusinessCustomerMaster['serviceSegment']

  taxId?:
    BusinessCustomerMaster['taxId']

  catalogDelivered?:
    BusinessCustomerMaster['catalogDelivered']

  registrationDate?:
    BusinessCustomerMaster['registrationDate']

  portalAccessBlocked?:
    BusinessCustomerMaster['portalAccessBlocked']

  contactLetter?:
    BusinessCustomerMaster['contactLetter']

  billingVersion?:
    BusinessCustomerMaster['billingVersion']

  salesClassification?:
    BusinessCustomerMaster['salesClassification']

  frequencyClassification?:
    BusinessCustomerMaster['frequencyClassification']

  purchaseAmountClassification?:
    BusinessCustomerMaster['purchaseAmountClassification']

  permanentFreeLocalShipping?:
    BusinessCustomerMaster['permanentFreeLocalShipping']

  identitySource?: CustomerIdentitySource
}