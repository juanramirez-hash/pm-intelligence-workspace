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

/** Gerencia y administración ven el trabajo de todo el equipo. */
export function isTeamWideRole(authUser) {
  return authUser?.scope === 'all'
}
