import type { Placement } from "../types";
import { PLANT_BY_ID } from "../data/plants";

export type Verdict = "synergy" | "conflict" | "neutral";

export type NeighborIssue = {
  bedId: string;
  placementId: string;
  plantId: string;
  withPlacementId: string;
  withPlantId: string;
  verdict: Exclude<Verdict, "neutral">;
  reason: string;
};

const NEIGHBOR_RADIUS = 2;

export function neighborsOf(target: Placement, all: Placement[]): Placement[] {
  return all.filter(
    (p) =>
      p.id !== target.id &&
      p.bedId === target.bedId &&
      Math.abs(p.row - target.row) <= NEIGHBOR_RADIUS &&
      Math.abs(p.col - target.col) <= NEIGHBOR_RADIUS,
  );
}

export function verdictBetween(plantIdA: string, plantIdB: string): Verdict {
  const a = PLANT_BY_ID.get(plantIdA);
  const b = PLANT_BY_ID.get(plantIdB);
  if (!a || !b) return "neutral";
  if (a.antagonists.includes(plantIdB) || b.antagonists.includes(plantIdA))
    return "conflict";
  if (a.companions.includes(plantIdB) || b.companions.includes(plantIdA))
    return "synergy";
  return "neutral";
}

export function placementVerdict(
  placement: Placement,
  all: Placement[],
): Verdict {
  let result: Verdict = "neutral";
  for (const n of neighborsOf(placement, all)) {
    const v = verdictBetween(placement.plantId, n.plantId);
    if (v === "conflict") return "conflict";
    if (v === "synergy") result = "synergy";
  }
  return result;
}

export function allIssues(placements: Placement[]): NeighborIssue[] {
  const issues: NeighborIssue[] = [];
  // Dedup by (plantA, plantB, bedId) so a square-foot cell holding multiple
  // instances of the same plant doesn't produce N identical issue rows for
  // each nearby companion.
  const seen = new Set<string>();
  for (const p of placements) {
    for (const n of neighborsOf(p, placements)) {
      const v = verdictBetween(p.plantId, n.plantId);
      if (v === "neutral") continue;
      const plantPair = [p.plantId, n.plantId].sort().join("|");
      const key = `${p.bedId}|${plantPair}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const aName = PLANT_BY_ID.get(p.plantId)?.name ?? p.plantId;
      const bName = PLANT_BY_ID.get(n.plantId)?.name ?? n.plantId;
      issues.push({
        bedId: p.bedId,
        placementId: p.id,
        plantId: p.plantId,
        withPlacementId: n.id,
        withPlantId: n.plantId,
        verdict: v,
        reason:
          v === "conflict"
            ? `${aName} and ${bName} should be separated.`
            : `${aName} and ${bName} grow well together.`,
      });
    }
  }
  return issues;
}
