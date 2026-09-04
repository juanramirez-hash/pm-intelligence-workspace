import {
  Router,
} from 'express'

const ALLOWED_ROLES =
  new Set([
    'admin',
    'analyst',
    'viewer',
    'manager',
    'pm',
    'engineering',
  ])

function normalizeEmail(value) {
  if (typeof value !== 'string') {
    return null
  }

  const email =
    value.trim().toLowerCase()

  if (
    email === '' ||
    !email.includes('@')
  ) {
    return null
  }

  return email
}

function normalizeName(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const name = value.trim()

  return name === ''
    ? null
    : name
}

function normalizeBrandIds(value) {
  if (!Array.isArray(value)) {
    return null
  }

  const normalized =
    value
      .filter(
        (brandId) =>
          typeof brandId === 'string',
      )
      .map(
        (brandId) =>
          brandId
            .trim()
            .toLocaleUpperCase('es-MX')
            .replace(/\s+/g, ' '),
      )
      .filter(
        (brandId) =>
          brandId !== '',
      )

  return [
    ...new Set(normalized),
  ]
}

export function createSettingsUsersRouter(
  pool,
) {
  const router = Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const result =
          await pool.query(
            `
              SELECT
                id,
                email,
                name,
                role,
                active,
                created_at,
                last_login_at
              FROM app_users
              ORDER BY
                active DESC,
                name NULLS LAST,
                email
            `,
          )

        return res.json({
          ok: true,
          users: result.rows,
        })
      } catch (error) {
        console.error(
          'Settings users load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Settings users load failed',
          })
      }
    },
  )

  router.post(
    '/',
    async (req, res) => {
      try {
        const email =
          normalizeEmail(
            req.body?.email,
          )

        const name =
          normalizeName(
            req.body?.name,
          )

        const role =
          req.body?.role

        const active =
          req.body?.active ?? true

        if (!email) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'A valid email is required',
            })
        }

        if (
          name === undefined
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Name must be a string or null',
            })
        }

        if (
          typeof role !== 'string' ||
          !ALLOWED_ROLES.has(role)
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Role is not valid',
            })
        }

        if (
          typeof active !== 'boolean'
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Active must be boolean',
            })
        }

        const result =
          await pool.query(
            `
              INSERT INTO app_users (
                email,
                name,
                role,
                active
              )
              VALUES ($1, $2, $3, $4)
              RETURNING
                id,
                email,
                name,
                role,
                active,
                created_at,
                last_login_at
            `,
            [
              email,
              name,
              role,
              active,
            ],
          )

        return res
          .status(201)
          .json({
            ok: true,
            user: result.rows[0],
          })
      } catch (error) {
        if (
          error?.code === '23505'
        ) {
          return res
            .status(409)
            .json({
              ok: false,
              error:
                'User already exists',
            })
        }

        console.error(
          'Settings user create failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Settings user create failed',
          })
      }
    },
  )

  router.patch(
    '/:id',
    async (req, res) => {
      try {
        const userId =
          Number(req.params.id)

        if (
          !Number.isInteger(userId) ||
          userId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'User id is not valid',
            })
        }

        const updates = []
        const values = []

        if (
          Object.hasOwn(
            req.body ?? {},
            'name',
          )
        ) {
          const name =
            normalizeName(
              req.body.name,
            )

          if (
            name === undefined
          ) {
            return res
              .status(400)
              .json({
                ok: false,
                error:
                  'Name must be a string or null',
              })
          }

          values.push(name)
          updates.push(
            `name = $${values.length}`,
          )
        }

        if (
          Object.hasOwn(
            req.body ?? {},
            'role',
          )
        ) {
          const role =
            req.body.role

          if (
            typeof role !== 'string' ||
            !ALLOWED_ROLES.has(role)
          ) {
            return res
              .status(400)
              .json({
                ok: false,
                error:
                  'Role is not valid',
              })
          }

          values.push(role)
          updates.push(
            `role = $${values.length}`,
          )
        }

        if (
          Object.hasOwn(
            req.body ?? {},
            'active',
          )
        ) {
          const active =
            req.body.active

          if (
            typeof active !== 'boolean'
          ) {
            return res
              .status(400)
              .json({
                ok: false,
                error:
                  'Active must be boolean',
              })
          }

          values.push(active)
          updates.push(
            `active = $${values.length}`,
          )
        }

        if (updates.length === 0) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'No valid changes provided',
            })
        }

        values.push(userId)

        const result =
          await pool.query(
            `
              UPDATE app_users
              SET
                ${updates.join(', ')}
              WHERE id =
                $${values.length}
              RETURNING
                id,
                email,
                name,
                role,
                active,
                created_at,
                last_login_at
            `,
            values,
          )

        if (
          result.rows.length === 0
        ) {
          return res
            .status(404)
            .json({
              ok: false,
              error:
                'User not found',
            })
        }

        return res.json({
          ok: true,
          user: result.rows[0],
        })
      } catch (error) {
        console.error(
          'Settings user update failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Settings user update failed',
          })
      }
    },
  )

    router.get(
    '/:id/brands',
    async (req, res) => {
      try {
        const userId =
          Number(req.params.id)

        if (
          !Number.isInteger(userId) ||
          userId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'User id is not valid',
            })
        }

        const userResult =
          await pool.query(
            `
              SELECT id
              FROM app_users
              WHERE id = $1
            `,
            [userId],
          )

        if (
          userResult.rows.length === 0
        ) {
          return res
            .status(404)
            .json({
              ok: false,
              error:
                'User not found',
            })
        }

        const result =
          await pool.query(
            `
              SELECT brand_id
              FROM app_user_brand_assignments
              WHERE user_id = $1
              ORDER BY brand_id
            `,
            [userId],
          )

        return res.json({
          ok: true,
          brandIds:
            result.rows.map(
              (row) =>
                row.brand_id,
            ),
        })
      } catch (error) {
        console.error(
          'Settings user brands load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Settings user brands load failed',
          })
      }
    },
  )

  router.put(
    '/:id/brands',
    async (req, res) => {
      const client =
        await pool.connect()

      try {
        const userId =
          Number(req.params.id)

        if (
          !Number.isInteger(userId) ||
          userId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'User id is not valid',
            })
        }

        const brandIds =
          normalizeBrandIds(
            req.body?.brandIds,
          )

        if (brandIds === null) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'brandIds must be an array',
            })
        }

        const createdBy =
          Number(
            req.session?.user?.id,
          )

        await client.query(
          'BEGIN',
        )

        const userResult =
          await client.query(
            `
              SELECT id
              FROM app_users
              WHERE id = $1
              FOR UPDATE
            `,
            [userId],
          )

        if (
          userResult.rows.length === 0
        ) {
          await client.query(
            'ROLLBACK',
          )

          return res
            .status(404)
            .json({
              ok: false,
              error:
                'User not found',
            })
        }

        await client.query(
          `
            DELETE FROM
              app_user_brand_assignments
            WHERE user_id = $1
          `,
          [userId],
        )

        if (
          brandIds.length > 0
        ) {
          await client.query(
            `
              INSERT INTO
                app_user_brand_assignments (
                  user_id,
                  brand_id,
                  created_by
                )
              SELECT
                $1,
                brand_id,
                $3
              FROM
                unnest(
                  $2::text[]
                ) AS brand_id
            `,
            [
              userId,
              brandIds,
              Number.isInteger(
                createdBy,
              )
                ? createdBy
                : null,
            ],
          )
        }

        await client.query(
          'COMMIT',
        )

        return res.json({
          ok: true,
          brandIds,
        })
      } catch (error) {
        await client.query(
          'ROLLBACK',
        )

        console.error(
          'Settings user brands update failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Settings user brands update failed',
          })
      } finally {
        client.release()
      }
    },
  )

  return router
}