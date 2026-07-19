import type { DetectableImportPlugin } from './importPlugin'

import { salesImportPlugin } from '../importers/sales/salesPlugin'

export const importPluginRegistry = [
  salesImportPlugin,
] as const satisfies readonly DetectableImportPlugin[]