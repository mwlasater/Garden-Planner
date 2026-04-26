import { describe, it, expect } from "vitest";
import { sunCompatible } from "./sun";

describe("sunCompatible", () => {
  it("full-sun bed accommodates any plant", () => {
    expect(sunCompatible("full", "full")).toBe(true);
    expect(sunCompatible("partial", "full")).toBe(true);
    expect(sunCompatible("shade", "full")).toBe(true);
  });

  it("partial-sun bed warns on full-sun plants", () => {
    expect(sunCompatible("full", "partial")).toBe(false);
    expect(sunCompatible("partial", "partial")).toBe(true);
    expect(sunCompatible("shade", "partial")).toBe(true);
  });

  it("shade bed warns on anything that needs more than shade", () => {
    expect(sunCompatible("full", "shade")).toBe(false);
    expect(sunCompatible("partial", "shade")).toBe(false);
    expect(sunCompatible("shade", "shade")).toBe(true);
  });
});
