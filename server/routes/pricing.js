import { Router } from 'express'

import {
  appendPricingChunk,
  cancelPricingChunkImport,
  finalizePricingChunkImport,
  startPricingChunkImport,
} from '../services/pricingChunkImportService.js'

import {
  loadPricingDataset,
} from '../services/pricingReadService.js'

export function createPricingRouter(
  pool,
) {
  const router =
    Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadPricingDataset(
            pool,
          )

        return res.json({
          ok: true,
          dataset: 'pricing',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Pricing load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Pricing load failed',
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
                'Pricing fileName is required',
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
                'Pricing sourceRowCount must be a non-negative integer',
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
          await startPricingChunkImport(
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
          dataset: 'pricing',
          import: importRecord,
        })
      } catch (error) {
        console.error(
          'Pricing chunk import start failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Pricing chunk import start failed',
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
                'Pricing importId is invalid',
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
                'Pricing chunkIndex is invalid',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Pricing chunk rows must be an array',
            })
        }

        const result =
          await appendPricingChunk(
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
          dataset: 'pricing',
          ...result,
        })
      } catch (error) {
        console.error(
          'Pricing chunk append failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Pricing chunk append failed',
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
                'Pricing importId is invalid',
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
                'Pricing cancel reason is invalid',
            })
        }

        const result =
          await cancelPricingChunkImport(
            pool,
            {
              importId,

              reason:
                reason.trim(),
            },
          )

        return res.json({
          ok: true,
          dataset: 'pricing',
          ...result,
        })
      } catch (error) {
        console.error(
          'Pricing chunk cancel failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Pricing chunk cancel failed',
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
                'Pricing importId is invalid',
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
                'Pricing ignoredRows is invalid',
            })
        }

        const result =
          await finalizePricingChunkImport(
            pool,
            {
              importId,
              ignoredRows,
            },
          )

        return res.json({
          ok: true,
          dataset: 'pricing',
          ...result,
        })
      } catch (error) {
        console.error(
          'Pricing chunk finalize failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Pricing chunk finalize failed',
          })
      }
    },
  )

  return router
}