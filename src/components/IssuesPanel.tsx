import { useGarden } from "../store";
import { allIssues } from "../lib/companions";
import { PLANT_BY_ID } from "../data/plants";
import { useMemo } from "react";

export function IssuesPanel() {
  const placements = useGarden((s) => s.placements);
  const beds = useGarden((s) => s.beds);
  const issues = useMemo(() => allIssues(placements), [placements]);

  if (placements.length === 0) {
    return (
      <div className="text-sm text-stone-500">
        Place some plants to see companion analysis.
      </div>
    );
  }

  const conflicts = issues.filter((i) => i.verdict === "conflict");
  const synergies = issues.filter((i) => i.verdict === "synergy");

  const bedName = (id: string) => beds.find((b) => b.id === id)?.name ?? "?";
  const plantName = (id: string) => PLANT_BY_ID.get(id)?.name ?? id;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex gap-3 text-xs">
        <span className="rounded-full bg-leaf-100 text-leaf-800 px-2 py-0.5">
          {synergies.length} synergies
        </span>
        <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5">
          {conflicts.length} conflicts
        </span>
      </div>

      {conflicts.length > 0 && (
        <div>
          <div className="font-medium text-red-800 mb-1">Conflicts</div>
          <ul className="space-y-1">
            {conflicts.map((i) => (
              <li
                key={i.placementId + i.withPlacementId}
                className="rounded border border-red-200 bg-red-50 px-2 py-1"
              >
                <span className="font-medium">{plantName(i.plantId)}</span> next to{" "}
                <span className="font-medium">{plantName(i.withPlantId)}</span> in{" "}
                <span className="text-stone-600">{bedName(i.bedId)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {synergies.length > 0 && (
        <div>
          <div className="font-medium text-leaf-800 mb-1">Good pairings</div>
          <ul className="space-y-1">
            {synergies.slice(0, 8).map((i) => (
              <li
                key={i.placementId + i.withPlacementId}
                className="rounded border border-leaf-200 bg-leaf-50 px-2 py-1"
              >
                <span className="font-medium">{plantName(i.plantId)}</span> +{" "}
                <span className="font-medium">{plantName(i.withPlantId)}</span> in{" "}
                <span className="text-stone-600">{bedName(i.bedId)}</span>
              </li>
            ))}
            {synergies.length > 8 && (
              <li className="text-xs text-stone-500 pl-2">
                …and {synergies.length - 8} more.
              </li>
            )}
          </ul>
        </div>
      )}

      {conflicts.length === 0 && synergies.length === 0 && (
        <div className="text-stone-500">No notable interactions yet.</div>
      )}
    </div>
  );
}
