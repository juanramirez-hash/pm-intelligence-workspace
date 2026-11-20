import {
  ipKeyGenerator,
  rateLimit,
} from 'express-rate-limit'

// Request rate limits (SEC-004). In-memory counters: they reset when the
// backend restarts and assume a single backend process.

export function createSigninRateLimit({
  limit = 20,
  windowMs = 15 * 60 * 1000,
} = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.redirect('/?auth_error=rate_limited'),
  })
}

/** Per signed-in user; per IP when there is no session user. */
export function rateLimitKey(req) {
  const userId = Number(req.session?.user?.id)

  if (Number.isInteger(userId) && userId > 0) {
    return `user:${userId}`
  }

  return `ip:${ipKeyGenerator(req.ip ?? '')}`
}

export function createApiRateLimit({
  limit = 120,
  windowMs = 60 * 1000,
} = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: rateLimitKey,
    handler: (_req, res) =>
      res.status(429).json({
        ok: false,
        error: 'Demasiadas solicitudes',
      }),
  })
}
