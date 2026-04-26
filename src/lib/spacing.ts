export function plantsPerSquareFoot(spacingInches: number): number {
  if (spacingInches <= 3) return 16;
  if (spacingInches <= 5) return 9;
  if (spacingInches <= 11) return 4;
  return 1;
}

export function subGridSide(capacity: number): number {
  return Math.round(Math.sqrt(capacity));
}
