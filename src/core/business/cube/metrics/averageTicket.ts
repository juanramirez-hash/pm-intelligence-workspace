export function calculateAverageTicket(
  revenue: number,
  documents: number,
): number | null {
  if (
    !Number.isFinite(revenue) ||
    !Number.isFinite(documents) ||
    documents <= 0
  ) {
    return null;
  }

  return revenue / documents;
}
