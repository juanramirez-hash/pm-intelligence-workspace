import { Router } from 'express'
import {
  importSalesDataset,
} from '../services/salesImportService.js'
import {
  appendSalesChunk,
  cancelSalesChunkImport,
  finalizeSalesChunkImport,
  startSalesChunkImport,
} from '../services/salesChunkImportService.js'

export function createSalesRouter(
  pool,
) {
  const router = Router()

  router.post(
    '/import',
    async (req, res) => {
      try {
        const {
          rows,
          fileName,
          ignoredRows = 0,
          checksumSha256 = null,
        } = req.body ?? {}

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales rows must be an array',
            })
        }

        if (
          typeof fileName !== 'string' ||
          fileName.trim() === ''
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales fileName is required',
            })
        }

        const userId =
          req.session?.user?.id

        if (
          userId === null ||
          userId === undefined
        ) {
          return res
            .status(401)
            .json({
              ok: false,
              error:
                'Authentication required',
            })
        }

        const result =
          await importSalesDataset(
            pool,
            {
              rows,
              fileName:
                fileName.trim(),
              uploadedByUserId:
                userId,
              ignoredRows,
              checksumSha256,
            },
          )

        return res.json({
          ok: true,
          dataset: 'sales',
          ...result,
        })
      } catch (error) {
        console.error(
          'Sales import failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Sales import failed',
          })
      }
    },
  )

  router.post(
    '/imports/start',
    async (req, res) => {
      try {
        const {
          fileName,
          sourceRowCount,
          importScope = 'partial',
          checksumSha256 = null,
        } = req.body ?? {}

        if (
          importScope !== 'full-periods' &&
          importScope !== 'partial'
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales importScope must be full-periods or partial',
            })
        }

        if (
          typeof fileName !== 'string' ||
          fileName.trim() === ''
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales fileName is required',
            })
        }

        if (
          !Number.isInteger(sourceRowCount) ||
          sourceRowCount < 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales sourceRowCount must be a non-negative integer',
            })
        }

        const userId =
          req.session?.user?.id

        if (
          userId === null ||
          userId === undefined
        ) {
          return res
            .status(401)
            .json({
              ok: false,
              error:
                'Authentication required',
            })
        }

        const importRecord =
          await startSalesChunkImport(
            pool,
            {
              fileName:
                fileName.trim(),
              uploadedByUserId:
                userId,
              sourceRowCount,
              importScope,
              checksumSha256,
            },
          )

        return res.json({
          ok: true,
          import: importRecord,
        })
      } catch (error) {
        console.error(
          'Sales chunk import start failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Sales chunk import start failed',
          })
      }
    },
  )

  router.post(
    '/imports/:importId/chunks',
    async (req, res) => {
      try {
        const importId =
          Number(
            req.params.importId,
          )

        const {
          chunkIndex,
          rows,
          checksumSha256 = null,
          sourceRowOffset = 0,
        } = req.body ?? {}

        if (
          !Number.isInteger(importId) ||
          importId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales importId is invalid',
            })
        }

        if (
          !Number.isInteger(chunkIndex) ||
          chunkIndex < 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales chunkIndex is invalid',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales chunk rows must be an array',
            })
        }

        if (
          !Number.isInteger(sourceRowOffset) ||
          sourceRowOffset < 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales sourceRowOffset is invalid',
            })
        }

        const result =
          await appendSalesChunk(
            pool,
            {
              importId,
              chunkIndex,
              rows,
              checksumSha256,
              sourceRowOffset,
            },
          )

        return res.json({
          ok: true,
          ...result,
        })
      } catch (error) {
        console.error(
          'Sales chunk append failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Sales chunk append failed',
          })
      }
    },
  )

  router.post(
    '/imports/:importId/cancel',
    async (req, res) => {
      try {
        const importId =
          Number(
            req.params.importId,
          )

        const {
          reason =
            'Import cancelled by user',
        } = req.body ?? {}

        if (
          !Number.isInteger(importId) ||
          importId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales importId is invalid',
            })
        }

        if (
          typeof reason !== 'string' ||
          reason.trim() === ''
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales cancel reason is invalid',
            })
        }

        const result =
          await cancelSalesChunkImport(
            pool,
            {
              importId,
              reason:
                reason.trim(),
            },
          )

        return res.json({
          ok: true,
          dataset: 'sales',
          ...result,
        })
      } catch (error) {
        console.error(
          'Sales chunk cancel failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Sales chunk cancel failed',
          })
      }
    },
  )

  router.post(
    '/imports/:importId/finalize',
    async (req, res) => {
      try {
        const importId =
          Number(
            req.params.importId,
          )

        const {
          ignoredRows = 0,
        } = req.body ?? {}

        if (
          !Number.isInteger(importId) ||
          importId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Sales importId is invalid',
            })
        }

        const result =
          await finalizeSalesChunkImport(
            pool,
            {
              importId,
              ignoredRows,
            },
          )

        return res.json({
          ok: true,
          dataset: 'sales',
          ...result,
        })
      } catch (error) {
        console.error(
          'Sales chunk finalize failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Sales chunk finalize failed',
          })
      }
    },
  )

  return router
}