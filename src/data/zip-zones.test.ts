import { describe, it, expect } from "vitest";
import { getZoneForZip } from "./zip-zones";
import zipZones from "./zip-zones.json";

describe("getZoneForZip", () => {
  it("returns the zone for a known 5-digit ZIP", () => {
    // Spot-checks from issue #24, against the 2023 PRISM dataset.
    expect(getZoneForZip("10001")).toBe("7b"); // NYC
    expect(getZoneForZip("99501")).toBe("5a"); // Anchorage
    // 2023 update bumped SF from 10a (2012 map) to 10b.
    expect(getZoneForZip("94110")).toBe("10b");
  });

  it("strips non-digit characters before lookup", () => {
    expect(getZoneForZip("10001-1234")).toBe("7b");
    expect(getZoneForZip(" 10001 ")).toBe("7b");
  });

  it("uses only the first 5 digits (ignores ZIP+4 suffix)", () => {
    expect(getZoneForZip("100019999")).toBe("7b");
  });

  it("returns undefined for partial ZIPs", () => {
    expect(getZoneForZip("")).toBeUndefined();
    expect(getZoneForZip("1")).toBeUndefined();
    expect(getZoneForZip("100")).toBeUndefined();
    expect(getZoneForZip("1000")).toBeUndefined();
  });

  it("returns undefined for a ZIP not in the dataset", () => {
    expect(getZoneForZip("00000")).toBeUndefined();
  });

  it("handles undefined and nullish input", () => {
    expect(getZoneForZip(undefined)).toBeUndefined();
  });
});

describe("zip-zones dataset", () => {
  it("covers at least 40,000 ZIPs (full US coverage)", () => {
    expect(Object.keys(zipZones).length).toBeGreaterThanOrEqual(40_000);
  });

  it("every value is a valid USDA half-zone", () => {
    const valid = /^(?:[1-9]|1[0-3])[ab]$/;
    const bad: string[] = [];
    for (const [zip, zone] of Object.entries(zipZones as Record<string, string>)) {
      if (!valid.test(zone)) bad.push(`${zip}:${zone}`);
    }
    expect(bad).toEqual([]);
  });
});
