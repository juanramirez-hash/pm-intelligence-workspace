// Enforce server-loaded write permission on action mutations.
export function requireWriteAccess(req, res, next) {
  if (!req.authUser) {
    return res.status(401).json({
      ok: false,
      authenticated: false,
      error: 'Authentication required',
    })
  }

  if (req.authUser.writeAccess !== true) {
    return res.status(403).json({
      ok: false,
      authenticated: true,
      error: 'Write access required',
    })
  }

  return next()
}

// Data Center imports replace shared data: only team-wide roles with write access.
export function requireDataImportAccess(req, res, next) {
  if (!req.authUser) {
    return res.status(401).json({
      ok: false,
      authenticated: false,
      error: 'Authentication required',
    })
  }

  if (
    req.authUser.writeAccess !== true ||
    req.authUser.scope !== 'all'
  ) {
    return res.status(403).json({
      ok: false,
      authenticated: true,
      error: 'Data import access required',
    })
  }

  return next()
}

// POST routes under /api/data that only read (req.path is relative to the mount).
export function isReadOnlyDataPost(req) {
  return (
    req.method === 'POST' &&
    typeof req.path === 'string' &&
    req.path.startsWith('/sales/analytics/')
  )
}

/** Gerencia y administración ven el trabajo de todo el equipo. */
export function isTeamWideRole(authUser) {
  return authUser?.scope === 'all'
}
