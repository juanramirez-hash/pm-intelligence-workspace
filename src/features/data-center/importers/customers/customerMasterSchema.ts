import type {
  CustomerMasterField,
} from './customerMasterColumnAliases'

export const REQUIRED_CUSTOMER_MASTER_FIELDS = [
  'customerId',
  'name',
] as const satisfies readonly CustomerMasterField[]

export const RECOMMENDED_CUSTOMER_MASTER_FIELDS = [
  'internalId',
  'category',
  'salesRep',
  'location',
  'priceLevel',
  'taxId',
  'registrationDate',
  'salesClassification',
  'frequencyClassification',
] as const satisfies readonly CustomerMasterField[]

export const OPTIONAL_CUSTOMER_MASTER_FIELDS = [
  'isDuplicate',
  'primaryContact',
  'salesRepLocation',
  'assignedKam',
  'lastSaleDate',
  'inactiveDate',
  'phone',
  'email',
  'hasPhysicalLocation',
  'department',
  'specialtyBrands',
  'previousSalesRep',
  'customerRegistrationForm',
  'whatsapp',
  'serviceSegment',
  'catalogDelivered',
  'portalAccessBlocked',
  'contactLetter',
  'billingVersion',
  'purchaseAmountClassification',
  'permanentFreeLocalShipping',
] as const satisfies readonly CustomerMasterField[]

export const ALL_CUSTOMER_MASTER_FIELDS = [
  ...REQUIRED_CUSTOMER_MASTER_FIELDS,
  ...RECOMMENDED_CUSTOMER_MASTER_FIELDS,
  ...OPTIONAL_CUSTOMER_MASTER_FIELDS,
] as const satisfies readonly CustomerMasterField[]