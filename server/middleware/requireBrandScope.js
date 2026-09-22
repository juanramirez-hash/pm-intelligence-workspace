/**
 * Resuelve el alcance de marcas del usuario autenticado y lo deja en req.brandScope.
 *
 * Debe montarse DESPUÉS de requireAuth y loadAuthenticatedUser, porque depende
 * de req.authUser (scope y brandIds vienen de PostgreSQL, nunca del cliente).
 *
 * req.brandScope = {
 *   mode: 'all' | 'assigned',
 *   brandKeys: string[]   // normalizadas con la misma regla que brand_key() en SQL
 * }
 */

const SCOPES_WITH_FULL_ACCESS = new Set(['all'])
const SCOPES_WITH_ASSIGNED_ACCESS = new Set(['assigned'])

export function normalizeBrandKey(value) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

  return normalized.length > 0 ? normalized : null
}

export function normalizeBrandKeys(values) {
  if (!Array.isArray(values)) {
    return []
  }

  const keys = values
    .map(normalizeBrandKey)
    .filter((key) => key !== null)

  return Array.from(new Set(keys))
}

export function requireBrandScope(req, res, next) {
  const access = req.authUser

  if (!access) {
    return res.status(401).json({
      ok: false,
      authenticated: false,
      error: 'Authentication required',
    })
  }

  if (SCOPES_WITH_FULL_ACCESS.has(access.scope)) {
    req.brandScope = {
      mode: 'all',
      brandKeys: [],
    }

    return next()
  }

  if (!SCOPES_WITH_ASSIGNED_ACCESS.has(access.scope)) {
    // 'pricing' y 'legacy' no tienen alcance comercial definido: se niegan.
    return res.status(403).json({
      ok: false,
      error: 'Brand access scope is invalid',
    })
  }

  const brandKeys = normalizeBrandKeys(access.brandIds)

  if (brandKeys.length === 0) {
    return res.status(403).json({
      ok: false,
      error: 'No brand assignments for this user',
    })
  }

  req.brandScope = {
    mode: 'assigned',
    brandKeys,
  }

  return next()
}

/**
 * Valida que una marca solicitada esté dentro del alcance del usuario.
 * Devuelve la clave normalizada o null si no está permitida.
 */
export function resolveRequestedBrandKey(req, rawBrand) {
  const requested = normalizeBrandKey(rawBrand)

  if (requested === null) {
    return null
  }

  if (req.brandScope?.mode === 'all') {
    return requested
  }

  return req.brandScope?.brandKeys.includes(requested)
    ? requested
    : null
}
