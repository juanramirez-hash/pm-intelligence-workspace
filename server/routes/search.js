import {
  Router,
} from 'express'

import {
  requireBrandScope,
} from '../middleware/requireBrandScope.js'

import {
  searchGlobalCatalog,
} from '../services/globalSearchService.js'

export function createSearchRouter(
  pool,
) {
  const router =
    Router()

  router.use(
    requireBrandScope,
  )

  router.use(
    (_req, res, next) => {
      res.set(
        'Cache-Control',
        'no-store',
      )

      next()
    },
  )

  router.get(
    '/',
    async (req, res) => {
      try {
        const query =
          typeof req.query.q ===
          'string'
            ? req.query.q
            : ''

        const results =
          await searchGlobalCatalog(
            pool,
            {
              query,
              brandScope:
                req.brandScope,
            },
          )

        return res.json({
          ok: true,
          query,
          ...results,
        })
      } catch (error) {
        console.error(
          'Global search failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Global search failed',
          })
      }
    },
  )

  return router
}