// MD-003: the 5 priority actions of "Mi día". /api/actions orders by
// horizon first, so the order is applied here: priority (critical > high >
// medium > low), then due date.

import {
  normalizeBrandKey,
} from '../../auth/brandAccess'

import type {
  AuthenticatedUser,
} from '../../auth/authTypes'

import type {
  MyDayAction,
  MyDayActionPriority,
  MyDayView,
} from '../api/myDayTypes'

const OPEN_STATUSES = new Set(['open', 'in_progress', 'blocked'])

const PRIORITY_RANK: Record<MyDayActionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/**
 * Brands of the actions block, the same rule as /api/my-day: the user's
 * assignments with view=mine; every brand in the user's scope with
 * view=all or without assignments (null = no filter).
 */
export function resolveActionBrandKeys(
  user: Pick<AuthenticatedUser, 'brandIds'>,
  view: MyDayView,
): string[] | null {
  if (view === 'all') {
    return null
  }

  const keys = user.brandIds
    .map((brandId) => normalizeBrandKey(brandId))
    .filter((key): key is string => Boolean(key))

  return keys.length > 0 ? [...new Set(keys)] : null
}

export function selectPriorityActions(
  actions: readonly MyDayAction[],
  brandKeys: readonly string[] | null,
  limit = 5,
): MyDayAction[] {
  const allowed = brandKeys ? new Set(brandKeys) : null

  return actions
    .filter((action) => OPEN_STATUSES.has(action.status))
    .filter((action) =>
      !allowed || allowed.has(normalizeBrandKey(action.brand_key) ?? ''),
    )
    .sort((left, right) =>
      (PRIORITY_RANK[left.priority] ?? 9) - (PRIORITY_RANK[right.priority] ?? 9) ||
      String(left.due_date).localeCompare(String(right.due_date)) ||
      left.id - right.id,
    )
    .slice(0, limit)
}
