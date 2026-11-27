import {
  isReadOnlyDataPost,
  requireDataImportAccess,
} from './middleware/requireWriteAccess.js'
import { requireAuth } from './middleware/requireAuth.js'
import { loadAuthenticatedUser } from './middleware/loadAuthenticatedUser.js'
import { createActionsRouter } from './routes/actions.js'
import { createMetricsRouter } from './routes/metrics.js'
import { createMyDayRouter } from './routes/myDay.js'
import { createDataStatusRouter } from './routes/dataStatus.js'
import { createSearchRouter } from './routes/search.js'
import { createImportBodyParser } from './http/requestLimits.js'

export function registerBusinessRoutes(app, pool) {
  const authenticatedUser =
    loadAuthenticatedUser(pool)

  const importBodyParser =
    createImportBodyParser()

  // Register before existing /api/data routers so only team-wide writers can import.
  app.use(
    '/api/data',
    (req, res, next) => {
      if (
        ['GET', 'HEAD', 'OPTIONS'].includes(
          req.method,
        )
      ) {
        return next()
      }

      // Sales analytics routers apply auth and brand scope themselves.
      if (isReadOnlyDataPost(req)) {
        return next()
      }

      return requireAuth(
        req,
        res,
        () =>
          authenticatedUser(
            req,
            res,
            () =>
              requireDataImportAccess(
                req,
                res,
                // Large import bodies are read only after the import permission.
                () =>
                  importBodyParser(
                    req,
                    res,
                    next,
                  ),
              ),
          ),
      )
    },
  )

  app.use(
    '/api/actions',
    requireAuth,
    authenticatedUser,
    createActionsRouter(pool),
  )

  app.use(
    '/api/metrics',
    requireAuth,
    authenticatedUser,
    createMetricsRouter(pool),
  )

  // MD-001. Rate limited in index.js (createApiRateLimit, SEC-004).
  app.use(
    '/api/my-day',
    requireAuth,
    authenticatedUser,
    createMyDayRouter(pool),
  )

  app.use(
    '/api/search',
    requireAuth,
    authenticatedUser,
    createSearchRouter(pool),
  )

  // NAV-001: "Datos al corte" of the top bar. Session only, no brand scope
  // (dates only). Rate limited in index.js (createApiRateLimit, SEC-004).
  app.use(
    '/api/status',
    requireAuth,
    authenticatedUser,
    createDataStatusRouter(pool),
  )
}