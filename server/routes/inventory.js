import { Router } from 'express'
import {
  datasetCache,
} from '../middleware/datasetCache.js'
import {
  resolveCostScope,
} from '../middleware/requireBrandScope.js'

import {
  loadInventoryDataset,
} from '../services/inventoryReadService.js'

import {
  appendInventoryChunk,
  appendInventoryItems,
  cancelInventoryChunkImport,
  finalizeInventoryChunkImport,
  startInventoryChunkImport,
} from '../services/inventoryChunkImportService.js'

// MD-002-HOTFIX1: errors with a status code (400, 404, 409, 422) carry a
// message meant for the user; anything else stays a generic 500.
function sendImportError(res, error, fallback) {
  if (Number.isInteger(error?.statusCode)) {
    return res
      .status(error.statusCode)
      .json({
        ok: false,
        error: error.message,
      })
  }

  return res
    .status(500)
    .json({
      ok: false,
      error: fallback,
    })
}

export function createInventoryRouter(
  pool,
) {
  const router = Router()

  router.get(
    '/',
    datasetCache(pool, {
      datasetType: 'inventory',
      costScoped: true,
    }),
    async (req, res) => {
      try {
        const dataset =
          await loadInventoryDataset(
            pool,
            resolveCostScope(
              req.authUser,
            ),
          )

        return res.json({
          ok: true,
          dataset: 'inventory',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Inventory load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Inventory load failed',
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
                'Inventory fileName is required',
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
                'Inventory sourceRowCount must be a non-negative integer',
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
          await startInventoryChunkImport(
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
          dataset: 'inventory',
          import: importRecord,
        })
      } catch (error) {
        console.error(
          'Inventory chunk import start failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Inventory chunk import start failed',
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
                'Inventory importId is invalid',
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
                'Inventory chunkIndex is invalid',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Inventory chunk rows must be an array',
            })
        }

        if (
          !Number.isInteger(
            sourceRowOffset,
          ) ||
          sourceRowOffset < 0
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Inventory sourceRowOffset is invalid',
            })
        }

        const result =
          await appendInventoryChunk(
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
          dataset: 'inventory',
          ...result,
        })
      } catch (error) {
        console.error(
          'Inventory chunk append failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Inventory chunk append failed',
          })
      }
    },
  )

  router.post(
    '/imports/:importId/items',
    async (req, res) => {
      try {
        const importId =
          Number(
            req.params.importId,
          )

        const {
          chunkIndex,
          items,
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
                'Inventory importId is invalid',
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
                'Inventory chunkIndex is invalid',
            })
        }

        const result =
          await appendInventoryItems(
            pool,
            {
              importId,
              items,
            },
          )

        return res.json({
          ok: true,
          dataset: 'inventory',
          chunkIndex,
          ...result,
        })
      } catch (error) {
        console.error(
          'Inventory items append failed:',
          error,
        )

        return sendImportError(
          res,
          error,
          'Inventory items append failed',
        )
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
                'Inventory importId is invalid',
            })
        }

        if (
          typeof reason !==
            'string' ||
          reason.trim() === ''
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Inventory cancel reason is invalid',
            })
        }

        const result =
          await cancelInventoryChunkImport(
            pool,
            {
              importId,
              reason:
                reason.trim(),
            },
          )

        return res.json({
          ok: true,
          dataset: 'inventory',
          ...result,
        })
      } catch (error) {
        console.error(
          'Inventory chunk cancel failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Inventory chunk cancel failed',
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
          expectedItemCount = null,
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
                'Inventory importId is invalid',
            })
        }

        if (
          expectedItemCount !== null &&
          (
            !Number.isInteger(
              expectedItemCount,
            ) ||
            expectedItemCount < 0
          )
        ) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Inventory expectedItemCount is invalid',
            })
        }

        const result =
          await finalizeInventoryChunkImport(
            pool,
            {
              importId,
              ignoredRows,
              expectedItemCount,
            },
          )

        return res.json({
          ok: true,
          dataset: 'inventory',
          ...result,
        })
      } catch (error) {
        console.error(
          'Inventory chunk finalize failed:',
          error,
        )

        return sendImportError(
          res,
          error,
          'Inventory chunk finalize failed',
        )
      }
    },
  )

  return router
}