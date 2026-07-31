import type {
  BusinessInventoryPosition,
} from '../../../core/business/entities/inventoryPosition'

import type {
  BusinessProduct,
} from '../../../core/business/entities/product'

export type ProductCatalogReplacementStatus =
  | 'current'
  | 'superseded_with_direct'
  | 'superseded_without_direct'
  | 'direct_substitute_only'

export interface ProductCatalogReplacementReference {
  reference: string
  productId: string | null
  productName: string | null
  model: string | null
  resolved: boolean
  onHand: number
  available: number
  locations: number
}

export interface ProductCatalogReplacementViewModel {
  status: ProductCatalogReplacementStatus
  statusLabel: string
  shortLabel: string
  description: string
  tone: 'positive' | 'attention' | 'critical'
  supersededBy: ProductCatalogReplacementReference | null
  directSubstitute: ProductCatalogReplacementReference | null
}

export interface ProductCatalogReplacementResolver {
  findProductById: (id: string) => BusinessProduct | undefined
  findProductByName: (name: string) => BusinessProduct | undefined
  findProductByCode: (code: string) => BusinessProduct | undefined
  findLatestInventoryByProduct: (
    productIdOrName: string,
  ) => BusinessInventoryPosition[]
}

function normalize(
  value: string | null | undefined,
): string {
  return (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function normalizedReference(
  value: string | null | undefined,
): string | null {
  const reference = normalize(value)
  return reference || null
}

function resolveProduct(
  reference: string,
  resolver: ProductCatalogReplacementResolver,
): BusinessProduct | undefined {
  return resolver.findProductById(reference) ??
    resolver.findProductByName(reference) ??
    resolver.findProductByCode(reference)
}

function uniqueReferences(
  values: Array<string | null | undefined>,
): string[] {
  return values
    .map(normalize)
    .filter((value, index, references) =>
      Boolean(value) && references.indexOf(value) === index,
    )
}

function resolveLatestInventory(
  reference: string,
  product: BusinessProduct | undefined,
  resolver: ProductCatalogReplacementResolver,
): BusinessInventoryPosition[] {
  const candidates = uniqueReferences([
    product?.id,
    product?.name,
    product?.code,
    reference,
  ])

  for (const candidate of candidates) {
    const positions = resolver.findLatestInventoryByProduct(candidate)

    if (positions.length > 0) {
      return positions
    }
  }

  return []
}

function buildReference(
  referenceValue: string | null | undefined,
  resolver: ProductCatalogReplacementResolver,
): ProductCatalogReplacementReference | null {
  const reference = normalizedReference(referenceValue)

  if (!reference) {
    return null
  }

  const product = resolveProduct(reference, resolver)
  const positions = resolveLatestInventory(
    reference,
    product,
    resolver,
  )

  return {
    reference,
    productId: product?.id ?? null,
    productName: product?.name ?? null,
    model: product?.model ?? null,
    resolved: Boolean(product),
    onHand: positions.reduce(
      (total, position) => total + position.onHand,
      0,
    ),
    available: positions.reduce(
      (total, position) => total + position.available,
      0,
    ),
    locations: new Set(
      positions.map((position) => position.locationId),
    ).size,
  }
}

function replacementPresentation(
  supersededBy: ProductCatalogReplacementReference | null,
  directSubstitute: ProductCatalogReplacementReference | null,
): Pick<
  ProductCatalogReplacementViewModel,
  'status' | 'statusLabel' | 'shortLabel' | 'description' | 'tone'
> {
  if (supersededBy && directSubstitute) {
    return {
      status: 'superseded_with_direct',
      statusLabel: 'Superseded con sustituto directo',
      shortLabel: 'Con sustituto directo',
      description:
        'El Product Master identifica al SKU como sustituido y registra una ruta directa de reemplazo.',
      tone: 'attention',
    }
  }

  if (supersededBy) {
    return {
      status: 'superseded_without_direct',
      statusLabel: 'Superseded sin sustituto directo',
      shortLabel: 'Superseded sin sustituto',
      description:
        'El SKU tiene un producto Superseded By, pero no cuenta con sustituto directo registrado.',
      tone: 'critical',
    }
  }

  if (directSubstitute) {
    return {
      status: 'direct_substitute_only',
      statusLabel: 'Sustituto directo registrado',
      shortLabel: 'Sustituto directo',
      description:
        'El Product Master registra un sustituto directo aunque el campo Superseded By esté vacío.',
      tone: 'attention',
    }
  }

  return {
    status: 'current',
    statusLabel: 'Producto vigente',
    shortLabel: 'Sin sustitución',
    description:
      'No existe Superseded By ni sustituto directo registrado para este SKU.',
    tone: 'positive',
  }
}

export function buildProductCatalogReplacement(
  product: BusinessProduct,
  resolver: ProductCatalogReplacementResolver,
): ProductCatalogReplacementViewModel {
  const supersededBy = buildReference(
    product.supersededBy,
    resolver,
  )
  const directSubstitute = buildReference(
    product.directSubstitute,
    resolver,
  )

  return {
    ...replacementPresentation(
      supersededBy,
      directSubstitute,
    ),
    supersededBy,
    directSubstitute,
  }
}
