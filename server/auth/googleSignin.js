import { timingSafeEqual } from 'node:crypto'

// Google Identity Services redirect login (SEC-004).
// Google posts the form field g_csrf_token and sets the cookie g_csrf_token;
// both must exist and match before the credential is even verified.

export function parseCookies(header) {
  const cookies = {}

  if (typeof header !== 'string') {
    return cookies
  }

  for (const part of header.split(';')) {
    const separator = part.indexOf('=')

    if (separator <= 0) {
      continue
    }

    const name = part.slice(0, separator).trim()
    const rawValue = part.slice(separator + 1).trim()

    if (!name || Object.hasOwn(cookies, name)) {
      continue
    }

    try {
      cookies[name] = decodeURIComponent(rawValue)
    } catch {
      cookies[name] = rawValue
    }
  }

  return cookies
}

export function hasValidGoogleCsrf(req) {
  const bodyToken = req.body?.g_csrf_token
  const cookieToken =
    parseCookies(req.headers?.cookie).g_csrf_token

  if (
    typeof bodyToken !== 'string' ||
    typeof cookieToken !== 'string' ||
    bodyToken.length === 0 ||
    cookieToken.length === 0
  ) {
    return false
  }

  const bodyBuffer = Buffer.from(bodyToken)
  const cookieBuffer = Buffer.from(cookieToken)

  return bodyBuffer.length === cookieBuffer.length &&
    timingSafeEqual(bodyBuffer, cookieBuffer)
}

// A new session id after login prevents session fixation.
function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

function saveSessionUser(req, user) {
  return new Promise((resolve, reject) => {
    req.session.user = user

    req.session.save((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

/**
 * @param {{
 *   authenticate: (credential: string) => Promise<object>,
 *   logger?: Pick<Console, 'error'>,
 * }} options
 */
export function createGoogleSigninHandler({
  authenticate,
  logger = console,
}) {
  return async function googleSigninHandler(req, res) {
    if (!hasValidGoogleCsrf(req)) {
      return res.redirect('/?auth_error=csrf')
    }

    try {
      const credential = req.body?.credential

      if (
        typeof credential !== 'string' ||
        credential.length === 0
      ) {
        return res.redirect(
          '/?auth_error=missing_credential',
        )
      }

      const user = await authenticate(credential)

      await regenerateSession(req)
      await saveSessionUser(req, user)

      return res.redirect('/')
    } catch (error) {
      logger.error(
        'Google redirect authentication failed:',
        error,
      )

      const statusCode =
        Number(error?.statusCode) || 401

      if (statusCode === 403) {
        return res.redirect(
          '/?auth_error=unauthorized',
        )
      }

      return res.redirect('/?auth_error=google')
    }
  }
}
