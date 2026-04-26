import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useShallow } from "zustand/react/shallow";
import { useGarden } from "../store";
import { PLANT_BY_ID } from "../data/plants";
import type { Bed, Placement, SunRequirement } from "../types";
import { placementVerdict } from "../lib/companions";
import { sunCompatible } from "../lib/sun";
import { clampBedDimension } from "../lib/bed";

const SUN_ICON = { full: "☀️", partial: "⛅", shade: "🌥" } as const;

const RING_BY_KIND = {
  conflict: "ring-2 ring-red-500",
  sunWarning: "ring-2 ring-amber-500",
  synergy: "ring-2 ring-leaf-500",
  neutral: "ring-1 ring-stone-300",
} as const;

function plantSwatch(plantId: string): string {
  const plant = PLANT_BY_ID.get(plantId);
  if (!plant) return "🌱";
  switch (plant.category) {
    case "vegetable":
      return "🥬";
    case "herb":
      return "🌿";
    case "fruit":
      return "🍓";
    case "root":
      return "🥕";
    case "flower":
      return "🌼";
    default:
      return "🌱";
  }
}

function PlantedCell({
  placement,
  allPlacements,
  bedSun,
  onRemove,
}: {
  placement: Placement;
  allPlacements: Placement[];
  bedSun: SunRequirement;
  onRemove: () => void;
}) {
  const plant = PLANT_BY_ID.get(placement.plantId);
  const verdict = placementVerdict(placement, allPlacements);
  const sunMismatch = plant ? !sunCompatible(plant.sun, bedSun) : false;
  const ringKind =
    verdict === "conflict"
      ? "conflict"
      : sunMismatch
        ? "sunWarning"
        : verdict === "synergy"
          ? "synergy"
          : "neutral";
  const titleSuffix = [
    verdict !== "neutral" ? verdict : null,
    sunMismatch ? `needs ${plant?.sun} sun` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placement:${placement.id}`,
    data: { source: "placement", placementId: placement.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={`${plant?.name ?? placement.plantId}${
        titleSuffix ? ` — ${titleSuffix}` : ""
      } (right-click to remove)`}
      onContextMenu={(e) => {
        e.preventDefault();
        onRemove();
      }}
      className={`absolute inset-0.5 rounded flex items-center justify-center text-lg bg-white cursor-grab ${
        RING_BY_KIND[ringKind]
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <span aria-hidden>{plantSwatch(placement.plantId)}</span>
    </div>
  );
}

function GridCell({
  bedId,
  bedSun,
  row,
  col,
  placements,
}: {
  bedId: string;
  bedSun: SunRequirement;
  row: number;
  col: number;
  placements: Placement[];
}) {
  const removePlacement = useGarden((s) => s.removePlacement);
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${bedId}:${row}:${col}`,
    data: { bedId, row, col },
  });
  const occupant = placements.find(
    (p) => p.bedId === bedId && p.row === row && p.col === col,
  );
  return (
    <div
      ref={setNodeRef}
      className={`relative aspect-square border ${
        isOver
          ? "border-leaf-500 bg-leaf-100"
          : "border-stone-200 bg-stone-50"
      }`}
    >
      {occupant && (
        <PlantedCell
          placement={occupant}
          allPlacements={placements}
          bedSun={bedSun}
          onRemove={() => removePlacement(occupant.id)}
        />
      )}
    </div>
  );
}

export function BedView({ bed }: { bed: Bed }) {
  const inBed = useGarden(
    useShallow((s) => s.placements.filter((p) => p.bedId === bed.id)),
  );
  const removeBed = useGarden((s) => s.removeBed);
  const updateBed = useGarden((s) => s.updateBed);

  const cols = Math.max(1, Math.round(bed.widthFt));
  const rows = Math.max(1, Math.round(bed.lengthFt));

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <input
            value={bed.name}
            onChange={(e) => updateBed(bed.id, { name: e.target.value })}
            className="font-semibold text-stone-800 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-leaf-500 outline-none min-w-0"
          />
          <span className="text-xs text-stone-500 whitespace-nowrap">
            {bed.widthFt} × {bed.lengthFt} ft · {SUN_ICON[bed.sun]}
          </span>
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete bed "${bed.name}"?`)) removeBed(bed.id);
          }}
          className="text-xs text-stone-500 hover:text-red-600"
        >
          delete
        </button>
      </div>
      <div
        className="grid gap-0 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `${cols * 56}px`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          return (
            <GridCell
              key={`${row}-${col}`}
              bedId={bed.id}
              bedSun={bed.sun}
              row={row}
              col={col}
              placements={inBed}
            />
          );
        })}
      </div>
    </div>
  );
}

export function AddBedForm() {
  const addBed = useGarden((s) => s.addBed);

  return (
    <form
      className="rounded-lg border border-dashed border-stone-300 p-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        addBed({
          name: String(data.get("name") || "New Bed"),
          widthFt: clampBedDimension(data.get("widthFt"), 1, 20, 4),
          lengthFt: clampBedDimension(data.get("lengthFt"), 1, 30, 8),
          sun: (data.get("sun") as Bed["sun"]) || "full",
        });
        form.reset();
      }}
    >
      <div className="text-sm font-medium text-stone-700">Add a new bed</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <label>
          <span className="block text-xs text-stone-500">Name</span>
          <input
            name="name"
            defaultValue="Bed"
            className="w-full rounded border border-stone-300 px-2 py-1"
          />
        </label>
        <label>
          <span className="block text-xs text-stone-500">Width (ft)</span>
          <input
            name="widthFt"
            type="number"
            min={1}
            max={20}
            defaultValue={4}
            className="w-full rounded border border-stone-300 px-2 py-1"
          />
        </label>
        <label>
          <span className="block text-xs text-stone-500">Length (ft)</span>
          <input
            name="lengthFt"
            type="number"
            min={1}
            max={30}
            defaultValue={8}
            className="w-full rounded border border-stone-300 px-2 py-1"
          />
        </label>
        <label>
          <span className="block text-xs text-stone-500">Sun</span>
          <select
            name="sun"
            defaultValue="full"
            className="w-full rounded border border-stone-300 px-2 py-1 bg-white"
          >
            <option value="full">Full sun</option>
            <option value="partial">Partial</option>
            <option value="shade">Shade</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="rounded bg-leaf-600 text-white px-3 py-1 text-sm font-medium hover:bg-leaf-700"
      >
        Add bed
      </button>
    </form>
  );
}
