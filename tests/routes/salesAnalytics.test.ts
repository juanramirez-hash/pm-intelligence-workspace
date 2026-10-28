import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

interface TestRequest {
  authUser?: {
    scope?: unknown
    brandIds?: unknown
  }
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
  summarizeSalesSegmentation:
    vi.fn(),
  groupSalesSegmentation:
    vi.fn(),
  loadSalesSegmentationFilterOptions:
    vi.fn(),
  loadSalesSegmentationDetailRows:
    vi.fn(),
}))

vi.mock(
  '../../server/services/salesAnalyticsService.js',
  () => ({
    summarizeSalesSegmentation:
      mocks.summarizeSalesSegmentation,
    groupSalesSegmentation:
      mocks.groupSalesSegmentation,
    loadSalesSegmentationFilterOptions:
      mocks.loadSalesSegmentationFilterOptions,
    loadSalesSegmentationDetailRows:
      mocks.loadSalesSegmentationDetailRows,
  }),
)

import {
  createSalesAnalyticsRouter,
} from '../../server/routes/salesAnalytics.js'

const pool = {
  connect: vi.fn(),
}

async function invokeRoute(
  path: string,
  req: TestRequest,
) {
  const router =
    createSalesAnalyticsRouter(
      pool,
    ) as {
      stack: Array<{
        route?: {
          path: string
          methods: Record<string, boolean>
          stack: Array<{
            handle: TestHandler
          }>
        }
      }>
    }

  const route = router.stack.find(
    (layer) =>
      layer.route?.path === path &&
      layer.route.methods.post,
  )?.route

  if (!route) {
    throw new Error(
      `POST ${path} was not found`,
    )
  }

  const handler =
    route.stack[0]?.handle

  if (!handler) {
    throw new Error(
      `POST ${path} handler is missing`,
    )
  }

  const res = buildResponse()

  await handler(
    req,
    res,
  )

  return res
}

beforeEach(() => {
  vi.clearAllMocks()

  mocks.summarizeSalesSegmentation
    .mockResolvedValue({})
  mocks.groupSalesSegmentation
    .mockResolvedValue([])
  mocks.loadSalesSegmentationFilterOptions
    .mockResolvedValue({})
  mocks.loadSalesSegmentationDetailRows
    .mockResolvedValue([])
})

describe(
  'Sales analytics routes',
  () => {
    it(
      'passes authenticated all scope and filter to summary',
      async () => {
        const summary = {
          revenue: 100,
        }

        mocks.summarizeSalesSegmentation
          .mockResolvedValue(summary)

        const res =
          await invokeRoute(
            '/summary',
            {
              authUser: {
                scope: 'all',
                brandIds: [],
              },
              body: {
                filter: {
                  periodIds: [
                    '2026-10',
                  ],
                },
              },
            },
          )

        expect(
          mocks.summarizeSalesSegmentation,
        ).toHaveBeenCalledExactlyOnceWith(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
          {
            periodIds: [
              '2026-10',
            ],
          },
        )

        expect(
          res.set,
        ).toHaveBeenCalledWith(
          'Cache-Control',
          'no-store',
        )

        expect(
          res.json,
        ).toHaveBeenCalledWith({
          ok: true,
          dataset: 'sales',
          analytics: 'summary',
          data: summary,
        })
      },
    )

    it(
      'uses authenticated assigned scope and ignores client scope overrides',
      async () => {
        await invokeRoute(
          '/summary',
          {
            authUser: {
              scope: 'assigned',
              brandIds: [
                'BELDEN',
              ],
            },
            body: {
              scope: 'all',
              brandIds: [
                'AJAX',
              ],
            },
          },
        )

        expect(
          mocks.summarizeSalesSegmentation,
        ).toHaveBeenCalledExactlyOnceWith(
          pool,
          {
            scope: 'assigned',
            brandIds: [
              'BELDEN',
            ],
          },
          {},
        )
      },
    )

    it(
      'rejects a missing authenticated user',
      async () => {
        const res =
          await invokeRoute(
            '/summary',
            {
              body: {},
            },
          )

        expect(
          res.status,
        ).toHaveBeenCalledWith(
          401,
        )

        expect(
          mocks.summarizeSalesSegmentation,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'rejects an invalid authenticated scope',
      async () => {
        const res =
          await invokeRoute(
            '/summary',
            {
              authUser: {
                scope: 'ALL',
                brandIds: [],
              },
            },
          )

        expect(
          res.status,
        ).toHaveBeenCalledWith(
          403,
        )
      },
    )

    it(
      'rejects invalid assigned brand ids',
      async () => {
        const res =
          await invokeRoute(
            '/summary',
            {
              authUser: {
                scope: 'assigned',
                brandIds: [
                  'BELDEN',
                  '',
                ],
              },
            },
          )

        expect(
          res.status,
        ).toHaveBeenCalledWith(
          403,
        )
      },
    )

    it(
      'routes a valid group-by request',
      async () => {
        const groups = [
          {
            id: 'BELDEN',
          },
        ]

        mocks.groupSalesSegmentation
          .mockResolvedValue(groups)

        const res =
          await invokeRoute(
            '/group-by',
            {
              authUser: {
                scope: 'all',
                brandIds: [],
              },
              body: {
                dimension: 'brand',
                filter: {
                  periodIds: [
                    '2026-10',
                  ],
                },
              },
            },
          )

        expect(
          mocks.groupSalesSegmentation,
        ).toHaveBeenCalledExactlyOnceWith(
          pool,
          'brand',
          {
            scope: 'all',
            brandIds: [],
          },
          {
            periodIds: [
              '2026-10',
            ],
          },
        )

        expect(
          res.json,
        ).toHaveBeenCalledWith({
          ok: true,
          dataset: 'sales',
          analytics: 'group-by',
          dimension: 'brand',
          data: groups,
        })
      },
    )

    it(
      'rejects an invalid group-by dimension',
      async () => {
        const res =
          await invokeRoute(
            '/group-by',
            {
              authUser: {
                scope: 'all',
                brandIds: [],
              },
              body: {
                dimension: 'unknown',
              },
            },
          )

        expect(
          res.status,
        ).toHaveBeenCalledWith(
          400,
        )

        expect(
          mocks.groupSalesSegmentation,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'routes filter options with an explicit period',
      async () => {
        await invokeRoute(
          '/filter-options',
          {
            authUser: {
              scope: 'all',
              brandIds: [],
            },
            body: {
              periodId: '2026-10',
              filter: {
                brandIds: [
                  'BELDEN',
                ],
              },
            },
          },
        )

        expect(
          mocks.loadSalesSegmentationFilterOptions,
        ).toHaveBeenCalledExactlyOnceWith(
          pool,
          '2026-10',
          {
            scope: 'all',
            brandIds: [],
          },
          {
            brandIds: [
              'BELDEN',
            ],
          },
        )
      },
    )

    it(
      'rejects filter options without a period',
      async () => {
        const res =
          await invokeRoute(
            '/filter-options',
            {
              authUser: {
                scope: 'all',
                brandIds: [],
              },
              body: {},
            },
          )

        expect(
          res.status,
        ).toHaveBeenCalledWith(
          400,
        )
      },
    )

    it(
      'routes detail rows with the current default limit',
      async () => {
        await invokeRoute(
          '/detail-rows',
          {
            authUser: {
              scope: 'all',
              brandIds: [],
            },
            body: {
              filter: {
                searchTerm:
                  'cyberpuerta',
              },
            },
          },
        )

        expect(
          mocks.loadSalesSegmentationDetailRows,
        ).toHaveBeenCalledExactlyOnceWith(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
          {
            searchTerm:
              'cyberpuerta',
          },
          100,
        )
      },
    )

    it(
      'rejects malformed segmentation filters',
      async () => {
        const res =
          await invokeRoute(
            '/summary',
            {
              authUser: {
                scope: 'all',
                brandIds: [],
              },
              body: {
                filter: {
                  customerIds:
                    '012035',
                },
              },
            },
          )

        expect(
          res.status,
        ).toHaveBeenCalledWith(
          400,
        )

        expect(
          mocks.summarizeSalesSegmentation,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'returns 500 without retrying if an analytics service fails',
      async () => {
        mocks.summarizeSalesSegmentation
          .mockRejectedValue(
            new Error(
              'Database failed',
            ),
          )

        const log = vi
          .spyOn(
            console,
            'error',
          )
          .mockImplementation(
            () => {},
          )

        try {
          const res =
            await invokeRoute(
              '/summary',
              {
                authUser: {
                  scope:
                    'assigned',
                  brandIds: [
                    'BELDEN',
                  ],
                },
              },
            )

          expect(
            res.status,
          ).toHaveBeenCalledWith(
            500,
          )

          expect(
            mocks.summarizeSalesSegmentation,
          ).toHaveBeenCalledTimes(
            1,
          )
        } finally {
          log.mockRestore()
        }
      },
    )
  },
)
