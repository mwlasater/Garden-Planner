import { describe, it, expect } from "vitest";
import {
  PLANTS,
  PLANTS_CURATED,
  PLANTS_EXTENDED,
  PLANT_BY_ID,
  resolvePlantName,
} from "./plants";

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
  it("every curated companion ID has a matching plant entry", () => {
    const dangling: { plantId: string; companionId: string }[] = [];
    for (const plant of PLANTS_CURATED) {
      for (const id of plant.companions) {
        if (!PLANT_BY_ID.has(id)) {
          dangling.push({ plantId: plant.id, companionId: id });
        }
      }
    }
    expect(dangling).toEqual([]);
  });

  it("every curated antagonist ID has a matching plant entry", () => {
    const dangling: { plantId: string; antagonistId: string }[] = [];
    for (const plant of PLANTS_CURATED) {
      for (const id of plant.antagonists) {
        if (!PLANT_BY_ID.has(id)) {
          dangling.push({ plantId: plant.id, antagonistId: id });
        }
      }
    }
    expect(dangling).toEqual([]);
  });

  it("plant IDs are unique across curated + extended", () => {
    const ids = PLANTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("extended catalog (USDA PLANTS seed)", () => {
  it("ships at least 500 entries (issue #32 floor)", () => {
    expect(PLANTS_EXTENDED.length).toBeGreaterThanOrEqual(500);
  });

  it("every extended entry is flagged with extended: true", () => {
    const unflagged = PLANTS_EXTENDED.filter((p) => p.extended !== true);
    expect(unflagged).toEqual([]);
  });

  it("extended entries have empty companions and antagonists", () => {
    const polluted = PLANTS_EXTENDED.filter(
      (p) => p.companions.length > 0 || p.antagonists.length > 0,
    );
    expect(polluted).toEqual([]);
  });

  it("merger drops extended entries that collide with curated IDs", () => {
    const curatedIds = new Set(PLANTS_CURATED.map((p) => p.id));
    const overlap = PLANTS.filter(
      (p) => curatedIds.has(p.id) && p.extended === true,
    );
    expect(overlap).toEqual([]);
  });

  it("merger preserves curated entries (companion logic still authoritative)", () => {
    for (const c of PLANTS_CURATED) {
      expect(PLANT_BY_ID.get(c.id)?.extended).toBeUndefined();
    }
  });
});
