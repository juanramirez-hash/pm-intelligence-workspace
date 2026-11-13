import type {
  AuthenticatedUser,
} from './authTypes'

export function hasAllBrandAccess(
  user: AuthenticatedUser,
): boolean {
  return user.scope === 'all'
}

export function canAccessBrand(
  user: AuthenticatedUser,
  brandId: string,
): boolean {
  if (hasAllBrandAccess(user)) {
    return true
  }

  if (user.scope !== 'assigned') {
    return true
  }

  return user.brandIds.includes(
    brandId,
  )
}

/**
 * Same rule as normalizeBrandKey in server/middleware/requireBrandScope.js
 * and brand_key() in SQL, including the STREAMAX alias.
 */
export function normalizeBrandKey(
  value: unknown,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

  if (!normalized) {
    return null
  }

  if (normalized === 'MERIVATECHNOLOGYSTREAMAX') {
    return 'STREAMAXMERIVA'
  }

  return normalized
}

export type CostVisibility =
  | { mode: 'none' }
  | { mode: 'all' }
  | { mode: 'assigned', brandKeys: string[] }

/**
 * Mirrors resolveCostScope in the server: which costs the API returns
 * for this user (SEC-003A).
 */
export function resolveCostVisibility(
  user: AuthenticatedUser,
): CostVisibility {
  if (user.costAccess !== true) {
    return { mode: 'none' }
  }

  if (user.scope === 'all') {
    return { mode: 'all' }
  }

  if (user.scope === 'assigned') {
    return {
      mode: 'assigned',
      brandKeys: Array.from(
        new Set(
          user.brandIds
            .map(normalizeBrandKey)
            .filter(
              (key): key is string =>
                key !== null,
            ),
        ),
      ),
    }
  }

  return { mode: 'none' }
}

export function filterAccessibleBrandIds(
  user: AuthenticatedUser,
  brandIds: readonly string[],
): string[] {
  if (hasAllBrandAccess(user)) {
    return [...brandIds]
  }

  if (user.scope !== 'assigned') {
    return [...brandIds]
  }

  const assignedBrandIds =
    new Set(user.brandIds)

  return brandIds.filter(
    (brandId) =>
      assignedBrandIds.has(
        brandId,
      ),
  )
}