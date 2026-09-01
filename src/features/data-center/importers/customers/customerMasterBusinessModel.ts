import type {
  CustomerMasterDatasetSummary,
  NormalizedCustomerMasterRow,
} from './customerMasterTypes'

export interface CustomerMasterBusinessModel {
  customers: NormalizedCustomerMasterRow[]
  summary: CustomerMasterDatasetSummary
}

function normalize(
  value: string | null | undefined,
): string {
  return (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function addIfPresent(
  target: Set<string>,
  value: string | null | undefined,
): void {
  const normalized = normalize(value)

  if (normalized) {
    target.add(normalized)
  }
}

export function buildCustomerMasterBusinessModel(
  customers: NormalizedCustomerMasterRow[],
  ignoredRows: number,
): CustomerMasterBusinessModel {
  const categories = new Set<string>()
  const locations = new Set<string>()
  const salesReps = new Set<string>()
  const priceLevels = new Set<string>()

  let duplicateCustomers = 0
  let customersWithSalesRep = 0
  let customersWithKam = 0
  let customersWithEmail = 0
  let customersWithPhone = 0
  let inactiveCustomers = 0

  for (const customer of customers) {
    if (customer.isDuplicate) {
      duplicateCustomers += 1
    }

    if (normalize(customer.salesRep)) {
      customersWithSalesRep += 1
    }

    if (normalize(customer.assignedKam)) {
      customersWithKam += 1
    }

    if (normalize(customer.email)) {
      customersWithEmail += 1
    }

    if (normalize(customer.phone)) {
      customersWithPhone += 1
    }

    if (customer.inactiveDate) {
      inactiveCustomers += 1
    }

    addIfPresent(
      categories,
      customer.category,
    )

    addIfPresent(
      locations,
      customer.location,
    )

    addIfPresent(
      salesReps,
      customer.salesRep,
    )

    addIfPresent(
      priceLevels,
      customer.priceLevel,
    )
  }

  return {
    customers,

    summary: {
      totalCustomers:
        customers.length,

      duplicateCustomers,

      customersWithSalesRep,

      customersWithKam,

      customersWithEmail,

      customersWithPhone,

      inactiveCustomers,

      uniqueCategories:
        categories.size,

      uniqueLocations:
        locations.size,

      uniqueSalesReps:
        salesReps.size,

      uniquePriceLevels:
        priceLevels.size,

      processedRows:
        customers.length,

      ignoredRows,
    },
  }
}