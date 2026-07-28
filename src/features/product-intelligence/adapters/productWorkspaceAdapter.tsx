import type { ReactNode } from 'react'
import {
  BadgeDollarSign,
  BrainCircuit,
  PackageSearch,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { IntelligentKpiCardProps } from '../../../atlas/widgets/kpi'
import type { ProductWorkspaceViewModel } from '../../../core/decision/products/productWorkspaceViewModel'

const icons: Record<string, ReactNode> = {
  revenue: <TrendingUp size={19} />,
  'gross-profit': <BadgeDollarSign size={19} />,
  customers: <Users size={19} />,
  risk: <ShieldAlert size={19} />,
  recovery: <BrainCircuit size={19} />,
}

function resolveTone(
  tone: ProductWorkspaceViewModel['cards'][number]['tone'],
): IntelligentKpiCardProps['tone'] {
  if (tone === 'emerald') return 'positive'
  if (tone === 'amber') return 'attention'
  if (tone === 'rose') return 'critical'
  if (tone === 'blue') return 'intelligence'
  return 'neutral'
}

function percentTrend(
  value: number | null,
  label: string,
): IntelligentKpiCardProps['trend'] | undefined {
  if (value === null) return undefined

  const percentage = value * 100
  return {
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
    sentiment: percentage > 0 ? 'positive' : percentage < 0 ? 'negative' : 'neutral',
    value: `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`,
    label,
  }
}

function pointsTrend(
  value: number | null,
  label: string,
): IntelligentKpiCardProps['trend'] | undefined {
  if (value === null) return undefined

  const points = value * 100
  return {
    direction: points > 0 ? 'up' : points < 0 ? 'down' : 'stable',
    sentiment: points > 0 ? 'positive' : points < 0 ? 'negative' : 'neutral',
    value: `${points > 0 ? '+' : ''}${points.toFixed(1)} pts`,
    label,
  }
}

function absoluteTrend(
  value: number | null,
  label: string,
): IntelligentKpiCardProps['trend'] | undefined {
  if (value === null) return undefined

  return {
    direction: value > 0 ? 'up' : value < 0 ? 'down' : 'stable',
    sentiment: value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral',
    value: `${value > 0 ? '+' : ''}${value}`,
    label,
  }
}

export function buildProductKpis(
  workspace: ProductWorkspaceViewModel,
): readonly IntelligentKpiCardProps[] {
  const trendByCard: Record<string, IntelligentKpiCardProps['trend'] | undefined> = {
    revenue: percentTrend(workspace.comparison.revenueVariation, 'vs periodo anterior'),
    'gross-profit': pointsTrend(workspace.comparison.grossMarginVariation, 'margen vs periodo anterior'),
    customers: absoluteTrend(workspace.comparison.customerDelta, 'clientes vs periodo anterior'),
  }

  return workspace.cards.map((card) => ({
    title: card.label,
    value: card.value,
    icon: icons[card.id] ?? <PackageSearch size={19} />,
    trend: trendByCard[card.id],
    insight: card.helper,
    source: 'Product Decision Engine',
    context: `${workspace.header.brandName} · ${workspace.header.currentPeriodId}`,
    tone: resolveTone(card.tone),
  }))
}
