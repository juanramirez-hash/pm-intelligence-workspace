import type { DetectableImportPlugin } from './importPlugin'

import { salesImportPlugin } from '../importers/sales/salesPlugin'
import { targetImportPlugin } from '../importers/targets/targetPlugin'
import { productMasterImportPlugin } from '../importers/products/productMasterPlugin'
import { inventoryImportPlugin } from '../importers/inventory/inventoryPlugin'
import { projectImportPlugin } from '../importers/projects/projectPlugin'
import { projectBillingImportPlugin } from '../importers/project-billings/projectBillingPlugin'
import { exchangeRateImportPlugin } from '../importers/exchange-rates/exchangeRatePlugin'

export const importPluginRegistry = [
  salesImportPlugin,
  targetImportPlugin,
  inventoryImportPlugin,
  productMasterImportPlugin,
  projectBillingImportPlugin,
  projectImportPlugin,
  exchangeRateImportPlugin,
] as const satisfies readonly DetectableImportPlugin[]