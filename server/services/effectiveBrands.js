// NAV-002: effective brands of a user.
//
// Every user has its own brand assignments (app_user_brand_assignments). An
// assistant ("Auxiliar") also inherits the assignments of the PMs linked to
// it (app_user_pm_links, migration 040), but only of PMs that are active and
// still have the pm role. The rule lives here so the authenticated user
// (requireBrandScope, resolveCostScope, /api/auth/me) and Acciones apply
// exactly the same brands.

export const ASSISTANT_ROLE = 'assistant'
export const PM_ROLE = 'pm'

// Linked PMs that count: active users with the pm role.
const ACTIVE_LINKED_PMS = `
  FROM app_user_pm_links l
  JOIN app_users pm
    ON pm.id = l.pm_user_id
   AND pm.active = TRUE
   AND pm.role = '${PM_ROLE}'`

/**
 * Subquery with one brand_id per row: own assignments plus, for an
 * assistant, the assignments of its active linked PMs. userIdSql and
 * roleSql are SQL expressions of the outer query (for example u.id, u.role).
 */
export function effectiveBrandIdsSql(userIdSql, roleSql) {
  return `
    SELECT own.brand_id
      FROM app_user_brand_assignments own
     WHERE own.user_id = ${userIdSql}
    UNION
    SELECT inherited.brand_id
    ${ACTIVE_LINKED_PMS}
      JOIN app_user_brand_assignments inherited
        ON inherited.user_id = pm.id
     WHERE l.assistant_user_id = ${userIdSql}
       AND ${roleSql} = '${ASSISTANT_ROLE}'`
}

/**
 * Brands inherited by an assistant ($1 = assistant id), with the PM each one
 * comes from. Locked for share when used inside a write transaction.
 */
export function inheritedBrandsSql({ forShare = false } = {}) {
  return `
    SELECT inherited.brand_id, pm.id AS pm_user_id, pm.name AS pm_name, pm.email AS pm_email
    ${ACTIVE_LINKED_PMS}
      JOIN app_user_brand_assignments inherited
        ON inherited.user_id = pm.id
     WHERE l.assistant_user_id = $1
     ORDER BY inherited.brand_id, pm.id
     ${forShare ? 'FOR SHARE OF l, pm, inherited' : ''}`
}

/** Active PMs linked to an assistant ($1 = assistant id). */
export function activeLinkedPmIdsSql({ forShare = false } = {}) {
  return `
    SELECT pm.id AS pm_user_id
    ${ACTIVE_LINKED_PMS}
     WHERE l.assistant_user_id = $1
     ORDER BY pm.id
     ${forShare ? 'FOR SHARE OF l, pm' : ''}`
}
