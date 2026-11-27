// MB-001 migration 042: expression index on sales_facts (brand_key(brand),
// sale_date) and the guarantee that every brand query filters with the exact
// same expression, so PostgreSQL can use it.

import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')
const migration = read('server/migrations/042_sales_facts_brand_key_index.sql')
const rollback = read('server/migrations/rollback/042_sales_facts_brand_key_index.rollback.sql')
const service = read('server/services/brandsService.js')

const withoutComments = (sql: string) => sql.replace(/--.*$/gm, '')

describe('MB-001 migration 042', () => {
  it('creates the expression index inside its own transaction, without CONCURRENTLY', () => {
    const sql = withoutComments(migration)

    expect(sql).toMatch(/^\s*BEGIN;/)
    expect(sql).toMatch(/COMMIT;\s*$/)
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_sales_facts_brand_key_sale_date')
    expect(sql).toMatch(/ON public\.sales_facts \(brand_key\(brand\), sale_date\)/)
    expect(sql).toContain('ANALYZE public.sales_facts;')
    expect(sql).not.toContain('CONCURRENTLY')
  })

  it('does not touch data, the cache version or the required schema list', () => {
    const sql = withoutComments(migration)

    expect(sql).not.toMatch(/data_cache_version|INSERT|UPDATE|DELETE/)
    expect(read('server/db/schemaCheck.js')).not.toContain('idx_sales_facts_brand_key_sale_date')
  })

  it('warns that a future brand_key() change needs a REINDEX', () => {
    expect(migration).toContain('REINDEX INDEX public.idx_sales_facts_brand_key_sale_date')
  })

  it('has a rollback that only drops the index', () => {
    const sql = withoutComments(rollback)

    expect(sql).toContain('DROP INDEX IF EXISTS public.idx_sales_facts_brand_key_sale_date;')
    expect(sql).not.toMatch(/DROP TABLE|DELETE|UPDATE/)
  })
})

describe('MB-001 brand queries use the index expression', () => {
  it('filters every sales_facts read with brand_key(f.brand) = $1', () => {
    const reads = service.split('FROM sales_facts f').slice(1)

    expect(reads.length).toBeGreaterThanOrEqual(7)

    for (const part of reads) {
      // The WHERE of the same statement (up to the next semicolon or backtick).
      const statement = part.split('`')[0] ?? ''

      expect(statement).toContain('brand_key(f.brand) = $1')
    }
  })

  it('never filters sales_facts with the raw brand text or another brand_key form', () => {
    expect(service).not.toMatch(/f\.brand\s*(=|ILIKE|LIKE)/)
    expect(service).not.toMatch(/UPPER\(f\.brand\)/)
  })
})
