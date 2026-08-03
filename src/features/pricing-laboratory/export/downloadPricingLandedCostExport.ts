import {
  downloadPricingBatchDesignExport,
} from './downloadPricingBatchDesignExport'

import type {
  PricingBatchDesignExportPayload,
} from './buildPricingBatchDesignExport'

export async function downloadPricingLandedCostExport(
  payload: PricingBatchDesignExportPayload,
): Promise<void> {
  await downloadPricingBatchDesignExport(payload)
}
