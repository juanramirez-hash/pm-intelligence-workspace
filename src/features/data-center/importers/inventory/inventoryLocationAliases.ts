// Short location names for the NetSuite "TS - Reporte de inventario por
// sucursal" groups (DC-002). The only place to map a NetSuite branch to the
// name used in PM Intelligence. A branch that is not here keeps its NetSuite
// name and the import shows "Sucursal sin alias: …".

export const INVENTORY_LOCATION_ALIASES: ReadonlyArray<
  readonly [netsuiteName: string, location: string]
> = [
  ['002 CDMX : CEDIS', 'CEDIS CDMX'],
  ['002 CDMX : PROYECTOS', 'PROYECTOS'],
  ['002 CDMX : VENTAS.', 'VENTAS CDMX'],
  ['011 QUERETARO : VENTAS', 'VENTAS QRO'],
  ['013 PUEBLA : VENTAS', 'VENTAS PUE'],
  ['015 GUADALAJARA : VENTAS', 'VENTAS GDL'],
  ['017 VERACRUZ : VENTAS', 'VENTAS VER'],
  ['019 MERIDA : VENTAS', 'VENTAS MER'],
  ['021 MONTERREY : CEDIS MTY', 'CEDIS MTY'],
  ['021 MONTERREY : VENTAS', 'VENTAS MTY'],
]

/** Ignores case, accents, punctuation and repeated spaces. */
export function normalizeInventoryLocationKey(
  value: string,
): string {
  return value
    .replace(/ /g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const LOCATION_BY_KEY = new Map<string, string>(
  INVENTORY_LOCATION_ALIASES.flatMap(([netsuiteName, location]) => [
    [normalizeInventoryLocationKey(netsuiteName), location],
    // Files already normalized by hand use the short name.
    [normalizeInventoryLocationKey(location), location],
  ]),
)

export interface ResolvedInventoryLocation {
  location: string
  aliased: boolean
}

export function resolveInventoryLocation(
  name: string,
): ResolvedInventoryLocation {
  const location = LOCATION_BY_KEY.get(
    normalizeInventoryLocationKey(name),
  )

  return location
    ? { location, aliased: true }
    : { location: name, aliased: false }
}

export function unaliasedLocationWarning(location: string): string {
  return `Sucursal sin alias: ${location}`
}

/** Warnings shown in the import panel for an inventory validation. */
export function inventoryImportWarnings(
  validation: object,
): string[] {
  const unaliased =
    'unaliasedLocations' in validation &&
    Array.isArray(validation.unaliasedLocations)
      ? validation.unaliasedLocations
      : []

  return unaliased.map((location) =>
    unaliasedLocationWarning(String(location)),
  )
}
