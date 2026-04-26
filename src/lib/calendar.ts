import type { Plant } from "../types";

export type TimingWindow = {
  kind: "startIndoors" | "transplant" | "directSow" | "harvest";
  start: Date;
  end: Date;
};

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 14;

function shiftWeeks(base: Date, weeks: number): Date {
  return new Date(base.getTime() + weeks * MS_PER_WEEK);
}

function shiftDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export function computeWindows(
  plant: Plant,
  lastFrost: Date,
  firstFrost: Date | null,
): TimingWindow[] {
  const t = plant.timing;
  if (!t) return [];
  const windows: TimingWindow[] = [];

  if (t.startIndoorsWeeksBeforeLastFrost != null) {
    const start = shiftWeeks(lastFrost, -t.startIndoorsWeeksBeforeLastFrost);
    windows.push({ kind: "startIndoors", start, end: shiftDays(start, WINDOW_DAYS) });
  }

  if (t.transplantWeeksAfterLastFrost != null) {
    const start = shiftWeeks(lastFrost, t.transplantWeeksAfterLastFrost);
    windows.push({ kind: "transplant", start, end: shiftDays(start, WINDOW_DAYS) });
  }

  if (t.directSowWeeksAfterLastFrost != null) {
    const start = shiftWeeks(lastFrost, t.directSowWeeksAfterLastFrost);
    windows.push({ kind: "directSow", start, end: shiftDays(start, WINDOW_DAYS) });
  }

  if (plant.daysToMaturity != null && (windows.length > 0 || firstFrost)) {
    const seedDate =
      windows.find((w) => w.kind === "transplant" || w.kind === "directSow")?.start ??
      shiftDays(lastFrost, 0);
    const harvestStart = shiftDays(seedDate, plant.daysToMaturity);
    const harvestEnd =
      t.harvestableThroughFirstFrost && firstFrost
        ? firstFrost
        : shiftDays(harvestStart, 21);
    if (harvestEnd > harvestStart) {
      windows.push({ kind: "harvest", start: harvestStart, end: harvestEnd });
    }
  }

  return windows;
}

export function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short" });
}
