import type {
  OpportunityPriority,
} from '../../../core/business/opportunityRadar'

import {
  opportunityPriorityClasses,
  opportunityPriorityLabel,
} from './opportunityPresentation'

interface PriorityBadgeProps {
  priority: OpportunityPriority
}

export function PriorityBadge({
  priority,
}: PriorityBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        opportunityPriorityClasses[priority],
      ].join(' ')}
      data-atlas-component="opportunity-priority-badge"
    >
      Prioridad {opportunityPriorityLabel[priority]}
    </span>
  )
}
