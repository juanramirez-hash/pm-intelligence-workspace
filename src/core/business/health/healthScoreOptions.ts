import type {
  BusinessHealthWeights,
} from './healthWeights'

export interface BusinessHealthBenchmarks {
  minimumCustomers?: number
  minimumProducts?: number
  /** Current-period revenue divided by previous-period revenue. */
  revenueTrendRatio?: number
}

export interface BusinessHealthScoreOptions {
  weights?: Partial<BusinessHealthWeights>
  benchmarks?: BusinessHealthBenchmarks
}
