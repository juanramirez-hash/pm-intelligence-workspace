export type BusinessHealthComponentId =
  | 'revenue'
  | 'grossProfit'
  | 'margin'
  | 'forecast'
  | 'pace'
  | 'customers'
  | 'products'
  | 'trend'

export type BusinessHealthWeights = Readonly<
  Record<BusinessHealthComponentId, number>
>

export const defaultBusinessHealthWeights:
  BusinessHealthWeights = Object.freeze({
    revenue: 25,
    grossProfit: 20,
    margin: 15,
    forecast: 15,
    pace: 10,
    customers: 5,
    products: 5,
    trend: 5,
  })

export function validateBusinessHealthWeights(
  weights: BusinessHealthWeights,
): void {
  for (const [componentId, weight] of
    Object.entries(weights)) {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error(
        `Invalid health weight for ${componentId}: ${weight}`,
      )
    }
  }

  const total = Object.values(weights)
    .reduce((sum, weight) => sum + weight, 0)

  if (total <= 0) {
    throw new Error(
      'Business health weights must have a positive total.',
    )
  }
}
