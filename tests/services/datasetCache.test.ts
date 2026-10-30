import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  applyDatasetCache,
  datasetCache,
} from '../../server/middleware/datasetCache.js'
import {
  DATASET_RESPONSE_FORMAT_VERSION,
  buildDatasetEtag,
  loadDatasetCacheState,
  matchesIfNoneMatch,
} from '../../server/services/datasetCacheService.js'

const baseState = {
  importCount: '12',
  maxImportId: '340',
  maxCompletedAt: '2026-10-30T15:00:00.000Z',
  dataVersion: '1',
}

function buildPool(
  row: Record<string, unknown> | undefined = {
    import_count: '12',
    max_import_id: '340',
    max_completed_at: new Date('2026-10-30T15:00:00.000Z'),
    data_version: 1,
  },
) {
  return {
    query: vi.fn(async () => ({
      rows: row ? [row] : [],
    })),
  }
}

function buildRequest(
  ifNoneMatch?: string,
) {
  return {
    get: vi.fn((name: string) =>
      name.toLowerCase() === 'if-none-match'
        ? ifNoneMatch
        : undefined,
    ),
  }
}

function buildResponse() {
  const res = {
    set: vi.fn(),
    vary: vi.fn(),
    status: vi.fn(),
    end: vi.fn(),
  }

  res.set.mockReturnValue(res)
  res.vary.mockReturnValue(res)
  res.status.mockReturnValue(res)
  res.end.mockReturnValue(res)

  return res
}

function etagFor(
  overrides: Partial<typeof baseState> = {},
  access?: { scope: string, brandIds: string[] },
  datasetType = 'sales',
) {
  return buildDatasetEtag({
    datasetType,
    state: {
      ...baseState,
      ...overrides,
    },
    access,
  })
}

describe('dataset cache state', () => {
  it('reads only data_imports and the manual data version', async () => {
    const pool = buildPool()

    const state = await loadDatasetCacheState(
      pool,
      'customers',
    )

    const [sql, params] = pool.query.mock.calls[0] as unknown as [
      string,
      unknown[],
    ]
    const compactSql = sql.replace(/\s+/g, ' ')

    expect(compactSql).toContain('FROM data_imports')
    expect(compactSql).toContain('FROM public.data_cache_version')
    expect(compactSql).toContain("status = 'completed'")
    expect(compactSql).not.toMatch(/FROM (sales_facts|customers)\b/)
    expect(params).toEqual(['customers'])
    expect(state).toEqual(baseState)
  })

  it('fails when the data version row is missing', async () => {
    await expect(
      loadDatasetCacheState(
        buildPool({
          import_count: '0',
          max_import_id: '0',
          max_completed_at: null,
          data_version: null,
        }),
        'sales',
      ),
    ).rejects.toThrow('Data cache version is not available')
  })
})

describe('dataset ETag', () => {
  it('is weak and stable for the same inputs', () => {
    const etag = etagFor()

    expect(etag).toMatch(/^W\/"sales-[A-Za-z0-9_-]{32}"$/)
    expect(etagFor()).toBe(etag)
  })

  it.each([
    ['a new completed import id', { maxImportId: '341' }],
    ['a later completion time', { maxCompletedAt: '2026-10-30T16:00:00.000Z' }],
    ['another completed import count', { importCount: '13' }],
    ['a manual data version bump', { dataVersion: '2' }],
  ])('changes with %s', (_label, overrides) => {
    expect(etagFor(overrides)).not.toBe(etagFor())
  })

  it('changes with the dataset type', () => {
    expect(etagFor({}, undefined, 'customers')).not.toBe(
      etagFor({}, undefined, 'sales'),
    )
  })

  it('changes with the scope and assigned brands', () => {
    const all = etagFor({}, { scope: 'all', brandIds: [] })
    const alter = etagFor({}, { scope: 'assigned', brandIds: ['ALTER'] })
    const belden = etagFor({}, { scope: 'assigned', brandIds: ['BELDEN'] })
    const none = etagFor({}, { scope: 'assigned', brandIds: [] })

    expect(new Set([all, alter, belden, none]).size).toBe(4)
  })

  it('ignores the order and duplicates of assigned brands', () => {
    expect(
      etagFor({}, { scope: 'assigned', brandIds: ['ALTER', 'BELDEN'] }),
    ).toBe(
      etagFor({}, { scope: 'assigned', brandIds: ['BELDEN', 'ALTER', 'ALTER'] }),
    )
  })

  it('does not expose assigned brands', () => {
    expect(
      etagFor({}, { scope: 'assigned', brandIds: ['ALTER'] }),
    ).not.toContain('ALTER')
  })

  it('includes the response format version', () => {
    expect(DATASET_RESPONSE_FORMAT_VERSION).toBe(1)
  })
})

describe('If-None-Match comparison', () => {
  const etag = 'W/"sales-abc"'

  it.each([
    ['the same weak tag', 'W/"sales-abc"', true],
    ['the strong form of the tag', '"sales-abc"', true],
    ['a list that contains the tag', 'W/"other", W/"sales-abc"', true],
    ['a wildcard', '*', true],
    ['another tag', 'W/"sales-xyz"', false],
    ['an empty header', '', false],
    ['a missing header', undefined, false],
  ])('handles %s', (_label, header, expected) => {
    expect(matchesIfNoneMatch(header, etag)).toBe(expected)
  })
})

describe('applyDatasetCache', () => {
  it('sends private revalidation headers and continues on a miss', async () => {
    const res = buildResponse()

    const notModified = await applyDatasetCache(
      buildPool(),
      buildRequest(),
      res,
      { datasetType: 'customers' },
    )

    expect(notModified).toBe(false)
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, no-cache')
    expect(res.set).toHaveBeenCalledWith(
      'ETag',
      etagFor({}, undefined, 'customers'),
    )
    expect(res.set).not.toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(res.vary).toHaveBeenCalledWith('Cookie')
    expect(res.status).not.toHaveBeenCalled()
  })

  it('answers 304 when the browser copy is current', async () => {
    const res = buildResponse()
    const access = { scope: 'assigned', brandIds: ['ALTER'] }

    const notModified = await applyDatasetCache(
      buildPool(),
      buildRequest(etagFor({}, access)),
      res,
      { datasetType: 'sales', access },
    )

    expect(notModified).toBe(true)
    expect(res.status).toHaveBeenCalledWith(304)
    expect(res.end).toHaveBeenCalledOnce()
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, no-cache')
  })

  it('does not reuse a copy cached under other brand assignments', async () => {
    const res = buildResponse()

    const notModified = await applyDatasetCache(
      buildPool(),
      buildRequest(
        etagFor({}, { scope: 'assigned', brandIds: ['ALTER'] }),
      ),
      res,
      {
        datasetType: 'sales',
        access: { scope: 'assigned', brandIds: ['ALTER', 'BELDEN'] },
      },
    )

    expect(notModified).toBe(false)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('fails open with no-store when the cache state cannot be read', async () => {
    const res = buildResponse()
    const pool = {
      query: vi.fn(async () => {
        throw new Error('relation "public.data_cache_version" does not exist')
      }),
    }
    const log = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const notModified = await applyDatasetCache(
        pool,
        buildRequest('*'),
        res,
        { datasetType: 'sales' },
      )

      expect(notModified).toBe(false)
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store')
      expect(res.set).not.toHaveBeenCalledWith('ETag', expect.anything())
      expect(res.status).not.toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })
})

describe('datasetCache middleware', () => {
  it('calls next on a miss', async () => {
    const next = vi.fn()

    await datasetCache(buildPool(), { datasetType: 'inventory' })(
      buildRequest(),
      buildResponse(),
      next,
    )

    expect(next).toHaveBeenCalledOnce()
  })

  it('stops the chain on a 304', async () => {
    const next = vi.fn()
    const res = buildResponse()

    await datasetCache(buildPool(), { datasetType: 'inventory' })(
      buildRequest(etagFor({}, undefined, 'inventory')),
      res,
      next,
    )

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(304)
  })
})
