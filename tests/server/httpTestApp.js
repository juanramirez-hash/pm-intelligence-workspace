// Helpers to run small Express apps in tests. Express lives in
// server/node_modules, so it is loaded from there.

import { createRequire } from 'node:module'

const requireFromServer = createRequire(
  new URL('../../server/package.json', import.meta.url),
)

export const express = requireFromServer('express')

export async function startTestApp(app) {
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () =>
      resolve(listening),
    )
  })
  const { port } = server.address()

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve())
      }),
  }
}

/** Session stub: the x-test-user header sets req.session.user.id. */
export function testSession(req, _res, next) {
  const userId = Number(req.get('x-test-user'))

  req.session = Number.isInteger(userId) && userId > 0
    ? { user: { id: userId } }
    : {}

  next()
}
