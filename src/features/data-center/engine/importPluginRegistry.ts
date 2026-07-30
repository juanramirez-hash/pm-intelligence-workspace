import type { DetectableImportPlugin } from './importPlugin'

import { salesImportPlugin } from '../importers/sales/salesPlugin'
import { targetImportPlugin } from '../importers/targets/targetPlugin'
import { productMasterImportPlugin } from '../importers/products/productMasterPlugin'
import { inventoryImportPlugin } from '../importers/inventory/inventoryPlugin'

export const importPluginRegistry = [
  salesImportPlugin,
  targetImportPlugin,
  inventoryImportPlugin,
  productMasterImportPlugin,
] as const satisfies readonly DetectableImportPlugin[]