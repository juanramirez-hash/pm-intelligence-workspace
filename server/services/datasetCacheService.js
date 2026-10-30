import { createHash } from 'node:crypto'

// Bump when the JSON shape returned by any GET /api/data/<dataset> changes,
// so browsers holding the previous shape download the new one.
export const DATASET_RESPONSE_FORMAT_VERSION = 1

/**
 * Reads the cheap state that identifies a dataset response:
 * completed imports of the dataset plus the manual data version
 * (migration 036). Never touches the dataset tables.
 *
 * @param {{ query: Function }} pool
 * @param {string} datasetType
 */
export async function loadDatasetCacheState(
  pool,
  datasetType,
) {
  const result =
    await pool.query(
      `
        SELECT
          COUNT(*)::TEXT AS import_count,
          COALESCE(
            MAX(id),
            0
          )::TEXT AS max_import_id,
          MAX(completed_at) AS max_completed_at,
          (
            SELECT version
            FROM public.data_cache_version
            WHERE id = 1
          ) AS data_version
        FROM data_imports
        WHERE
          dataset_type = $1
          AND status = 'completed'
      `,
      [
        datasetType,
      ],
    )

  const row =
    result.rows[0]

  if (
    !row ||
    row.data_version === null ||
    row.data_version === undefined
  ) {
    throw new Error(
      'Data cache version is not available',
    )
  }

  return {
    importCount:
      String(row.import_count),
    maxImportId:
      String(row.max_import_id),
    maxCompletedAt:
      row.max_completed_at instanceof Date
        ? row.max_completed_at.toISOString()
        : String(
            row.max_completed_at ?? '',
          ),
    dataVersion:
      String(row.data_version),
  }
}

/**
 * @param {{ scope: string, brandIds: string[] } | undefined} access
 */
function describeAccess(
  access,
) {
  if (!access) {
    return 'unscoped'
  }

  if (access.scope !== 'assigned') {
    return access.scope
  }

  // Order and duplicates do not change the response, so they must not
  // change the tag either.
  const brandIds =
    [
      ...new Set(
        access.brandIds.map(
          (brandId) =>
            brandId
              .trim()
              .toUpperCase(),
        ),
      ),
    ].sort()

  return `assigned:${brandIds.join('|')}`
}

/**
 * Builds a weak ETag. Weak on purpose: nginx gzip and Cloudflare
 * compression drop or weaken strong ETags. The parts are hashed so
 * assigned brands are not exposed in headers.
 *
 * @param {{
 *   datasetType: string,
 *   state: Awaited<ReturnType<typeof loadDatasetCacheState>>,
 *   access?: { scope: string, brandIds: string[] },
 * }} options
 */
export function buildDatasetEtag({
  datasetType,
  state,
  access,
}) {
  const digest =
    createHash('sha256')
      .update(
        JSON.stringify([
          DATASET_RESPONSE_FORMAT_VERSION,
          datasetType,
          state.importCount,
          state.maxImportId,
          state.maxCompletedAt,
          state.dataVersion,
          describeAccess(access),
        ]),
      )
      .digest('base64url')
      .slice(0, 32)

  return `W/"${datasetType}-${digest}"`
}

/**
 * Weak comparison, as required for If-None-Match.
 *
 * @param {string | undefined} ifNoneMatch
 * @param {string} etag
 */
export function matchesIfNoneMatch(
  ifNoneMatch,
  etag,
) {
  if (
    typeof ifNoneMatch !== 'string' ||
    ifNoneMatch.trim().length === 0
  ) {
    return false
  }

  if (ifNoneMatch.trim() === '*') {
    return true
  }

  const opaqueTag =
    etag.replace(/^W\//, '')

  return ifNoneMatch
    .split(',')
    .map(
      (candidate) =>
        candidate
          .trim()
          .replace(/^W\//, ''),
    )
    .includes(opaqueTag)
}
