import { describe, it, expect } from "vitest";
import { targetCalendarYear, computeWindows } from "./calendar";
import type { Plant } from "../types";

describe("targetCalendarYear", () => {
  it("returns the current year when today is before first frost", () => {
    const today = new Date("2026-04-15");
    expect(targetCalendarYear(today, "Oct 30")).toBe(2026);
  });

  it("returns next year when today is after first frost", () => {
    const today = new Date("2026-11-15");
    expect(targetCalendarYear(today, "Oct 30")).toBe(2027);
  });

  it("returns current year when first frost is undefined", () => {
    const today = new Date("2026-11-15");
    expect(targetCalendarYear(today, undefined)).toBe(2026);
  });

  it('returns current year when first frost is "none" (tropical zone)', () => {
    const today = new Date("2026-11-15");
    expect(targetCalendarYear(today, "none")).toBe(2026);
  });

  it('returns current year when first frost is "rare"', () => {
    const today = new Date("2026-11-15");
    expect(targetCalendarYear(today, "rare")).toBe(2026);
  });

  it("treats the day of first frost as start of next season", () => {
    // parseFrostDate("Oct 30") yields Oct 30 at midnight. Anything later
    // that same day already counts as past frost.
    const today = new Date("2026-10-30T12:00:00");
    expect(targetCalendarYear(today, "Oct 30")).toBe(2027);
  });

  it("returns current year on the day before first frost", () => {
    const today = new Date("2026-10-29T23:00:00");
    expect(targetCalendarYear(today, "Oct 30")).toBe(2026);
  });
});

describe("computeWindows", () => {
  const lastFrost = new Date("2026-04-15");
  const firstFrost = new Date("2026-10-30");

  it("returns no windows for a plant without timing", () => {
    const plant: Plant = {
      id: "x",
      name: "X",
      category: "vegetable",
      sun: "full",
      spacingInches: 12,
      companions: [],
      antagonists: [],
    };
    expect(computeWindows(plant, lastFrost, firstFrost)).toEqual([]);
  });

  it("derives start-indoors and transplant windows for tomato-like plants", () => {
    const plant: Plant = {
      id: "tomato",
      name: "Tomato",
      category: "vegetable",
      sun: "full",
      spacingInches: 24,
      daysToMaturity: 75,
      companions: [],
      antagonists: [],
      timing: {
        startIndoorsWeeksBeforeLastFrost: 6,
        transplantWeeksAfterLastFrost: 2,
      },
    };
    const windows = computeWindows(plant, lastFrost, firstFrost);
    const kinds = windows.map((w) => w.kind);
    expect(kinds).toContain("startIndoors");
    expect(kinds).toContain("transplant");
    expect(kinds).toContain("harvest");
  });

  it("uses first frost as harvest end when harvestableThroughFirstFrost is set", () => {
    const plant: Plant = {
      id: "kale",
      name: "Kale",
      category: "vegetable",
      sun: "full",
      spacingInches: 18,
      daysToMaturity: 55,
      companions: [],
      antagonists: [],
      timing: {
        transplantWeeksAfterLastFrost: -2,
        harvestableThroughFirstFrost: true,
      },
    };
    const windows = computeWindows(plant, lastFrost, firstFrost);
    const harvest = windows.find((w) => w.kind === "harvest");
    expect(harvest?.end.getTime()).toBe(firstFrost.getTime());
  });
});
