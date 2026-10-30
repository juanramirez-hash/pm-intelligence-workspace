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
  options = {},
) {
  const salesSourceScopeSql =
    options.salesSourceScopeSql ??
      brandScopeSql

  const fallbackOwnersCte =
  options.fallbackOwnersCte ??
  `
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
    )
  `

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
      ${salesSourceScopeSql}
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
    ${fallbackOwnersCte},
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

function buildSalesSegmentationSourceQuery(
  filter,
  brandScopeFilter,
) {
  const periodIds =
    normalizeSalesSegmentationList(
      filter.periodIds,
    )

  if (
    !periodIds ||
    periodIds.length === 0
  ) {
    return {
      sql: brandScopeFilter.sql,
      params: [],
      periodFilteredAtSource: false,
    }
  }

  const parameterIndex =
    brandScopeFilter.params.length + 1

  const periodCondition =
  `period_id = ANY($${parameterIndex}::TEXT[])`

  // sales_facts.period_id is written as the YYYY-MM prefix of sale_date
  // by both sales importers, so it always equals the canonical period_id
  // (TO_CHAR(sale_date, 'YYYY-MM')). Filtering here makes the canonical
  // period filter redundant.
  return {
    sql:
      brandScopeFilter.sql.trim()
        ? `${brandScopeFilter.sql}
      AND ${periodCondition}`
        : `WHERE ${periodCondition}`,
    params: [
      periodIds,
    ],
    periodFilteredAtSource: true,
  }
}

function buildPersistedFallbackOwnersCte(
  access,
) {
  const scopeCondition =
    access?.scope === 'assigned'
      ? `
      WHERE
        candidate.scope_brand_key =
          ANY($1::TEXT[])
      `
      : ''

  return `
    fallback_owners AS (
      SELECT DISTINCT ON (
        candidate.base_id
      )
        candidate.base_id,
        candidate.brand_id,
        candidate.resolved_model_key
      FROM public.sales_fallback_owner_candidates
        AS candidate
      ${scopeCondition}
      ORDER BY
        candidate.base_id,
        candidate.first_sale_date,
        candidate.first_sale_id
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
 * @param {import('pg').Pool} pool
 * @param {{ scope: 'all' | 'assigned', brandIds: string[] }} [access]
 * @param {{
 *   periodIds?: readonly string[],
 *   dateFrom?: string,
 *   dateTo?: string,
 *   brandIds?: readonly string[],
 *   customerIds?: readonly string[],
 *   productIds?: readonly string[],
 *   locationIds?: readonly string[],
 *   salesRepresentativeIds?: readonly string[],
 *   searchTerm?: string,
 * }} [filter]
 */
export async function summarizeSalesSegmentation(
  pool,
  access = {
    scope: 'all',
    brandIds: [],
  },
  filter = {},
) {
  const client = await pool.connect()

  try {
    const brandScopeFilter =
      buildBrandScopeFilter(access)

    const sourceQuery =
      buildSalesSegmentationSourceQuery(
        filter,
        brandScopeFilter,
      )

    const ctes =
      buildProductIdentityCtes(
        brandScopeFilter.sql,
        {
          salesSourceScopeSql:
            sourceQuery.sql,
          fallbackOwnersCte:
            buildPersistedFallbackOwnersCte(
              access,
            ),
        },
      )

    const filterQuery =
      buildSalesSegmentationFilterQuery(
        filter,
        brandScopeFilter.sql,
        brandScopeFilter.params.length +
          sourceQuery.params.length +
          1,
        {
          periodFilteredAtSource:
            sourceQuery.periodFilteredAtSource,
        },
      )

    const result = await client.query(
      `
        ${ctes}
        ${filterQuery.ctes}

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
            FROM ${filterQuery.canonicalSource}
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

        FROM ${filterQuery.segmentSource} AS segment
      `,
      [
        ...brandScopeFilter.params,
        ...sourceQuery.params,
        ...filterQuery.params,
      ],
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
const salesSegmentationDimensionColumns = {
  period: 'period_id',
  brand: 'brand_id',
  customer: 'customer_id',
  product: 'product_id',
  location: 'location_id',
  salesRepresentative:
    'sales_representative_id',
}

const normalizeTextSql = (column) => `
  NULLIF(
    REGEXP_REPLACE(
      BTRIM(${column}),
      '[[:space:]]+',
      ' ',
      'g'
    ),
    ''
  )
`

function normalizeSalesSegmentationValue(
  value,
) {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function normalizeSalesSegmentationList(
  values,
) {
  if (!values || values.length === 0) {
    return null
  }

  return [
    ...new Set(
      values
        .map(
          normalizeSalesSegmentationValue,
        )
        .filter(Boolean),
    ),
  ]
}

const normalizeSalesSegmentationSql =
  (expression) => `
    NULLIF(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          NORMALIZE(
            UPPER(
              BTRIM(${expression})
            ),
            NFD
          ),
          U&'[\\0300-\\036F]',
          '',
          'g'
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ),
      ''
    )
  `

function buildSalesSegmentationSearchCtes(
  brandScopeSql,
) {
  return `
    filter_brand_labels AS (
      SELECT DISTINCT ON (sales.brand_id)
        sales.brand_id,
        CASE
          WHEN UPPER(
            ${normalizeTextSql('source.brand')}
          ) = 'MERIVA TECHNOLOGY - STREAMAX'
            THEN 'STREAMAX - MERIVA'
          ELSE ${normalizeTextSql('source.brand')}
        END AS label
      FROM normalized_sales AS sales
      INNER JOIN sales_source AS source
        ON source.id = sales.id
      WHERE sales.brand_id IS NOT NULL
      ORDER BY
        sales.brand_id,
        sales.sale_date,
        sales.id
    ),
    filter_customer_master_labels AS (
      SELECT
        customer_id,
        name
      FROM customers
    ),
    filter_scoped_customer_sales AS (
      SELECT
        id,
        sale_date,
        customer_id,
        customer_name,
        brand
      FROM sales_facts
      ${brandScopeSql}
    ),
    filter_customer_label_source AS (
      SELECT
        scoped.id,
        scoped.sale_date,
        ${normalizeSql('scoped.customer_id')} AS customer_id,
        ${normalizeTextSql('scoped.customer_name')} AS customer_name
      FROM filter_scoped_customer_sales AS scoped
    ),
    filter_customer_sales_labels AS (
      SELECT DISTINCT ON (customer_id)
        customer_id,
        customer_name
      FROM filter_customer_label_source
      WHERE
        customer_id IS NOT NULL
        AND customer_name IS NOT NULL
      ORDER BY
        customer_id,
        sale_date DESC,
        id DESC
    ),
    filter_product_master_labels AS (
      SELECT DISTINCT ON (name_key)
        name_key AS product_id,
        model
      FROM normalized_products
      WHERE name_key IS NOT NULL
      ORDER BY
        name_key,
        id
    ),
    filter_product_fallback_labels AS (
      SELECT DISTINCT ON (canonical.product_id)
        canonical.product_id,
        COALESCE(
          ${normalizeTextSql('source.model')},
          reconciled.product_name_key,
          reconciled.product_code_key,
          canonical.product_id
        ) AS label
      FROM canonical_sales AS canonical
      INNER JOIN reconciled_sales AS reconciled
        ON reconciled.id = canonical.id
      INNER JOIN sales_source AS source
        ON source.id = canonical.id
      WHERE canonical.product_id IS NOT NULL
      ORDER BY
        canonical.product_id,
        canonical.sale_date,
        canonical.id
    )
  `
}

function buildSalesSegmentationFilterQuery(
  filter,
  brandScopeSql,
  firstParameterIndex,
  {
    periodFilteredAtSource = false,
  } = {},
) {
  const params = []
  const conditions = []

  const addParameter = (value) => {
    const index =
      firstParameterIndex + params.length

    params.push(value)
    return `$${index}`
  }

  const addListFilter = (
    values,
    column,
  ) => {
    const normalized =
      normalizeSalesSegmentationList(values)

    if (!normalized || normalized.length === 0) {
      return
    }

    const parameter =
      addParameter(normalized)

    conditions.push(`
      ${normalizeSalesSegmentationSql(column)} =
        ANY(${parameter}::TEXT[])
    `)
  }

  // Repeating the period filter on canonical rows changes no result, but
  // the planner cannot estimate it and falls back to nested loops.
  if (!periodFilteredAtSource) {
    addListFilter(
      filter.periodIds,
      'canonical.period_id',
    )
  }

  if (filter.dateFrom) {
    const parameter =
      addParameter(filter.dateFrom)

    conditions.push(`
      canonical.sale_date::TEXT >= ${parameter}
    `)
  }

  if (filter.dateTo) {
    const parameter =
      addParameter(filter.dateTo)

    conditions.push(`
      canonical.sale_date::TEXT <= ${parameter}
    `)
  }

  addListFilter(
    filter.brandIds,
    'canonical.brand_id',
  )
  addListFilter(
    filter.customerIds,
    'canonical.customer_id',
  )
  addListFilter(
    filter.productIds,
    'canonical.product_id',
  )
  addListFilter(
    filter.locationIds,
    'canonical.location_id',
  )
  addListFilter(
    filter.salesRepresentativeIds,
    'canonical.sales_representative_id',
  )

  const normalizedSearch =
    filter.searchTerm
      ? normalizeSalesSegmentationValue(
          filter.searchTerm,
        )
      : ''

  let searchCtes = ''
  let searchJoins = ''

  if (normalizedSearch) {
    const searchParameter =
      addParameter(normalizedSearch)

    searchCtes = `
      ${buildSalesSegmentationSearchCtes(
        brandScopeSql,
      )},
    `

    searchJoins = `
      LEFT JOIN filter_brand_labels
        AS filter_brand
        ON filter_brand.brand_id =
          canonical.brand_id
      LEFT JOIN filter_customer_master_labels
        AS filter_customer_master
        ON filter_customer_master.customer_id =
          canonical.customer_id
      LEFT JOIN filter_customer_sales_labels
        AS filter_customer_sales
        ON filter_customer_sales.customer_id =
          canonical.customer_id
      LEFT JOIN filter_product_master_labels
        AS filter_product_master
        ON filter_product_master.product_id =
          canonical.product_id
      LEFT JOIN filter_product_fallback_labels
        AS filter_product_fallback
        ON filter_product_fallback.product_id =
          canonical.product_id
    `

    const brandLabel = `
      COALESCE(
        filter_brand.label,
        canonical.brand_id
      )
    `

    const customerLabel = `
      canonical.customer_id || ' ' ||
      COALESCE(
        NULLIF(
          filter_customer_master.name,
          ''
        ),
        filter_customer_sales.customer_name,
        'Cliente ' || canonical.customer_id
      )
    `

    const productLabel = `
      COALESCE(
        NULLIF(
          filter_product_master.model,
          ''
        ),
        filter_product_master.product_id,
        filter_product_fallback.label,
        canonical.product_id
      )
    `

    const searchableExpressions = [
      'canonical.period_id',
      'canonical.brand_id',
      brandLabel,
      'canonical.customer_id',
      customerLabel,
      'canonical.product_id',
      productLabel,
      'canonical.location_id',
      'canonical.sales_representative_id',
    ]

    conditions.push(`
      (
        ${searchableExpressions
          .map(
            (expression) => `
              ${normalizeSalesSegmentationSql(
                expression,
              )} LIKE
                '%' || ${searchParameter} || '%'
            `,
          )
          .join(' OR ')}
      )
    `)
  }

  if (conditions.length === 0) {
    return {
      ctes: '',
      params,
      canonicalSource: 'canonical_sales',
      segmentSource: 'sales_segments',
    }
  }

  return {
    ctes: `
      ,
      ${searchCtes}
      filtered_canonical_sales AS (
        SELECT canonical.*
        FROM canonical_sales AS canonical
        ${searchJoins}
        WHERE
          canonical.brand_id IS NOT NULL
          AND ${conditions.join('\n          AND ')}
      ),
      filtered_sales_segments AS (
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
        FROM filtered_canonical_sales
        GROUP BY
          sale_date,
          period_id,
          brand_id,
          customer_id,
          product_id,
          location_id,
          sales_representative_id
      )
    `,
    params,
    canonicalSource:
      'filtered_canonical_sales',
    segmentSource:
      'filtered_sales_segments',
  }
}

function getSalesSegmentationDimensionColumn(
  dimension,
) {
  const column =
    salesSegmentationDimensionColumns[dimension]

  if (!column) {
    throw new Error(
      `Unsupported sales segmentation dimension: ${dimension}`,
    )
  }

  return column
}

function buildSalesSegmentationLabelQuery(
  dimension,
  brandScopeSql,
) {
  switch (dimension) {
    case 'brand':
      return {
        ctes: `
          brand_labels AS (
            SELECT DISTINCT ON (sales.brand_id)
              sales.brand_id,
              CASE
                WHEN UPPER(
                  ${normalizeTextSql('source.brand')}
                ) = 'MERIVA TECHNOLOGY - STREAMAX'
                  THEN 'STREAMAX - MERIVA'
                ELSE ${normalizeTextSql('source.brand')}
              END AS label
            FROM normalized_sales AS sales
            INNER JOIN sales_source AS source
              ON source.id = sales.id
            WHERE sales.brand_id IS NOT NULL
            ORDER BY
              sales.brand_id,
              sales.sale_date,
              sales.id
          )
        `,
        labelSql:
          'COALESCE(brand_label.label, group_data.id)',
        joinSql: `
          LEFT JOIN brand_labels AS brand_label
            ON brand_label.brand_id = group_data.id
        `,
      }

    case 'customer':
      return {
        ctes: `
          customer_master_labels AS (
            SELECT
              customer_id,
              name
            FROM customers
          ),
          scoped_customer_sales AS (
            SELECT
              id,
              sale_date,
              customer_id,
              customer_name,
              brand
            FROM sales_facts
            ${brandScopeSql}
          ),
          customer_label_source AS (
            SELECT
              scoped.id,
              scoped.sale_date,
              ${normalizeSql('scoped.customer_id')} AS customer_id,
              ${normalizeTextSql('scoped.customer_name')} AS customer_name
            FROM scoped_customer_sales AS scoped
          ),
          customer_sales_labels AS (
            SELECT DISTINCT ON (customer_id)
              customer_id,
              customer_name
            FROM customer_label_source
            WHERE
              customer_id IS NOT NULL
              AND customer_name IS NOT NULL
            ORDER BY
              customer_id,
              sale_date DESC,
              id DESC
          )
        `,
        labelSql: `
          group_data.id || ' ' ||
          COALESCE(
            NULLIF(customer_master.name, ''),
            customer_sales.customer_name,
            'Cliente ' || group_data.id
          )
        `,
        joinSql: `
          LEFT JOIN customer_master_labels AS customer_master
            ON customer_master.customer_id = group_data.id
          LEFT JOIN customer_sales_labels AS customer_sales
            ON customer_sales.customer_id = group_data.id
        `,
      }

    case 'product':
      return {
        ctes: `
          product_master_labels AS (
            SELECT DISTINCT ON (name_key)
              name_key AS product_id,
              model
            FROM normalized_products
            WHERE name_key IS NOT NULL
            ORDER BY
              name_key,
              id
          ),
          product_fallback_labels AS (
            SELECT DISTINCT ON (canonical.product_id)
              canonical.product_id,
              COALESCE(
                ${normalizeTextSql('source.model')},
                reconciled.product_name_key,
                reconciled.product_code_key,
                canonical.product_id
              ) AS label
            FROM canonical_sales AS canonical
            INNER JOIN reconciled_sales AS reconciled
              ON reconciled.id = canonical.id
            INNER JOIN sales_source AS source
              ON source.id = canonical.id
            WHERE canonical.product_id IS NOT NULL
            ORDER BY
              canonical.product_id,
              canonical.sale_date,
              canonical.id
          )
        `,
        labelSql: `
          COALESCE(
            NULLIF(product_master.model, ''),
            product_master.product_id,
            product_fallback.label,
            group_data.id
          )
        `,
        joinSql: `
          LEFT JOIN product_master_labels AS product_master
            ON product_master.product_id = group_data.id
          LEFT JOIN product_fallback_labels AS product_fallback
            ON product_fallback.product_id = group_data.id
        `,
      }

    case 'period':
    case 'location':
    case 'salesRepresentative':
      return {
        ctes: '',
        labelSql: 'group_data.id',
        joinSql: '',
      }

    default:
      throw new Error(
        `Unsupported sales segmentation dimension: ${dimension}`,
      )
  }
}

function mapSalesSegmentationGroup(row) {
  const revenue =
    Number(row.revenue ?? 0)

  const grossProfit =
    Number(row.gross_profit ?? 0)

  return {
    id: String(row.id),
    label: String(row.label ?? row.id),
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
    productCount:
      Number(row.product_count ?? 0),
    rowCount:
      Number(row.row_count ?? 0),
  }
}

function sortSalesSegmentationGroups(
  dimension,
  groups,
) {
  if (dimension === 'period') {
    return groups.sort(
      (left, right) =>
        left.id.localeCompare(right.id),
    )
  }

  return groups.sort(
    (left, right) =>
      right.revenue - left.revenue ||
      left.label.localeCompare(
        right.label,
        'es-MX',
      ),
  )
}

/**
 * Server-side equivalent of SalesSegmentationQueries.groupBy()
 * for the complete access-scoped sales history.
 *
 * @param {import('pg').Pool} pool
 * @param {'period' | 'brand' | 'customer' | 'product' | 'location' | 'salesRepresentative'} dimension
 * @param {{ scope: 'all' | 'assigned', brandIds: string[] }} [access]
 * @param {{
 *   periodIds?: readonly string[],
 *   dateFrom?: string,
 *   dateTo?: string,
 *   brandIds?: readonly string[],
 *   customerIds?: readonly string[],
 *   productIds?: readonly string[],
 *   locationIds?: readonly string[],
 *   salesRepresentativeIds?: readonly string[],
 *   searchTerm?: string,
 * }} [filter]
 */
export async function groupSalesSegmentation(
  pool,
  dimension,
  access = {
    scope: 'all',
    brandIds: [],
  },
  filter = {},
) {
  const dimensionColumn =
    getSalesSegmentationDimensionColumn(
      dimension,
    )

  const client = await pool.connect()

  try {
    const brandScopeFilter =
      buildBrandScopeFilter(access)

    const sourceQuery =
      buildSalesSegmentationSourceQuery(
        filter,
        brandScopeFilter,
      )

    const ctes =
      buildProductIdentityCtes(
        brandScopeFilter.sql,
        {
          salesSourceScopeSql:
            sourceQuery.sql,
          fallbackOwnersCte:
            buildPersistedFallbackOwnersCte(
              access,
            ),
        },
      )

    const filterQuery =
      buildSalesSegmentationFilterQuery(
        filter,
        brandScopeFilter.sql,
        brandScopeFilter.params.length +
          sourceQuery.params.length +
          1,
        {
          periodFilteredAtSource:
            sourceQuery.periodFilteredAtSource,
        },
      )

    const labelQuery =
      buildSalesSegmentationLabelQuery(
        dimension,
        brandScopeFilter.sql,
      )

    const extraLabelCtes =
      labelQuery.ctes.trim()
        ? `,${labelQuery.ctes}`
        : ''

    const result = await client.query(
      `
        ${ctes}
        ${filterQuery.ctes}
        ${extraLabelCtes},
        grouped_documents AS (
          SELECT
            canonical.${dimensionColumn} AS id,
            COUNT(
              DISTINCT canonical.document_number
            )::INTEGER AS documents
          FROM ${filterQuery.canonicalSource} AS canonical
          WHERE
            canonical.brand_id IS NOT NULL
            AND canonical.${dimensionColumn} IS NOT NULL
          GROUP BY canonical.${dimensionColumn}
        ),
        dimension_groups AS (
          SELECT
            segment.${dimensionColumn} AS id,
            SUM(segment.revenue) AS revenue,
            SUM(segment.gross_profit) AS gross_profit,
            SUM(segment.quantity) AS quantity,
            COUNT(
              DISTINCT segment.customer_id
            )::INTEGER AS customer_count,
            COUNT(
              DISTINCT segment.product_id
            )::INTEGER AS product_count,
            SUM(segment.row_count)::INTEGER AS row_count
          FROM ${filterQuery.segmentSource} AS segment
          WHERE segment.${dimensionColumn} IS NOT NULL
          GROUP BY segment.${dimensionColumn}
        )

        SELECT
          group_data.id,
          ${labelQuery.labelSql} AS label,
          group_data.revenue,
          group_data.gross_profit,
          group_data.quantity,
          COALESCE(
            document_data.documents,
            0
          )::INTEGER AS documents,
          group_data.customer_count,
          group_data.product_count,
          group_data.row_count
        FROM dimension_groups AS group_data
        LEFT JOIN grouped_documents AS document_data
          ON document_data.id = group_data.id
        ${labelQuery.joinSql}
      `,
      [
        ...brandScopeFilter.params,
        ...sourceQuery.params,
        ...filterQuery.params,
      ],
    )

    const groups =
      result.rows.map(
        mapSalesSegmentationGroup,
      )

    return sortSalesSegmentationGroups(
      dimension,
      groups,
    )
  } finally {
    client.release()
  }
}

const salesSegmentationFilterDimensionFields = {
  brand: 'brandIds',
  customer: 'customerIds',
  product: 'productIds',
  location: 'locationIds',
  salesRepresentative: 'salesRepresentativeIds',
}

function buildFacetedSalesSegmentationFilter(
  filter,
  periodId,
  dimension,
) {
  const field =
    salesSegmentationFilterDimensionFields[dimension]

  if (!field) {
    throw new Error(
      `Unsupported sales filter option dimension: ${dimension}`,
    )
  }

  const facetedFilter = {
    ...filter,
    periodIds: [periodId],
  }

  delete facetedFilter[field]

  return facetedFilter
}

function mapSalesSegmentationOptions(groups) {
  return groups
    .map((group) => ({
      id: group.id,
      label: group.label,
      revenue: group.revenue,
    }))
    .sort((left, right) =>
      left.label.localeCompare(
        right.label,
        'es-MX',
      ),
    )
}

/**
 * Server-side equivalent of Sales Workspace buildFilterOptions().
 *
 * Each facet keeps the selected period and all active segmentation filters,
 * except its own dimension. Search remains active for every facet.
 *
 * @param {import('pg').Pool} pool
 * @param {string} periodId
 * @param {{ scope: 'all' | 'assigned', brandIds: string[] }} [access]
 * @param {{
 *   dateFrom?: string,
 *   dateTo?: string,
 *   brandIds?: readonly string[],
 *   customerIds?: readonly string[],
 *   productIds?: readonly string[],
 *   locationIds?: readonly string[],
 *   salesRepresentativeIds?: readonly string[],
 *   searchTerm?: string,
 * }} [filter]
 */
export async function loadSalesSegmentationFilterOptions(
  pool,
  periodId,
  access = {
    scope: 'all',
    brandIds: [],
  },
  filter = {},
) {
  const dimensions = [
    ['brands', 'brand'],
    ['customers', 'customer'],
    ['products', 'product'],
    ['locations', 'location'],
    [
      'salesRepresentatives',
      'salesRepresentative',
    ],
  ]

  const grouped = await Promise.all(
    dimensions.map(([, dimension]) =>
      groupSalesSegmentation(
        pool,
        dimension,
        access,
        buildFacetedSalesSegmentationFilter(
          filter,
          periodId,
          dimension,
        ),
      ),
    ),
  )

  return Object.fromEntries(
    dimensions.map(
      ([key], index) => [
        key,
        mapSalesSegmentationOptions(
          grouped[index],
        ),
      ],
    ),
  )
}

function bindSalesSegmentationLabelQuery(
  labelQuery,
  idSql,
) {
  return {
    ctes: labelQuery.ctes,
    labelSql:
      labelQuery.labelSql.replaceAll(
        'group_data.id',
        idSql,
      ),
    joinSql:
      labelQuery.joinSql.replaceAll(
        'group_data.id',
        idSql,
      ),
  }
}

function buildSalesSegmentationSegmentIdSql(
  alias,
) {
  return `
    ${alias}.sale_date::TEXT ||
    '::' || ${alias}.period_id ||
    '::' || ${alias}.brand_id ||
    '::' || COALESCE(
      ${alias}.customer_id,
      'NO_CUSTOMER'
    ) ||
    '::' || COALESCE(
      ${alias}.product_id,
      'NO_PRODUCT'
    ) ||
    '::' || COALESCE(
      ${alias}.location_id,
      'NO_LOCATION'
    ) ||
    '::' || COALESCE(
      ${alias}.sales_representative_id,
      'NO_SALES_REP'
    )
  `
}

function mapSalesSegmentationDetailRow(row) {
  const revenue =
    Number(row.revenue ?? 0)

  const grossProfit =
    Number(row.gross_profit ?? 0)

  return {
    id: String(row.id),
    periodId: String(row.period_id),
    brandId: String(row.brand_id),
    brandLabel:
      String(
        row.brand_label ??
        row.brand_id,
      ),
    customerId:
      row.customer_id == null
        ? null
        : String(row.customer_id),
    customerLabel:
      String(
        row.customer_label ??
        'Sin cliente',
      ),
    productId:
      row.product_id == null
        ? null
        : String(row.product_id),
    productLabel:
      String(
        row.product_label ??
        'Sin producto',
      ),
    locationId:
      row.location_id == null
        ? null
        : String(row.location_id),
    locationLabel:
      String(
        row.location_label ??
        'Sin ubicación',
      ),
    salesRepresentativeId:
      row.sales_representative_id == null
        ? null
        : String(
          row.sales_representative_id,
        ),
    salesRepresentativeLabel:
      String(
        row.sales_representative_label ??
        'Sin vendedor',
      ),
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
    rowCount:
      Number(row.row_count ?? 0),
  }
}

/**
 * Server-side equivalent of SalesSegmentationQueries.getDetailRows().
 *
 * Preserves the current segmentation grain, filters, labels, document counts,
 * revenue ordering, segment-id tie break and limit semantics.
 *
 * @param {import('pg').Pool} pool
 * @param {{ scope: 'all' | 'assigned', brandIds: string[] }} [access]
 * @param {{
 *   periodIds?: readonly string[],
 *   dateFrom?: string,
 *   dateTo?: string,
 *   brandIds?: readonly string[],
 *   customerIds?: readonly string[],
 *   productIds?: readonly string[],
 *   locationIds?: readonly string[],
 *   salesRepresentativeIds?: readonly string[],
 *   searchTerm?: string,
 * }} [filter]
 * @param {number} [limit]
 */
export async function loadSalesSegmentationDetailRows(
  pool,
  access = {
    scope: 'all',
    brandIds: [],
  },
  filter = {},
  limit = 100,
) {
  const normalizedLimit =
    Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : 0

  if (normalizedLimit === 0) {
    return []
  }

  const client = await pool.connect()

  try {
    const brandScopeFilter =
      buildBrandScopeFilter(access)

    const sourceQuery =
      buildSalesSegmentationSourceQuery(
        filter,
        brandScopeFilter,
      )

    const ctes =
      buildProductIdentityCtes(
        brandScopeFilter.sql,
        {
          salesSourceScopeSql:
            sourceQuery.sql,
          fallbackOwnersCte:
            buildPersistedFallbackOwnersCte(
              access,
            ),
        },
      )

    const filterQuery =
      buildSalesSegmentationFilterQuery(
        filter,
        brandScopeFilter.sql,
        brandScopeFilter.params.length +
          sourceQuery.params.length +
          1,
        {
          periodFilteredAtSource:
            sourceQuery.periodFilteredAtSource,
        },
      )

    const brandLabelQuery =
      bindSalesSegmentationLabelQuery(
        buildSalesSegmentationLabelQuery(
          'brand',
          brandScopeFilter.sql,
        ),
        'group_data.brand_id',
      )

    const customerLabelQuery =
      bindSalesSegmentationLabelQuery(
        buildSalesSegmentationLabelQuery(
          'customer',
          brandScopeFilter.sql,
        ),
        'group_data.customer_id',
      )

    const productLabelQuery =
      bindSalesSegmentationLabelQuery(
        buildSalesSegmentationLabelQuery(
          'product',
          brandScopeFilter.sql,
        ),
        'group_data.product_id',
      )

    const labelCtes = [
      brandLabelQuery.ctes,
      customerLabelQuery.ctes,
      productLabelQuery.ctes,
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(',\n')

    const extraLabelCtes =
      labelCtes
        ? ',\n' + labelCtes
        : ''

    const limitParameter =
      brandScopeFilter.params.length +
      sourceQuery.params.length +
      filterQuery.params.length +
      1

    const result = await client.query(
      `
        ${ctes}
        ${filterQuery.ctes}
        ${extraLabelCtes},
        segment_documents AS (
          SELECT
            canonical.sale_date,
            canonical.period_id,
            canonical.brand_id,
            canonical.customer_id,
            canonical.product_id,
            canonical.location_id,
            canonical.sales_representative_id,
            COUNT(
              DISTINCT canonical.document_number
            )::INTEGER AS documents
          FROM ${filterQuery.canonicalSource} AS canonical
          WHERE canonical.brand_id IS NOT NULL
          GROUP BY
            canonical.sale_date,
            canonical.period_id,
            canonical.brand_id,
            canonical.customer_id,
            canonical.product_id,
            canonical.location_id,
            canonical.sales_representative_id
        ),
        detail_groups AS (
          SELECT
            ${buildSalesSegmentationSegmentIdSql(
              'segment',
            )} AS id,
            segment.period_id,
            segment.brand_id,
            segment.customer_id,
            segment.product_id,
            segment.location_id,
            segment.sales_representative_id,
            segment.revenue,
            segment.gross_profit,
            segment.quantity,
            COALESCE(
              document_data.documents,
              0
            )::INTEGER AS documents,
            segment.row_count
          FROM ${filterQuery.segmentSource} AS segment
          LEFT JOIN segment_documents AS document_data
            ON document_data.sale_date =
              segment.sale_date
            AND document_data.period_id =
              segment.period_id
            AND document_data.brand_id =
              segment.brand_id
            AND document_data.customer_id
              IS NOT DISTINCT FROM
                segment.customer_id
            AND document_data.product_id
              IS NOT DISTINCT FROM
                segment.product_id
            AND document_data.location_id
              IS NOT DISTINCT FROM
                segment.location_id
            AND document_data.sales_representative_id
              IS NOT DISTINCT FROM
                segment.sales_representative_id
        )

        SELECT
          group_data.id,
          group_data.period_id,
          group_data.brand_id,
          ${brandLabelQuery.labelSql}
            AS brand_label,
          group_data.customer_id,
          CASE
            WHEN group_data.customer_id IS NULL
              THEN 'Sin cliente'
            ELSE ${customerLabelQuery.labelSql}
          END AS customer_label,
          group_data.product_id,
          CASE
            WHEN group_data.product_id IS NULL
              THEN 'Sin producto'
            ELSE ${productLabelQuery.labelSql}
          END AS product_label,
          group_data.location_id,
          COALESCE(
            group_data.location_id,
            'Sin ubicación'
          ) AS location_label,
          group_data.sales_representative_id,
          COALESCE(
            group_data.sales_representative_id,
            'Sin vendedor'
          ) AS sales_representative_label,
          group_data.revenue,
          group_data.gross_profit,
          group_data.quantity,
          group_data.documents,
          group_data.row_count
        FROM detail_groups AS group_data
        ${brandLabelQuery.joinSql}
        ${customerLabelQuery.joinSql}
        ${productLabelQuery.joinSql}
        ORDER BY
          group_data.revenue DESC,
          group_data.id ASC
        LIMIT $${limitParameter}
      `,
      [
        ...brandScopeFilter.params,
        ...sourceQuery.params,
        ...filterQuery.params,
        normalizedLimit,
      ],
    )

    return result.rows.map(
      mapSalesSegmentationDetailRow,
    )
  } finally {
    client.release()
  }
}

