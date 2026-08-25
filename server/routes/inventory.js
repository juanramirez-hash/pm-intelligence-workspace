import { Router } from 'express'

import {
  importInventoryDataset,
} from '../services/inventoryImportService.js'

import {
  loadInventoryDataset,
} from '../services/inventoryReadService.js'

import {
  appendInventoryChunk,
  cancelInventoryChunkImport,
  finalizeInventoryChunkImport,
  startInventoryChunkImport,
} from '../services/inventoryChunkImportService.js'

export function createInventoryRouter(
  pool,
) {
  const router = Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadInventoryDataset(
            pool,
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
                'Inventory rows must be an array',
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
                'Inventory fileName is required',
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
          await importInventoryDataset(
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
          dataset: 'inventory',
          ...result,
        })
      } catch (error) {
        console.error(
          'Inventory import failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Inventory import failed',
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

        const result =
          await finalizeInventoryChunkImport(
            pool,
            {
              importId,
              ignoredRows,
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

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Inventory chunk finalize failed',
          })
      }
    },
  )

  return router
}