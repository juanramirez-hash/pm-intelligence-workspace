import type {
  PricingBatchDesignExportPayload,
} from './buildPricingBatchDesignExport'

import {
  downloadPricingBatchDesignExport,
} from './downloadPricingBatchDesignExport'

export async function downloadPricingCostFxStressExport(
  payload: PricingBatchDesignExportPayload,
): Promise<void> {
  await downloadPricingBatchDesignExport(payload)
}
