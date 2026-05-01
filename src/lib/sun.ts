import type { SunRequirement } from "../types";

const RANK: Record<SunRequirement, number> = { full: 2, partial: 1, shade: 0 };

export function sunCompatible(
  plantSun: SunRequirement | undefined,
  bedSun: SunRequirement,
): boolean {
  // Treat unknown plant sun (extended catalog) as compatible — we'd rather
  // not raise a false-positive warning for a plant whose tolerance we
  // haven't recorded.
  if (plantSun == null) return true;
  return RANK[bedSun] >= RANK[plantSun];
}
