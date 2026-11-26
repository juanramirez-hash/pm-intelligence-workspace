import express from 'express'

// Request body limits (SEC-004). Normal routes accept small bodies; import
// routes accept up to 10 MB, and only after authentication and the import
// permission (registerBusinessRoutes applies the import parser).

export const JSON_BODY_LIMIT = '100kb'
export const URLENCODED_BODY_LIMIT = '20kb'
export const IMPORT_BODY_LIMIT = '10mb'

const LARGE_IMPORT_PATHS = [
  /^\/api\/data\/[^/]+\/imports\/[^/]+\/chunks\/?$/i,
  // MD-002-HOTFIX1: inventory item records, in chunks of 500.
  /^\/api\/data\/inventory\/imports\/[^/]+\/items\/?$/i,
  // Includes /api/data/targets/import.
  /^\/api\/data\/[^/]+\/import\/?$/i,
  /^\/api\/data\/exchange-rates\/?$/i,
]

export function isLargeImportRequest(req) {
  if (req.method !== 'POST') {
    return false
  }

  const path = String(req.originalUrl ?? req.url ?? '')
    .split('?')[0]

  return LARGE_IMPORT_PATHS.some(
    (pattern) => pattern.test(path),
  )
}

function skipLargeImports(parser) {
  return function bodyParserOutsideImports(req, res, next) {
    if (isLargeImportRequest(req)) {
      return next()
    }

    return parser(req, res, next)
  }
}

export function createGlobalBodyParsers() {
  return [
    skipLargeImports(
      express.json({
        limit: JSON_BODY_LIMIT,
      }),
    ),
    skipLargeImports(
      express.urlencoded({
        extended: false,
        limit: URLENCODED_BODY_LIMIT,
      }),
    ),
  ]
}

export function createImportBodyParser() {
  const parser = express.json({
    limit: IMPORT_BODY_LIMIT,
  })

  return function importBodyParser(req, res, next) {
    if (!isLargeImportRequest(req)) {
      return next()
    }

    return parser(req, res, next)
  }
}

// JSON instead of the Express HTML error page.
export function payloadTooLargeHandler(error, req, res, next) {
  if (
    res.headersSent ||
    (
      error?.type !== 'entity.too.large' &&
      error?.status !== 413
    )
  ) {
    return next(error)
  }

  return res.status(413).json({
    ok: false,
    error: 'Solicitud demasiado grande',
  })
}
