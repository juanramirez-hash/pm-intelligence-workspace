import {
  useEffect,
  useState,
} from 'react'

import {
  useDataCenterStore,
} from '../store/dataCenterStore'

import {
  loadProjectBillingReconciliation,
} from '../repositories/project-billing-reconciliation/projectBillingReconciliationRepository'

import type {
  ProjectBillingReconciliationSummary,
} from '../repositories/project-billing-reconciliation/projectBillingReconciliationRepository'

export function useProjectBillingReconciliation() {
  const projectBillingLastImportedAt =
    useDataCenterStore(
      (state) =>
        state.projectBillingLastImportedAt,
    )

  const [
    report,
    setReport,
  ] = useState<
    ProjectBillingReconciliationSummary | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    const controller =
      new AbortController()

    setLoading(true)
    setError(null)

    void loadProjectBillingReconciliation(
      controller.signal,
    )
      .then(
        (result) => {
          if (
            controller.signal.aborted
          ) {
            return
          }

          setReport(result)
        },
      )
      .catch(
        (loadError) => {
          if (
            controller.signal.aborted
          ) {
            return
          }

          setReport(null)

          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar la conciliación de facturación de proyectos',
          )
        },
      )
      .finally(
        () => {
          if (
            !controller.signal.aborted
          ) {
            setLoading(false)
          }
        },
      )

    return () => {
      controller.abort()
    }
  }, [
    projectBillingLastImportedAt,
  ])

  return {
    report,
    loading,
    error,
  }
}