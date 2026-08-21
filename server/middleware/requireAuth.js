export function requireAuth(
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

  return next()
}