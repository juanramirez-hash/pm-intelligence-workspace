import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  createGoogleSigninHandler,
  hasValidGoogleCsrf,
  parseCookies,
} from '../../server/auth/googleSignin.js'

const USER = {
  id: 7,
  email: 'admin@example.com',
  name: 'Admin',
  role: 'admin',
}

function buildRequest({
  bodyToken,
  cookieToken,
  credential = 'google-credential',
} = {}) {
  const events = []
  const previousSession = {}
  const regeneratedSession = {
    save: vi.fn((callback) => {
      events.push(['save', regeneratedSession.user])
      callback()
    }),
  }

  previousSession.regenerate = vi.fn((callback) => {
    events.push(['regenerate', previousSession.user])
    req.session = regeneratedSession
    callback()
  })
  previousSession.save = vi.fn((callback) => callback())

  const req = {
    body: {
      credential,
      ...(bodyToken === undefined
        ? {}
        : { g_csrf_token: bodyToken }),
    },
    headers: cookieToken === undefined
      ? {}
      : { cookie: `theme=dark; g_csrf_token=${cookieToken}; other=1` },
    session: previousSession,
  }

  return {
    req,
    events,
    previousSession,
    regeneratedSession,
  }
}

function buildResponse() {
  return {
    redirect: vi.fn(),
  }
}

async function signIn(request, authenticate = vi.fn(async () => USER)) {
  const res = buildResponse()

  await createGoogleSigninHandler({
    authenticate,
    logger: { error: vi.fn() },
  })(request.req, res)

  return {
    res,
    authenticate,
  }
}

describe('Google sign-in (SEC-004)', () => {
  it('parses cookies without cookie-parser', () => {
    expect(
      parseCookies('a=1; g_csrf_token=abc%3D; empty=; =x; a=2'),
    ).toEqual({
      a: '1',
      g_csrf_token: 'abc=',
      empty: '',
    })
    expect(parseCookies(undefined)).toEqual({})
  })

  it.each([
    ['missing body token', { cookieToken: 'abc' }],
    ['missing cookie', { bodyToken: 'abc' }],
    ['different tokens', { bodyToken: 'abc', cookieToken: 'xyz' }],
    ['empty tokens', { bodyToken: '', cookieToken: '' }],
  ])('rejects %s before verifying the credential', async (_label, tokens) => {
    const request = buildRequest(tokens)
    const { res, authenticate } = await signIn(request)

    expect(hasValidGoogleCsrf(request.req)).toBe(false)
    expect(res.redirect).toHaveBeenCalledWith('/?auth_error=csrf')
    expect(authenticate).not.toHaveBeenCalled()
    expect(request.previousSession.regenerate).not.toHaveBeenCalled()
  })

  it('regenerates the session before saving the user when tokens match', async () => {
    const request = buildRequest({
      bodyToken: 'abc',
      cookieToken: 'abc',
    })
    const { res, authenticate } = await signIn(request)

    expect(authenticate).toHaveBeenCalledWith('google-credential')
    expect(request.events).toEqual([
      ['regenerate', undefined],
      ['save', USER],
    ])
    expect(request.req.session).toBe(request.regeneratedSession)
    expect(request.previousSession.user).toBeUndefined()
    expect(res.redirect).toHaveBeenCalledWith('/')
  })

  it('keeps the existing errors after a valid CSRF check', async () => {
    const missing = buildRequest({
      bodyToken: 'abc',
      cookieToken: 'abc',
      credential: '',
    })
    const unauthorized = buildRequest({
      bodyToken: 'abc',
      cookieToken: 'abc',
    })

    expect(
      (await signIn(missing)).res.redirect,
    ).toHaveBeenCalledWith('/?auth_error=missing_credential')
    expect(
      (
        await signIn(
          unauthorized,
          vi.fn(async () => {
            throw Object.assign(new Error('not allowed'), {
              statusCode: 403,
            })
          }),
        )
      ).res.redirect,
    ).toHaveBeenCalledWith('/?auth_error=unauthorized')
    expect(unauthorized.previousSession.regenerate).not.toHaveBeenCalled()
  })
})
