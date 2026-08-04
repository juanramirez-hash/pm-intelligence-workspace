import {
  useMemo,
  useState,
} from 'react'

import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'

import {
  ExecutiveAnalysisPeriod,
} from './components/ExecutiveAnalysisPeriod'

import {
  ExecutiveAttentionCenter,
} from './components/ExecutiveAttentionCenter'

import {
  ExecutiveBrandOverview,
} from './components/ExecutiveBrandOverview'

import {
  ExecutiveCommercialTrends,
} from './components/ExecutiveCommercialTrends'

import {
  ExecutiveDataHealthSummary,
} from './components/ExecutiveDataHealthSummary'

import {
  ExecutiveDomainReadinessPanel,
} from './components/ExecutiveDomainReadinessPanel'

import {
  ExecutiveSalesPerformance,
} from './components/ExecutiveSalesPerformance'

import {
  buildExecutivePeriodView,
} from './engine/executivePeriodView'

import {
  useExecutiveWorkspace,
} from './hooks/useExecutiveWorkspace'

import type {
  ExecutivePeriodPreset,
} from './types/executiveWorkspaceTypes'

function getImportStatusLabel(
  importStatus: string,
): string {
  switch (importStatus) {
    case 'completed':
      return 'Sistema listo para análisis'

    case 'processing':
      return 'Procesando información'

    case 'validating':
      return 'Validando información'

    case 'error':
      return 'Requiere atención'

    default:
      return 'Esperando información'
  }
}

export function ExecutiveWorkspacePage() {
  const executive =
    useExecutiveWorkspace()

  const [periodPreset, setPeriodPreset] =
    useState<ExecutivePeriodPreset>(
      'month',
    )

  const [anchorPeriodId, setAnchorPeriodId] =
    useState<string | null>(null)

  const periodView =
    useMemo(
      () =>
        buildExecutivePeriodView(
          executive.repository,
          {
            anchorPeriodId,
            preset: periodPreset,
          },
        ),
      [
        executive.repository,
        anchorPeriodId,
        periodPreset,
      ],
    )

  const {
    systemReady,
    importStatus,
  } = executive.health

  const handlePresetChange =
    (preset: ExecutivePeriodPreset) => {
      setPeriodPreset(preset)
    }

  const handlePreviousPeriod = () => {
    setAnchorPeriodId(
      periodView.selection
        .previousAnchorPeriodId,
    )
  }

  const handleNextPeriod = () => {
    setAnchorPeriodId(
      periodView.selection
        .nextAnchorPeriodId,
    )
  }

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <TrendingUp size={14} />

            Inteligencia ejecutiva
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Executive Workspace
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Antesala operativa para revisar desempeño, tendencias, prioridades y abrir cada Workspace de análisis.
          </p>
        </div>

        <div
          className={[
            'inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm',
            systemReady
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700',
          ].join(' ')}
        >
          {systemReady ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertTriangle size={17} />
          )}

          {getImportStatusLabel(
            importStatus,
          )}
        </div>
      </section>

      <ExecutiveSalesPerformance
        performance={
          periodView.salesPerformance
        }
        periodBadge={
          periodView.selection.presetLabel
        }
      />

      <ExecutiveAnalysisPeriod
        lastImportedAt={
          executive.health.lastImportedAt
        }
        onNextPeriod={handleNextPeriod}
        onPresetChange={
          handlePresetChange
        }
        onPreviousPeriod={
          handlePreviousPeriod
        }
        selection={periodView.selection}
      />

      <ExecutiveAttentionCenter
        attention={periodView.attention}
        selection={periodView.selection}
      />

      <ExecutiveCommercialTrends
        selectionLabel={
          periodView.selection.currentLabel
        }
        trends={
          periodView.commercialTrends
        }
      />

      <ExecutiveBrandOverview
        brands={periodView.brands}
        comparisonPeriodLabel={
          periodView.selection.comparisonLabel
        }
        currentPeriodLabel={
          periodView.selection.currentLabel
        }
      />

      {executive.domains && (
        <ExecutiveDomainReadinessPanel
          domains={executive.domains}
          health={executive.health}
        />
      )}

      <ExecutiveDataHealthSummary
        health={executive.health}
      />
    </div>
  )
}
