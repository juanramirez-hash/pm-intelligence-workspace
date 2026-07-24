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
  RevenueQueries,
} from './revenueQueries'

export class BusinessRepository {
  private readonly model:
    BusinessDataModel

  readonly brand:
    BrandQueries

  readonly customer:
    CustomerQueries

  readonly revenue:
    RevenueQueries

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

    this.revenue =
      new RevenueQueries(
        model,
      )
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
    return [
      ...this.model.products.values(),
    ]
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
    return this.model.products.get(
      id,
    )
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