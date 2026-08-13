const CLOSED_PURCHASE_ORDER_STATUS_TOKENS = [
  'CLOSED',
  'CERRADA',
  'CERRADO',
  'CANCELLED',
  'CANCELED',
  'CANCELADA',
  'CANCELADO',
  'RECEIVED',
  'RECIBIDA',
  'RECIBIDO',
  'COMPLETED',
  'COMPLETADA',
  'COMPLETADO',
] as const

function normalizePurchaseOrderStatus(
  status: string | null | undefined,
): string {
  return (
    status
      ?.trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ') ??
    ''
  )
}

export function isClosedPurchaseOrderStatus(
  status: string | null | undefined,
): boolean {
  const normalizedStatus =
    normalizePurchaseOrderStatus(status)

  if (!normalizedStatus) {
    return false
  }

  return CLOSED_PURCHASE_ORDER_STATUS_TOKENS.some(
    (token) =>
      normalizedStatus.includes(token),
  )
}