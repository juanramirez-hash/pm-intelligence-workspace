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
        sale_date,
        brand,
        revenue,
        gross_profit,
        customer_id,
        product_name,
        product_code,
        model,
        quantity,
        document_number,
        location,
        sales_rep
      FROM sales_facts
      ${brandScopeSql}
    ),
    normalized_sales AS (
      SELECT
        id,
        sale_date,
        TO_CHAR(
          sale_date,
          'YYYY-MM'
        ) AS period_id,
        ${normalizeSql('brand')} AS reconciliation_brand_key,
        CASE
          WHEN ${normalizeSql('brand')} =
            'MERIVA TECHNOLOGY - STREAMAX'
            THEN 'STREAMAX - MERIVA'
          ELSE ${normalizeSql('brand')}
        END AS brand_id,
        revenue,
        gross_profit,
        ${normalizeSql('customer_id')} AS customer_id,
        ${normalizeSql('product_name')} AS product_name_key,
        ${normalizeSql('product_code')} AS product_code_key,
        ${normalizeSql('model')} AS model_key,
        quantity,
        ${normalizeSql('document_number')} AS document_number,
        ${normalizeSql('location')} AS location_id,
        ${normalizeSql('sales_rep')} AS sales_representative_id
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
        COUNT(*)::INTEGER AS candidate_count,
        CASE
          WHEN COUNT(*) = 1
            THEN MIN(name_key)
          ELSE NULL
        END AS matched_product_id
      FROM normalized_products
      WHERE name_key IS NOT NULL
      GROUP BY name_key
    ),
    product_code_index AS (
      SELECT
        code_key AS identity_key,
        COUNT(*)::INTEGER AS candidate_count,
        CASE
          WHEN COUNT(*) = 1
            THEN MIN(name_key)
          ELSE NULL
        END AS matched_product_id
      FROM normalized_products
      WHERE code_key IS NOT NULL
      GROUP BY code_key
    ),
    product_brand_model_index AS (
      SELECT
        brand_key || '::' || model_key
          AS identity_key,
        COUNT(*)::INTEGER AS candidate_count,
        CASE
          WHEN COUNT(*) = 1
            THEN MIN(name_key)
          ELSE NULL
        END AS matched_product_id
      FROM normalized_products
      WHERE
        brand_key IS NOT NULL
        AND model_key IS NOT NULL
      GROUP BY
        brand_key,
        model_key
    ),
    product_master_names AS (
      SELECT DISTINCT
        name_key AS product_id
      FROM normalized_products
      WHERE name_key IS NOT NULL
    ),
    reconciled_sales AS (
      SELECT
        sales.*,

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
            ) >= 1
            THEN name_index.matched_product_id

          WHEN
            sales.product_code_key IS NOT NULL
            AND COALESCE(
              code_index.candidate_count,
              0
            ) >= 1
            THEN code_index.matched_product_id

          WHEN
            sales.reconciliation_brand_key IS NOT NULL
            AND sales.model_key IS NOT NULL
            AND COALESCE(
              brand_model_index.candidate_count,
              0
            ) >= 1
            THEN brand_model_index.matched_product_id

          ELSE NULL
        END AS matched_product_id,

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
            sales.reconciliation_brand_key IS NOT NULL
            AND sales.model_key IS NOT NULL
            AND COALESCE(
              brand_model_index.candidate_count,
              0
            ) = 1
            THEN 'matched'

          WHEN
            sales.reconciliation_brand_key IS NOT NULL
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
            sales.reconciliation_brand_key IS NOT NULL
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
            sales.reconciliation_brand_key IS NOT NULL
            AND sales.model_key IS NOT NULL
            AND COALESCE(
              brand_model_index.candidate_count,
              0
            ) = 1
            THEN 'matched_by_brand_model'

          WHEN
            sales.reconciliation_brand_key IS NOT NULL
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
              sales.reconciliation_brand_key IS NOT NULL
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
            sales.reconciliation_brand_key ||
            '::' ||
            sales.model_key
          )
    ),
    fallback_candidates AS (
      SELECT
        reconciled.*,
        COALESCE(
          reconciled.product_name_key,
          reconciled.product_code_key,
          reconciled.model_key
        ) AS base_id,
        COALESCE(
          reconciled.model_key,
          reconciled.product_name_key,
          reconciled.product_code_key
        ) AS resolved_model_key
      FROM reconciled_sales AS reconciled
      WHERE
        reconciled.brand_id IS NOT NULL
        AND reconciled.matched_product_id IS NULL
        AND reconciled.status <> 'ambiguous'
        AND COALESCE(
          reconciled.product_name_key,
          reconciled.product_code_key,
          reconciled.model_key
        ) IS NOT NULL
    ),
    fallback_owners AS (
      SELECT DISTINCT ON (
        candidate.base_id
      )
        candidate.base_id,
        candidate.brand_id,
        candidate.resolved_model_key
      FROM fallback_candidates AS candidate
      LEFT JOIN product_master_names AS master
        ON master.product_id = candidate.base_id
      WHERE master.product_id IS NULL
      ORDER BY
        candidate.base_id,
        candidate.sale_date,
        candidate.id
    ),
    canonical_sales AS (
      SELECT
        reconciled.id,
        reconciled.sale_date,
        reconciled.period_id,
        reconciled.brand_id,
        reconciled.revenue,
        reconciled.gross_profit,
        reconciled.customer_id,
        CASE
          WHEN reconciled.matched_product_id IS NOT NULL
            THEN reconciled.matched_product_id

          WHEN reconciled.status = 'ambiguous'
            THEN
              'AMBIGUOUS::' ||
              reconciled.brand_id ||
              '::' ||
              COALESCE(
                reconciled.product_name_key,
                reconciled.product_code_key,
                reconciled.model_key
              )

          WHEN COALESCE(
            reconciled.product_name_key,
            reconciled.product_code_key,
            reconciled.model_key
          ) IS NULL
            THEN NULL

          WHEN master.product_id IS NOT NULL
            THEN
              'SALES::' ||
              reconciled.brand_id ||
              '::' ||
              COALESCE(
                reconciled.product_name_key,
                reconciled.product_code_key,
                reconciled.model_key
              )

          WHEN
            owner.brand_id = reconciled.brand_id
            AND owner.resolved_model_key =
              COALESCE(
                reconciled.model_key,
                reconciled.product_name_key,
                reconciled.product_code_key
              )
            THEN COALESCE(
              reconciled.product_name_key,
              reconciled.product_code_key,
              reconciled.model_key
            )

          ELSE
            'SALES::' ||
            reconciled.brand_id ||
            '::' ||
            COALESCE(
              reconciled.product_name_key,
              reconciled.product_code_key,
              reconciled.model_key
            )
        END AS product_id,
        reconciled.quantity,
        reconciled.document_number,
        reconciled.location_id,
        reconciled.sales_representative_id
      FROM reconciled_sales AS reconciled
      LEFT JOIN product_master_names AS master
        ON master.product_id =
          COALESCE(
            reconciled.product_name_key,
            reconciled.product_code_key,
            reconciled.model_key
          )
      LEFT JOIN fallback_owners AS owner
        ON owner.base_id =
          COALESCE(
            reconciled.product_name_key,
            reconciled.product_code_key,
            reconciled.model_key
          )
    ),
    sales_segments AS (
      SELECT
        sale_date,
        period_id,
        brand_id,
        customer_id,
        product_id,
        location_id,
        sales_representative_id,
        SUM(revenue) AS revenue,
        SUM(gross_profit) AS gross_profit,
        SUM(quantity) AS quantity,
        COUNT(*)::INTEGER AS row_count
      FROM canonical_sales
      WHERE brand_id IS NOT NULL
      GROUP BY
        sale_date,
        period_id,
        brand_id,
        customer_id,
        product_id,
        location_id,
        sales_representative_id
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

/**
 * Server-side equivalent of SalesSegmentationQueries.summarize()
 * for the complete access-scoped sales history.
 *
 * SQL-002 intentionally starts without workspace filters. The next phase
 * will add period/date/dimension/search filters after base parity is proven.
 *
 * @param {import('pg').Pool} pool
 * @param {{ scope: 'all' | 'assigned', brandIds: string[] }} [access]
 */
export async function summarizeSalesSegmentation(
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
          COALESCE(
            SUM(segment.revenue),
            0
          ) AS revenue,

          COALESCE(
            SUM(segment.gross_profit),
            0
          ) AS gross_profit,

          COALESCE(
            SUM(segment.quantity),
            0
          ) AS quantity,

          (
            SELECT COUNT(DISTINCT document_number)
            FROM canonical_sales
            WHERE
              brand_id IS NOT NULL
              AND document_number IS NOT NULL
          )::INTEGER AS documents,

          COUNT(
            DISTINCT segment.customer_id
          )::INTEGER AS customer_count,

          COUNT(
            DISTINCT segment.brand_id
          )::INTEGER AS brand_count,

          COUNT(
            DISTINCT segment.product_id
          )::INTEGER AS product_count,

          COALESCE(
            SUM(segment.row_count),
            0
          )::INTEGER AS row_count,

          COUNT(*)::INTEGER AS segment_count

        FROM sales_segments AS segment
      `,
      brandScopeFilter.params,
    )

    const row =
      result.rows[0] ?? {}

    const revenue =
      Number(row.revenue ?? 0)

    const grossProfit =
      Number(row.gross_profit ?? 0)

    return {
      revenue,
      grossProfit,
      grossMargin:
        revenue === 0
          ? 0
          : (grossProfit / revenue) * 100,
      quantity:
        Number(row.quantity ?? 0),
      documents:
        Number(row.documents ?? 0),
      customerCount:
        Number(row.customer_count ?? 0),
      brandCount:
        Number(row.brand_count ?? 0),
      productCount:
        Number(row.product_count ?? 0),
      rowCount:
        Number(row.row_count ?? 0),
      segmentCount:
        Number(row.segment_count ?? 0),
    }
  } finally {
    client.release()
  }
}
