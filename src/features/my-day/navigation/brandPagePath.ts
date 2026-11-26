// MD-003: link from "Mi día" to the brand page (/brands/:brandId).
//
// The brand page identifies a brand by its name normalized like
// normalizeBrandIdentifier in buildBusinessDataModel.ts (trim, es-MX upper
// case, collapsed spaces, STREAMAX alias), not by brand_key(). It is copied
// here so this page does not load the business model; a parity test keeps
// both equal.

export function brandPageId(brandLabel: string | null | undefined): string | null {
  if (!brandLabel) {
    return null
  }

  const normalized = brandLabel
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')

  if (!normalized) {
    return null
  }

  return normalized === 'MERIVA TECHNOLOGY - STREAMAX'
    ? 'STREAMAX - MERIVA'
    : normalized
}

export function brandPagePath(brandLabel: string | null | undefined): string | null {
  const brandId = brandPageId(brandLabel)

  return brandId ? `/brands/${encodeURIComponent(brandId)}` : null
}
