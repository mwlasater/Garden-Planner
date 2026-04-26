import zipZones from "./zip-zones.json";

const ZIP_TO_ZONE = zipZones as Record<string, string>;

export function getZoneForZip(zip: string | undefined): string | undefined {
  if (!zip) return undefined;
  const trimmed = zip.trim();
  if (trimmed.length < 3) return undefined;
  return ZIP_TO_ZONE[trimmed.slice(0, 3)];
}
