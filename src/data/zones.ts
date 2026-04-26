export type ZoneInfo = {
  zone: string;
  minTempF: [number, number];
  lastFrost: string;
  firstFrost: string;
};

export const USDA_ZONES: ZoneInfo[] = [
  { zone: "3a", minTempF: [-40, -35], lastFrost: "May 25", firstFrost: "Sep 10" },
  { zone: "3b", minTempF: [-35, -30], lastFrost: "May 20", firstFrost: "Sep 15" },
  { zone: "4a", minTempF: [-30, -25], lastFrost: "May 15", firstFrost: "Sep 20" },
  { zone: "4b", minTempF: [-25, -20], lastFrost: "May 10", firstFrost: "Sep 25" },
  { zone: "5a", minTempF: [-20, -15], lastFrost: "May 5", firstFrost: "Oct 1" },
  { zone: "5b", minTempF: [-15, -10], lastFrost: "Apr 30", firstFrost: "Oct 5" },
  { zone: "6a", minTempF: [-10, -5], lastFrost: "Apr 25", firstFrost: "Oct 15" },
  { zone: "6b", minTempF: [-5, 0], lastFrost: "Apr 15", firstFrost: "Oct 20" },
  { zone: "7a", minTempF: [0, 5], lastFrost: "Apr 10", firstFrost: "Oct 30" },
  { zone: "7b", minTempF: [5, 10], lastFrost: "Apr 1", firstFrost: "Nov 5" },
  { zone: "8a", minTempF: [10, 15], lastFrost: "Mar 20", firstFrost: "Nov 15" },
  { zone: "8b", minTempF: [15, 20], lastFrost: "Mar 10", firstFrost: "Nov 25" },
  { zone: "9a", minTempF: [20, 25], lastFrost: "Feb 25", firstFrost: "Dec 5" },
  { zone: "9b", minTempF: [25, 30], lastFrost: "Feb 10", firstFrost: "Dec 15" },
  { zone: "10a", minTempF: [30, 35], lastFrost: "Jan 30", firstFrost: "Dec 25" },
  { zone: "10b", minTempF: [35, 40], lastFrost: "rare", firstFrost: "rare" },
  { zone: "11a", minTempF: [40, 45], lastFrost: "none", firstFrost: "none" },
  { zone: "11b", minTempF: [45, 50], lastFrost: "none", firstFrost: "none" },
];

export const ZONE_BY_ID = new Map(USDA_ZONES.map((z) => [z.zone, z]));

export function parseFrostDate(
  value: string | undefined,
  year: number = new Date().getFullYear(),
): Date | null {
  if (!value || value === "rare" || value === "none") return null;
  const date = new Date(`${value} ${year}`);
  return isNaN(date.getTime()) ? null : date;
}
