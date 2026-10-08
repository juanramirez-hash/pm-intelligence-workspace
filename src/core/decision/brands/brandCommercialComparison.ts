import {
  countWeekdaysInclusive,
  endOfMonth,
  resolveEquivalentWorkingDayCutoff,
  toIsoDate,
} from '../../analytics/shared/dateAnalytics'

import type {
  BusinessRepository,
} from '../../business/repository'

import type {
  BrandDecisionModel,
} from './brandDecisionTypes'

export interface BrandCommercialWindow {
  year: number
  periodId: string

  dateFrom: string
  dateTo: string
  workingDays: number

  revenue: number
  grossProfit: number
  grossMargin: number | null

  quantity: number
  documents: number
  customers: number
  products: number

  rowCount: number
}

export interface BrandCommercialComparisonSet {
  current:
    BrandCommercialWindow | null

  previousYear:
    BrandCommercialWindow | null

  twoYearsBack:
    BrandCommercialWindow | null
}

export interface BrandAnnualProjection {
  year: number

  revenue: number
  grossProfit: number | null
  grossMargin: number | null

  historicalRevenueCompletionRatio:
    number

  historicalGrossProfitCompletionRatio:
    number | null

  historicalYearsUsed:
    number[]
}

export interface BrandAnnualComparison {
  projection:
    BrandAnnualProjection | null

  previousYear:
    BrandCommercialWindow | null

  twoYearsBack:
    BrandCommercialWindow | null
}

export interface BrandCommercialComparison {
  /**
   * Legacy comparison.
   *
   * Se conserva temporalmente para no romper
   * BrandWorkspaceViewModel mientras se migra
   * la UI al comparativo multi-año.
   */
  snapshots:
    BrandDecisionModel['currentSnapshot'][]

  ranges:
    Record<string, string>

  description: string

  /**
   * Nuevo modelo comercial multi-año.
   */
  currentYear: number | null

  monthly:
    BrandCommercialComparisonSet

  ytd:
    BrandCommercialComparisonSet

  annual:
    BrandAnnualComparison

  multiYearDescription:
    string
}

interface ComparableMonthCutoff {
  year: number
  periodId: string
  end: string
  dateTo: string
  workingDays: number
}

function emptyComparisonSet():
  BrandCommercialComparisonSet {
  return {
    current: null,
    previousYear: null,
    twoYearsBack: null,
  }
}

function emptyAnnualComparison():
  BrandAnnualComparison {
  return {
    projection: null,
    previousYear: null,
    twoYearsBack: null,
  }
}

function isValidPeriodId(
  value: string,
): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/
    .test(value)
}

function getPeriodEnd(
  periodId: string,
): string {
  return toIsoDate(
    endOfMonth(
      new Date(
        `${periodId}-01T00:00:00Z`,
      ),
    ),
  )
}

function buildPeriodIds(
  year: number,
  monthFrom: number,
  monthTo: number,
): string[] {
  const ids: string[] = []

  for (
    let month = monthFrom;
    month <= monthTo;
    month += 1
  ) {
    ids.push(
      `${year}-${String(month).padStart(
        2,
        '0',
      )}`,
    )
  }

  return ids
}

function summarizeWindow(
  repository: BusinessRepository,
  brandId: string,
  year: number,
  periodId: string,
  periodIds: string[],
  dateFrom: string,
  dateTo: string,
): BrandCommercialWindow {
  const total =
    repository.salesSegmentation
      .summarize({
        brandIds: [brandId],
        periodIds,
        dateFrom,
        dateTo,
      })

  return {
    year,
    periodId,

    dateFrom,
    dateTo,

    workingDays:
      countWeekdaysInclusive(
        dateFrom,
        dateTo,
      ) ?? 0,

    revenue:
      total.revenue,

    grossProfit:
      total.grossProfit,

    grossMargin:
      total.revenue !== 0
        ? total.grossProfit /
          total.revenue
        : null,

    quantity:
      total.quantity,

    documents:
      total.documents,

    customers:
      total.customerCount,

    products:
      total.productCount,

    rowCount:
      total.rowCount,
  }
}

function averagePositive(
  values: number[],
): number | null {
  const valid =
    values.filter(
      (value) =>
        Number.isFinite(value) &&
        value > 0,
    )

  if (valid.length === 0) {
    return null
  }

  return (
    valid.reduce(
      (total, value) =>
        total + value,
      0,
    ) /
    valid.length
  )
}

function resolveComparableMonthCutoffs(
  currentPeriodId: string,
  currentTo: string,
  years: number[],
  closed: boolean,
): ComparableMonthCutoff[] | null {
  const month =
    currentPeriodId.slice(5, 7)

  const preliminary:
    ComparableMonthCutoff[] = []

  for (const year of years) {
    const periodId =
      `${year}-${month}`

    const end =
      getPeriodEnd(periodId)

    let dateTo: string

    if (
      year === Number(
        currentPeriodId.slice(
          0,
          4,
        ),
      )
    ) {
      dateTo =
        closed
          ? end
          : currentTo
    } else if (closed) {
      dateTo = end
    } else {
      const equivalent =
        resolveEquivalentWorkingDayCutoff(
          currentPeriodId,
          currentTo,
          periodId,
          end,
        )

      if (!equivalent) {
        return null
      }

      dateTo =
        equivalent
    }

    preliminary.push({
      year,
      periodId,
      end,
      dateTo,

      workingDays:
        countWeekdaysInclusive(
          `${periodId}-01`,
          dateTo,
        ) ?? 0,
    })
  }

  /**
   * Mes cerrado:
   * se comparan los meses completos.
   *
   * No se fuerza el mismo número de días
   * laborables porque el segmento temporal
   * ya es exactamente el mismo mes completo.
   */
  if (closed) {
    return preliminary
  }

  const valid =
    preliminary.filter(
      (item) =>
        item.workingDays > 0,
    )

  if (
    valid.length !==
    preliminary.length
  ) {
    return null
  }

  /**
   * En un mes parcial puede suceder que el
   * mismo mes de otro año tenga un día hábil
   * menos disponible.
   *
   * Tomamos como referencia la ventana más
   * corta y ajustamos las demás al mismo
   * número de días laborables.
   */
  const reference =
    valid.reduce(
      (shortest, candidate) =>
        candidate.workingDays <
        shortest.workingDays
          ? candidate
          : shortest,
    )

  const adjusted:
    ComparableMonthCutoff[] = []

  for (
    const item of preliminary
  ) {
    if (
      item.workingDays ===
      reference.workingDays
    ) {
      adjusted.push(item)
      continue
    }

    const dateTo =
      resolveEquivalentWorkingDayCutoff(
        reference.periodId,
        reference.dateTo,
        item.periodId,
        item.end,
      )

    if (!dateTo) {
      return null
    }

    adjusted.push({
      ...item,
      dateTo,

      workingDays:
        countWeekdaysInclusive(
          `${item.periodId}-01`,
          dateTo,
        ) ?? 0,
    })
  }

  return adjusted
}

function buildLegacyComparison(
  repository: BusinessRepository,
  decision: BrandDecisionModel,
): {
  snapshots:
    BrandDecisionModel['currentSnapshot'][]

  ranges:
    Record<string, string>

  description: string
} {
  const unavailable = (
    description: string,
  ) => ({
    snapshots: [],
    ranges: {},
    description,
  })

  const currentId =
    decision.currentPeriodId

  const previousId =
    decision.previousPeriodId

  const cutoff =
    repository
      .getDataPeriodEnd()
      ?.slice(0, 10)

  if (
    !cutoff ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      cutoff,
    ) ||
    !isValidPeriodId(
      currentId,
    ) ||
    !isValidPeriodId(
      previousId,
    )
  ) {
    return unavailable(
      'No hay un corte de datos válido para comparar.',
    )
  }

  const currentStart =
    `${currentId}-01`

  const previousStart =
    `${previousId}-01`

  const currentEnd =
    getPeriodEnd(currentId)

  const previousEnd =
    getPeriodEnd(previousId)

  if (
    cutoff <
    currentStart
  ) {
    return unavailable(
      'El periodo seleccionado todavía no tiene corte de datos.',
    )
  }

  const closed =
    cutoff >= currentEnd

  let currentTo =
    closed
      ? currentEnd
      : cutoff

  let previousTo =
    previousEnd

  if (!closed) {
    const equivalent =
      resolveEquivalentWorkingDayCutoff(
        currentId,
        currentTo,
        previousId,
        previousEnd,
      )

    if (!equivalent) {
      return unavailable(
        'Aún no hay días laborables para establecer un corte equivalente.',
      )
    }

    previousTo =
      equivalent

    const currentDays =
      countWeekdaysInclusive(
        currentStart,
        currentTo,
      ) ?? 0

    const previousDays =
      countWeekdaysInclusive(
        previousStart,
        previousTo,
      ) ?? 0

    if (
      previousDays <
      currentDays
    ) {
      const adjusted =
        resolveEquivalentWorkingDayCutoff(
          previousId,
          previousTo,
          currentId,
          currentEnd,
        )

      if (!adjusted) {
        return unavailable(
          'No se pudo establecer un corte equivalente.',
        )
      }

      currentTo =
        adjusted
    }
  }

  const snapshots:
    BrandCommercialComparison['snapshots'] =
      []

  const ranges:
    Record<string, string> =
      {}

  for (
    const [
      snapshot,
      dateTo,
    ] of [
      [
        decision.previousSnapshot,
        previousTo,
      ],
      [
        decision.currentSnapshot,
        currentTo,
      ],
    ] as const
  ) {
    if (!snapshot) {
      continue
    }

    const dateFrom =
      `${snapshot.periodId}-01`

    const total =
      repository.salesSegmentation
        .summarize({
          brandIds: [
            decision.brandId,
          ],

          periodIds: [
            snapshot.periodId,
          ],

          dateFrom,
          dateTo,
        })

    const monthly =
      repository.salesSegmentation
        .summarize({
          brandIds: [
            decision.brandId,
          ],

          periodIds: [
            snapshot.periodId,
          ],
        })

    if (
      monthly.rowCount === 0 &&
      (
        snapshot.actuals
          .revenue !== 0 ||
        snapshot.actuals
          .customers > 0
      )
    ) {
      return unavailable(
        'Falta detalle de ventas por fecha para comparar esta marca al mismo corte.',
      )
    }

    snapshots.push({
      ...snapshot,

      actuals: {
        ...snapshot.actuals,

        revenue:
          total.revenue,

        grossProfit:
          total.grossProfit,

        grossMargin:
          total.revenue !== 0
            ? total.grossProfit /
              total.revenue
            : null,

        quantity:
          total.quantity,

        documents:
          total.documents,

        customers:
          total.customerCount,

        products:
          total.productCount,
      },
    })

    ranges[
      snapshot.periodId
    ] =
      `${dateFrom} al ${dateTo} · ${countWeekdaysInclusive(
        dateFrom,
        dateTo,
      ) ?? 0} días laborables`
  }

  return {
    snapshots,
    ranges,

    description:
      (
        closed
          ? 'Mes cerrado contra mes anterior completo.'
          : 'Mismo número de días laborables (lunes a viernes, sin ajuste por feriados). Ventas incluidas dentro de las fechas indicadas.'
      ) +
      (
        decision.previousSnapshot
          ? ''
          : ' Sin datos del periodo anterior; variación no disponible.'
      ),
  }
}

export function buildBrandCommercialComparison(
  repository: BusinessRepository,
  decision: BrandDecisionModel,
): BrandCommercialComparison {
  const legacy =
    buildLegacyComparison(
      repository,
      decision,
    )

  const emptyResult:
    BrandCommercialComparison = {
      ...legacy,

      currentYear: null,

      monthly:
        emptyComparisonSet(),

      ytd:
        emptyComparisonSet(),

      annual:
        emptyAnnualComparison(),

      multiYearDescription:
        'No hay información suficiente para construir el comparativo multi-año.',
    }

  const currentId =
    decision.currentPeriodId

  const cutoff =
    repository
      .getDataPeriodEnd()
      ?.slice(0, 10)

  if (
    !cutoff ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      cutoff,
    ) ||
    !isValidPeriodId(
      currentId,
    )
  ) {
    return emptyResult
  }

  const currentYear =
    Number(
      currentId.slice(
        0,
        4,
      ),
    )

  const currentMonth =
    Number(
      currentId.slice(
        5,
        7,
      ),
    )

  if (
    !Number.isInteger(
      currentYear,
    ) ||
    currentMonth < 1 ||
    currentMonth > 12
  ) {
    return emptyResult
  }

  const currentStart =
    `${currentId}-01`

  const currentEnd =
    getPeriodEnd(
      currentId,
    )

  if (
    cutoff <
    currentStart
  ) {
    return {
      ...emptyResult,
      currentYear,

      multiYearDescription:
        'El periodo seleccionado todavía no tiene corte de datos.',
    }
  }

  const closed =
    cutoff >= currentEnd

  const currentTo =
    closed
      ? currentEnd
      : cutoff

  const years = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
  ]

  const cutoffs =
    resolveComparableMonthCutoffs(
      currentId,
      currentTo,
      years,
      closed,
    )

  if (!cutoffs) {
    return {
      ...emptyResult,
      currentYear,

      multiYearDescription:
        'No se pudo establecer un corte laboral equivalente para los tres años.',
    }
  }

  const monthlyWindows =
    new Map<
      number,
      BrandCommercialWindow
    >()

  const ytdWindows =
    new Map<
      number,
      BrandCommercialWindow
    >()

  for (
    const comparable
    of cutoffs
  ) {
    const monthFrom =
      `${comparable.periodId}-01`

    const monthly =
      summarizeWindow(
        repository,
        decision.brandId,
        comparable.year,
        comparable.periodId,
        [
          comparable.periodId,
        ],
        monthFrom,
        comparable.dateTo,
      )

    monthlyWindows.set(
      comparable.year,
      monthly,
    )

    const ytdFrom =
      `${comparable.year}-01-01`

    const ytd =
      summarizeWindow(
        repository,
        decision.brandId,
        comparable.year,
        `${comparable.year}-YTD`,
        buildPeriodIds(
          comparable.year,
          1,
          currentMonth,
        ),
        ytdFrom,
        comparable.dateTo,
      )

    ytdWindows.set(
      comparable.year,
      ytd,
    )
  }

  const currentMonthly =
    monthlyWindows.get(
      currentYear,
    ) ?? null

  const currentYtd =
    ytdWindows.get(
      currentYear,
    ) ?? null

  /**
   * Si el Decision Engine conoce venta del
   * periodo actual pero Sales Segmentation
   * no contiene el detalle fechado, no
   * publicamos un comparativo parcial
   * fabricado.
   */
  if (
    currentMonthly &&
    currentMonthly.rowCount === 0 &&
    (
      decision.currentSnapshot
        .actuals.revenue !== 0 ||
      decision.currentSnapshot
        .actuals.customers > 0
    )
  ) {
    return {
      ...emptyResult,
      currentYear,

      multiYearDescription:
        'Falta detalle de ventas por fecha para comparar esta marca al mismo corte.',
    }
  }

  const previousYear =
    currentYear - 1

  const twoYearsBack =
    currentYear - 2

  const annualActuals =
    new Map<
      number,
      BrandCommercialWindow
    >()

  for (
    const year of [
      previousYear,
      twoYearsBack,
    ]
  ) {
    const annual =
      summarizeWindow(
        repository,
        decision.brandId,
        year,
        `${year}-FY`,
        buildPeriodIds(
          year,
          1,
          12,
        ),
        `${year}-01-01`,
        `${year}-12-31`,
      )

    if (
      annual.rowCount > 0
    ) {
      annualActuals.set(
        year,
        annual,
      )
    }
  }

  const previousYtd =
    ytdWindows.get(
      previousYear,
    ) ?? null

  const twoYearsBackYtd =
    ytdWindows.get(
      twoYearsBack,
    ) ?? null

  const previousAnnual =
    annualActuals.get(
      previousYear,
    ) ?? null

  const twoYearsBackAnnual =
    annualActuals.get(
      twoYearsBack,
    ) ?? null

  const revenueRatios:
    {
      year: number
      value: number
    }[] = []

  const grossProfitRatios:
    {
      year: number
      value: number
    }[] = []

  for (
    const [
      year,
      ytd,
      annual,
    ] of [
      [
        previousYear,
        previousYtd,
        previousAnnual,
      ],
      [
        twoYearsBack,
        twoYearsBackYtd,
        twoYearsBackAnnual,
      ],
    ] as const
  ) {
    if (
      ytd &&
      annual &&
      annual.revenue !== 0
    ) {
      const ratio =
        ytd.revenue /
        annual.revenue

      if (
        Number.isFinite(
          ratio,
        ) &&
        ratio > 0
      ) {
        revenueRatios.push({
          year,
          value: ratio,
        })
      }
    }

    if (
      ytd &&
      annual &&
      annual.grossProfit !==
        0
    ) {
      const ratio =
        ytd.grossProfit /
        annual.grossProfit

      if (
        Number.isFinite(
          ratio,
        ) &&
        ratio > 0
      ) {
        grossProfitRatios.push({
          year,
          value: ratio,
        })
      }
    }
  }

  const historicalRevenueCompletionRatio =
    averagePositive(
      revenueRatios.map(
        (item) =>
          item.value,
      ),
    )

  const historicalGrossProfitCompletionRatio =
    averagePositive(
      grossProfitRatios.map(
        (item) =>
          item.value,
      ),
    )

  let projection:
    BrandAnnualProjection | null =
      null

  if (
    currentYtd &&
    historicalRevenueCompletionRatio
  ) {
    const projectedRevenue =
      currentYtd.revenue /
      historicalRevenueCompletionRatio

    const projectedGrossProfit =
      historicalGrossProfitCompletionRatio
        ? currentYtd.grossProfit /
          historicalGrossProfitCompletionRatio
        : null

    projection = {
      year:
        currentYear,

      revenue:
        projectedRevenue,

      grossProfit:
        projectedGrossProfit,

      grossMargin:
        projectedGrossProfit !== null &&
        projectedRevenue !== 0
          ? projectedGrossProfit /
            projectedRevenue
          : null,

      historicalRevenueCompletionRatio,

      historicalGrossProfitCompletionRatio,

      historicalYearsUsed:
        revenueRatios.map(
          (item) =>
            item.year,
        ),
    }
  }

  const historicalWindowOrNull = (
    window:
      BrandCommercialWindow |
      undefined,
  ): BrandCommercialWindow | null =>
    window &&
    window.rowCount > 0
      ? window
      : null

  return {
    ...legacy,

    currentYear,

       monthly: {
      current:
        currentMonthly,

      previousYear:
        historicalWindowOrNull(
          monthlyWindows.get(
            previousYear,
          ),
        ),

      twoYearsBack:
        historicalWindowOrNull(
          monthlyWindows.get(
            twoYearsBack,
          ),
        ),
    },

    ytd: {
      current:
        currentYtd,

      previousYear:
        historicalWindowOrNull(
          ytdWindows.get(
            previousYear,
          ),
        ),

      twoYearsBack:
        historicalWindowOrNull(
          ytdWindows.get(
            twoYearsBack,
          ),
        ),
    },

     annual: {
      projection,

      previousYear:
        previousAnnual,

      twoYearsBack:
        twoYearsBackAnnual,
    },

    multiYearDescription:
      closed
        ? `Mes cerrado. Comparativo del mismo mes en ${currentYear}, ${previousYear} y ${twoYearsBack}; YTD al cierre del mes y proyección anual basada en la estacionalidad histórica disponible.`
        : `Mismo segmento del año: igual número de días laborables del mes actual (lunes a viernes, sin ajuste por feriados) para ${currentYear}, ${previousYear} y ${twoYearsBack}. YTD conserva los mismos meses completos más ese corte equivalente.`,
  }
}