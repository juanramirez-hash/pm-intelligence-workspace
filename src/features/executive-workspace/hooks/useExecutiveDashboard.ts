import { useMemo } from 'react'

import { useDataCenterStore } from '../../data-center/store/dataCenterStore'
import { calculateExecutiveSalesAnalytics } from '../analytics/executiveSalesAnalytics'

export function useExecutiveDashboard() {
  const normalizedSales =
    useDataCenterStore(
      (state) =>
        state.normalizedSales,
    )

  const salesAnalytics =
    useMemo(
      () =>
        calculateExecutiveSalesAnalytics(
          normalizedSales,
        ),
      [normalizedSales],
    )

  return {
    salesAnalytics,
    normalizedSalesCount:
      normalizedSales.length,
  }
}