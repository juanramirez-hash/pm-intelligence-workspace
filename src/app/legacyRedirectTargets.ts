// NAV-001: targets of the legacy redirects (pure, tested without a router).

export const EXECUTIVE_PATH = '/executive'

export function legacyAttentionTarget(
  domain: string | undefined,
  search = '',
  hash = '',
): string {
  const path = domain
    ? `${EXECUTIVE_PATH}/attention/${encodeURIComponent(domain)}`
    : EXECUTIVE_PATH

  return `${path}${search}${hash}`
}

// MB-001: the sales workspace is replaced by the brand directory.
export const BRANDS_PATH = '/brands'

export function salesTarget(search = '', hash = ''): string {
  return `${BRANDS_PATH}${search}${hash}`
}

/** /brands/:brandId opens the Ventas tab, keeping the period and the hash. */
export function brandIndexTarget(
  brandId: string | undefined,
  search = '',
  hash = '',
): string {
  return brandId
    ? `${BRANDS_PATH}/${encodeURIComponent(brandId)}/ventas${search}${hash}`
    : `${BRANDS_PATH}${search}${hash}`
}
