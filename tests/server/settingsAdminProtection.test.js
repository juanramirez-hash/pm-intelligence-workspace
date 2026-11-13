import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  createSettingsRolesRouter,
} from '../../server/routes/settingsRoles.js'
import {
  createSettingsUsersRouter,
} from '../../server/routes/settingsUsers.js'

function findHandler(
  router,
  method,
  path,
) {
  const layer = router.stack.find(
    (candidate) =>
      candidate.route?.path === path &&
      candidate.route.methods[method],
  )

  if (!layer) {
    throw new Error(`Route ${method} ${path} not found`)
  }

  return layer.route.stack[0].handle
}

function buildResponse() {
  const res = {
    statusCode: 200,
    body: undefined,
    status: vi.fn((code) => {
      res.statusCode = code
      return res
    }),
    json: vi.fn((body) => {
      res.body = body
      return res
    }),
  }

  return res
}

describe(
  'settingsRoles PATCH sobre roles de sistema',
  () => {
    const roles = {
      admin: {
        scope: 'all',
        write_access: true,
        active: true,
        system_role: true,
      },
      analyst: {
        scope: 'legacy',
        write_access: false,
        active: true,
        system_role: true,
      },
      pm: {
        scope: 'assigned',
        write_access: true,
        active: true,
        system_role: false,
      },
    }

    async function patchRole(
      roleKey,
      body,
    ) {
      const pool = {
        query: vi.fn(async (sql) =>
          sql.includes('UPDATE app_roles')
            ? { rows: [{ role_key: roleKey }] }
            : { rows: [roles[roleKey]] },
        ),
      }
      const res = buildResponse()

      await findHandler(
        createSettingsRolesRouter(pool),
        'patch',
        '/:roleKey',
      )(
        {
          params: { roleKey },
          body,
        },
        res,
      )

      return {
        pool,
        res,
      }
    }

    it.each([
      ['admin', { scope: 'assigned' }],
      ['admin', { writeAccess: false }],
      ['admin', { active: false }],
      ['analyst', { scope: 'all' }],
      ['analyst', { writeAccess: true }],
      ['analyst', { active: false }],
    ])(
      'rechaza con 400 el cambio de %s %j',
      async (roleKey, body) => {
        const { pool, res } =
          await patchRole(roleKey, body)

        expect(res.statusCode).toBe(400)
        expect(res.body.error).toBe(
          'System roles keep their scope, write access and status',
        )
        expect(
          pool.query.mock.calls.some(
            ([sql]) => sql.includes('UPDATE app_roles'),
          ),
        ).toBe(false)
      },
    )

    it(
      'permite renombrar un rol de sistema sin tocar sus permisos',
      async () => {
        const { res } =
          await patchRole('admin', {
            roleName: 'Administrador general',
            scope: 'all',
          })

        expect(res.statusCode).toBe(200)
      },
    )

    it(
      'permite cambiar permisos de roles que no son de sistema',
      async () => {
        const { pool, res } =
          await patchRole('pm', {
            scope: 'all',
            writeAccess: false,
            active: false,
          })
        const [sql, params] =
          pool.query.mock.calls.find(
            ([text]) => text.includes('UPDATE app_roles'),
          )

        expect(res.statusCode).toBe(200)
        expect(sql).toContain('scope = $1')
        expect(params).toEqual([
          'all',
          false,
          false,
          'pm',
        ])
      },
    )
  },
)

describe(
  'settingsUsers PATCH y administradores activos',
  () => {
    const actor = {
      id: 1,
      role: 'admin',
      active: true,
    }
    const otherAdmin = {
      id: 2,
      role: 'admin',
      active: true,
    }
    const pm = {
      id: 3,
      role: 'pm',
      active: true,
    }

    async function patchUser(
      userId,
      body,
      lockedRows,
    ) {
      const client = {
        query: vi.fn(async (sql) => {
          if (sql.includes('FOR UPDATE')) {
            return { rows: lockedRows }
          }

          if (sql.includes('UPDATE app_users')) {
            return { rows: [{ id: userId }] }
          }

          return { rows: [] }
        }),
        release: vi.fn(),
      }
      const pool = {
        connect: vi.fn(async () => client),
        query: vi.fn(),
      }
      const res = buildResponse()

      await findHandler(
        createSettingsUsersRouter(pool),
        'patch',
        '/:id',
      )(
        {
          authUser: { id: actor.id, role: 'admin' },
          params: { id: String(userId) },
          body,
        },
        res,
      )

      const statements =
        client.query.mock.calls.map(
          ([sql]) => sql.trim().split(/\s+/)[0],
        )

      return {
        client,
        res,
        statements,
      }
    }

    it(
      'bloquea al actor, al usuario y a los admins activos antes de decidir',
      async () => {
        const { client } =
          await patchUser(
            3,
            { role: 'engineering' },
            [actor, otherAdmin, pm],
          )
        const [sql, params] =
          client.query.mock.calls.find(
            ([text]) => text.includes('FOR UPDATE'),
          )

        expect(sql).toContain("role = 'admin'")
        expect(sql).toContain('ORDER BY id')
        expect(params).toEqual([[1, 3]])
        expect(client.release).toHaveBeenCalled()
      },
    )

    it(
      'permite que un admin se degrade si queda otro admin activo',
      async () => {
        const { res, statements } =
          await patchUser(
            1,
            { role: 'manager' },
            [actor, otherAdmin],
          )

        expect(res.statusCode).toBe(200)
        expect(statements).toContain('COMMIT')
      },
    )

    it(
      'rechaza con 409 la auto-degradacion del unico admin activo',
      async () => {
        const { res, statements } =
          await patchUser(
            1,
            { role: 'manager' },
            [actor],
          )

        expect(res.statusCode).toBe(409)
        expect(res.body.error).toBe(
          'Debe quedar al menos un administrador activo',
        )
        expect(statements).toContain('ROLLBACK')
        expect(statements).not.toContain('UPDATE')
      },
    )

    it(
      'rechaza con 409 la auto-desactivacion del unico admin activo',
      async () => {
        const { res } =
          await patchUser(
            1,
            { active: false },
            [actor],
          )

        expect(res.statusCode).toBe(409)
      },
    )

    it(
      'permite la auto-desactivacion si queda otro admin activo',
      async () => {
        const { res } =
          await patchUser(
            1,
            { active: false },
            [actor, otherAdmin],
          )

        expect(res.statusCode).toBe(200)
      },
    )

    it(
      'rechaza con 403 si quien hace el cambio ya no es admin activo',
      async () => {
        const { res, statements } =
          await patchUser(
            2,
            { role: 'pm' },
            [
              {
                ...actor,
                role: 'manager',
              },
              otherAdmin,
            ],
          )

        expect(res.statusCode).toBe(403)
        expect(statements).not.toContain('UPDATE')
      },
    )

    it(
      'permite degradar a otro admin porque quien hace el cambio sigue activo',
      async () => {
        const { res } =
          await patchUser(
            2,
            { role: 'pm' },
            [actor, otherAdmin],
          )

        expect(res.statusCode).toBe(200)
      },
    )

    it(
      'no exige otro admin para cambios que no quitan administradores',
      async () => {
        const { res } =
          await patchUser(
            1,
            { name: 'Admin' },
            [actor],
          )

        expect(res.statusCode).toBe(200)
      },
    )
  },
)
