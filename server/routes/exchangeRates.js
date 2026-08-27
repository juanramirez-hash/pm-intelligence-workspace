import { Router } from 'express'

import {
  loadExchangeRateDataset,
} from '../services/exchangeRateReadService.js'

import {
  saveExchangeRateDataset,
} from '../services/exchangeRateWriteService.js'

export function createExchangeRatesRouter(
  pool,
) {
  const router =
    Router()

  router.get(
    '/',
    async (_req, res) => {
      try {
        const dataset =
          await loadExchangeRateDataset(
            pool,
          )

        return res.json({
          ok: true,
          dataset: 'exchangeRates',
          data: dataset,
        })
      } catch (error) {
        console.error(
          'Exchange Rate load failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Exchange Rate load failed',
          })
      }
    },
  )

  router.post(
    '/',
    async (req, res) => {
      try {
        const {
          fileName,
          rows,
          ignoredRows = 0,
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
                'Exchange Rate fileName is required',
            })
        }

        if (!Array.isArray(rows)) {
          return res
            .status(400)
            .json({
              ok: false,
              error:
                'Exchange Rate rows must be an array',
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
                'Exchange Rate ignoredRows is invalid',
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
          await saveExchangeRateDataset(
            pool,
            {
              fileName:
                fileName.trim(),

              uploadedByUserId:
                userId,

              rows,
              ignoredRows,
            },
          )

        return res.json({
          ok: true,
          dataset: 'exchangeRates',
          ...result,
        })
      } catch (error) {
        console.error(
          'Exchange Rate persistence failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Exchange Rate persistence failed',
          })
      }
    },
  )

  return router
}