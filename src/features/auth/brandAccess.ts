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