import type {
  BusinessDataModel,
} from '../models'

import type {
  BusinessBrand,
} from '../entities/brand'

import type {
  BusinessCustomer,
} from '../entities/customer'

import type {
  BusinessProduct,
} from '../entities/product'

import {
  BrandQueries,
} from './brandQueries'

import {
  CustomerQueries,
} from './customerQueries'

import {
  CustomerBrandQueries,
} from './customerBrandQueries'

import {
  RevenueQueries,
} from './revenueQueries'

import {
  ProductQueries,
} from './productQueries'

import {
  CommercialTargetQueries,
} from './commercialTargetQueries'

import {
  SalesSegmentationQueries,
} from './salesSegmentationQueries'

import {
  ProductIdentityQualityQueries,
} from './productIdentityQualityQueries'

import {
  InventoryQueries,
} from './inventoryQueries'

import {
  InventoryAnalyticsQueries,
} from './inventoryAnalyticsQueries'

import {
  InventoryRiskOpportunityQueries,
} from './inventoryRiskOpportunityQueries'

import {
  ForecastDataQueries,
} from './forecastDataQueries'

import {
  ProjectQueries,
} from './projectQueries'

import {
  ProjectBillingQueries,
} from './projectBillingQueries'

import {
  ExchangeRateQueries,
} from './exchangeRateQueries'

import {
  SalesTransactionQueries,
} from './salesTransactionQueries'

import {
  ProjectBillingReconciliationQueries,
} from './projectBillingReconciliationQueries'

export class BusinessRepository {
  private readonly model:
    BusinessDataModel

  readonly brand:
    BrandQueries

  readonly customer:
    CustomerQueries

  readonly customerBrand:
    CustomerBrandQueries

  readonly revenue:
    RevenueQueries

  readonly product:
    ProductQueries

  readonly targets:
    CommercialTargetQueries

  readonly salesSegmentation:
    SalesSegmentationQueries


  readonly productIdentityQuality:
    ProductIdentityQualityQueries

  readonly inventory:
    InventoryQueries

  readonly inventoryAnalytics:
    InventoryAnalyticsQueries

  readonly inventoryRiskOpportunity:
    InventoryRiskOpportunityQueries

  readonly forecast:
    ForecastDataQueries

  readonly projects:
    ProjectQueries

  readonly projectBillings:
    ProjectBillingQueries

  readonly exchangeRates:
    ExchangeRateQueries

  readonly salesTransactions:
    SalesTransactionQueries

  readonly projectBillingReconciliation:
    ProjectBillingReconciliationQueries

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model

    this.brand =
      new BrandQueries(
        model,
      )

    this.customer =
      new CustomerQueries(
        model,
      )

    this.customerBrand =
      new CustomerBrandQueries(
        model,
      )

    this.revenue =
      new RevenueQueries(
        model,
      )

    this.product =
      new ProductQueries(
        model,
      )

    this.targets =
      new CommercialTargetQueries(
        model,
      )

    this.salesSegmentation =
      new SalesSegmentationQueries(
        model,
      )


    this.productIdentityQuality =
      new ProductIdentityQualityQueries(
        model,
      )

    this.inventory =
      new InventoryQueries(model)

    this.inventoryAnalytics =
      new InventoryAnalyticsQueries(model)

    this.inventoryRiskOpportunity =
      new InventoryRiskOpportunityQueries(model)

    this.forecast =
      new ForecastDataQueries(model)

    this.projects =
      new ProjectQueries(model)

    this.projectBillings =
      new ProjectBillingQueries(model)

    this.exchangeRates =
      new ExchangeRateQueries(model)

    this.salesTransactions =
      new SalesTransactionQueries(model)

    this.projectBillingReconciliation =
      new ProjectBillingReconciliationQueries(model)
  }

  getCustomers():
    BusinessCustomer[] {
    return this.customer.getAll()
  }

  getBrands():
    BusinessBrand[] {
    return this.brand.getAll()
  }

  getProducts():
    BusinessProduct[] {
    return this.product.getAll()
  }

  getProductReconciliationSummary() {
    return this.product.getReconciliationSummary()
  }

  getProductIdentityQualityReport() {
    return this.productIdentityQuality.getReport()
  }

  getInventoryPositions() {
    return this.inventory.getAll()
  }

  getLatestInventorySnapshot() {
    return this.inventory.getLatestSnapshot()
  }

  getInventoryAnalyticsReport() {
    return this.inventoryAnalytics.getReport()
  }

  getInventoryRiskOpportunityReport() {
    return this.inventoryRiskOpportunity.getReport()
  }

  getProjects() {
    return this.projects.getAll()
  }

  getProjectBillingDocuments() {
    return this.projectBillings.getAllDocuments()
  }

  getExchangeRates() {
    return this.exchangeRates.getAll()
  }

  getSalesTransactionDocuments() {
    return this.salesTransactions.getAllDocuments()
  }

  getProjectBillingReconciliationReport() {
    return this.projectBillingReconciliation.getReport()
  }

  getProjectAwareForecastReport() {
    return this.forecast.getProjectAwareReport()
  }

  findCustomer(
    id: string,
  ): BusinessCustomer | undefined {
    return this.customer.findById(
      id,
    )
  }

  findBrand(
    id: string,
  ): BusinessBrand | undefined {
    return this.brand.findById(
      id,
    )
  }

  findProduct(
    id: string,
  ): BusinessProduct | undefined {
    return this.product.findById(
      id,
    )
  }

  getGeneratedAt(): string {
    return this.model.generatedAt
  }

  getDataPeriodEnd(): string | null {
    return this.model.periodEnd
  }

  getTotals() {
    return this.model.totals
  }

  getPeriods() {
    return [
      ...this.model.periods.values(),
    ]
  }
}