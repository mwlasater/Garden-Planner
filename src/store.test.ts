import { describe, it, expect, beforeEach } from "vitest";
import { useGarden } from "./store";

describe("placePlant capacity enforcement", () => {
  let bedId: string;

  beforeEach(() => {
    useGarden.getState().resetGarden();
    bedId = useGarden.getState().addBed({
      name: "Test bed",
      widthFt: 4,
      lengthFt: 4,
      sun: "full",
    });
  });

  it("places one tomato (capacity 1) successfully", () => {
    useGarden.getState().placePlant(bedId, "tomato", 0, 0);
    expect(useGarden.getState().placements).toHaveLength(1);
  });

  it("rejects a second tomato in the same cell (over capacity)", () => {
    useGarden.getState().placePlant(bedId, "tomato", 0, 0);
    useGarden.getState().placePlant(bedId, "tomato", 0, 0);
    expect(useGarden.getState().placements).toHaveLength(1);
  });

  it("allows up to 4 lettuces in one cell (6-inch spacing → capacity 4)", () => {
    for (let i = 0; i < 4; i++) {
      useGarden.getState().placePlant(bedId, "lettuce", 0, 0);
    }
    expect(useGarden.getState().placements).toHaveLength(4);
  });

  it("rejects a 5th lettuce in the same cell", () => {
    for (let i = 0; i < 5; i++) {
      useGarden.getState().placePlant(bedId, "lettuce", 0, 0);
    }
    expect(useGarden.getState().placements).toHaveLength(4);
  });

  it("allows up to 16 radishes in one cell (2-inch spacing → capacity 16)", () => {
    for (let i = 0; i < 16; i++) {
      useGarden.getState().placePlant(bedId, "radish", 0, 0);
    }
    expect(useGarden.getState().placements).toHaveLength(16);
  });

  it("rejects a different species in a partially-filled cell", () => {
    useGarden.getState().placePlant(bedId, "lettuce", 0, 0);
    useGarden.getState().placePlant(bedId, "tomato", 0, 0);
    const placements = useGarden.getState().placements;
    expect(placements).toHaveLength(1);
    expect(placements[0].plantId).toBe("lettuce");
  });

  it("ignores a plant ID that doesn't exist", () => {
    useGarden.getState().placePlant(bedId, "nonexistent-plant", 0, 0);
    expect(useGarden.getState().placements).toHaveLength(0);
  });
});

describe("movePlacement capacity enforcement", () => {
  let bedId: string;

  beforeEach(() => {
    useGarden.getState().resetGarden();
    bedId = useGarden.getState().addBed({
      name: "Test bed",
      widthFt: 4,
      lengthFt: 4,
      sun: "full",
    });
  });

  it("allows moving a placement back to its own cell (self-drop)", () => {
    useGarden.getState().placePlant(bedId, "tomato", 0, 0);
    const placementId = useGarden.getState().placements[0].id;
    useGarden.getState().movePlacement(placementId, bedId, 0, 0);
    expect(useGarden.getState().placements[0].row).toBe(0);
    expect(useGarden.getState().placements[0].col).toBe(0);
  });

  it("rejects moving a tomato onto a cell occupied by lettuce", () => {
    useGarden.getState().placePlant(bedId, "tomato", 0, 0);
    useGarden.getState().placePlant(bedId, "lettuce", 1, 1);
    const tomatoId = useGarden
      .getState()
      .placements.find((p) => p.plantId === "tomato")!.id;
    useGarden.getState().movePlacement(tomatoId, bedId, 1, 1);
    const tomato = useGarden.getState().placements.find((p) => p.id === tomatoId)!;
    expect(tomato.row).toBe(0);
    expect(tomato.col).toBe(0);
  });

  it("allows moving a lettuce into a cell that has room for more lettuce", () => {
    useGarden.getState().placePlant(bedId, "lettuce", 0, 0);
    useGarden.getState().placePlant(bedId, "lettuce", 0, 0);
    useGarden.getState().placePlant(bedId, "lettuce", 1, 1);
    const movingId = useGarden
      .getState()
      .placements.filter((p) => p.row === 1 && p.col === 1)[0].id;
    useGarden.getState().movePlacement(movingId, bedId, 0, 0);
    expect(
      useGarden.getState().placements.filter((p) => p.row === 0 && p.col === 0),
    ).toHaveLength(3);
  });

  it("rejects moving a lettuce into a cell already at capacity", () => {
    for (let i = 0; i < 4; i++) {
      useGarden.getState().placePlant(bedId, "lettuce", 0, 0);
    }
    useGarden.getState().placePlant(bedId, "lettuce", 1, 1);
    const movingId = useGarden
      .getState()
      .placements.filter((p) => p.row === 1 && p.col === 1)[0].id;
    useGarden.getState().movePlacement(movingId, bedId, 0, 0);
    const moving = useGarden.getState().placements.find((p) => p.id === movingId)!;
    expect(moving.row).toBe(1);
    expect(moving.col).toBe(1);
  });
});

describe("placement notes & photos", () => {
  let bedId: string;
  let placementId: string;

  beforeEach(() => {
    useGarden.getState().resetGarden();
    bedId = useGarden.getState().addBed({
      name: "Test bed",
      widthFt: 4,
      lengthFt: 4,
      sun: "full",
    });
    useGarden.getState().placePlant(bedId, "tomato", 0, 0);
    placementId = useGarden.getState().placements[0].id;
  });

  it("setPlacementNotes saves and trims-to-undefined when cleared", () => {
    useGarden.getState().setPlacementNotes(placementId, "Cherokee Purple, 12 in deep");
    expect(useGarden.getState().placements[0].notes).toBe("Cherokee Purple, 12 in deep");
    useGarden.getState().setPlacementNotes(placementId, "");
    expect(useGarden.getState().placements[0].notes).toBeUndefined();
  });

  it("addPlacementPhoto appends to the photos list", () => {
    useGarden.getState().addPlacementPhoto(placementId, "abc123.jpg");
    useGarden.getState().addPlacementPhoto(placementId, "def456.png");
    expect(useGarden.getState().placements[0].photos).toEqual(["abc123.jpg", "def456.png"]);
  });

  it("removePlacementPhoto removes the named filename and clears the field when empty", () => {
    useGarden.getState().addPlacementPhoto(placementId, "abc123.jpg");
    useGarden.getState().addPlacementPhoto(placementId, "def456.png");
    useGarden.getState().removePlacementPhoto(placementId, "abc123.jpg");
    expect(useGarden.getState().placements[0].photos).toEqual(["def456.png"]);
    useGarden.getState().removePlacementPhoto(placementId, "def456.png");
    expect(useGarden.getState().placements[0].photos).toBeUndefined();
  });

  it("removing a placement clears it from selectedPlacementId", () => {
    useGarden.getState().selectPlacement(placementId);
    expect(useGarden.getState().selectedPlacementId).toBe(placementId);
    useGarden.getState().removePlacement(placementId);
    expect(useGarden.getState().selectedPlacementId).toBeNull();
  });

  it("selectPlacement(null) closes the drawer", () => {
    useGarden.getState().selectPlacement(placementId);
    useGarden.getState().selectPlacement(null);
    expect(useGarden.getState().selectedPlacementId).toBeNull();
  });
});
