import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  createApiRateLimit,
  createSigninRateLimit,
  rateLimitKey,
} from '../../server/http/rateLimits.js'

import {
  express,
  startTestApp,
  testSession,
} from './httpTestApp.js'

let running

afterEach(async () => {
  await running?.close()
  running = undefined
})

describe('rate limits (SEC-004)', () => {
  it('keys by session user and falls back to the IP', () => {
    expect(
      rateLimitKey({ session: { user: { id: 12 } }, ip: '10.0.0.1' }),
    ).toBe('user:12')
    expect(
      rateLimitKey({ session: {}, ip: '10.0.0.1' }),
    ).toBe('ip:10.0.0.1')
  })

  it('redirects to the login error after too many sign-in attempts', async () => {
    const app = express()

    app.post(
      '/signin/google',
      createSigninRateLimit({ limit: 2 }),
      (_req, res) => res.redirect('/'),
    )
    running = await startTestApp(app)

    const statuses = []

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${running.url}/signin/google`, {
        method: 'POST',
        redirect: 'manual',
      })

      statuses.push([
        response.status,
        response.headers.get('location'),
      ])
    }

    expect(statuses).toEqual([
      [302, '/'],
      [302, '/'],
      [302, '/?auth_error=rate_limited'],
    ])
  })

  it('answers 429 JSON per user on API routes', async () => {
    const app = express()

    app.use(testSession)
    app.use('/api/search', createApiRateLimit({ limit: 2 }))
    app.get('/api/search', (_req, res) => res.json({ ok: true }))
    running = await startTestApp(app)

    const search = (userId) =>
      fetch(`${running.url}/api/search`, {
        headers: { 'x-test-user': String(userId) },
      })

    expect((await search(1)).status).toBe(200)
    expect((await search(1)).status).toBe(200)

    const limited = await search(1)

    expect(limited.status).toBe(429)
    expect(await limited.json()).toEqual({
      ok: false,
      error: 'Demasiadas solicitudes',
    })

    // Another user keeps their own budget.
    expect((await search(2)).status).toBe(200)
  })
})
