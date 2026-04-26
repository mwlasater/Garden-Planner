import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGarden } from "../store";
import { PLANT_BY_ID } from "../data/plants";
import { parseFrostDate } from "../data/zones";
import { computeWindows, monthLabel, type TimingWindow } from "../lib/calendar";

const KIND_LABEL: Record<TimingWindow["kind"], string> = {
  startIndoors: "Start indoors",
  transplant: "Transplant",
  directSow: "Direct sow",
  harvest: "Harvest",
};

const KIND_COLOR: Record<TimingWindow["kind"], string> = {
  startIndoors: "bg-amber-300",
  transplant: "bg-leaf-400",
  directSow: "bg-leaf-500",
  harvest: "bg-red-300",
};

export function CalendarView() {
  const location = useGarden((s) => s.location);
  const placedPlantIds = useGarden(
    useShallow((s) => Array.from(new Set(s.placements.map((p) => p.plantId)))),
  );

  const lastFrost = parseFrostDate(location.lastFrost);
  const firstFrost = parseFrostDate(location.firstFrost);

  const year = lastFrost?.getFullYear() ?? new Date().getFullYear();
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  const yearMs = yearEnd - yearStart;

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)),
    [year],
  );

  if (!lastFrost) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600">
        Set your USDA hardiness zone on the Location tab to see a planting calendar
        based on your frost dates.
      </div>
    );
  }

  if (placedPlantIds.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600">
        Place some plants in your garden to see when to start them.
      </div>
    );
  }

  const rows = placedPlantIds
    .map((id) => {
      const plant = PLANT_BY_ID.get(id);
      if (!plant) return null;
      const windows = computeWindows(plant, lastFrost, firstFrost);
      return { plant, windows };
    })
    .filter((r): r is { plant: NonNullable<typeof r>["plant"]; windows: TimingWindow[] } => r !== null);

  const withTiming = rows.filter((r) => r.windows.length > 0);
  const withoutTiming = rows.filter((r) => r.windows.length === 0);

  const pctFromYear = (d: Date) =>
    Math.max(0, Math.min(100, ((d.getTime() - yearStart) / yearMs) * 100));

  return (
    <div className="space-y-4">
      <div className="text-sm text-stone-600">
        Calendar for {year} based on last frost{" "}
        <span className="font-medium">{location.lastFrost}</span>
        {location.firstFrost && (
          <>
            {" · "}first frost{" "}
            <span className="font-medium">{location.firstFrost}</span>
          </>
        )}
        .
      </div>

      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="grid grid-cols-[8rem_1fr] border-b border-stone-200 text-xs text-stone-500">
          <div className="px-3 py-2 font-medium">Plant</div>
          <div className="grid grid-cols-12 border-l border-stone-200">
            {months.map((m) => (
              <div key={m.getMonth()} className="px-1 py-2 border-r border-stone-100 last:border-r-0">
                {monthLabel(m)}
              </div>
            ))}
          </div>
        </div>

        {withTiming.map(({ plant, windows }) => (
          <div
            key={plant.id}
            className="grid grid-cols-[8rem_1fr] border-b border-stone-100 last:border-b-0"
          >
            <div className="px-3 py-2 text-sm">{plant.name}</div>
            <div className="relative h-10 border-l border-stone-200">
              <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                {months.map((m) => (
                  <div key={m.getMonth()} className="border-r border-stone-100 last:border-r-0" />
                ))}
              </div>
              {windows.map((w, idx) => {
                const left = pctFromYear(w.start);
                const right = pctFromYear(w.end);
                const width = Math.max(1, right - left);
                return (
                  <div
                    key={idx}
                    className={`absolute top-1.5 h-3 rounded ${KIND_COLOR[w.kind]}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${KIND_LABEL[w.kind]}: ${w.start.toDateString()} – ${w.end.toDateString()}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-stone-600">
        {(Object.keys(KIND_LABEL) as TimingWindow["kind"][]).map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded ${KIND_COLOR[k]}`} />
            {KIND_LABEL[k]}
          </div>
        ))}
      </div>

      {withoutTiming.length > 0 && (
        <div className="text-xs text-stone-500">
          No timing data yet for: {withoutTiming.map((r) => r.plant.name).join(", ")}
        </div>
      )}
    </div>
  );
}
