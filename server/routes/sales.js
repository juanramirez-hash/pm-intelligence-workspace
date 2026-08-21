import { Router } from 'express'
import {
  importSalesDataset,
} from '../services/salesImportService.js'

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

  return router
}