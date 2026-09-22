import { requireWriteAccess } from './middleware/requireWriteAccess.js'
import { requireAuth } from './middleware/requireAuth.js'
import { loadAuthenticatedUser } from './middleware/loadAuthenticatedUser.js'
import { createActionsRouter } from './routes/actions.js'
import { createMetricsRouter } from './routes/metrics.js'

export function registerBusinessRoutes(app, pool) {
  const authenticatedUser = loadAuthenticatedUser(pool)
  // Register before existing /api/data routers so read-only roles cannot import.
  app.use('/api/data', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
    return requireAuth(req, res, () => authenticatedUser(req, res, () => requireWriteAccess(req, res, next)))
  })
  app.use('/api/actions', requireAuth, authenticatedUser, createActionsRouter(pool))
  app.use('/api/metrics', requireAuth, authenticatedUser, createMetricsRouter(pool))
}
