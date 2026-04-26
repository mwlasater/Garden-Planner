import { describe, it, expect } from "vitest";
import { PLANTS, PLANT_BY_ID, resolvePlantName } from "./plants";

describe("resolvePlantName", () => {
  it("returns the display name for a known ID", () => {
    expect(resolvePlantName("bean-pole")).toBe("Pole Bean");
    expect(resolvePlantName("tomato")).toBe("Tomato");
  });

  it("falls back to the raw ID for an unknown ID", () => {
    expect(resolvePlantName("does-not-exist")).toBe("does-not-exist");
  });

  it("returns the raw ID for an empty string", () => {
    expect(resolvePlantName("")).toBe("");
  });
});

describe("plant catalog data integrity", () => {
  it("every companion ID has a matching plant entry", () => {
    const dangling: { plantId: string; companionId: string }[] = [];
    for (const plant of PLANTS) {
      for (const id of plant.companions) {
        if (!PLANT_BY_ID.has(id)) {
          dangling.push({ plantId: plant.id, companionId: id });
        }
      }
    }
    expect(dangling).toEqual([]);
  });

  it("every antagonist ID has a matching plant entry", () => {
    const dangling: { plantId: string; antagonistId: string }[] = [];
    for (const plant of PLANTS) {
      for (const id of plant.antagonists) {
        if (!PLANT_BY_ID.has(id)) {
          dangling.push({ plantId: plant.id, antagonistId: id });
        }
      }
    }
    expect(dangling).toEqual([]);
  });

  it("plant IDs are unique", () => {
    const ids = PLANTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
