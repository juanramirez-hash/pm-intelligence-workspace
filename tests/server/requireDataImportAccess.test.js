import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  isReadOnlyDataPost,
  requireDataImportAccess,
} from '../../server/middleware/requireWriteAccess.js'

function createResponse() {
  const res = {}

  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)

  return res
}

function runMiddleware(authUser) {
  const req = { authUser }
  const res = createResponse()
  const next = vi.fn()

  requireDataImportAccess(
    req,
    res,
    next,
  )

  return { res, next }
}

describe(
  'requireDataImportAccess',
  () => {
    it(
      'responde 401 sin usuario autenticado',
      () => {
        const { res, next } =
          runMiddleware(undefined)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
      },
    )

    it(
      'responde 403 a un PM con alcance asignado y escritura',
      () => {
        const { res, next } =
          runMiddleware({
            role: 'pm',
            scope: 'assigned',
            writeAccess: true,
          })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Data import access required',
          }),
        )
        expect(next).not.toHaveBeenCalled()
      },
    )

    it(
      'responde 403 a ingenieria sin escritura',
      () => {
        const { res, next } =
          runMiddleware({
            role: 'engineering',
            scope: 'assigned',
            writeAccess: false,
          })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
      },
    )

    it(
      'permite a gerencia y administracion con alcance total y escritura',
      () => {
        for (const role of ['manager', 'admin']) {
          const { res, next } =
            runMiddleware({
              role,
              scope: 'all',
              writeAccess: true,
            })

          expect(next).toHaveBeenCalledTimes(1)
          expect(res.status).not.toHaveBeenCalled()
        }
      },
    )

    it(
      'responde 403 con alcance total sin escritura',
      () => {
        const { res, next } =
          runMiddleware({
            scope: 'all',
            writeAccess: false,
          })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
      },
    )
  },
)

describe(
  'isReadOnlyDataPost',
  () => {
    it(
      'reconoce la analitica de ventas como POST de solo lectura',
      () => {
        expect(
          isReadOnlyDataPost({
            method: 'POST',
            path: '/sales/analytics/summary',
          }),
        ).toBe(true)
      },
    )

    it(
      'no exenta importaciones de ventas',
      () => {
        expect(
          isReadOnlyDataPost({
            method: 'POST',
            path: '/sales/imports/start',
          }),
        ).toBe(false)
      },
    )

    it(
      'solo aplica a POST',
      () => {
        expect(
          isReadOnlyDataPost({
            method: 'GET',
            path: '/sales/analytics/summary',
          }),
        ).toBe(false)
      },
    )

    it(
      'no exenta la captura de tipos de cambio',
      () => {
        expect(
          isReadOnlyDataPost({
            method: 'POST',
            path: '/exchange-rates',
          }),
        ).toBe(false)
      },
    )
  },
)
