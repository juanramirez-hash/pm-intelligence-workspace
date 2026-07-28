import type { DetectableImportPlugin } from './importPlugin'

import { salesImportPlugin } from '../importers/sales/salesPlugin'
import { targetImportPlugin } from '../importers/targets/targetPlugin'
import { productMasterImportPlugin } from '../importers/products/productMasterPlugin'

export const importPluginRegistry = [
  salesImportPlugin,
  targetImportPlugin,
  productMasterImportPlugin,
] as const satisfies readonly DetectableImportPlugin[]