export type InsightSeverity =
  | 'success'
  | 'info'
  | 'warning'
  | 'critical'

export interface BusinessInsight {
  id: string

  title: string

  description: string

  severity: InsightSeverity

  category:
    | 'sales'
    | 'customers'
    | 'brands'
    | 'products'
    | 'inventory'

  priority: number

  generatedAt: string
}