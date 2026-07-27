import type { BusinessDataModel } from '../models'
import type { BusinessProduct } from '../entities/product'
import type { BusinessProductPeriod } from '../entities/productPeriod'

function normalizeIdentifier(value: string): string {
  return value.trim().toLocaleUpperCase('es-MX')
}

export class ProductQueries {
  private readonly model: BusinessDataModel

  constructor(model: BusinessDataModel) {
    this.model = model
  }

  getAll(): BusinessProduct[] {
    return [...this.model.products.values()]
  }

  findById(id: string): BusinessProduct | undefined {
    return this.model.products.get(normalizeIdentifier(id))
  }

  findPeriod(productId: string, periodId: string): BusinessProductPeriod | undefined {
    return this.model.productPeriods.get(`${periodId}::${normalizeIdentifier(productId)}`)
  }

  findTimeline(productId: string): BusinessProductPeriod[] {
    const normalizedProductId = normalizeIdentifier(productId)
    return [...this.model.productPeriods.values()]
      .filter((item) => item.productId === normalizedProductId)
      .sort((a, b) => a.periodId.localeCompare(b.periodId))
  }
}
