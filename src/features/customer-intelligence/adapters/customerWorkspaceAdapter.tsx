import type { ReactNode } from 'react'

import {
  BadgeDollarSign,
  BrainCircuit,
  PackageSearch,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'

import type {
  IntelligentKpiCardProps,
} from '../../../atlas/widgets/kpi'

import type {
  CustomerWorkspaceViewModel,
} from '../../../core/decision/customers/customerWorkspaceViewModel'

const icons: Record<string, ReactNode> = {
  revenue: <TrendingUp size={19} />,
  'gross-profit': <BadgeDollarSign size={19} />,
  risk: <ShieldAlert size={19} />,
  probability: <BrainCircuit size={19} />,
  products: <PackageSearch size={19} />,
}

function resolveTone(
  tone: CustomerWorkspaceViewModel['cards'][number]['tone'],
): IntelligentKpiCardProps['tone'] {
  if (tone === 'emerald') return 'positive'
  if (tone === 'amber') return 'attention'
  if (tone === 'rose') return 'critical'
  if (tone === 'blue') return 'intelligence'
  return 'neutral'
}

export function buildCustomerKpis(
  workspace: CustomerWorkspaceViewModel,
): readonly IntelligentKpiCardProps[] {
  return workspace.cards.map((card) => ({
    title: card.label,
    value: card.value,
    icon: icons[card.id],
    insight: card.helper,
    source: 'Customer Decision Engine',
    context: workspace.header.scopeLabel,
    tone: resolveTone(card.tone),
  }))
}
