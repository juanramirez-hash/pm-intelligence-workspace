import type {
  BusinessInventoryPosition,
} from '../../../core/business/entities/inventoryPosition'

import type {
  BusinessProduct,
  ProductCommercialStatus,
} from '../../../core/business/entities/product'

export type InventoryReplacementStatus =
  | 'both'
  | 'superseded_only'
  | 'direct_substitute_only'
  | 'none'

export interface InventoryCatalogEntry {
  commercialStatus: ProductCommercialStatus | null
  supersededBy: string | null
  directSubstitute: string | null
  replacementStatus: InventoryReplacementStatus
  supersededByAvailable: number | null
  directSubstituteAvailable: number | null
  catalogResolved: boolean
}

export interface InventoryWorkspacePosition
  extends BusinessInventoryPosition,
    InventoryCatalogEntry {}

export interface InventoryCatalogSummary {
  classifiedProducts: number
  unclassifiedProducts: number
  productsWithSuperseded: number
  productsWithDirectSubstitute: number
  productsWithBoth: number
  supersededWithoutDirectSubstitute: number
  supersededOnHand: number
  supersededAvailable: number
  supersededInventoryValue: number
}

export interface InventoryProductCatalogResolver {
  findById: (id: string) => BusinessProduct | undefined
  findByName: (name: string) => BusinessProduct | undefined
  findByCode: (code: string) => BusinessProduct | undefined
}

export type InventoryCatalogLookup = ReadonlyMap<
  string,
  InventoryCatalogEntry
>

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function replacementStatus(
  supersededBy: string | null,
  directSubstitute: string | null,
): InventoryReplacementStatus {
  if (supersededBy && directSubstitute) {
    return 'both'
  }

  if (supersededBy) {
    return 'superseded_only'
  }

  if (directSubstitute) {
    return 'direct_substitute_only'
  }

  return 'none'
}

function resolvePositionProduct(
  position: BusinessInventoryPosition,
  resolver: InventoryProductCatalogResolver,
): BusinessProduct | undefined {
  if (position.productId) {
    const byId = resolver.findById(position.productId)

    if (byId) {
      return byId
    }
  }

  const byName = resolver.findByName(position.productName)

  if (byName) {
    return byName
  }

  return position.productCode
    ? resolver.findByCode(position.productCode)
    : undefined
}

function resolveReferenceProduct(
  reference: string,
  resolver: InventoryProductCatalogResolver,
): BusinessProduct | undefined {
  return resolver.findById(reference) ??
    resolver.findByName(reference) ??
    resolver.findByCode(reference)
}

function positionReferences(
  position: BusinessInventoryPosition,
): string[] {
  return [
    position.productId,
    position.productName,
    position.productCode,
  ]
    .map(normalize)
    .filter((value, index, values) =>
      Boolean(value) && values.indexOf(value) === index,
    )
}

function productReferences(
  product: BusinessProduct | undefined,
  fallback: string,
): string[] {
  return [
    product?.id,
    product?.name,
    product?.code,
    fallback,
  ]
    .map(normalize)
    .filter((value, index, values) =>
      Boolean(value) && values.indexOf(value) === index,
    )
}

function buildAvailableByReference(
  positions: readonly BusinessInventoryPosition[],
): Map<string, number> {
  const availableByReference = new Map<string, number>()

  for (const position of positions) {
    for (const reference of positionReferences(position)) {
      availableByReference.set(
        reference,
        (availableByReference.get(reference) ?? 0) +
          position.available,
      )
    }
  }

  return availableByReference
}

function replacementAvailability(
  reference: string | null,
  resolver: InventoryProductCatalogResolver,
  availableByReference: ReadonlyMap<string, number>,
): number | null {
  if (!reference) {
    return null
  }

  const product = resolveReferenceProduct(reference, resolver)

  for (const candidate of productReferences(product, reference)) {
    const available = availableByReference.get(candidate)

    if (available !== undefined) {
      return available
    }
  }

  return 0
}

export function enrichInventoryPositions(
  positions: readonly BusinessInventoryPosition[],
  resolver: InventoryProductCatalogResolver,
): InventoryWorkspacePosition[] {
  const availableByReference = buildAvailableByReference(positions)

  return positions.map((position) => {
    const product = resolvePositionProduct(position, resolver)
    const supersededBy = product?.supersededBy ?? null
    const directSubstitute = product?.directSubstitute ?? null

    return {
      ...position,
      commercialStatus: product?.commercialStatus ?? null,
      supersededBy,
      directSubstitute,
      replacementStatus: replacementStatus(
        supersededBy,
        directSubstitute,
      ),
      supersededByAvailable: replacementAvailability(
        supersededBy,
        resolver,
        availableByReference,
      ),
      directSubstituteAvailable: replacementAvailability(
        directSubstitute,
        resolver,
        availableByReference,
      ),
      catalogResolved: Boolean(product),
    }
  })
}

export function buildInventoryCatalogLookup(
  positions: readonly InventoryWorkspacePosition[],
): InventoryCatalogLookup {
  const lookup = new Map<string, InventoryCatalogEntry>()

  for (const position of positions) {
    const entry: InventoryCatalogEntry = {
      commercialStatus: position.commercialStatus,
      supersededBy: position.supersededBy,
      directSubstitute: position.directSubstitute,
      replacementStatus: position.replacementStatus,
      supersededByAvailable: position.supersededByAvailable,
      directSubstituteAvailable: position.directSubstituteAvailable,
      catalogResolved: position.catalogResolved,
    }

    for (const reference of positionReferences(position)) {
      lookup.set(reference, entry)
    }
  }

  return lookup
}

export function findInventoryCatalogEntry(
  lookup: InventoryCatalogLookup,
  productId: string | null,
  productName: string,
): InventoryCatalogEntry | undefined {
  const candidates = [productId, productName]
    .map(normalize)
    .filter(Boolean)

  for (const candidate of candidates) {
    const entry = lookup.get(candidate)

    if (entry) {
      return entry
    }
  }

  return undefined
}

export function buildInventoryCatalogSummary(
  positions: readonly InventoryWorkspacePosition[],
): InventoryCatalogSummary {
  const products = new Map<
    string,
    {
      commercialStatus: ProductCommercialStatus | null
      supersededBy: string | null
      directSubstitute: string | null
      onHand: number
      available: number
      inventoryValue: number
    }
  >()

  for (const position of positions) {
    const key = normalize(
      position.productId ?? position.productName,
    )
    const current = products.get(key) ?? {
      commercialStatus: position.commercialStatus,
      supersededBy: position.supersededBy,
      directSubstitute: position.directSubstitute,
      onHand: 0,
      available: 0,
      inventoryValue: 0,
    }

    current.onHand += position.onHand
    current.available += position.available
    current.inventoryValue += position.inventoryValue
    products.set(key, current)
  }

  const summary: InventoryCatalogSummary = {
    classifiedProducts: 0,
    unclassifiedProducts: 0,
    productsWithSuperseded: 0,
    productsWithDirectSubstitute: 0,
    productsWithBoth: 0,
    supersededWithoutDirectSubstitute: 0,
    supersededOnHand: 0,
    supersededAvailable: 0,
    supersededInventoryValue: 0,
  }

  for (const product of products.values()) {
    if (product.commercialStatus) {
      summary.classifiedProducts += 1
    } else {
      summary.unclassifiedProducts += 1
    }

    if (product.supersededBy) {
      summary.productsWithSuperseded += 1
      summary.supersededOnHand += product.onHand
      summary.supersededAvailable += product.available
      summary.supersededInventoryValue += product.inventoryValue
    }

    if (product.directSubstitute) {
      summary.productsWithDirectSubstitute += 1
    }

    if (product.supersededBy && product.directSubstitute) {
      summary.productsWithBoth += 1
    }

    if (product.supersededBy && !product.directSubstitute) {
      summary.supersededWithoutDirectSubstitute += 1
    }
  }

  return summary
}
