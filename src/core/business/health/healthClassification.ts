export type BusinessHealthGrade =
  | 'excellent'
  | 'very-healthy'
  | 'healthy'
  | 'attention'
  | 'risk'
  | 'critical'
  | 'not-evaluable'

export interface BusinessHealthClassification {
  grade: BusinessHealthGrade
  label: string
}

export function classifyBusinessHealthScore(
  score: number | null,
): BusinessHealthClassification {
  if (score === null || !Number.isFinite(score)) {
    return {
      grade: 'not-evaluable',
      label: 'No evaluable',
    }
  }

  if (score >= 95) {
    return {
      grade: 'excellent',
      label: 'Excelente',
    }
  }

  if (score >= 85) {
    return {
      grade: 'very-healthy',
      label: 'Muy saludable',
    }
  }

  if (score >= 70) {
    return {
      grade: 'healthy',
      label: 'Saludable',
    }
  }

  if (score >= 55) {
    return {
      grade: 'attention',
      label: 'Atención',
    }
  }

  if (score >= 40) {
    return {
      grade: 'risk',
      label: 'Riesgo',
    }
  }

  return {
    grade: 'critical',
    label: 'Crítico',
  }
}
