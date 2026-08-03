import {
  downloadPricingBatchDesignExport,
} from './downloadPricingBatchDesignExport'

import type {
  PricingBatchDesignExportPayload,
} from './buildPricingBatchDesignExport'

export async function downloadPricingCorridorExport(
  payload: PricingBatchDesignExportPayload,
): Promise<void> {
  await downloadPricingBatchDesignExport(payload)
}
