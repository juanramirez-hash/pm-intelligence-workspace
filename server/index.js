import 'dotenv/config'
import { registerBusinessRoutes } from './registerBusinessRoutes.js'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { OAuth2Client } from 'google-auth-library'
import { pool } from './db/pool.js'
import { assertSchemaOrExit } from './db/schemaCheck.js'
import { createGoogleSigninHandler } from './auth/googleSignin.js'
import {
  createGlobalBodyParsers,
  payloadTooLargeHandler,
} from './http/requestLimits.js'
import {
  createApiRateLimit,
  createSigninRateLimit,
} from './http/rateLimits.js'
import { requireAuth } from './middleware/requireAuth.js'
import { requireAdmin } from './middleware/requireAdmin.js'
import { createSalesRouter } from './routes/sales.js'
import { createInventoryRouter } from './routes/inventory.js'
import { createTargetsRouter } from './routes/targets.js'
import { createProductsRouter } from './routes/products.js'
import { createPurchasesRouter } from './routes/purchases.js'
import { createPurchaseRequestsRouter } from './routes/purchaseRequests.js'
import { createProjectsRouter } from './routes/projects.js'
import { createProjectBillingsRouter } from './routes/projectBillings.js'
import { createExchangeRatesRouter } from './routes/exchangeRates.js'
import { createPricingRouter } from './routes/pricing.js'
import { createCustomersRouter } from './routes/customers.js'
import { createSettingsUsersRouter } from './routes/settingsUsers.js'
import { createSettingsRolesRouter } from './routes/settingsRoles.js'
import {
  loadAuthenticatedUser,
} from './middleware/loadAuthenticatedUser.js'

const app = express()

const authenticatedUser =
  loadAuthenticatedUser(pool)

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

// 100 kb JSON / 20 kb forms; import routes get 10 MB after auth (SEC-004).
app.use(
  ...createGlobalBodyParsers(),
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
  authenticatedUser,
  (req, res) => {
    return res.json({
      ok: true,
      authenticated: true,
      user: req.authUser,
    })
  },
)

app.post(
  '/signin/google',
  createSigninRateLimit(),
  createGoogleSigninHandler({
    authenticate:
      authenticateGoogleCredential,
  }),
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
  '/api/search',
  createApiRateLimit(),
)

app.use(
  '/api/data/sales/analytics',
  createApiRateLimit(),
)

app.use(
  '/api/my-day',
  createApiRateLimit(),
)

app.use(
  '/api/status',
  createApiRateLimit(),
)

app.use(
  '/api/brands',
  createApiRateLimit(),
)

app.use(
  '/api/brand-portfolio',
  createApiRateLimit(),
)

registerBusinessRoutes(app, pool)

app.use(
  '/api/data/sales',
  requireAuth,
  authenticatedUser,
  createSalesRouter(pool),
)

app.use(
  '/api/data/inventory',
  requireAuth,
  authenticatedUser,
  createInventoryRouter(pool),
)

app.use(
  '/api/data/targets',
  requireAuth,
  authenticatedUser,
  createTargetsRouter(pool),
)

app.use(
  '/api/data/products',
  requireAuth,
  authenticatedUser,
  createProductsRouter(pool),
)

app.use(
  '/api/data/purchases',
  requireAuth,
  authenticatedUser,
  createPurchasesRouter(pool),
)

app.use(
  '/api/data/purchase-requests',
  requireAuth,
  authenticatedUser,
  createPurchaseRequestsRouter(pool),
)

app.use(
  '/api/data/projects',
  requireAuth,
  authenticatedUser,
  createProjectsRouter(pool),
)

app.use(
  '/api/data/project-billings',
  requireAuth,
  authenticatedUser,
  createProjectBillingsRouter(pool),
)

app.use(
  '/api/data/exchange-rates',
  requireAuth,
  authenticatedUser,
  createExchangeRatesRouter(pool),
)

app.use(
  '/api/data/pricing',
  requireAuth,
  authenticatedUser,
  createPricingRouter(pool),
)

app.use(
  '/api/data/customers',
  requireAuth,
  authenticatedUser,
  createCustomersRouter(pool),
)

app.use(
  '/api/settings/users',
  requireAuth,
  authenticatedUser,
  requireAdmin,
  createSettingsUsersRouter(pool),
)

app.use(
  '/api/settings/roles',
  requireAuth,
  authenticatedUser,
  requireAdmin,
  createSettingsRolesRouter(pool),
)

app.use(payloadTooLargeHandler)

// Do not serve requests without the migrations the code depends on (OPS-001).
await assertSchemaOrExit(pool)

app.listen(
  port,
  '127.0.0.1',
  () => {
    console.log(
      `PM Intelligence API listening on http://127.0.0.1:${port}`,
    )
  },
)
