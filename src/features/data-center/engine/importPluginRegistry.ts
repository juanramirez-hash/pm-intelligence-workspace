import type { DetectableImportPlugin } from './importPlugin'

import { salesImportPlugin } from '../importers/sales/salesPlugin'
import { targetImportPlugin } from '../importers/targets/targetPlugin'

export const importPluginRegistry = [
  salesImportPlugin,
  targetImportPlugin,
] as const satisfies readonly DetectableImportPlugin[]