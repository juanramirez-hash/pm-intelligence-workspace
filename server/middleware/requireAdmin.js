export function requireAdmin(
  req,
  res,
  next,
) {
  if (!req.session?.user) {
    return res
      .status(401)
      .json({
        ok: false,
        authenticated: false,
        error: 'Authentication required',
      })
  }

  if (
    req.session.user.role !== 'admin'
  ) {
    return res
      .status(403)
      .json({
        ok: false,
        authenticated: true,
        error: 'Administrator access required',
      })
  }

  return next()
}