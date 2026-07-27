import type { IntelligentKpiCardProps } from './IntelligentKpiCard'

export type KpiDefinition = IntelligentKpiCardProps & { id: string }

export function defineKpiRegistry<const T extends readonly KpiDefinition[]>(definitions: T): T {
  return definitions
}
