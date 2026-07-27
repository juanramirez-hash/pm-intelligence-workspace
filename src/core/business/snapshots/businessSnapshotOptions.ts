export interface BusinessSnapshotOptions {
  /**
   * Number of elapsed working days in the requested period.
   *
   * It remains explicit to keep snapshot generation deterministic and free of
   * device-clock or calendar assumptions.
   */
  elapsedWorkingDays?: number
}
