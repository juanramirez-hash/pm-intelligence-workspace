export function requireAdmin(
  req,
  res,
  next,
) {
  if (!req.authUser) {
    return res
      .status(401)
      .json({
        ok: false,
        authenticated: false,
        error:
          'Authentication required',
      })
  }

  if (
    req.authUser.role !== 'admin'
  ) {
    return res
      .status(403)
      .json({
        ok: false,
        authenticated: true,
        error:
          'Administrator access required',
      })
  }

  return next()
}