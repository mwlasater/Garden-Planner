import { describe, it, expect } from "vitest";
import { clampBedDimension } from "./bed";

describe("clampBedDimension", () => {
  it("returns the parsed value when within bounds", () => {
    expect(clampBedDimension("5", 1, 20, 4)).toBe(5);
  });

  it("clamps values above max", () => {
    expect(clampBedDimension("50", 1, 20, 4)).toBe(20);
  });

  it("clamps values below min", () => {
    expect(clampBedDimension("-10", 1, 20, 4)).toBe(1);
  });

  it("returns fallback for empty string (would otherwise be 0)", () => {
    expect(clampBedDimension("", 1, 20, 4)).toBe(4);
  });

  it("returns fallback for non-numeric input", () => {
    expect(clampBedDimension("abc", 1, 20, 4)).toBe(4);
  });

  it("returns fallback for null", () => {
    expect(clampBedDimension(null, 1, 20, 4)).toBe(4);
  });

  it("returns fallback for explicit zero", () => {
    expect(clampBedDimension("0", 1, 20, 4)).toBe(4);
  });

  it("respects different bounds (length vs width)", () => {
    expect(clampBedDimension("25", 1, 30, 8)).toBe(25);
    expect(clampBedDimension("25", 1, 20, 4)).toBe(20);
  });
});
