function normalizeSearchValue(
  value,
) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleUpperCase('es-MX')
}

function normalizeSql(
  expression,
) {
  return `
    REGEXP_REPLACE(
      TRANSLATE(
        UPPER(
          BTRIM(
            COALESCE(
              ${expression},
              ''
            )
          )
        ),
        'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑ',
        'AAAAAEEEEIIIIOOOOOUUUUN'
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  `
}

function scoreSql(
  expressions,
) {
  const scores =
    expressions.map(
      (expression) => {
        const normalized =
          normalizeSql(
            expression,
          )

        return `
          CASE
            WHEN ${normalized} = $1
              THEN 0
            WHEN LEFT(
              ${normalized},
              LENGTH($1)
            ) = $1
              THEN 1
            WHEN STRPOS(
              ' ' || ${normalized},
              ' ' || $1
            ) > 0
              THEN 2
            WHEN STRPOS(
              ${normalized},
              $1
            ) > 0
              THEN 3
            ELSE 99
          END
        `
      },
    )

  return `
    LEAST(
      ${scores.join(',\n')}
    )
  `
}

const brandScore =
  scoreSql([
    'id',
    'name',
  ])

const customerScore =
  scoreSql([
    'customer_id',
    'name',
    'internal_id',
    'email',
    'phone',
    'sales_rep',
    'assigned_kam',
    'tax_id',
  ])

const productScore =
  scoreSql([
    'route_id',
    'model',
    'route_id',
    'brand',
    'name',
    'code',
    'erp_internal_id',
    'vendor_code',
    'description',
  ])

async function searchBrands(
  pool,
  params,
) {
  const result =
    await pool.query(
      `
        WITH brand_keys AS (
          SELECT DISTINCT
            brand_key AS id
          FROM brand_period_scorecard
          WHERE
            brand_key IS NOT NULL
            AND brand_key <> ''
            AND (
              NOT $3::BOOLEAN
              OR brand_key = ANY(
                $2::TEXT[]
              )
            )
        ),

        product_brand_names AS (
          SELECT DISTINCT ON (
            brand_key(brand)
          )
            brand_key(brand) AS id,
            BTRIM(brand) AS name
          FROM products
          WHERE
            NULLIF(
              BTRIM(brand),
              ''
            ) IS NOT NULL
            AND (
              NOT $3::BOOLEAN
              OR brand_key(brand) = ANY(
                $2::TEXT[]
              )
            )
          ORDER BY
            brand_key(brand),
            BTRIM(brand)
        ),

        source AS (
          SELECT
            keys.id,
            COALESCE(
              product_names.name,
              keys.id
            ) AS name
          FROM brand_keys keys
          LEFT JOIN product_brand_names
            product_names
            ON product_names.id =
              keys.id
        ),

        ranked AS (
          SELECT
            id,
            name,
            ${brandScore} AS score
          FROM source
        )

        SELECT
          id,
          name,
          score
        FROM ranked
        WHERE score < 99
        ORDER BY
          score,
          ${normalizeSql('name')},
          id
        LIMIT 5
      `,
      params,
    )

  return result.rows.map(
    (row) => ({
      id: row.id,
      name: row.name,
      score:
        Number(row.score),
    }),
  )
}

async function searchCustomers(
  pool,
  params,
) {
  const result =
    await pool.query(
      `
        WITH source AS (
          SELECT DISTINCT ON (
            customer_id
          )
            customer_id,
            name,
            internal_id,
            email,
            phone,
            sales_rep,
            assigned_kam,
            tax_id
          FROM customers
          WHERE
            NULLIF(
              BTRIM(customer_id),
              ''
            ) IS NOT NULL
            AND (
              NOT $3::BOOLEAN
              OR EXISTS (
                SELECT 1
                FROM
                  brand_customer_period_metrics
                    metrics
                WHERE
                  metrics.customer_id =
                    customers.customer_id
                  AND metrics.brand_key =
                    ANY(
                      $2::TEXT[]
                    )
              )
            )
          ORDER BY
            customer_id,
            id
        ),

        ranked AS (
          SELECT
            customer_id,
            name,
            internal_id,
            email,
            phone,
            sales_rep,
            assigned_kam,
            tax_id,
            ${customerScore} AS score
          FROM source
        )

        SELECT
          customer_id,
          name,
          internal_id,
          email,
          phone,
          sales_rep,
          assigned_kam,
          tax_id,
          score
        FROM ranked
        WHERE score < 99
        ORDER BY
          score,
          ${normalizeSql('COALESCE(name, customer_id)')},
          customer_id
        LIMIT 5
      `,
      params,
    )

  return result.rows.map(
    (row) => ({
      id:
        row.customer_id,

      name:
        row.name,

      erpInternalId:
        row.internal_id,

      email:
        row.email,

      phone:
        row.phone,

      salesRep:
        row.sales_rep,

      assignedKam:
        row.assigned_kam,

      taxId:
        row.tax_id,

      score:
        Number(row.score),
    }),
  )
}

async function searchProducts(
  pool,
  params,
) {
  const routeIdSql =
    normalizeSql(
      'COALESCE(name, code)',
    )

  const result =
    await pool.query(
      `
        WITH normalized AS (
          SELECT
            id,
            ${routeIdSql}
              AS route_id,
            name,
            code,
            model,
            brand,
            erp_internal_id,
            vendor_code,
            description
          FROM products
        ),

        source AS (
          SELECT DISTINCT ON (
            route_id
          )
            route_id,
            name,
            code,
            model,
            brand,
            erp_internal_id,
            vendor_code,
            description
          FROM normalized
          WHERE
            route_id <> ''
            AND (
              NOT $3::BOOLEAN
              OR brand_key(brand) =
                ANY(
                  $2::TEXT[]
                )
            )
          ORDER BY
            route_id,
            name,
            id
        ),

        ranked AS (
          SELECT
            route_id,
            name,
            code,
            model,
            brand,
            erp_internal_id,
            vendor_code,
            description,
            ${productScore} AS score
          FROM source
        )

        SELECT
          route_id,
          name,
          code,
          model,
          brand,
          erp_internal_id,
          vendor_code,
          description,
          score
        FROM ranked
        WHERE score < 99
        ORDER BY
          score,
          ${normalizeSql(
            'COALESCE(model, name, route_id)',
          )},
          route_id
        LIMIT 5
      `,
      params,
    )

  return result.rows.map(
    (row) => ({
      id:
        row.route_id,

      name:
        row.name,

      code:
        row.code,

      model:
        row.model,

      sku:
        row.route_id,

      brand:
        row.brand,

      erpInternalId:
        row.erp_internal_id,

      vendorCode:
        row.vendor_code,

      description:
        row.description,

      score:
        Number(row.score),
    }),
  )
}

export async function searchGlobalCatalog(
  pool,
  {
    query,
    brandScope,
  },
) {
  const normalizedQuery =
    normalizeSearchValue(
      query,
    )

  if (
    normalizedQuery.length < 2
  ) {
    return {
      brands: [],
      customers: [],
      products: [],
    }
  }

  const assigned =
    brandScope?.mode ===
    'assigned'

  const brandKeys =
    assigned &&
    Array.isArray(
      brandScope?.brandKeys,
    )
      ? brandScope.brandKeys
      : []

  const params = [
    normalizedQuery,
    brandKeys,
    assigned,
  ]

  const [
    brands,
    customers,
    products,
  ] = await Promise.all([
    searchBrands(
      pool,
      params,
    ),

    searchCustomers(
      pool,
      params,
    ),

    searchProducts(
      pool,
      params,
    ),
  ])

  return {
    brands,
    customers,
    products,
  }
}