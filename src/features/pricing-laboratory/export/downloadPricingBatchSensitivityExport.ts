import type {
  PricingBatchDesignExportPayload,
} from './buildPricingBatchDesignExport'

import {
  downloadPricingBatchDesignExport,
} from './downloadPricingBatchDesignExport'

export async function downloadPricingBatchSensitivityExport(
  payload: PricingBatchDesignExportPayload,
): Promise<void> {
  await downloadPricingBatchDesignExport(payload)
}
