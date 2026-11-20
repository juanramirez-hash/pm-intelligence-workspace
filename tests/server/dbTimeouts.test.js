import { readFileSync, readdirSync } from 'node:fs'

import {
  afterAll,
  describe,
  expect,
  it,
} from 'vitest'

import { pool } from '../../server/db/pool.js'

afterAll(async () => {
  await pool.end()
})

describe('PostgreSQL timeouts (SEC-004)', () => {
  it('sets the statement and idle-in-transaction timeouts on the pool', () => {
    expect(pool.options.statement_timeout).toBe(120000)
    expect(pool.options.idle_in_transaction_session_timeout).toBe(60000)
  })

  it('raises the timeout to 15 min in every transaction that refreshes aggregates', () => {
    const servicesDir = new URL('../../server/services/', import.meta.url)
    const refreshing = readdirSync(servicesDir)
      .filter((file) => file.endsWith('.js'))
      .map((file) => [
        file,
        readFileSync(new URL(file, servicesDir), 'utf8'),
      ])
      .filter(([, source]) =>
        /refresh_[a-z_]+\(|REFRESH MATERIALIZED/.test(source),
      )

    expect(refreshing.map(([file]) => file).sort()).toEqual([
      'productChunkImportService.js',
      'salesChunkImportService.js',
      'salesImportService.js',
    ])

    for (const [file, source] of refreshing) {
      const refreshAt = source.search(/refresh_[a-z_]+\(/)
      const transactionStart = source.lastIndexOf(
        "await client.query('BEGIN')",
        refreshAt,
      )
      const transaction = source.slice(transactionStart, refreshAt)

      expect(transaction, file).toContain(
        "SET LOCAL statement_timeout = '15min'",
      )
    }
  })
})
