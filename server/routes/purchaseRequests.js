import { Router } from 'express'

import {
  appendPurchaseRequestChunk,
  cancelPurchaseRequestChunkImport,
  finalizePurchaseRequestChunkImport,
  startPurchaseRequestChunkImport,
} from '../services/purchaseRequestChunkImportService.js'

import {
  loadPurchaseRequestDataset,
} from '../services/purchaseRequestReadService.js'

export function createPurchaseRequestsRouter(
  pool,
) {
  const router =
    Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadPurchaseRequestDataset(
            pool,
          )

        return res.json({
          ok: true,
          dataset: 'purchaseRequests',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Purchase Request load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Request load failed',
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
                'Purchase Request fileName is required',
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
                'Purchase Request sourceRowCount must be a non-negative integer',
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
          await startPurchaseRequestChunkImport(
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
          dataset: 'purchaseRequests',
          import: importRecord,
        })
      } catch (error) {
        console.error(
          'Purchase Request chunk import start failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Request chunk import start failed',
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
                'Purchase Request importId is invalid',
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
                'Purchase Request chunkIndex is invalid',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Purchase Request chunk rows must be an array',
            })
        }

        const result =
          await appendPurchaseRequestChunk(
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
          dataset: 'purchaseRequests',
          ...result,
        })
      } catch (error) {
        console.error(
          'Purchase Request chunk append failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Request chunk append failed',
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
                'Purchase Request importId is invalid',
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
                'Purchase Request cancel reason is invalid',
            })
        }

        const result =
          await cancelPurchaseRequestChunkImport(
            pool,
            {
              importId,
              reason:
                reason.trim(),
            },
          )

        return res.json({
          ok: true,
          dataset: 'purchaseRequests',
          ...result,
        })
      } catch (error) {
        console.error(
          'Purchase Request chunk cancel failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Request chunk cancel failed',
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
                'Purchase Request importId is invalid',
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
                'Purchase Request ignoredRows is invalid',
            })
        }

        const result =
          await finalizePurchaseRequestChunkImport(
            pool,
            {
              importId,
              ignoredRows,
            },
          )

        return res.json({
          ok: true,
          dataset: 'purchaseRequests',
          ...result,
        })
      } catch (error) {
        console.error(
          'Purchase Request chunk finalize failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Purchase Request chunk finalize failed',
          })
      }
    },
  )

  return router
}
