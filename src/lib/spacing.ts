export function plantsPerSquareFoot(spacingInches: number | undefined): number {
  // Default to 1/sqft when spacing is unknown (e.g. extended catalog entries
  // that haven't had a gardener-facing spacing value filled in). Picking the
  // most conservative density avoids surprise overcrowding in mixed beds.
  if (spacingInches == null) return 1;
  if (spacingInches <= 3) return 16;
  if (spacingInches <= 5) return 9;
  if (spacingInches <= 11) return 4;
  return 1;
}

export function subGridSide(capacity: number): number {
  return Math.round(Math.sqrt(capacity));
}
