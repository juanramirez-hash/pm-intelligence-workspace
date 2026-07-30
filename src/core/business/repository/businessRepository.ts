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