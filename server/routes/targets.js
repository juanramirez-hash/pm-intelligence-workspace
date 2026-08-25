import { Router } from 'express'

import {
  importTargetDataset,
} from '../services/targetImportService.js'

import {
  loadTargetDataset,
} from '../services/targetReadService.js'

export function createTargetsRouter(
  pool,
) {
  const router = Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadTargetDataset(
            pool,
          )

        return res.json({
          ok: true,
          dataset: 'salesTargets',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Target load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Target load failed',
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
                'Target rows must be an array',
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
                'Target fileName is required',
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
          await importTargetDataset(
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
          dataset: 'salesTargets',
          ...result,
        })
      } catch (error) {
        console.error(
          'Target import failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Target import failed',
          })
      }
    },
  )

  return router
}