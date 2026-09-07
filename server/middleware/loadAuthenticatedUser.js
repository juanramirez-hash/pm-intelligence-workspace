export function loadAuthenticatedUser(
  pool,
) {
  return async function authenticatedUserMiddleware(
    req,
    res,
    next,
  ) {
    const userId =
      Number(
        req.session?.user?.id,
      )

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res
        .status(401)
        .json({
          ok: false,
          authenticated: false,
          error:
            'Authentication required',
        })
    }

    try {
      const result =
        await pool.query(
          `
            SELECT
              u.id,
              u.email,
              u.name,
              u.role,
              u.active,
              r.role_name,
              r.scope,
              r.write_access,
              r.active AS role_active,
              COALESCE(
                ARRAY_AGG(
                  a.brand_id
                  ORDER BY a.brand_id
                ) FILTER (
                  WHERE
                    a.brand_id IS NOT NULL
                ),
                ARRAY[]::TEXT[]
              ) AS brand_ids
            FROM app_users u
            LEFT JOIN app_roles r
              ON r.role_key = u.role
            LEFT JOIN
              app_user_brand_assignments a
              ON a.user_id = u.id
            WHERE u.id = $1
            GROUP BY
              u.id,
              u.email,
              u.name,
              u.role,
              u.active,
              r.role_name,
              r.scope,
              r.write_access,
              r.active
          `,
          [userId],
        )

      const user =
        result.rows[0]

      if (
        !user ||
        user.active !== true ||
        user.role_active !== true
      ) {
        return res
          .status(403)
          .json({
            ok: false,
            authenticated: false,
            error:
              'User is not authorized',
          })
      }

      req.authUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleName:
          user.role_name,
        scope: user.scope,
        writeAccess:
          user.write_access,
        brandIds:
          user.brand_ids,
      }

      return next()
    } catch (error) {
      console.error(
        'Authenticated user load failed:',
        error,
      )

      return res
        .status(500)
        .json({
          ok: false,
          authenticated: false,
          error:
            'Authenticated user load failed',
        })
    }
  }
}