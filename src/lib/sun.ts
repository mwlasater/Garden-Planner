import type { SunRequirement } from "../types";

const RANK: Record<SunRequirement, number> = { full: 2, partial: 1, shade: 0 };

export function sunCompatible(
  plantSun: SunRequirement,
  bedSun: SunRequirement,
): boolean {
  return RANK[bedSun] >= RANK[plantSun];
}
