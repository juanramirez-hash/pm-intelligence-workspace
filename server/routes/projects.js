import { Router } from 'express'

import {
  appendProjectChunk,
  cancelProjectChunkImport,
  finalizeProjectChunkImport,
  startProjectChunkImport,
} from '../services/projectChunkImportService.js'

import {
  loadProjectDataset,
} from '../services/projectReadService.js'

export function createProjectsRouter(
  pool,
) {
  const router =
    Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadProjectDataset(
            pool,
          )

        return res.json({
          ok: true,
          dataset: 'projects',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Project load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project load failed',
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
                'Project fileName is required',
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
                'Project sourceRowCount must be a non-negative integer',
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
          await startProjectChunkImport(
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
          dataset: 'projects',
          import: importRecord,
        })
      } catch (error) {
        console.error(
          'Project chunk import start failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project chunk import start failed',
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
                'Project importId is invalid',
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
                'Project chunkIndex is invalid',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Project chunk rows must be an array',
            })
        }

        const result =
          await appendProjectChunk(
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
          dataset: 'projects',
          ...result,
        })
      } catch (error) {
        console.error(
          'Project chunk append failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project chunk append failed',
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
                'Project importId is invalid',
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
                'Project cancel reason is invalid',
            })
        }

        const result =
          await cancelProjectChunkImport(
            pool,
            {
              importId,
              reason:
                reason.trim(),
            },
          )

        return res.json({
          ok: true,
          dataset: 'projects',
          ...result,
        })
      } catch (error) {
        console.error(
          'Project chunk cancel failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project chunk cancel failed',
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
                'Project importId is invalid',
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
                'Project ignoredRows is invalid',
            })
        }

        const result =
          await finalizeProjectChunkImport(
            pool,
            {
              importId,
              ignoredRows,
            },
          )

        return res.json({
          ok: true,
          dataset: 'projects',
          ...result,
        })
      } catch (error) {
        console.error(
          'Project chunk finalize failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Project chunk finalize failed',
          })
      }
    },
  )

  return router
}
