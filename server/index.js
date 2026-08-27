import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { OAuth2Client } from 'google-auth-library'
import { pool } from './db/pool.js'
import { requireAuth } from './middleware/requireAuth.js'
import { createDataStatusRouter } from './routes/dataStatus.js'
import { createSalesRouter } from './routes/sales.js'
import { createInventoryRouter } from './routes/inventory.js'
import { createTargetsRouter } from './routes/targets.js'
import { createProductsRouter } from './routes/products.js'
import { createPurchasesRouter } from './routes/purchases.js'
import { createPurchaseRequestsRouter } from './routes/purchaseRequests.js'
import { createProjectsRouter } from './routes/projects.js'

const app = express()

app.disable('x-powered-by')

const port = Number(process.env.PORT ?? 3001)

const googleClientId = process.env.GOOGLE_CLIENT_ID
const sessionSecret = process.env.SESSION_SECRET

if (!googleClientId) {
  throw new Error('GOOGLE_CLIENT_ID is required')
}

if (!sessionSecret) {
  throw new Error('SESSION_SECRET is required')
}

const googleClient = new OAuth2Client(
  googleClientId,
)

const PgSession = connectPgSimple(session)

app.set('trust proxy', 1)

app.use(
  express.json({
    limit: '10mb',
  }),
)

app.use(
  express.urlencoded({
    extended: false,
  }),
)

app.use(
  session({
    name: 'pm_intelligence.sid',
    store: new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
)

async function authenticateGoogleCredential(
  credential,
) {
  const ticket =
    await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    })

  const payload = ticket.getPayload()

  if (
    !payload?.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    const error =
      new Error(
        'Google identity is not valid',
      )

    error.statusCode = 401

    throw error
  }

  const email =
    payload.email.toLowerCase()

  const result = await pool.query(
    `
      SELECT
        id,
        google_sub,
        email,
        name,
        role,
        active
      FROM app_users
      WHERE LOWER(email) = $1
      LIMIT 1
    `,
    [email],
  )

  const user = result.rows[0]

  if (
    !user ||
    user.active !== true
  ) {
    const error =
      new Error(
        'User is not authorized',
      )

    error.statusCode = 403

    throw error
  }

  if (
    user.google_sub &&
    user.google_sub !== payload.sub
  ) {
    const error =
      new Error(
        'Google account does not match authorized user',
      )

    error.statusCode = 403

    throw error
  }

  const updated =
    await pool.query(
      `
        UPDATE app_users
        SET
          google_sub =
            COALESCE(
              google_sub,
              $1
            ),
          name =
            COALESCE(
              $2,
              name
            ),
          last_login_at = NOW()
        WHERE id = $3
        RETURNING
          id,
          email,
          name,
          role,
          active,
          last_login_at
      `,
      [
        payload.sub,
        payload.name ?? null,
        user.id,
      ],
    )

  return {
    id: updated.rows[0].id,
    email: updated.rows[0].email,
    name: updated.rows[0].name,
    role: updated.rows[0].role,
  }
}

function saveSession(
  req,
  user,
) {
  return new Promise(
    (resolve, reject) => {
      req.session.user = user

      req.session.save(
        (error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        },
      )
    },
  )
}

app.get(
  '/api/health',
  async (_req, res) => {
    try {
      await pool.query('SELECT 1')

      res.json({
        ok: true,
      })
    } catch (error) {
      console.error(
        'Database health check failed:',
        error,
      )

      res.status(500).json({
        ok: false,
      })
    }
  },
)

app.get(
  '/api/auth/me',
  requireAuth,
  (req, res) => {
    return res.json({
      ok: true,
      authenticated: true,
      user: req.session.user,
    })
  },
)

app.post(
  '/api/auth/google',
  async (req, res) => {
    try {
      const credential =
        req.body?.credential

      if (
        typeof credential !==
          'string' ||
        credential.length === 0
      ) {
        return res
          .status(400)
          .json({
            ok: false,
            error:
              'Google credential is required',
          })
      }

      const user =
        await authenticateGoogleCredential(
          credential,
        )

      await saveSession(
        req,
        user,
      )

      return res.json({
        ok: true,
        authenticated: true,
        user,
      })
    } catch (error) {
      console.error(
        'Google authentication failed:',
        error,
      )

      const statusCode =
        Number(
          error?.statusCode,
        ) || 401

      return res
        .status(statusCode)
        .json({
          ok: false,
          error:
            statusCode === 403
              ? 'User is not authorized'
              : 'Google authentication failed',
        })
    }
  },
)

app.post(
  '/signin/google',
  async (req, res) => {
    try {
      const credential =
        req.body?.credential

      if (
        typeof credential !==
          'string' ||
        credential.length === 0
      ) {
        return res.redirect(
          '/?auth_error=missing_credential',
        )
      }

      const user =
        await authenticateGoogleCredential(
          credential,
        )

      await saveSession(
        req,
        user,
      )

      return res.redirect('/')
    } catch (error) {
      console.error(
        'Google redirect authentication failed:',
        error,
      )

      const statusCode =
        Number(
          error?.statusCode,
        ) || 401

      if (statusCode === 403) {
        return res.redirect(
          '/?auth_error=unauthorized',
        )
      }

      return res.redirect(
        '/?auth_error=google',
      )
    }
  },
)

app.post(
  '/api/auth/logout',
  (req, res) => {
    req.session.destroy(
      (error) => {
        if (error) {
          console.error(
            'Session logout failed:',
            error,
          )

          return res
            .status(500)
            .json({
              ok: false,
              error:
                'Logout failed',
            })
        }

        res.clearCookie(
          'pm_intelligence.sid',
        )

        return res.json({
          ok: true,
        })
      },
    )
  },
)

app.use(
  '/api/data',
  requireAuth,
  createDataStatusRouter(pool),
)

app.use(
  '/api/data/sales',
  requireAuth,
  createSalesRouter(pool),
)

app.use(
  '/api/data/inventory',
  requireAuth,
  createInventoryRouter(pool),
)

app.use(
  '/api/data/targets',
  requireAuth,
  createTargetsRouter(pool),
)

app.use(
  '/api/data/products',
  requireAuth,
  createProductsRouter(pool),
)

app.use(
  '/api/data/purchases',
  requireAuth,
  createPurchasesRouter(pool),
)

app.use(
  '/api/data/purchase-requests',
  requireAuth,
  createPurchaseRequestsRouter(pool),
)

app.use(
  '/api/data/projects',
  requireAuth,
  createProjectsRouter(pool),
)

app.listen(
  port,
  '127.0.0.1',
  () => {
    console.log(
      `PM Intelligence API listening on http://127.0.0.1:${port}`,
    )
  },
)
