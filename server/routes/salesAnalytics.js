import {
  Router,
} from 'express'

import {
  groupSalesSegmentation,
  loadSalesSegmentationDetailRows,
  loadSalesSegmentationFilterOptions,
  summarizeSalesSegmentation,
} from '../services/salesAnalyticsService.js'

const salesSegmentationDimensions =
  new Set([
    'period',
    'brand',
    'customer',
    'product',
    'location',
    'salesRepresentative',
  ])

const salesSegmentationListFilterFields = [
  'periodIds',
  'brandIds',
  'customerIds',
  'productIds',
  'locationIds',
  'salesRepresentativeIds',
]

const salesSegmentationStringFilterFields = [
  'dateFrom',
  'dateTo',
  'searchTerm',
]

function resolveSalesAnalyticsAccess(
  req,
  res,
) {
  const access = req.authUser

  if (!access) {
    res.status(401).json({
      ok: false,
      error: 'Authentication required',
    })

    return null
  }

  if (
    access.scope !== 'all' &&
    access.scope !== 'assigned'
  ) {
    res.status(403).json({
      ok: false,
      error: 'Sales access scope is invalid',
    })

    return null
  }

  if (
    access.scope === 'assigned' &&
    (
      !Array.isArray(access.brandIds) ||
      !access.brandIds.every(
        (brandId) =>
          typeof brandId === 'string' &&
          brandId.trim().length > 0,
      )
    )
  ) {
    res.status(403).json({
      ok: false,
      error: 'Sales brand assignments are invalid',
    })

    return null
  }

  return {
    scope: access.scope,
    brandIds:
      access.scope === 'assigned'
        ? access.brandIds
        : [],
  }
}

function parseSalesSegmentationFilter(
  value,
) {
  if (value == null) {
    return {
      ok: true,
      filter: {},
    }
  }

  if (
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return {
      ok: false,
      error:
        'Sales analytics filter is invalid',
    }
  }

  const filter = {}

  for (
    const field of
    salesSegmentationListFilterFields
  ) {
    const candidate = value[field]

    if (candidate === undefined) {
      continue
    }

    if (
      !Array.isArray(candidate) ||
      !candidate.every(
        (item) =>
          typeof item === 'string' &&
          item.trim().length > 0,
      )
    ) {
      return {
        ok: false,
        error:
          `Sales analytics filter ${field} is invalid`,
      }
    }

    filter[field] = candidate
  }

  for (
    const field of
    salesSegmentationStringFilterFields
  ) {
    const candidate = value[field]

    if (candidate === undefined) {
      continue
    }

    if (typeof candidate !== 'string') {
      return {
        ok: false,
        error:
          `Sales analytics filter ${field} is invalid`,
      }
    }

    filter[field] = candidate
  }

  return {
    ok: true,
    filter,
  }
}

function prepareSalesAnalyticsRequest(
  req,
  res,
) {
  const access =
    resolveSalesAnalyticsAccess(
      req,
      res,
    )

  if (!access) {
    return null
  }

  const parsedFilter =
    parseSalesSegmentationFilter(
      req.body?.filter,
    )

  if (!parsedFilter.ok) {
    res.status(400).json({
      ok: false,
      error: parsedFilter.error,
    })

    return null
  }

  res.set(
    'Cache-Control',
    'no-store',
  )

  return {
    access,
    filter: parsedFilter.filter,
  }
}

export function createSalesAnalyticsRouter(
  pool,
) {
  const router = Router()

  router.post(
    '/summary',
    async (req, res) => {
      const request =
        prepareSalesAnalyticsRequest(
          req,
          res,
        )

      if (!request) {
        return
      }

      try {
        const data =
          await summarizeSalesSegmentation(
            pool,
            request.access,
            request.filter,
          )

        return res.json({
          ok: true,
          dataset: 'sales',
          analytics: 'summary',
          data,
        })
      } catch (error) {
        console.error(
          'Sales analytics summary failed:',
          error,
        )

        return res.status(500).json({
          ok: false,
          error:
            'Sales analytics summary failed',
        })
      }
    },
  )

  router.post(
    '/group-by',
    async (req, res) => {
      const request =
        prepareSalesAnalyticsRequest(
          req,
          res,
        )

      if (!request) {
        return
      }

      const dimension =
        req.body?.dimension

      if (
        typeof dimension !== 'string' ||
        !salesSegmentationDimensions.has(
          dimension,
        )
      ) {
        return res.status(400).json({
          ok: false,
          error:
            'Sales analytics dimension is invalid',
        })
      }

      try {
        const data =
          await groupSalesSegmentation(
            pool,
            dimension,
            request.access,
            request.filter,
          )

        return res.json({
          ok: true,
          dataset: 'sales',
          analytics: 'group-by',
          dimension,
          data,
        })
      } catch (error) {
        console.error(
          'Sales analytics group-by failed:',
          error,
        )

        return res.status(500).json({
          ok: false,
          error:
            'Sales analytics group-by failed',
        })
      }
    },
  )

  router.post(
    '/filter-options',
    async (req, res) => {
      const request =
        prepareSalesAnalyticsRequest(
          req,
          res,
        )

      if (!request) {
        return
      }

      const periodId =
        req.body?.periodId

      if (
        typeof periodId !== 'string' ||
        periodId.trim().length === 0
      ) {
        return res.status(400).json({
          ok: false,
          error:
            'Sales analytics periodId is invalid',
        })
      }

      try {
        const data =
          await loadSalesSegmentationFilterOptions(
            pool,
            periodId,
            request.access,
            request.filter,
          )

        return res.json({
          ok: true,
          dataset: 'sales',
          analytics: 'filter-options',
          periodId,
          data,
        })
      } catch (error) {
        console.error(
          'Sales analytics filter options failed:',
          error,
        )

        return res.status(500).json({
          ok: false,
          error:
            'Sales analytics filter options failed',
        })
      }
    },
  )

  router.post(
    '/detail-rows',
    async (req, res) => {
      const request =
        prepareSalesAnalyticsRequest(
          req,
          res,
        )

      if (!request) {
        return
      }

      const limit =
        req.body?.limit ?? 100

      if (
        typeof limit !== 'number' ||
        !Number.isFinite(limit)
      ) {
        return res.status(400).json({
          ok: false,
          error:
            'Sales analytics limit is invalid',
        })
      }

      try {
        const data =
          await loadSalesSegmentationDetailRows(
            pool,
            request.access,
            request.filter,
            limit,
          )

        return res.json({
          ok: true,
          dataset: 'sales',
          analytics: 'detail-rows',
          data,
        })
      } catch (error) {
        console.error(
          'Sales analytics detail rows failed:',
          error,
        )

        return res.status(500).json({
          ok: false,
          error:
            'Sales analytics detail rows failed',
        })
      }
    },
  )

  return router
}
