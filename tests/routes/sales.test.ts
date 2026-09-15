import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

// VERSION: SALES-ROUTE-REAL-ROUTER-V2

interface TestRequest {
  authUser?: {
    scope?: unknown
    brandIds?: unknown
  }
  query?: Record<string, unknown>
  body?: Record<string, unknown>
}

function buildResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    set: vi.fn(),
  }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  res.set.mockReturnValue(res)

  return res
}

type TestHandler = (
  req: TestRequest,
  res: ReturnType<typeof buildResponse>,
) => Promise<unknown>

const mocks = vi.hoisted(() => ({
  loadSalesDataset: vi.fn(),
}))

vi.mock('../../server/services/salesReadService.js', () => ({
  loadSalesDataset: mocks.loadSalesDataset,
}))

vi.mock('../../server/services/salesImportService.js', () => ({
  importSalesDataset: vi.fn(),
}))

vi.mock('../../server/services/salesChunkImportService.js', () => ({
  appendSalesChunk: vi.fn(),
  cancelSalesChunkImport: vi.fn(),
  finalizeSalesChunkImport: vi.fn(),
  startSalesChunkImport: vi.fn(),
}))

import {
  createSalesRouter,
} from '../../server/routes/sales.js'

const pool = {
  connect: vi.fn(),
}

async function readSales(req: TestRequest) {
  const router = createSalesRouter(pool) as {
    stack: Array<{
      route?: {
        path: string
        methods: Record<string, boolean>
        stack: Array<{ handle: TestHandler }>
      }
    }>
  }

  const route = router.stack.find(
    (layer) =>
      layer.route?.path === '/' &&
      layer.route.methods.get,
  )?.route

  if (!route) {
    throw new Error(
      'V2: GET / was not found in the real Express router',
    )
  }

  if (route.stack.length !== 1) {
    throw new Error(
      'V2: GET / has multiple handlers; test the middleware chain',
    )
  }

  const handler = route.stack[0]?.handle

  if (!handler) {
    throw new Error('V2: GET / handler is missing')
  }

  const res = buildResponse()
  await handler(req, res)

  return res
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.loadSalesDataset.mockReset()
  mocks.loadSalesDataset.mockResolvedValue(null)
})

describe('Sales GET route access', () => {
  it('passes explicit all scope for an authorized unrestricted user', async () => {
    const res = await readSales({
      authUser: {
        scope: 'all',
        brandIds: [],
      },
    })

    expect(mocks.loadSalesDataset).toHaveBeenCalledExactlyOnceWith(
      pool,
      { scope: 'all', brandIds: [] },
    )
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      dataset: 'sales',
      data: null,
    })
    expect(res.set).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    )
  })

  it('passes authenticated canonical brand ids to the reader', async () => {
    const dataset = {
      normalizedRows: [],
      lastImportedFile: 'sales.xlsx',
      lastImportedAt: '2026-09-11T12:00:00.000Z',
    }

    mocks.loadSalesDataset.mockResolvedValue(dataset)

    const res = await readSales({
      authUser: {
        scope: 'assigned',
        brandIds: ['ALTER', 'SONOFF', 'CDATA', 'MIKROTIK'],
      },
    })

    expect(mocks.loadSalesDataset).toHaveBeenCalledExactlyOnceWith(
      pool,
      {
        scope: 'assigned',
        brandIds: ['ALTER', 'SONOFF', 'CDATA', 'MIKROTIK'],
      },
    )
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      dataset: 'sales',
      data: dataset,
    })
    expect(res.set).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    )
  })

  it('preserves empty assigned scope instead of granting all access', async () => {
    const res = await readSales({
      authUser: {
        scope: 'assigned',
        brandIds: [],
      },
    })

    expect(mocks.loadSalesDataset).toHaveBeenCalledExactlyOnceWith(
      pool,
      { scope: 'assigned', brandIds: [] },
    )
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      dataset: 'sales',
      data: null,
    })
  })

  it('ignores client attempts to override scope and brands', async () => {
    await readSales({
      authUser: {
        scope: 'assigned',
        brandIds: ['ALTER'],
      },
      query: {
        scope: 'all',
        brandIds: ['AJAX', 'BELDEN'],
      },
      body: {
        scope: 'all',
        brandIds: ['AJAX', 'BELDEN'],
      },
    })

    expect(mocks.loadSalesDataset).toHaveBeenCalledExactlyOnceWith(
      pool,
      { scope: 'assigned', brandIds: ['ALTER'] },
    )
  })

  it('rejects a missing authenticated user', async () => {
    const res = await readSales({
      query: { scope: 'all' },
    })

    expect(res.status).toHaveBeenCalledWith(401)
    expect(mocks.loadSalesDataset).not.toHaveBeenCalled()
  })

  it.each([
    undefined,
    null,
    'unknown',
    'ALL',
  ])('rejects invalid scope %s', async (scope) => {
    const res = await readSales({
      authUser: {
        scope,
        brandIds: ['ALTER'],
      },
    })

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.loadSalesDataset).not.toHaveBeenCalled()
  })

  it.each([
    { label: 'missing', value: undefined },
    { label: 'null', value: null },
    { label: 'a string', value: 'ALTER' },
    { label: 'a non-string element', value: ['ALTER', 42] },
    { label: 'an empty element', value: [''] },
    { label: 'a whitespace element', value: ['   '] },
  ])('rejects assigned brands that are $label', async ({ value }) => {
    const res = await readSales({
      authUser: {
        scope: 'assigned',
        brandIds: value,
      },
    })

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.loadSalesDataset).not.toHaveBeenCalled()
  })

  it('does not retry without restrictions if the scoped reader fails', async () => {
    mocks.loadSalesDataset.mockRejectedValue(
      new Error('Scoped read failed'),
    )

    const log = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const res = await readSales({
        authUser: {
          scope: 'assigned',
          brandIds: ['ALTER'],
        },
      })

      expect(res.status).toHaveBeenCalledWith(500)
      expect(mocks.loadSalesDataset).toHaveBeenCalledExactlyOnceWith(
        pool,
        { scope: 'assigned', brandIds: ['ALTER'] },
      )
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: 'Sales load failed',
      })
    } finally {
      log.mockRestore()
    }
  })
})