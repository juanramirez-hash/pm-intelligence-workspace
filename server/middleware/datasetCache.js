import {
  buildDatasetEtag,
  loadDatasetCacheState,
  matchesIfNoneMatch,
} from '../services/datasetCacheService.js'

/**
 * Revalidates a GET /api/data/<dataset> response before the dataset
 * is queried. Returns true when a 304 was sent.
 *
 * Must run after authentication: a 304 only confirms a copy the same
 * browser already received with its own session.
 *
 * Fails open: if the cache state cannot be read (for example, migration
 * 036 is missing), the response goes out as before, with no-store.
 *
 * @param {{ query: Function }} pool
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {{
 *   datasetType: string,
 *   access?: { scope: string, brandIds: string[] },
 * }} options
 */
export async function applyDatasetCache(
  pool,
  req,
  res,
  {
    datasetType,
    access,
  },
) {
  let etag

  try {
    const state =
      await loadDatasetCacheState(
        pool,
        datasetType,
      )

    etag =
      buildDatasetEtag({
        datasetType,
        state,
        access,
      })
  } catch (error) {
    console.error(
      `Dataset cache state failed for ${datasetType}:`,
      error,
    )

    res.set(
      'Cache-Control',
      'no-store',
    )

    return false
  }

  res.set(
    'Cache-Control',
    'private, no-cache',
  )
  res.set(
    'ETag',
    etag,
  )
  res.vary('Cookie')

  if (
    matchesIfNoneMatch(
      req.get('If-None-Match'),
      etag,
    )
  ) {
    res
      .status(304)
      .end()

    return true
  }

  return false
}

/**
 * Middleware form for datasets that do not depend on the user scope.
 *
 * @param {{ query: Function }} pool
 * @param {{ datasetType: string }} options
 */
export function datasetCache(
  pool,
  {
    datasetType,
  },
) {
  return async function datasetCacheMiddleware(
    req,
    res,
    next,
  ) {
    const notModified =
      await applyDatasetCache(
        pool,
        req,
        res,
        {
          datasetType,
        },
      )

    if (notModified) {
      return
    }

    return next()
  }
}
