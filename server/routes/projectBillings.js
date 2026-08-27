import { Router } from 'express'

import {
  appendProjectBillingChunk,
  cancelProjectBillingChunkImport,
  finalizeProjectBillingChunkImport,
  startProjectBillingChunkImport,
} from '../services/projectBillingChunkImportService.js'

import {
  loadProjectBillingDataset,
} from '../services/projectBillingReadService.js'

export function createProjectBillingsRouter(
  pool,
) {
  const router =
    Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadProjectBillingDataset(
            pool,
          )

        return res.json({
          ok: true,
          dataset: 'projectBillings',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Project Billing load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project Billing load failed',
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
          checksumSha256 = null,
        } = req.body ?? {}

        if (
          typeof fileName !== 'string' ||
          fileName.trim() === ''
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project Billing fileName is required',
            })
        }

        if (
          !Number.isInteger(
            sourceRowCount,
          ) ||
          sourceRowCount < 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project Billing sourceRowCount must be a non-negative integer',
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
          await startProjectBillingChunkImport(
            pool,
            {
              fileName:
                fileName.trim(),
              uploadedByUserId:
                userId,
              sourceRowCount,
              checksumSha256,
            },
          )

        return res.json({
          ok: true,
          dataset: 'projectBillings',
          import: importRecord,
        })
      } catch (error) {
        console.error(
          'Project Billing chunk import start failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project Billing chunk import start failed',
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
        } = req.body ?? {}

        if (
          !Number.isInteger(
            importId,
          ) ||
          importId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project Billing importId is invalid',
            })
        }

        if (
          !Number.isInteger(
            chunkIndex,
          ) ||
          chunkIndex < 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project Billing chunkIndex is invalid',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project Billing chunk rows must be an array',
            })
        }

        const result =
          await appendProjectBillingChunk(
            pool,
            {
              importId,
              chunkIndex,
              rows,
              checksumSha256,
            },
          )

        return res.json({
          ok: true,
          dataset: 'projectBillings',
          ...result,
        })
      } catch (error) {
        console.error(
          'Project Billing chunk append failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project Billing chunk append failed',
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
          !Number.isInteger(
            importId,
          ) ||
          importId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project Billing importId is invalid',
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
                'Project Billing cancel reason is invalid',
            })
        }

        const result =
          await cancelProjectBillingChunkImport(
            pool,
            {
              importId,
              reason:
                reason.trim(),
            },
          )

        return res.json({
          ok: true,
          dataset: 'projectBillings',
          ...result,
        })
      } catch (error) {
        console.error(
          'Project Billing chunk cancel failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project Billing chunk cancel failed',
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
          !Number.isInteger(
            importId,
          ) ||
          importId <= 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project Billing importId is invalid',
            })
        }

        if (
          !Number.isInteger(
            ignoredRows,
          ) ||
          ignoredRows < 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project Billing ignoredRows is invalid',
            })
        }

        const result =
          await finalizeProjectBillingChunkImport(
            pool,
            {
              importId,
              ignoredRows,
            },
          )

        return res.json({
          ok: true,
          dataset: 'projectBillings',
          ...result,
        })
      } catch (error) {
        console.error(
          'Project Billing chunk finalize failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project Billing chunk finalize failed',
          })
      }
    },
  )

  return router
}
