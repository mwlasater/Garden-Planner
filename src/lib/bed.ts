export function clampBedDimension(
  raw: FormDataEntryValue | null,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed === 0) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
