import { Router } from 'express'

import {
  importInventoryDataset,
} from '../services/inventoryImportService.js'

import {
  loadInventoryDataset,
} from '../services/inventoryReadService.js'

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

  return router
}