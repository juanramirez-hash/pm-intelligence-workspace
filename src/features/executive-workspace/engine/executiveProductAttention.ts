import type {
  BusinessProduct,
} from '../../../core/business/entities/product'

import type {
  BusinessProductPeriod,
} from '../../../core/business/entities/productPeriod'

import type {
  BusinessRepository,
} from '../../../core/business/repository'

import type {
  ExecutiveProductAttentionSummary,
} from '../types/executiveWorkspaceTypes'

function sortPeriods(
  repository: BusinessRepository,
) {
  return repository
    .getPeriods()
    .sort(
      (left, right) =>
        left.year - right.year ||
        left.month - right.month,
    )
}

function hasRevenue(
  period: BusinessProductPeriod | undefined,
): boolean {
  return (period?.revenue ?? 0) > 0
}

function findFirstActivePeriodId(
  repository: BusinessRepository,
  product: BusinessProduct,
): string | null {
  return repository.product
    .findTimeline(product.id)
    .filter(
      (period) => period.revenue > 0,
    )
    .sort(
      (left, right) =>
        left.periodId.localeCompare(
          right.periodId,
        ),
    )[0]?.periodId ?? null
}

export function buildExecutiveProductAttention(
  repository: BusinessRepository | null,
  currentPeriodId: string | null,
): ExecutiveProductAttentionSummary | null {
  if (!repository || !currentPeriodId) {
    return null
  }

  const periods = sortPeriods(repository)
  const currentPeriodIndex =
    periods.findIndex(
      (period) =>
        period.id === currentPeriodId,
    )

  if (currentPeriodIndex < 0) {
    return null
  }

  const previousPeriodId =
    periods[currentPeriodIndex - 1]?.id ??
    null

  const currentPeriods =
    repository.product.findPeriodsByPeriodId(
      currentPeriodId,
    )

  const previousPeriods =
    previousPeriodId
      ? repository.product.findPeriodsByPeriodId(
          previousPeriodId,
        )
      : []

  const currentByProductId =
    new Map(
      currentPeriods.map(
        (period) => [
          period.productId,
          period,
        ],
      ),
    )

  const previousByProductId =
    new Map(
      previousPeriods.map(
        (period) => [
          period.productId,
          period,
        ],
      ),
    )

  const productIds =
    new Set([
      ...currentByProductId.keys(),
      ...previousByProductId.keys(),
    ])

  let growingProducts = 0
  let decliningProducts = 0
  let recoveredProducts = 0
  let newProducts = 0
  let inactiveOrLostProducts = 0
  let activeProducts = 0

  for (const productId of productIds) {
    const current =
      currentByProductId.get(productId)

    const previous =
      previousByProductId.get(productId)

    const currentActive =
      hasRevenue(current)

    const previousActive =
      hasRevenue(previous)

    if (currentActive) {
      activeProducts += 1
    }

    if (
      currentActive &&
      previousActive
    ) {
      if (
        (current?.revenue ?? 0) >
        (previous?.revenue ?? 0)
      ) {
        growingProducts += 1
      } else if (
        (current?.revenue ?? 0) <
        (previous?.revenue ?? 0)
      ) {
        decliningProducts += 1
      }

      continue
    }

    if (
      currentActive &&
      !previousActive
    ) {
      const product =
        repository.product.findById(
          productId,
        )

      const firstActivePeriodId:
        string | null =
        product
          ? findFirstActivePeriodId(
              repository,
              product,
            )
          : currentPeriodId

      if (
        firstActivePeriodId ===
        currentPeriodId
      ) {
        newProducts += 1
      } else {
        recoveredProducts += 1
      }

      continue
    }

    if (
      !currentActive &&
      previousActive
    ) {
      inactiveOrLostProducts += 1
    }
  }

  return {
    currentPeriodId,
    previousPeriodId,
    totalProducts:
      productIds.size,
    activeProducts,
    productsRequiringAttention:
      decliningProducts +
      inactiveOrLostProducts,
    growingProducts,
    decliningProducts,
    recoveredProducts,
    newProducts,
    inactiveOrLostProducts,
  }
}
