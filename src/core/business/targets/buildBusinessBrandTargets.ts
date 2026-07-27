import type {
  BusinessBrandTarget,
} from '../entities/brandTarget'

import type {
  BusinessBrandTargetInput,
  BusinessBrandTargetIssue,
  BusinessBrandTargetIssueCode,
} from './businessBrandTargetInput'

import {
  getBrandTargetId,
  normalizeBusinessIdentifier,
  normalizeBusinessPeriodId,
} from './brandTargetKey'

export interface BusinessBrandTargetsBuildResult {
  brandTargets:
    Map<string, BusinessBrandTarget>

  processedRows: number
  ignoredRows: number

  issues:
    BusinessBrandTargetIssue[]
}

function isFiniteNonNegative(
  value: number,
): boolean {
  return (
    Number.isFinite(value) &&
    value >= 0
  )
}

function normalizeOptionalNumber(
  value: number | null | undefined,
): number | null {
  return value ?? null
}

function addIssue(
  issues: BusinessBrandTargetIssue[],
  rowIndex: number,
  code: BusinessBrandTargetIssueCode,
  message: string,
): void {
  issues.push({
    rowIndex,
    code,
    message,
  })
}

function validateTargetValues(
  input: BusinessBrandTargetInput,
  rowIndex: number,
  issues: BusinessBrandTargetIssue[],
): {
  targetRevenue: number | null
  targetGrossProfit: number | null
  targetGrossMargin: number | null
  workingDays: number | null
} | null {
  const targetRevenue =
    normalizeOptionalNumber(
      input.targetRevenue,
    )

  const targetGrossProfit =
    normalizeOptionalNumber(
      input.targetGrossProfit,
    )

  const targetGrossMargin =
    normalizeOptionalNumber(
      input.targetGrossMargin,
    )

  const workingDays =
    normalizeOptionalNumber(
      input.workingDays,
    )

  let isValid = true

  if (
    targetRevenue !== null &&
    !isFiniteNonNegative(
      targetRevenue,
    )
  ) {
    addIssue(
      issues,
      rowIndex,
      'INVALID_TARGET_REVENUE',
      'El objetivo de venta debe ser un número finito mayor o igual a cero.',
    )

    isValid = false
  }

  if (
    targetGrossProfit !== null &&
    !isFiniteNonNegative(
      targetGrossProfit,
    )
  ) {
    addIssue(
      issues,
      rowIndex,
      'INVALID_TARGET_GROSS_PROFIT',
      'El objetivo de GP debe ser un número finito mayor o igual a cero.',
    )

    isValid = false
  }

  if (
    targetGrossMargin !== null &&
    (
      !Number.isFinite(
        targetGrossMargin,
      ) ||
      targetGrossMargin < 0 ||
      targetGrossMargin > 1
    )
  ) {
    addIssue(
      issues,
      rowIndex,
      'INVALID_TARGET_GROSS_MARGIN',
      'El objetivo de margen debe expresarse como razón decimal entre 0 y 1.',
    )

    isValid = false
  }

  if (
    workingDays !== null &&
    (
      !Number.isInteger(
        workingDays,
      ) ||
      workingDays <= 0
    )
  ) {
    addIssue(
      issues,
      rowIndex,
      'INVALID_WORKING_DAYS',
      'Los días laborales deben ser un entero mayor que cero.',
    )

    isValid = false
  }

  if (
    targetRevenue === null &&
    targetGrossProfit === null &&
    targetGrossMargin === null
  ) {
    addIssue(
      issues,
      rowIndex,
      'MISSING_TARGET_VALUE',
      'El objetivo debe incluir venta, GP o margen.',
    )

    isValid = false
  }

  if (!isValid) {
    return null
  }

  return {
    targetRevenue,
    targetGrossProfit,
    targetGrossMargin,
    workingDays,
  }
}

export function buildBusinessBrandTargets(
  inputs:
    readonly BusinessBrandTargetInput[],
): BusinessBrandTargetsBuildResult {
  const brandTargets =
    new Map<
      string,
      BusinessBrandTarget
    >()

  const issues:
    BusinessBrandTargetIssue[] = []

  let processedRows = 0
  let ignoredRows = 0

  inputs.forEach(
    (
      input,
      rowIndex,
    ) => {
      const brandId =
        normalizeBusinessIdentifier(
          input.brandId,
        )

      if (!brandId) {
        addIssue(
          issues,
          rowIndex,
          'INVALID_BRAND_ID',
          'La marca es obligatoria.',
        )

        ignoredRows += 1
        return
      }

      const periodId =
        normalizeBusinessPeriodId(
          input.periodId,
        )

      if (!periodId) {
        addIssue(
          issues,
          rowIndex,
          'INVALID_PERIOD_ID',
          'El periodo debe usar el formato YYYY-MM.',
        )

        ignoredRows += 1
        return
      }

      const targetValues =
        validateTargetValues(
          input,
          rowIndex,
          issues,
        )

      if (!targetValues) {
        ignoredRows += 1
        return
      }

      const id =
        getBrandTargetId(
          periodId,
          brandId,
        )

      if (
        brandTargets.has(id)
      ) {
        addIssue(
          issues,
          rowIndex,
          'DUPLICATE_TARGET',
          `Ya existe un objetivo para ${id}. Se conserva el primer registro válido.`,
        )

        ignoredRows += 1
        return
      }

      brandTargets.set(
        id,
        {
          id,
          brandId,
          periodId,
          ...targetValues,
        },
      )

      processedRows += 1
    },
  )

  return {
    brandTargets,
    processedRows,
    ignoredRows,
    issues,
  }
}
