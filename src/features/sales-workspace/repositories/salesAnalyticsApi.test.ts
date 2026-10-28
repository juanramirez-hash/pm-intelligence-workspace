import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  authenticatedFetch,
} from '../../../shared/http/authenticatedFetch'

import {
  loadSalesDetailRows,
  loadSalesFilterOptions,
} from './salesAnalyticsApi'

vi.mock(
  '../../../shared/http/authenticatedFetch',
  () => ({
    authenticatedFetch: vi.fn(),
  }),
)

const mockedAuthenticatedFetch =
  vi.mocked(authenticatedFetch)

function mockJsonResponse(
  payload: unknown,
  status = 200,
): void {
  mockedAuthenticatedFetch
    .mockResolvedValueOnce({
      ok:
        status >= 200 &&
        status < 300,
      status,
      json:
        async () => payload,
    } as Response)
}

describe(
  'salesAnalyticsApi',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it(
      'loads faceted filter options for the selected period',
      async () => {
        const data = {
          brands: [
            {
              id: 'BELDEN',
              label: 'BELDEN',
              revenue: 100,
            },
          ],
          customers: [],
          products: [],
          locations: [],
          salesRepresentatives: [],
        }

        mockJsonResponse({
          ok: true,
          dataset: 'sales',
          analytics: 'filter-options',
          periodId: '2026-10',
          data,
        })

        const result =
          await loadSalesFilterOptions(
            '2026-10',
            {
              periodId: '2026-10',
              comparisonMode:
                'previous-period',
              brandIds: ['BELDEN'],
              customerIds: ['012035'],
              searchTerm:
                'cyberpuerta',
            },
          )

        expect(result)
          .toEqual(data)

        expect(
          mockedAuthenticatedFetch,
        ).toHaveBeenCalledTimes(1)

        const [
          url,
          init,
        ] =
          mockedAuthenticatedFetch
            .mock.calls[0]

        expect(url)
          .toBe(
            '/api/data/sales/analytics/filter-options',
          )

        expect(init?.method)
          .toBe('POST')

        expect(
          JSON.parse(
            String(init?.body),
          ),
        ).toEqual({
          periodId: '2026-10',
          filter: {
            brandIds: ['BELDEN'],
            customerIds: ['012035'],
            searchTerm:
              'cyberpuerta',
          },
        })
      },
    )

    it(
      'loads detail rows using the selected period as a segmentation filter',
      async () => {
        const data = [
          {
            id:
              '2026-10-01::2026-10::BELDEN::012035::PRODUCT-1::MX::REP-1',
            periodId: '2026-10',
            brandId: 'BELDEN',
            brandLabel: 'BELDEN',
            customerId: '012035',
            customerLabel:
              '012035 CYBERPUERTA',
            productId: 'PRODUCT-1',
            productLabel:
              'PRODUCT-1',
            locationId: 'MX',
            locationLabel: 'MX',
            salesRepresentativeId:
              'REP-1',
            salesRepresentativeLabel:
              'REP-1',
            revenue: 100,
            grossProfit: 25,
            grossMargin: 25,
            quantity: 1,
            documents: 1,
            rowCount: 1,
          },
        ]

        mockJsonResponse({
          ok: true,
          dataset: 'sales',
          analytics: 'detail-rows',
          data,
        })

        const result =
          await loadSalesDetailRows(
            '2026-10',
            {
              periodId: '2026-10',
              comparisonMode:
                'previous-period',
              brandIds: ['BELDEN'],
            },
            5,
          )

        expect(result)
          .toEqual(data)

        const [
          url,
          init,
        ] =
          mockedAuthenticatedFetch
            .mock.calls[0]

        expect(url)
          .toBe(
            '/api/data/sales/analytics/detail-rows',
          )

        expect(
          JSON.parse(
            String(init?.body),
          ),
        ).toEqual({
          filter: {
            periodIds: ['2026-10'],
            brandIds: ['BELDEN'],
          },
          limit: 5,
        })
      },
    )

    it(
      'propagates the API error message',
      async () => {
        mockJsonResponse(
          {
            error:
              'Invalid sales analytics filter',
          },
          400,
        )

        await expect(
          loadSalesFilterOptions(
            '2026-10',
            {
              periodId: '2026-10',
              comparisonMode:
                'previous-period',
            },
          ),
        ).rejects.toThrow(
          'Invalid sales analytics filter',
        )
      },
    )

    it(
      'falls back to the HTTP status when the response has no API error',
      async () => {
        mockJsonResponse(
          {
            ok: false,
          },
          500,
        )

        await expect(
          loadSalesDetailRows(
            '2026-10',
            {
              periodId: '2026-10',
              comparisonMode:
                'previous-period',
            },
          ),
        ).rejects.toThrow(
          'Request failed with status 500',
        )
      },
    )
  },
)