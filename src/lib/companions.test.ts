import { describe, it, expect } from "vitest";
import { allIssues, neighborsOf, verdictBetween } from "./companions";
import type { Placement } from "../types";

const place = (id: string, plantId: string, row: number, col: number): Placement => ({
  id,
  bedId: "bed1",
  plantId,
  row,
  col,
});

describe("verdictBetween", () => {
  it("identifies known synergies (tomato + basil)", () => {
    expect(verdictBetween("tomato", "basil")).toBe("synergy");
  });

  it("identifies known conflicts (tomato + cabbage)", () => {
    expect(verdictBetween("tomato", "cabbage")).toBe("conflict");
  });

  it("identifies less-obvious synergies (tomato + asparagus)", () => {
    expect(verdictBetween("tomato", "asparagus")).toBe("synergy");
  });

  it("returns neutral for genuinely unrelated pairs (radish + fennel)", () => {
    expect(verdictBetween("radish", "fennel")).toBe("neutral");
  });
});

describe("neighborsOf", () => {
  it("includes placements within 2-cell radius in same bed", () => {
    const target = place("a", "tomato", 5, 5);
    const all = [
      target,
      place("b", "basil", 5, 6),
      place("c", "carrot", 7, 7),
      place("d", "kale", 8, 8),
    ];
    const neighbors = neighborsOf(target, all).map((p) => p.id);
    expect(neighbors).toEqual(["b", "c"]);
  });

  it("excludes placements in other beds", () => {
    const target = place("a", "tomato", 5, 5);
    const other = { ...place("b", "basil", 5, 5), bedId: "bed2" };
    expect(neighborsOf(target, [target, other])).toEqual([]);
  });
});

describe("allIssues dedup", () => {
  it("emits only one issue per plant pair per bed even with stacked SFG cells", () => {
    // 4 lettuces in one cell + 1 tomato adjacent — should yield ONE
    // tomato/lettuce synergy, not 4
    const placements: Placement[] = [
      place("l1", "lettuce", 0, 0),
      place("l2", "lettuce", 0, 0),
      place("l3", "lettuce", 0, 0),
      place("l4", "lettuce", 0, 0),
      place("t1", "tomato", 0, 1),
    ];
    const issues = allIssues(placements);
    const synergies = issues.filter(
      (i) =>
        (i.plantId === "tomato" && i.withPlantId === "lettuce") ||
        (i.plantId === "lettuce" && i.withPlantId === "tomato"),
    );
    expect(synergies).toHaveLength(1);
  });

  it("emits separate issues for the same plant pair in different beds", () => {
    const placements: Placement[] = [
      place("a", "tomato", 0, 0),
      place("b", "basil", 0, 1),
      { ...place("c", "tomato", 0, 0), bedId: "bed2" },
      { ...place("d", "basil", 0, 1), bedId: "bed2" },
    ];
    const synergies = allIssues(placements).filter((i) => i.verdict === "synergy");
    expect(synergies).toHaveLength(2);
  });

  it("does not emit issues for same-plant pairs in the same cell", () => {
    const placements: Placement[] = [
      place("l1", "lettuce", 0, 0),
      place("l2", "lettuce", 0, 0),
    ];
    expect(allIssues(placements)).toEqual([]);
  });
});
