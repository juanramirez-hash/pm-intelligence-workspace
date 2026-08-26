import { Router } from 'express'

import {
  appendPurchaseOrderChunk,
  cancelPurchaseOrderChunkImport,
  finalizePurchaseOrderChunkImport,
  startPurchaseOrderChunkImport,
} from '../services/purchaseOrderChunkImportService.js'

import {
  loadPurchaseOrderDataset,
} from '../services/purchaseOrderReadService.js'

export function createPurchasesRouter(
  pool,
) {
  const router =
    Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadPurchaseOrderDataset(
            pool,
          )

        return res.json({
          ok: true,
          dataset: 'purchases',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Purchase Order load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Order load failed',
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
                'Purchase Order fileName is required',
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
                'Purchase Order sourceRowCount must be a non-negative integer',
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
          await startPurchaseOrderChunkImport(
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
          dataset: 'purchases',
          import: importRecord,
        })
      } catch (error) {
        console.error(
          'Purchase Order chunk import start failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Order chunk import start failed',
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
                'Purchase Order importId is invalid',
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
                'Purchase Order chunkIndex is invalid',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Purchase Order chunk rows must be an array',
            })
        }

        const result =
          await appendPurchaseOrderChunk(
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
          dataset: 'purchases',
          ...result,
        })
      } catch (error) {
        console.error(
          'Purchase Order chunk append failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Order chunk append failed',
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
                'Purchase Order importId is invalid',
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
                'Purchase Order cancel reason is invalid',
            })
        }

        const result =
          await cancelPurchaseOrderChunkImport(
            pool,
            {
              importId,
              reason:
                reason.trim(),
            },
          )

        return res.json({
          ok: true,
          dataset: 'purchases',
          ...result,
        })
      } catch (error) {
        console.error(
          'Purchase Order chunk cancel failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Order chunk cancel failed',
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
                'Purchase Order importId is invalid',
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
                'Purchase Order ignoredRows is invalid',
            })
        }

        const result =
          await finalizePurchaseOrderChunkImport(
            pool,
            {
              importId,
              ignoredRows,
            },
          )

        return res.json({
          ok: true,
          dataset: 'purchases',
          ...result,
        })
      } catch (error) {
        console.error(
          'Purchase Order chunk finalize failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Order chunk finalize failed',
          })
      }
    },
  )

  return router
}