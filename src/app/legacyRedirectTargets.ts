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
