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
  CustomerQueries,
} from './customerQueries'

import {
  RevenueQueries,
} from './revenueQueries'

export class BusinessRepository {
  private readonly model:
    BusinessDataModel

  readonly customer:
    CustomerQueries

  readonly revenue:
    RevenueQueries

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model

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
    return [
      ...this.model.brands.values(),
    ]
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
    return this.model.brands.get(
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