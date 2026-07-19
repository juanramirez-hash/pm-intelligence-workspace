import {
  getActiveBrands,
  getActiveLocations,
  getGrossMargin,
  getSalesByBrand,
  getSalesByLocation,
  getSalesByMonth,
  getTotalGrossProfit,
  getTotalQuantity,
  getTotalSales,
  getUniqueCustomers,
  getUniqueDocuments,
  getUniqueProducts,
} from '../../analytics/salesAnalytics'
import type { SalesDatasetSummary } from '../../types/reportTypes'
import type { SalesBusinessModel } from './salesBusinessModel'

export function processSalesBusinessModel(
  model: SalesBusinessModel,
): SalesDatasetSummary {
  return {
    periodStart: model.periodStart,
    periodEnd: model.periodEnd,

    totalSales: getTotalSales(model),
    totalGrossProfit: getTotalGrossProfit(model),
    grossMargin: getGrossMargin(model),
    totalQuantity: getTotalQuantity(model),

    uniqueCustomers: getUniqueCustomers(model),
    uniqueProducts: getUniqueProducts(model),
    uniqueDocuments: getUniqueDocuments(model),

    activeBrands: getActiveBrands(model),
    activeLocations: getActiveLocations(model),

    salesByBrand: getSalesByBrand(model),
    salesByMonth: getSalesByMonth(model),
    salesByLocation: getSalesByLocation(model),

    processedRows: model.processedRows,
    ignoredRows: model.ignoredRows,
  }
}