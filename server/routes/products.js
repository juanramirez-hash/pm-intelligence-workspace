import { Router } from 'express'

import {
  appendProductChunk,
  cancelProductChunkImport,
  finalizeProductChunkImport,
  startProductChunkImport,
} from '../services/productChunkImportService.js'

import {
  loadProductDataset,
} from '../services/productReadService.js'

export function createProductsRouter(
  pool,
) {
  const router = Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadProductDataset(
            pool,
          )

        return res.json({
          ok: true,
          dataset: 'products',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Product load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Product load failed',
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
                'Product fileName is required',
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
                'Product sourceRowCount must be a non-negative integer',
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
          await startProductChunkImport(
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
          dataset: 'products',
          import: importRecord,
        })
      } catch (error) {
        console.error(
          'Product chunk import start failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Product chunk import start failed',
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
                'Product importId is invalid',
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
                'Product chunkIndex is invalid',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Product chunk rows must be an array',
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
                'Product sourceRowOffset is invalid',
            })
        }

        const result =
          await appendProductChunk(
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
          dataset: 'products',
          ...result,
        })
      } catch (error) {
        console.error(
          'Product chunk append failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Product chunk append failed',
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
                'Product importId is invalid',
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
                'Product cancel reason is invalid',
            })
        }

        const result =
          await cancelProductChunkImport(
            pool,
            {
              importId,
              reason:
                reason.trim(),
            },
          )

        return res.json({
          ok: true,
          dataset: 'products',
          ...result,
        })
      } catch (error) {
        console.error(
          'Product chunk cancel failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Product chunk cancel failed',
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
                'Product importId is invalid',
            })
        }

        const result =
          await finalizeProductChunkImport(
            pool,
            {
              importId,
              ignoredRows,
            },
          )

        return res.json({
          ok: true,
          dataset: 'products',
          ...result,
        })
      } catch (error) {
        console.error(
          'Product chunk finalize failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Product chunk finalize failed',
          })
      }
    },
  )

  return router
}