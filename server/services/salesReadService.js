function buildBrandScopeFilter(
  access,
) {
  if (
    access?.scope !== 'assigned'
  ) {
    return {
      sql: '',
      params: undefined,
    }
  }

  return {
    sql: `
      WHERE REGEXP_REPLACE(
        UPPER(brand),
        '[^A-Z0-9]',
        '',
        'g'
      ) = ANY($1::TEXT[])
    `,
    params: [
      access.brandIds ?? [],
    ],
  }
}

/**
 * @param {{ scope: 'all' | 'assigned', brandIds: string[] }} [access]
 */

export async function loadSalesDataset(
  pool,
  access = {
    scope: 'all',
    brandIds: [],
  },
) {
  const client =
    await pool.connect()

  try {
    const importResult =
      await client.query(
        `
          SELECT
            id,
            file_name,
            uploaded_at
          FROM data_imports
          WHERE
            dataset_type = 'sales'
            AND status = 'completed'
          ORDER BY
            completed_at DESC NULLS LAST,
            id DESC
          LIMIT 1
        `,
      )

    const latestImport =
      importResult.rows[0] ?? null

    if (
      latestImport === null
    ) {
      return null
    }

    const brandScopeFilter =
      buildBrandScopeFilter(
        access,
      )

    // Sales acumula histórico entre cargas.
    // El último import aporta metadatos,
    // pero no limita las filas consultadas.
    const rowsResult =
      await client.query(
        `
          SELECT
            sale_date,
            brand,
            revenue,
            gross_profit,
            customer_id,
            customer_name,
            product_name,
            product_code,
            model,
            product_status,
            quantity,
            document_number,
            location,
            sales_rep,
            currency
          FROM sales_facts
          ${brandScopeFilter.sql}
          ORDER BY
            sale_date,
            id
        `,
        brandScopeFilter.params,
      )

    if (
      rowsResult.rowCount === 0
    ) {
      return null
    }

    const normalizedRows =
      rowsResult.rows.map(
        (row) => ({
          date:
            row.sale_date
              .toISOString()
              .slice(0, 10),

          brand:
            row.brand,

          revenue:
            Number(
              row.revenue,
            ),

          grossProfit:
            Number(
              row.gross_profit,
            ),

          customerId:
            row.customer_id,

          customerName:
            row.customer_name,

          productName:
            row.product_name,

          productCode:
            row.product_code,

          model:
            row.model,

          productStatus:
            row.product_status,

          quantity:
            Number(
              row.quantity,
            ),

          documentNumber:
            row.document_number,

          location:
            row.location,

          salesRep:
            row.sales_rep,

          currency:
            row.currency,
        }),
      )

    return {
      normalizedRows,

      lastImportedFile:
        latestImport.file_name ??
        'PostgreSQL Sales',

      lastImportedAt:
        latestImport.uploaded_at
          ? new Date(
              latestImport.uploaded_at,
            ).toISOString()
          : new Date().toISOString(),
    }
  } finally {
    client.release()
  }
}