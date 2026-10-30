BEGIN;

-- 035_sales_fallback_owner_candidates.sql
-- Persiste la propiedad histórica mínima necesaria para la identidad canónica
-- de productos de Sales Analytics. Evita reconstruir todo sales_facts en cada
-- consulta interactiva, sin restringir el historial de ventas.
--
-- La granularidad (base_id, scope_brand_key) preserva scope='assigned':
-- el owner final se sigue eligiendo dentro de las marcas autorizadas y
-- respetando el primer registro histórico por sale_date, id.

CREATE MATERIALIZED VIEW public.sales_fallback_owner_candidates AS
WITH normalized_sales AS (
  SELECT
    f.id,
    f.sale_date,
    REGEXP_REPLACE(
      UPPER(f.brand),
      '[^A-Z0-9]',
      '',
      'g'
    ) AS scope_brand_key,
    NULLIF(
      UPPER(
        REGEXP_REPLACE(
          BTRIM(f.brand),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS reconciliation_brand_key,
    CASE
      WHEN NULLIF(
        UPPER(
          REGEXP_REPLACE(
            BTRIM(f.brand),
            '[[:space:]]+',
            ' ',
            'g'
          )
        ),
        ''
      ) = 'MERIVA TECHNOLOGY - STREAMAX'
        THEN 'STREAMAX - MERIVA'
      ELSE NULLIF(
        UPPER(
          REGEXP_REPLACE(
            BTRIM(f.brand),
            '[[:space:]]+',
            ' ',
            'g'
          )
        ),
        ''
      )
    END AS brand_id,
    NULLIF(
      UPPER(
        REGEXP_REPLACE(
          BTRIM(f.product_name),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS product_name_key,
    NULLIF(
      UPPER(
        REGEXP_REPLACE(
          BTRIM(f.product_code),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS product_code_key,
    NULLIF(
      UPPER(
        REGEXP_REPLACE(
          BTRIM(f.model),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS model_key
  FROM public.sales_facts AS f
),
normalized_products AS (
  SELECT
    p.id,
    NULLIF(
      UPPER(
        REGEXP_REPLACE(
          BTRIM(p.name),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS name_key,
    NULLIF(
      UPPER(
        REGEXP_REPLACE(
          BTRIM(p.code),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS code_key,
    NULLIF(
      UPPER(
        REGEXP_REPLACE(
          BTRIM(p.brand),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS brand_key,
    NULLIF(
      UPPER(
        REGEXP_REPLACE(
          BTRIM(p.model),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS model_key
  FROM public.products AS p
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
    brand_key || '::' || model_key AS identity_key,
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
    END AS status
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
    reconciled.id,
    reconciled.sale_date,
    reconciled.scope_brand_key,
    reconciled.brand_id,
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
    reconciled.scope_brand_key IS NOT NULL
    AND reconciled.brand_id IS NOT NULL
    AND reconciled.matched_product_id IS NULL
    AND reconciled.status <> 'ambiguous'
    AND COALESCE(
      reconciled.product_name_key,
      reconciled.product_code_key,
      reconciled.model_key
    ) IS NOT NULL
),
eligible_candidates AS (
  SELECT
    candidate.*
  FROM fallback_candidates AS candidate
  LEFT JOIN product_master_names AS master
    ON master.product_id =
      candidate.base_id
  WHERE master.product_id IS NULL
)
SELECT DISTINCT ON (
  candidate.base_id,
  candidate.scope_brand_key
)
  candidate.base_id,
  candidate.scope_brand_key,
  candidate.brand_id,
  candidate.resolved_model_key,
  candidate.sale_date AS first_sale_date,
  candidate.id AS first_sale_id
FROM eligible_candidates AS candidate
ORDER BY
  candidate.base_id,
  candidate.scope_brand_key,
  candidate.sale_date,
  candidate.id;

CREATE UNIQUE INDEX uq_sales_fallback_owner_candidates
  ON public.sales_fallback_owner_candidates (
    base_id,
    scope_brand_key
  );

CREATE INDEX idx_sales_fallback_owner_candidates_base
  ON public.sales_fallback_owner_candidates (
    base_id
  );

CREATE INDEX idx_sales_fallback_owner_candidates_scope_brand
  ON public.sales_fallback_owner_candidates (
    scope_brand_key
  );

CREATE OR REPLACE FUNCTION public.refresh_sales_fallback_owner_candidates(
  p_concurrently BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(350035);
  REFRESH MATERIALIZED VIEW public.sales_fallback_owner_candidates;
END;
$$;

COMMENT ON MATERIALIZED VIEW public.sales_fallback_owner_candidates IS
  'Historical fallback product identity candidates used by Sales Analytics.';

COMMENT ON FUNCTION public.refresh_sales_fallback_owner_candidates(BOOLEAN) IS
  'Refreshes the historical fallback product identity cache after sales or product imports.';

ALTER MATERIALIZED VIEW public.sales_fallback_owner_candidates
  OWNER TO pm_intelligence;

ALTER FUNCTION public.refresh_sales_fallback_owner_candidates(BOOLEAN)
  OWNER TO pm_intelligence;

REVOKE ALL
  ON FUNCTION public.refresh_sales_fallback_owner_candidates(BOOLEAN)
  FROM PUBLIC;

GRANT SELECT
  ON TABLE public.sales_fallback_owner_candidates
  TO pm_intelligence;

GRANT EXECUTE
  ON FUNCTION public.refresh_sales_fallback_owner_candidates(BOOLEAN)
  TO pm_intelligence;

COMMIT;
