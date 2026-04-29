// ZIP code → USDA hardiness zone lookup.
//
// Source: 2023 USDA Plant Hardiness Zone Map, derived from the official
// PRISM Climate Group ZIP-code CSVs (https://prism.oregonstate.edu/phzm/).
// License: free to reproduce and redistribute with attribution.
// Coverage: ~40,500 active US ZIPs across CONUS, AK, HI, and Puerto Rico.
//
// Regenerate with: node scripts/build-zip-zones.mjs
import zipZones from "./zip-zones.json";

const ZIP_TO_ZONE = zipZones as Record<string, string>;

export function getZoneForZip(zip: string | undefined): string | undefined {
  if (!zip) return undefined;
  const digits = zip.replace(/\D/g, "");
  if (digits.length < 5) return undefined;
  return ZIP_TO_ZONE[digits.slice(0, 5)];
}
