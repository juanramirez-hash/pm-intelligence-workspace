import type {
  BusinessPrice,
  BusinessPriceMarginBand,
} from '../entities/price'

export const PRICE_DESIGN_METHODOLOGY =
  'price-design-v1' as const

export type PriceDesignMethodology =
  typeof PRICE_DESIGN_METHODOLOGY

export type PriceDesignObjective =
  | {
    type: 'target_gross_margin'
    grossMargin: number
  }
  | {
    type: 'target_gross_profit'
    grossProfit: number
  }
  | {
    type: 'target_selling_price'
    sellingPrice: number
  }
  | {
    type: 'list_price_factor'
    factor: number
  }
  | {
    type: 'selling_price_factor'
    factor: number
  }
  | {
    type: 'list_price'
    listPrice: number
  }

export type PriceDesignObjectiveType =
  PriceDesignObjective['type']

export interface PriceDesignIdentity {
  brandName: string | null
  model: string | null
  sku: string | null
}

export interface PriceDesignInput {
  id: string
  identity: PriceDesignIdentity
  currency: string
  cost: number
  discountRate: number
  objective: PriceDesignObjective
  notes?: string | null
}

export interface PriceDesignOptions {
  moneyPrecision?: number
  ratePrecision?: number
}

export interface PriceDesignMetrics {
  currency: string
  cost: number
  discountRate: number
  listPrice: number
  sellingPrice: number
  grossProfit: number
  grossMargin: number
  listPriceFactor: number
  sellingPriceFactor: number
  marginBand: BusinessPriceMarginBand
}

export type PriceDesignSignalSeverity =
  | 'info'
  | 'warning'
  | 'invalid'

export type PriceDesignSignalCode =
  | 'PRICE_DESIGN_INVALID_IDENTIFIER'
  | 'PRICE_DESIGN_INVALID_CURRENCY'
  | 'PRICE_DESIGN_INVALID_COST'
  | 'PRICE_DESIGN_INVALID_DISCOUNT'
  | 'PRICE_DESIGN_INVALID_OBJECTIVE'
  | 'PRICE_DESIGN_NEGATIVE_GROSS_PROFIT'
  | 'PRICE_DESIGN_LIST_FACTOR_BELOW_ONE'

export interface PriceDesignSignal {
  code: PriceDesignSignalCode
  severity: PriceDesignSignalSeverity
  message: string
  actual: number | null
  threshold: number | null
}

export type PriceDesignStatus =
  | 'valid'
  | 'warning'
  | 'invalid'

export interface PriceDesignIsolationContract {
  mutatesCatalogPrice: false
  persistsDesign: false
  writesBusinessRepository: false
  writesOtherWorkspaces: false
}

export interface PriceDesignResult {
  available: boolean
  methodology: PriceDesignMethodology
  executionMode: 'simulation-only'
  isolation: PriceDesignIsolationContract
  status: PriceDesignStatus
  input: PriceDesignInput
  metrics: PriceDesignMetrics | null
  transientPrice: BusinessPrice | null
  signals: PriceDesignSignal[]
  explainability: string[]
}
