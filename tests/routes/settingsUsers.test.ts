import { describe, expect, it, vi } from 'vitest'
import { createSettingsUsersRouter } from '../../server/routes/settingsUsers.js'

interface User {
  id: number
  email: string
  role: string
  active: boolean
}

interface DeleteRequest {
  params: { id: string }
  authUser?: { id: number; role: string }
}

const admin: User = {
  id: 1, email: 'admin@example.test', role: 'admin', active: true,
}
const target: User = {
  id: 2, email: 'user@example.test', role: 'pm', active: true,
}

function buildPool({
  users = [admin, target],
  failure,
}: {
  users?: User[]
  failure?: 'sessions' | 'user' | 'connect'
} = {}) {
  const query = vi.fn(async (sql: string, ..._params: unknown[]) => {
    if (sql.includes('SELECT id, email, role, active')) {
      return { rows: users, rowCount: users.length }
    }
    if (
      (failure === 'sessions' && sql.includes('DELETE FROM user_sessions')) ||
      (failure === 'user' && sql.includes('DELETE FROM app_users'))
    ) {
      throw Object.assign(new Error('Simulated database failure'), {
        code: failure === 'user' ? '23503' : 'XX000',
      })
    }
    return { rows: [], rowCount: 1 }
  })
  const release = vi.fn()
  const connect = vi.fn(async () => {
    if (failure === 'connect') {
      throw new Error('Connection unavailable')
    }
    return { query, release }
  })
  return { pool: { connect, query }, query, release }
}

function buildResponse() {
  const res = { status: vi.fn(), json: vi.fn() }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res
}

async function removeUser(
  fixture: ReturnType<typeof buildPool>,
  request: DeleteRequest = {
    params: { id: '2' }, authUser: { id: 1, role: 'admin' },
  },
) {
  const router = createSettingsUsersRouter(fixture.pool) as {
    stack: Array<{
      route?: {
        path: string
        methods: Record<string, boolean>
        stack: Array<{
          handle: (
            req: DeleteRequest,
            res: ReturnType<typeof buildResponse>,
          ) => Promise<unknown>
        }>
      }
    }>
  }
  const route = router.stack.find(
    (layer) => layer.route?.path === '/:id' && layer.route.methods.delete,
  )?.route
  if (!route || route.stack.length !== 1) {
    throw new Error('Expected one DELETE /:id handler')
  }
  const res = buildResponse()
  await route.stack[0].handle(request, res)
  return res
}

describe('Settings user deletion', () => {
  it('rejects unauthenticated deletion before connecting', async () => {
    const fixture = buildPool()
    const res = await removeUser(fixture, { params: { id: '2' } })
    expect(res.status).toHaveBeenCalledWith(401)
    expect(fixture.pool.connect).not.toHaveBeenCalled()
  })

  it('rejects non-administrators before connecting', async () => {
    const fixture = buildPool()
    const res = await removeUser(fixture, {
      params: { id: '2' }, authUser: { id: 3, role: 'pm' },
    })
    expect(res.status).toHaveBeenCalledWith(403)
    expect(fixture.pool.connect).not.toHaveBeenCalled()
  })

  it.each(['0', '-2', '2.5', '2e0', 'invalid'])(
    'rejects invalid target id %s', async (id) => {
      const fixture = buildPool()
      const res = await removeUser(fixture, {
        params: { id }, authUser: { id: 1, role: 'admin' },
      })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(fixture.pool.connect).not.toHaveBeenCalled()
    },
  )

  it('prevents deleting the current administrator', async () => {
    const fixture = buildPool({ users: [admin] })
    const res = await removeUser(fixture, {
      params: { id: '1' }, authUser: { id: 1, role: 'admin' },
    })
    expect(res.status).toHaveBeenCalledWith(409)
    expect(fixture.pool.connect).not.toHaveBeenCalled()
  })

  it.each([
    { ...admin, active: false },
    { ...admin, role: 'pm' },
  ])('rechecks current administrator permissions under lock: %j', async (actor) => {
    const fixture = buildPool({ users: [actor, target] })
    const res = await removeUser(fixture)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(fixture.query).toHaveBeenCalledWith('ROLLBACK')
    expect(fixture.query.mock.calls.some(([sql]) => sql.includes('DELETE FROM'))).toBe(false)
    expect(fixture.release).toHaveBeenCalledOnce()
  })

  it('returns 404 for a missing target and rolls back', async () => {
    const fixture = buildPool({ users: [admin] })
    const res = await removeUser(fixture)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(fixture.query).toHaveBeenCalledWith('ROLLBACK')
    expect(fixture.release).toHaveBeenCalledOnce()
  })

  it.each(['pm', 'admin'])(
    'deletes another %s and their sessions in one transaction', async (role) => {
      const fixture = buildPool({ users: [admin, { ...target, role }] })
      const res = await removeUser(fixture)
      expect(fixture.query.mock.calls[0][0]).toBe('BEGIN')
      expect(fixture.query).toHaveBeenCalledWith(
        expect.stringContaining('FOR UPDATE'), [[1, 2]],
      )
      expect(fixture.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_sessions'), ['2'],
      )
      expect(fixture.query).toHaveBeenCalledWith(
        'DELETE FROM app_users WHERE id = $1', [2],
      )
      expect(fixture.query.mock.calls.at(-1)?.[0]).toBe('COMMIT')
      expect(res.json).toHaveBeenCalledWith({ ok: true, deletedUserId: 2 })
      expect(fixture.release).toHaveBeenCalledOnce()
    },
  )

  it.each([
    { failure: 'sessions' as const, status: 500 },
    { failure: 'user' as const, status: 409 },
    { failure: 'connect' as const, status: 500 },
  ])('handles $failure failure without committing', async ({ failure, status }) => {
    const fixture = buildPool({ failure })
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const res = await removeUser(fixture)
      expect(res.status).toHaveBeenCalledWith(status)
      expect(fixture.query).not.toHaveBeenCalledWith('COMMIT')
      if (failure === 'connect') {
        expect(fixture.release).not.toHaveBeenCalled()
      } else {
        expect(fixture.query).toHaveBeenCalledWith('ROLLBACK')
        expect(fixture.release).toHaveBeenCalledOnce()
      }
    } finally {
      log.mockRestore()
    }
  })
})
