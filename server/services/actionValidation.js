export function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode })
}
export function positiveId(value, name = 'id') {
  const text = String(value ?? '')
  if (!['string', 'number'].includes(typeof value) || !/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(Number(text))) {
    throw httpError(400, `${name} debe ser un entero positivo`)
  }
  return Number(text)
}
export function periodId(value) {
  if (typeof value !== 'string' || !/^(?:19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value)) {
    throw httpError(400, 'Periodo inválido; utiliza YYYY-MM')
  }
  return value
}
export function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw httpError(400, 'Fecha inválida')
  const date = new Date(`${value}T00:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw httpError(400, 'Fecha inválida')
  return value
}
export function pageInteger(value, fallback, maximum, minimum = 0) {
  if (value === undefined) return fallback
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < minimum || Number(value) > maximum) {
    throw httpError(400, 'Parámetro de paginación o ventana inválido')
  }
  return Number(value)
}
export function textValue(value, name, max = 2000, nullable = false) {
  if (nullable && value == null) return null
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw httpError(400, `${name} inválido`)
  return value.trim()
}
export function numericValue(value, name) {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) >= 1e14) throw httpError(400, `${name} inválido`)
  return value
}
export function allowed(value, values, name) {
  if (!values.has(value)) throw httpError(400, `${name} inválido`)
  return value
}
export function handleRouteError(res, error, label) {
  const status = error.statusCode ?? (error.code === '23505' ? 409 : 500)
  if (status === 500) console.error(label, error)
  return res.status(status).json({ ok: false, error: status === 500 ? label : (error.code === '23505' ? 'Existe otra acción abierta para esta regla y entidad' : error.message) })
}
