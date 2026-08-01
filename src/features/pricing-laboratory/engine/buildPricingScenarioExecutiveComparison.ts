import type {
  PriceEngineeringGuardrail,
  PriceEngineeringSignal,
} from '../../../core/business/pricing'

import {
  PRICING_SCENARIO_EXECUTIVE_COMPARISON_METHODOLOGY,
} from '../types/pricingScenarioExecutiveComparisonTypes'

import type {
  PricingScenarioExecutiveComparisonGuardrailSummary,
  PricingScenarioExecutiveComparisonIssue,
  PricingScenarioExecutiveComparisonModel,
  PricingScenarioExecutiveComparisonRow,
  PricingScenarioExecutiveComparisonSignalSummary,
} from '../types/pricingScenarioExecutiveComparisonTypes'

import type {
  PricingLaboratoryWorkspaceModel,
  PricingLaboratoryWorkspaceScenarioRow,
  PricingLaboratoryWorkspaceSourcePrice,
} from '../types/pricingLaboratoryWorkspaceTypes'

const EXECUTIVE_DISCLAIMER =
  'SIMULACIÓN SIN EFECTO COMERCIAL. Este documento no modifica, aprueba, recomienda ni publica precios.'

function normalizeScenarioKey(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function uniqueScenarioKeys(
  values: readonly string[],
): string[] {
  const keys: string[] = []
  const seen = new Set<string>()

  values.forEach((value) => {
    const key = normalizeScenarioKey(value)

    if (!key || seen.has(key)) {
      return
    }

    seen.add(key)
    keys.push(key)
  })

  return keys
}

function cloneGuardrail(
  guardrail: Readonly<PriceEngineeringGuardrail>,
): PriceEngineeringGuardrail {
  return {
    ...guardrail,
  }
}

function cloneSignal(
  signal: Readonly<PriceEngineeringSignal>,
): PriceEngineeringSignal {
  return {
    ...signal,
  }
}

function cloneSource(
  source: PricingLaboratoryWorkspaceSourcePrice,
): PricingLaboratoryWorkspaceSourcePrice {
  return {
    ...source,
    metrics: {
      ...source.metrics,
    },
  }
}

function summarizeGuardrails(
  guardrails: readonly PriceEngineeringGuardrail[],
): PricingScenarioExecutiveComparisonGuardrailSummary {
  return guardrails.reduce<PricingScenarioExecutiveComparisonGuardrailSummary>(
    (summary, guardrail) => ({
      total: summary.total + 1,
      warning: summary.warning + (guardrail.severity === 'warning' ? 1 : 0),
      blocking: summary.blocking + (guardrail.severity === 'blocking' ? 1 : 0),
    }),
    {
      total: 0,
      warning: 0,
      blocking: 0,
    },
  )
}

function summarizeSignals(
  signals: readonly PriceEngineeringSignal[],
): PricingScenarioExecutiveComparisonSignalSummary {
  return signals.reduce<PricingScenarioExecutiveComparisonSignalSummary>(
    (summary, signal) => ({
      total: summary.total + 1,
      info: summary.info + (signal.severity === 'info' ? 1 : 0),
      warning: summary.warning + (signal.severity === 'warning' ? 1 : 0),
      blocking: summary.blocking + (signal.severity === 'blocking' ? 1 : 0),
      invalid: summary.invalid + (signal.severity === 'invalid' ? 1 : 0),
    }),
    {
      total: 0,
      info: 0,
      warning: 0,
      blocking: 0,
      invalid: 0,
    },
  )
}

function isCalculableScenario(
  row: PricingLaboratoryWorkspaceScenarioRow,
): row is PricingLaboratoryWorkspaceScenarioRow & {
  evaluationStatus: NonNullable<PricingLaboratoryWorkspaceScenarioRow['evaluationStatus']>
  basis: NonNullable<PricingLaboratoryWorkspaceScenarioRow['basis']>
  metrics: NonNullable<PricingLaboratoryWorkspaceScenarioRow['metrics']>
  delta: NonNullable<PricingLaboratoryWorkspaceScenarioRow['delta']>
} {
  return row.orchestrationStatus === 'evaluated' &&
    row.evaluationStatus !== null &&
    row.basis !== null &&
    row.metrics !== null &&
    row.delta !== null
}

function createComparisonRow(
  row: PricingLaboratoryWorkspaceScenarioRow & {
    evaluationStatus: NonNullable<PricingLaboratoryWorkspaceScenarioRow['evaluationStatus']>
    basis: NonNullable<PricingLaboratoryWorkspaceScenarioRow['basis']>
    metrics: NonNullable<PricingLaboratoryWorkspaceScenarioRow['metrics']>
    delta: NonNullable<PricingLaboratoryWorkspaceScenarioRow['delta']>
  },
  order: number,
): PricingScenarioExecutiveComparisonRow {
  const guardrails = row.resolvedGuardrails.map(cloneGuardrail)
  const signals = row.signals.map(cloneSignal)

  return {
    key: row.key,
    order,
    origin: row.origin,
    configurationId: row.configurationId,
    name: row.name,
    pricingGroupId: row.pricingGroupId,
    evaluationStatus: row.evaluationStatus,
    basis: {
      ...row.basis,
    },
    metrics: {
      ...row.metrics,
    },
    delta: {
      ...row.delta,
    },
    guardrails,
    guardrailSummary: summarizeGuardrails(guardrails),
    signals,
    signalSummary: summarizeSignals(signals),
    templateIssues: row.issues.map((issue) => ({
      ...issue,
    })),
    explainability: [...row.explainability],
    sourceReference: row.sourceReference,
    notes: row.notes,
  }
}

function createUnavailableModel(
  workspace: PricingLaboratoryWorkspaceModel,
  requestedScenarioKeys: string[],
): PricingScenarioExecutiveComparisonModel {
  return {
    available: false,
    status: 'unavailable',
    generatedAt: workspace.generatedAt,
    methodology: PRICING_SCENARIO_EXECUTIVE_COMPARISON_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      ...workspace.isolation,
    },
    disclaimer: EXECUTIVE_DISCLAIMER,
    source: null,
    requestedScenarioKeys,
    rows: [],
    summary: {
      requestedRows: requestedScenarioKeys.length,
      selectedRows: 0,
      validRows: 0,
      warningRows: 0,
      blockedRows: 0,
      invalidSelections: requestedScenarioKeys.length,
      rowsWithGuardrails: 0,
      rowsWithSignals: 0,
    },
    issues: [{
      code: 'EXECUTIVE_COMPARISON_SOURCE_UNAVAILABLE',
      severity: 'invalid',
      scenarioKey: null,
      message: 'Selecciona un producto y una moneda con precio vigente antes de preparar la comparación ejecutiva.',
    }],
    workspaceIssues: workspace.issues.map((issue) => ({
      ...issue,
    })),
    limitations: [...workspace.limitations],
  }
}

export function buildPricingScenarioExecutiveComparison(
  workspace: PricingLaboratoryWorkspaceModel,
  selectedScenarioKeys: readonly string[],
): PricingScenarioExecutiveComparisonModel {
  const requestedScenarioKeys = uniqueScenarioKeys(selectedScenarioKeys)

  if (!workspace.source) {
    return createUnavailableModel(
      workspace,
      requestedScenarioKeys,
    )
  }

  const requestedSet = new Set(requestedScenarioKeys)
  const workspaceRowsByKey = new Map(
    workspace.scenarios.map((row) => [normalizeScenarioKey(row.key), row]),
  )
  const issues: PricingScenarioExecutiveComparisonIssue[] = []

  requestedScenarioKeys.forEach((key) => {
    const row = workspaceRowsByKey.get(key)

    if (!row) {
      issues.push({
        code: 'EXECUTIVE_COMPARISON_SCENARIO_NOT_FOUND',
        severity: 'warning',
        scenarioKey: key,
        message: `El escenario ${key} ya no está disponible en la sesión actual.`,
      })
      return
    }

    if (!isCalculableScenario(row)) {
      issues.push({
        code: 'EXECUTIVE_COMPARISON_SCENARIO_NOT_CALCULABLE',
        severity: 'warning',
        scenarioKey: key,
        message: `El escenario ${row.name} no contiene métricas completas y no puede incluirse en la comparación ejecutiva.`,
      })
    }
  })

  const rows = workspace.scenarios
    .filter((row) => requestedSet.has(normalizeScenarioKey(row.key)))
    .filter(isCalculableScenario)
    .map((row, index) => createComparisonRow(row, index + 1))

  if (requestedScenarioKeys.length === 0) {
    issues.push({
      code: 'EXECUTIVE_COMPARISON_SELECTION_EMPTY',
      severity: 'info',
      scenarioKey: null,
      message: 'Selecciona al menos un escenario calculable para generar la salida ejecutiva.',
    })
  }

  const summary = {
    requestedRows: requestedScenarioKeys.length,
    selectedRows: rows.length,
    validRows: rows.filter((row) => row.evaluationStatus === 'valid').length,
    warningRows: rows.filter((row) => row.evaluationStatus === 'warning').length,
    blockedRows: rows.filter((row) => row.evaluationStatus === 'blocked').length,
    invalidSelections: issues.filter((issue) => (
      issue.code === 'EXECUTIVE_COMPARISON_SCENARIO_NOT_FOUND' ||
      issue.code === 'EXECUTIVE_COMPARISON_SCENARIO_NOT_CALCULABLE'
    )).length,
    rowsWithGuardrails: rows.filter((row) => row.guardrailSummary.total > 0).length,
    rowsWithSignals: rows.filter((row) => row.signalSummary.total > 0).length,
  }

  return {
    available: rows.length > 0,
    status: rows.length === 0
      ? requestedScenarioKeys.length === 0
        ? 'empty'
        : 'partial'
      : issues.some((issue) => issue.severity !== 'info')
        ? 'partial'
        : 'ready',
    generatedAt: workspace.generatedAt,
    methodology: PRICING_SCENARIO_EXECUTIVE_COMPARISON_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      ...workspace.isolation,
    },
    disclaimer: EXECUTIVE_DISCLAIMER,
    source: cloneSource(workspace.source),
    requestedScenarioKeys,
    rows,
    summary,
    issues,
    workspaceIssues: workspace.issues.map((issue) => ({
      ...issue,
    })),
    limitations: [...workspace.limitations],
  }
}
