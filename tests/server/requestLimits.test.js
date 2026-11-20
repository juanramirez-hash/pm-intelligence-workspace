import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  createGlobalBodyParsers,
  isLargeImportRequest,
  payloadTooLargeHandler,
} from '../../server/http/requestLimits.js'
import {
  registerBusinessRoutes,
} from '../../server/registerBusinessRoutes.js'

import {
  express,
  startTestApp,
  testSession,
} from './httpTestApp.js'

const ADMIN_ID = 1
const PM_ID = 2

// loadAuthenticatedUser reads the user and role from PostgreSQL.
function buildPool() {
  return {
    query: vi.fn(async (_sql, params) => {
      const admin = params?.[0] === ADMIN_ID

      return {
        rows: [
          {
            id: params?.[0],
            email: admin ? 'admin@example.com' : 'pm@example.com',
            name: admin ? 'Admin' : 'PM',
            role: admin ? 'admin' : 'pm',
            active: true,
            role_name: admin ? 'Administrador' : 'Product Manager',
            scope: admin ? 'all' : 'assigned',
            write_access: true,
            cost_access: true,
            role_active: true,
            brand_ids: admin ? [] : ['HIKVISION'],
          },
        ],
      }
    }),
  }
}

function buildApp() {
  const app = express()

  app.use(...createGlobalBodyParsers())
  app.use(testSession)
  registerBusinessRoutes(app, buildPool())

  const echo = (req, res) =>
    res.json({
      ok: true,
      bytes: JSON.stringify(req.body ?? null).length,
    })

  app.post('/api/data/sales/imports/:importId/chunks', echo)
  app.post('/api/data/exchange-rates', echo)
  app.post('/api/data/sales/imports/start', echo)
  app.post('/api/echo', echo)
  app.post('/signin/form', (req, res) =>
    res.json({ ok: true, fields: Object.keys(req.body ?? {}) }),
  )
  app.use(payloadTooLargeHandler)

  return app
}

function jsonBody(bytes) {
  return JSON.stringify({ rows: 'x'.repeat(bytes) })
}

let running

afterEach(async () => {
  await running?.close()
  running = undefined
})

async function post(path, body, {
  userId,
  contentType = 'application/json',
} = {}) {
  return fetch(`${running.url}${path}`, {
    method: 'POST',
    headers: {
      'content-type': contentType,
      ...(userId ? { 'x-test-user': String(userId) } : {}),
    },
    body,
  })
}

describe('request body limits (SEC-004)', () => {
  it('recognizes only the large import routes', () => {
    const request = (method, originalUrl) => ({ method, originalUrl })

    expect(isLargeImportRequest(request('POST', '/api/data/sales/imports/42/chunks'))).toBe(true)
    expect(isLargeImportRequest(request('POST', '/api/data/sales/import'))).toBe(true)
    expect(isLargeImportRequest(request('POST', '/api/data/targets/import'))).toBe(true)
    expect(isLargeImportRequest(request('POST', '/api/data/exchange-rates?x=1'))).toBe(true)
    expect(isLargeImportRequest(request('POST', '/api/data/sales/imports/start'))).toBe(false)
    expect(isLargeImportRequest(request('POST', '/api/data/sales/analytics/summary'))).toBe(false)
    expect(isLargeImportRequest(request('GET', '/api/data/sales/import'))).toBe(false)
  })

  it('answers 413 JSON for a 200 kb body on a normal route', async () => {
    running = await startTestApp(buildApp())

    const response = await post('/api/echo', jsonBody(200 * 1024))

    expect(response.status).toBe(413)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({
      ok: false,
      error: 'Solicitud demasiado grande',
    })
  })

  it('keeps the 100 kb limit on small import steps', async () => {
    running = await startTestApp(buildApp())

    const response = await post(
      '/api/data/sales/imports/start',
      jsonBody(200 * 1024),
      { userId: ADMIN_ID },
    )

    expect(response.status).toBe(413)
  })

  it('limits form bodies to 20 kb', async () => {
    running = await startTestApp(buildApp())

    const small = await post(
      '/signin/form',
      `credential=${'x'.repeat(2 * 1024)}`,
      { contentType: 'application/x-www-form-urlencoded' },
    )
    const large = await post(
      '/signin/form',
      `credential=${'x'.repeat(30 * 1024)}`,
      { contentType: 'application/x-www-form-urlencoded' },
    )

    expect(small.status).toBe(200)
    expect(large.status).toBe(413)
  })

  it('accepts a 2 MB import chunk from a team-wide importer', async () => {
    running = await startTestApp(buildApp())

    const chunk = await post(
      '/api/data/sales/imports/42/chunks',
      jsonBody(2 * 1024 * 1024),
      { userId: ADMIN_ID },
    )
    const exchangeRates = await post(
      '/api/data/exchange-rates',
      jsonBody(2 * 1024 * 1024),
      { userId: ADMIN_ID },
    )

    expect(chunk.status).toBe(200)
    expect((await chunk.json()).bytes).toBeGreaterThan(2 * 1024 * 1024)
    expect(exchangeRates.status).toBe(200)
  })

  it('rejects the same 2 MB chunk from users without import access', async () => {
    running = await startTestApp(buildApp())

    const pm = await post(
      '/api/data/sales/imports/42/chunks',
      jsonBody(2 * 1024 * 1024),
      { userId: PM_ID },
    )
    const anonymous = await post(
      '/api/data/sales/imports/42/chunks',
      jsonBody(2 * 1024 * 1024),
    )

    expect(pm.status).toBe(403)
    expect((await pm.json()).error).toBe('Data import access required')
    expect(anonymous.status).toBe(401)
  })
})
