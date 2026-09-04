import {
  Router,
} from 'express'

const ALLOWED_SCOPES =
  new Set([
    'all',
    'assigned',
    'pricing',
    'legacy',
  ])

export function createSettingsRolesRouter(
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
                role_key,
                role_name,
                description,
                scope,
                write_access,
                active,
                system_role,
                created_at,
                updated_at
              FROM app_roles
              ORDER BY
                system_role DESC,
                role_name
            `,
          )

        return res.json({
          ok: true,
          roles: result.rows,
        })
      } catch (error) {
        console.error(
          'Settings roles load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Settings roles load failed',
          })
      }
    },
  )

  router.patch(
    '/:roleKey',
    async (req, res) => {
      try {
        const roleKey =
          String(
            req.params.roleKey ?? '',
          ).trim()

        if (roleKey === '') {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Role key is required',
            })
        }

        const updates = []
        const values = []

        if (
          Object.hasOwn(
            req.body ?? {},
            'roleName',
          )
        ) {
          const roleName =
            typeof req.body.roleName ===
            'string'
              ? req.body.roleName.trim()
              : ''

          if (roleName === '') {
            return res
              .status(400)
              .json({
                ok: false,
                error:
                  'Role name is required',
              })
          }

          values.push(roleName)
          updates.push(
            `role_name = $${values.length}`,
          )
        }

        if (
          Object.hasOwn(
            req.body ?? {},
            'description',
          )
        ) {
          const description =
            req.body.description

          if (
            description !== null &&
            typeof description !== 'string'
          ) {
            return res
              .status(400)
              .json({
                ok: false,
                error:
                  'Description must be string or null',
              })
          }

          values.push(
            description === null
              ? null
              : description.trim(),
          )

          updates.push(
            `description = $${values.length}`,
          )
        }

        if (
          Object.hasOwn(
            req.body ?? {},
            'scope',
          )
        ) {
          const scope =
            req.body.scope

          if (
            typeof scope !== 'string' ||
            !ALLOWED_SCOPES.has(scope)
          ) {
            return res
              .status(400)
              .json({
                ok: false,
                error:
                  'Scope is not valid',
              })
          }

          values.push(scope)
          updates.push(
            `scope = $${values.length}`,
          )
        }

        if (
          Object.hasOwn(
            req.body ?? {},
            'writeAccess',
          )
        ) {
          const writeAccess =
            req.body.writeAccess

          if (
            typeof writeAccess !==
            'boolean'
          ) {
            return res
              .status(400)
              .json({
                ok: false,
                error:
                  'Write access must be boolean',
              })
          }

          values.push(writeAccess)
          updates.push(
            `write_access = $${values.length}`,
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

        values.push(roleKey)

        const result =
          await pool.query(
            `
              UPDATE app_roles
              SET
                ${updates.join(', ')},
                updated_at = NOW()
              WHERE role_key =
                $${values.length}
              RETURNING
                role_key,
                role_name,
                description,
                scope,
                write_access,
                active,
                system_role,
                created_at,
                updated_at
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
                'Role not found',
            })
        }

        return res.json({
          ok: true,
          role: result.rows[0],
        })
      } catch (error) {
        console.error(
          'Settings role update failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Settings role update failed',
          })
      }
    },
  )

  return router
}