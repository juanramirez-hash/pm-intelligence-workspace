export const targetColumnAliases = {
  brandId: [
    'Marca',
    'Brand',
    'Brand ID',
    'Nombre de marca',
  ],
  periodId: [
    'Periodo',
    'Period',
    'Mes',
    'Month',
    'Periodo ID',
  ],
  targetRevenue: [
    'Objetivo Venta',
    'Cuota Venta',
    'Venta Objetivo',
    'Target Revenue',
    'Sales Target',
  ],
  targetGrossProfit: [
    'Objetivo GP',
    'Cuota GP',
    'GP Objetivo',
    'Target Gross Profit',
    'Gross Profit Target',
  ],
  targetGrossMargin: [
    'Margen Objetivo',
    'Objetivo Margen',
    'Target Gross Margin',
    'Gross Margin Target',
  ],
  workingDays: [
    'Dias Laborables',
    'Días Laborables',
    'Dias Habiles',
    'Días Hábiles',
    'Working Days',
  ],
} as const

export type TargetField =
  keyof typeof targetColumnAliases
