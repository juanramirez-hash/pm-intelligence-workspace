import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  loadAuthenticatedUser,
} from '../../server/middleware/loadAuthenticatedUser.js'

async function loadUserWith(costAccess) {
  const pool = {
    query: vi.fn(async () => ({
      rows: [
        {
          id: 7,
          email: 'pm@example.com',
          name: 'PM',
          role: 'pm',
          active: true,
          role_name: 'Product Manager',
          scope: 'assigned',
          write_access: true,
          cost_access: costAccess,
          role_active: true,
          brand_ids: ['HIKVISION'],
        },
      ],
    })),
  }
  const req = {
    session: {
      user: {
        id: 7,
      },
    },
  }
  const next = vi.fn()

  await loadAuthenticatedUser(pool)(
    req,
    {},
    next,
  )

  expect(next).toHaveBeenCalledTimes(1)
  expect(pool.query.mock.calls[0][0]).toContain('r.cost_access')

  return req.authUser
}

describe(
  'loadAuthenticatedUser costAccess',
  () => {
    it(
      'expone costAccess true cuando el rol tiene cost_access',
      async () => {
        expect(
          (await loadUserWith(true)).costAccess,
        ).toBe(true)
      },
    )

    it(
      'expone costAccess false con cost_access falso, nulo o ausente',
      async () => {
        for (const value of [false, null, undefined]) {
          expect(
            (await loadUserWith(value)).costAccess,
          ).toBe(false)
        }
      },
    )
  },
)
