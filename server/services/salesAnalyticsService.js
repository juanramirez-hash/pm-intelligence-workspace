function normalizeAssignedBrandIds(brandIds) {
  return [
    ...new Set(
      brandIds
        .map((brandId) =>
          brandId.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        )
        .filter((brandId) => brandId.length > 0),
    ),
  ]
}

function buildBrandScopeFilter(access) {
  if (access?.scope !== 'assigned') {
    return {
      sql: '',
      params: [],
    }
  }

  const brandIds =
    normalizeAssignedBrandIds(
      access.brandIds ?? [],
    )

  return {
    sql: `
      WHERE REGEXP_REPLACE(
        UPPER(brand),
        '[^A-Z0-9]',
        '',
        'g'
      ) = ANY($1::TEXT[])
    `,
    params: [brandIds],
  }
}

const normalizeSql = (column) => `
  NULLIF(
    UPPER(
      REGEXP_REPLACE(
        BTRIM(${column}),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ),
    ''
  )
`

function buildProductIdentityCtes(
  brandScopeSql,
) {
  return `
    WITH sales_source AS (
      SELECT
        id,
        brand,
        product_name,
        product_code,
        model
      FROM sales_facts
      ${brandScopeSql}
    ),
    normalized_sales AS (
      SELECT
        id,
        ${normalizeSql('brand')} AS brand_key,
        ${normalizeSql('product_name')} AS product_name_key,
        ${normalizeSql('product_code')} AS product_code_key,
        ${normalizeSql('model')} AS model_key
      FROM sales_source
    ),
    normalized_products AS (
      SELECT
        id,
        name,
        code,
        model,
        brand,
        ${normalizeSql('name')} AS name_key,
        ${normalizeSql('code')} AS code_key,
        ${normalizeSql('brand')} AS brand_key,
        ${normalizeSql('model')} AS model_key
      FROM products
    ),
    product_name_index AS (
      SELECT
        name_key AS identity_key,
        COUNT(*)::INTEGER AS candidate_count
      FROM normalized_products
      WHERE name_key IS NOT NULL
      GROUP BY name_key
    ),
    product_code_index AS (
      SELECT
        code_key AS identity_key,
        COUNT(*)::INTEGER AS candidate_count
      FROM normalized_products
      WHERE code_key IS NOT NULL
      GROUP BY code_key
    ),
    product_brand_model_index AS (
      SELECT
        brand_key || '::' || model_key
          AS identity_key,
        COUNT(*)::INTEGER AS candidate_count
      FROM normalized_products
      WHERE
        brand_key IS NOT NULL
        AND model_key IS NOT NULL
      GROUP BY
        brand_key,
        model_key
    ),
    reconciled_sales AS (
      SELECT
        sales.id,
        sales.brand_key,
        sales.product_name_key,
        sales.product_code_key,
        sales.model_key,

        COALESCE(
          name_index.candidate_count,
          0
        ) AS name_candidate_count,

        COALESCE(
          code_index.candidate_count,
          0
        ) AS code_candidate_count,

        COALESCE(
          brand_model_index.candidate_count,
          0
        ) AS brand_model_candidate_count,

        CASE
          WHEN
            sales.product_name_key IS NOT NULL
            AND COALESCE(
              name_index.candidate_count,
              0
            ) = 1
            THEN 'matched'

          WHEN
            sales.product_name_key IS NOT NULL
            AND COALESCE(
              name_index.candidate_count,
              0
            ) > 1
            THEN 'ambiguous'

          WHEN
            sales.product_code_key IS NOT NULL
            AND COALESCE(
              code_index.candidate_count,
              0
            ) = 1
            THEN 'matched'

          WHEN
            sales.product_code_key IS NOT NULL
            AND COALESCE(
              code_index.candidate_count,
              0
            ) > 1
            THEN 'ambiguous'

          WHEN
            sales.brand_key IS NOT NULL
            AND sales.model_key IS NOT NULL
            AND COALESCE(
              brand_model_index.candidate_count,
              0
            ) = 1
            THEN 'matched'

          WHEN
            sales.brand_key IS NOT NULL
            AND sales.model_key IS NOT NULL
            AND COALESCE(
              brand_model_index.candidate_count,
              0
            ) > 1
            THEN 'ambiguous'

          WHEN sales.product_name_key IS NOT NULL
            THEN 'matched'

          ELSE 'unmatched'
        END AS status,

        CASE
          WHEN
            sales.product_name_key IS NOT NULL
            AND COALESCE(
              name_index.candidate_count,
              0
            ) >= 1
            THEN 'name'

          WHEN
            sales.product_code_key IS NOT NULL
            AND COALESCE(
              code_index.candidate_count,
              0
            ) >= 1
            THEN 'erp_code'

          WHEN
            sales.brand_key IS NOT NULL
            AND sales.model_key IS NOT NULL
            AND COALESCE(
              brand_model_index.candidate_count,
              0
            ) >= 1
            THEN 'brand_model'

          WHEN sales.product_name_key IS NOT NULL
            THEN 'name'

          ELSE 'none'
        END AS strategy,

        CASE
          WHEN
            sales.product_name_key IS NOT NULL
            AND COALESCE(
              name_index.candidate_count,
              0
            ) = 1
            THEN 'matched_by_name'

          WHEN
            sales.product_name_key IS NOT NULL
            AND COALESCE(
              name_index.candidate_count,
              0
            ) > 1
            THEN 'ambiguous_name'

          WHEN
            sales.product_code_key IS NOT NULL
            AND COALESCE(
              code_index.candidate_count,
              0
            ) = 1
            THEN 'matched_by_erp_code'

          WHEN
            sales.product_code_key IS NOT NULL
            AND COALESCE(
              code_index.candidate_count,
              0
            ) > 1
            THEN 'ambiguous_erp_code'

          WHEN
            sales.brand_key IS NOT NULL
            AND sales.model_key IS NOT NULL
            AND COALESCE(
              brand_model_index.candidate_count,
              0
            ) = 1
            THEN 'matched_by_brand_model'

          WHEN
            sales.brand_key IS NOT NULL
            AND sales.model_key IS NOT NULL
            AND COALESCE(
              brand_model_index.candidate_count,
              0
            ) > 1
            THEN 'ambiguous_brand_model'

          WHEN sales.product_name_key IS NOT NULL
            THEN 'historical_unlisted'

          WHEN
            sales.product_code_key IS NOT NULL
            OR (
              sales.brand_key IS NOT NULL
              AND sales.model_key IS NOT NULL
            )
            THEN 'product_not_found'

          ELSE 'missing_product_identity'
        END AS reason

      FROM normalized_sales AS sales

      LEFT JOIN product_name_index AS name_index
        ON name_index.identity_key =
          sales.product_name_key

      LEFT JOIN product_code_index AS code_index
        ON code_index.identity_key =
          sales.product_code_key

      LEFT JOIN product_brand_model_index
        AS brand_model_index
        ON brand_model_index.identity_key =
          (
            sales.brand_key ||
            '::' ||
            sales.model_key
          )
    )
  `
}

/**
 * Diagnostic query used while migrating Sales Workspace segmentation
 * from the in-memory BusinessDataModel to PostgreSQL.
 *
 * It intentionally does not replace loadSalesDataset().
 *
 * @param {import('pg').Pool} pool
 * @param {{ scope: 'all' | 'assigned', brandIds: string[] }} [access]
 */
export async function loadSalesProductIdentityDiagnostics(
  pool,
  access = {
    scope: 'all',
    brandIds: [],
  },
) {
  const client = await pool.connect()

  try {
    const brandScopeFilter =
      buildBrandScopeFilter(access)

    const ctes =
      buildProductIdentityCtes(
        brandScopeFilter.sql,
      )

    const result = await client.query(
      `
        ${ctes}

        SELECT
          COUNT(*)::INTEGER AS total_rows,

          COUNT(*) FILTER (
            WHERE status = 'matched'
          )::INTEGER AS matched_rows,

          COUNT(*) FILTER (
            WHERE reason = 'matched_by_name'
          )::INTEGER AS matched_by_name,

          COUNT(*) FILTER (
            WHERE reason = 'historical_unlisted'
          )::INTEGER AS matched_historical_unlisted,

          COUNT(*) FILTER (
            WHERE reason = 'matched_by_erp_code'
          )::INTEGER AS matched_by_erp_code,

          COUNT(*) FILTER (
            WHERE reason = 'matched_by_brand_model'
          )::INTEGER AS matched_by_brand_model,

          COUNT(*) FILTER (
            WHERE status = 'ambiguous'
          )::INTEGER AS ambiguous_rows,

          COUNT(*) FILTER (
            WHERE reason = 'ambiguous_name'
          )::INTEGER AS ambiguous_by_name,

          COUNT(*) FILTER (
            WHERE reason = 'ambiguous_erp_code'
          )::INTEGER AS ambiguous_by_erp_code,

          COUNT(*) FILTER (
            WHERE reason = 'ambiguous_brand_model'
          )::INTEGER AS ambiguous_by_brand_model,

          COUNT(*) FILTER (
            WHERE status = 'unmatched'
          )::INTEGER AS unmatched_rows,

          COUNT(*) FILTER (
            WHERE reason = 'missing_product_identity'
          )::INTEGER AS missing_identity_rows

        FROM reconciled_sales
      `,
      brandScopeFilter.params,
    )

    const row =
      result.rows[0] ?? {}

    const totalRows =
      Number(row.total_rows ?? 0)

    const matchedRows =
      Number(row.matched_rows ?? 0)

    return {
      totalRows,
      matchedRows,
      matchedByName:
        Number(
          row.matched_by_name ?? 0,
        ),
      matchedHistoricalUnlisted:
        Number(
          row.matched_historical_unlisted ?? 0,
        ),
      matchedByErpCode:
        Number(
          row.matched_by_erp_code ?? 0,
        ),
      matchedByBrandAndModel:
        Number(
          row.matched_by_brand_model ?? 0,
        ),
      ambiguousRows:
        Number(
          row.ambiguous_rows ?? 0,
        ),
      ambiguousByName:
        Number(
          row.ambiguous_by_name ?? 0,
        ),
      ambiguousByErpCode:
        Number(
          row.ambiguous_by_erp_code ?? 0,
        ),
      ambiguousByBrandAndModel:
        Number(
          row.ambiguous_by_brand_model ?? 0,
        ),
      unmatchedRows:
        Number(
          row.unmatched_rows ?? 0,
        ),
      missingIdentityRows:
        Number(
          row.missing_identity_rows ?? 0,
        ),
      matchRate:
        totalRows > 0
          ? (matchedRows / totalRows) * 100
          : 0,
    }
  } finally {
    client.release()
  }
}