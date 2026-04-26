import { describe, it, expect } from "vitest";
import { plantsPerSquareFoot, subGridSide } from "./spacing";

describe("plantsPerSquareFoot", () => {
  it("returns 16 for very tight spacing (≤ 3 inches)", () => {
    expect(plantsPerSquareFoot(2)).toBe(16);
    expect(plantsPerSquareFoot(3)).toBe(16);
  });

  it("returns 9 for 4–5 inch spacing", () => {
    expect(plantsPerSquareFoot(4)).toBe(9);
    expect(plantsPerSquareFoot(5)).toBe(9);
  });

  it("returns 4 for 6–11 inch spacing", () => {
    expect(plantsPerSquareFoot(6)).toBe(4);
    expect(plantsPerSquareFoot(8)).toBe(4);
    expect(plantsPerSquareFoot(11)).toBe(4);
  });

  it("returns 1 for 12-inch and wider spacing", () => {
    expect(plantsPerSquareFoot(12)).toBe(1);
    expect(plantsPerSquareFoot(18)).toBe(1);
    expect(plantsPerSquareFoot(36)).toBe(1);
  });

  it("matches canonical SFG densities for known plants", () => {
    // tomato (24"), lettuce (8"), bush bean (4"), radish (2")
    expect(plantsPerSquareFoot(24)).toBe(1);
    expect(plantsPerSquareFoot(8)).toBe(4);
    expect(plantsPerSquareFoot(4)).toBe(9);
    expect(plantsPerSquareFoot(2)).toBe(16);
  });
});

describe("subGridSide", () => {
  it("returns the integer square root of capacity", () => {
    expect(subGridSide(1)).toBe(1);
    expect(subGridSide(4)).toBe(2);
    expect(subGridSide(9)).toBe(3);
    expect(subGridSide(16)).toBe(4);
  });
});
