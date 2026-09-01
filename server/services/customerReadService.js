function dateOnlyOrNull(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (value instanceof Date) {
    return value
      .toISOString()
      .slice(0, 10)
  }

  const text =
    String(value)

  return text.length >= 10
    ? text.slice(0, 10)
    : text
}

function timestampOrNull(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed =
    new Date(value)

  return Number.isNaN(
    parsed.getTime(),
  )
    ? String(value)
    : parsed.toISOString()
}

export async function loadCustomerMasterDataset(
  pool,
) {
  const [
    customerResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          internal_id,
          customer_id,
          name,
          is_duplicate,
          primary_contact,
          category,
          sales_rep,
          sales_rep_location,
          assigned_kam,
          last_sale_date,
          inactive_date,
          phone,
          email,
          location,
          has_physical_location,
          department,
          specialty_brands,
          previous_sales_rep,
          customer_registration_form,
          price_level,
          whatsapp,
          service_segment,
          tax_id,
          catalog_delivered,
          registration_date,
          portal_access_blocked,
          contact_letter,
          billing_version,
          sales_classification,
          frequency_classification,
          purchase_amount_classification,
          permanent_free_local_shipping
        FROM customers
        ORDER BY
          customer_id,
          id
      `,
    ),

    pool.query(
      `
        SELECT
          file_name,
          uploaded_at,
          ignored_rows
        FROM data_imports
        WHERE
          dataset_type = 'customers'
          AND status = 'completed'
        ORDER BY
          id DESC
        LIMIT 1
      `,
    ),
  ])

  const latestImport =
    importResult.rows[0] ?? null

  if (
    customerResult.rows.length === 0 &&
    !latestImport
  ) {
    return null
  }

  const normalizedRows =
    customerResult.rows.map(
      (row) => ({
        internalId:
          row.internal_id,

        customerId:
          row.customer_id,

        name:
          row.name,

        isDuplicate:
          Boolean(
            row.is_duplicate,
          ),

        primaryContact:
          row.primary_contact,

        category:
          row.category,

        salesRep:
          row.sales_rep,

        salesRepLocation:
          row.sales_rep_location,

        assignedKam:
          row.assigned_kam,

        lastSaleDate:
          dateOnlyOrNull(
            row.last_sale_date,
          ),

        inactiveDate:
          dateOnlyOrNull(
            row.inactive_date,
          ),

        phone:
          row.phone,

        email:
          row.email,

        location:
          row.location,

        hasPhysicalLocation:
          Boolean(
            row.has_physical_location,
          ),

        department:
          row.department,

        specialtyBrands:
          row.specialty_brands,

        previousSalesRep:
          row.previous_sales_rep,

        customerRegistrationForm:
          row.customer_registration_form,

        priceLevel:
          row.price_level,

        whatsapp:
          row.whatsapp,

        serviceSegment:
          row.service_segment,

        taxId:
          row.tax_id,

        catalogDelivered:
          Boolean(
            row.catalog_delivered,
          ),

        registrationDate:
          dateOnlyOrNull(
            row.registration_date,
          ),

        portalAccessBlocked:
          Boolean(
            row.portal_access_blocked,
          ),

        contactLetter:
          row.contact_letter,

        billingVersion:
          row.billing_version,

        salesClassification:
          row.sales_classification,

        frequencyClassification:
          row.frequency_classification,

        purchaseAmountClassification:
          row.purchase_amount_classification,

        permanentFreeLocalShipping:
          Boolean(
            row.permanent_free_local_shipping,
          ),
      }),
    )

  return {
    normalizedRows,

    ignoredRows:
      Number(
        latestImport
          ?.ignored_rows ?? 0,
      ),

    lastImportedFile:
      latestImport
        ?.file_name ?? null,

    lastImportedAt:
      timestampOrNull(
        latestImport
          ?.uploaded_at,
      ),
  }
}