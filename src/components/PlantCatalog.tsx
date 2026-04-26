import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { PLANTS, resolvePlantName } from "../data/plants";
import type { Plant, PlantCategory } from "../types";

const CATEGORIES: (PlantCategory | "all")[] = [
  "all",
  "vegetable",
  "herb",
  "fruit",
  "root",
  "flower",
];

const SUN_LABEL: Record<Plant["sun"], string> = {
  full: "☀️ Full sun",
  partial: "⛅ Partial",
  shade: "🌥 Shade",
};

function PlantTile({ plant, onSelect }: { plant: Plant; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog:${plant.id}`,
    data: { source: "catalog", plantId: plant.id },
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={`text-left rounded-md border border-stone-200 bg-white p-2 hover:border-leaf-400 hover:shadow-sm transition cursor-grab ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="font-medium text-sm">{plant.name}</div>
      <div className="text-xs text-stone-500 italic">{plant.scientificName}</div>
      <div className="text-xs text-stone-600 mt-1">
        {SUN_LABEL[plant.sun]} · {plant.spacingInches}" spacing
      </div>
    </button>
  );
}

function PlantDetail({ plant, onClose }: { plant: Plant; onClose: () => void }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{plant.name}</div>
          <div className="text-xs text-stone-500 italic">{plant.scientificName}</div>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-stone-500 hover:text-stone-800"
        >
          close
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div>
          <span className="text-stone-500">Sun: </span>
          {SUN_LABEL[plant.sun]}
        </div>
        <div>
          <span className="text-stone-500">Spacing: </span>
          {plant.spacingInches}"
        </div>
        {plant.daysToMaturity != null && (
          <div>
            <span className="text-stone-500">Maturity: </span>
            {plant.daysToMaturity}d
          </div>
        )}
        <div>
          <span className="text-stone-500">Category: </span>
          {plant.category}
        </div>
      </div>
      {plant.companions.length > 0 && (
        <div className="text-xs">
          <span className="text-leaf-700 font-medium">Plant with: </span>
          {plant.companions.map(resolvePlantName).join(", ")}
        </div>
      )}
      {plant.antagonists.length > 0 && (
        <div className="text-xs">
          <span className="text-red-700 font-medium">Keep away from: </span>
          {plant.antagonists.map(resolvePlantName).join(", ")}
        </div>
      )}
      {plant.notes && (
        <div className="text-xs text-stone-700 border-t border-stone-200 pt-1.5">
          {plant.notes}
        </div>
      )}
    </div>
  );
}

export function PlantCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlantCategory | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLANTS.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.scientificName?.toLowerCase().includes(q) ||
        p.id.includes(q)
      );
    });
  }, [query, category]);

  const selectedPlant = selected ? PLANTS.find((p) => p.id === selected) : null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <input
          className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
          placeholder="Search plants…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs rounded-full px-2 py-0.5 border ${
                category === c
                  ? "bg-leaf-600 text-white border-leaf-600"
                  : "bg-white text-stone-700 border-stone-300 hover:border-leaf-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {selectedPlant && (
        <PlantDetail plant={selectedPlant} onClose={() => setSelected(null)} />
      )}

      <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {filtered.map((p) => (
          <PlantTile
            key={p.id}
            plant={p}
            onSelect={() => setSelected(p.id === selected ? null : p.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-stone-500 text-center py-4">
            No plants match that search.
          </div>
        )}
      </div>
    </div>
  );
}
